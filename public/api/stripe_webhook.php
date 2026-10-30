<?php
require_once 'config.php';

// Webhooks do Stripe enviam POST com JSON body
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$event = null;

// 1. Carregar configurações para pegar o Webhook Secret
try {
    $stmt = $conn->prepare("SELECT settings_json FROM system_settings WHERE id = 1");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $settings = json_decode($row['settings_json'], true);
    $endpoint_secret = trim($settings['stripeWebhookSecret'] ?? '');
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "DB load error"]);
    exit();
}

if (empty($endpoint_secret)) {
    // SECURITY CONSTRAINT: Se a senha não estiver no painel, bloqueamos os webhooks por segurança.
    http_response_code(500);
    echo json_encode(["error" => "Stripe Webhook Secret não configurado no Administrador"]);
    exit();
}

// 2. Validação RIGOROSA da Assinatura Cryptográfica HMAC SHA-256
$timestamp = '';
$signatures = [];
$parts = explode(',', $sig_header);
foreach ($parts as $part) {
    if (strpos($part, 't=') === 0)
        $timestamp = substr($part, 2);
    if (strpos($part, 'v1=') === 0)
        $signatures[] = substr($part, 3);
}

if (empty($timestamp) || empty($signatures)) {
    http_response_code(400);
    echo json_encode(["error" => "Assinatura inválida (HTTP_STRIPE_SIGNATURE ausente)"]);
    exit();
}

$signed_payload = $timestamp . '.' . $payload;
$expected_signature = hash_hmac('sha256', $signed_payload, $endpoint_secret);

$matched = false;
foreach ($signatures as $sig) {
    if (hash_equals($expected_signature, $sig)) {
        $matched = true;
        break;
    }
}

if (!$matched) {
    http_response_code(400);
    echo json_encode(["error" => "Falha na assinatura HMAC SHA-256 (Pode ser um ataque)"]);
    exit();
}

$data = json_decode($payload, true);
$event_type = $data['type'] ?? '';

if (!$event_type) {
    http_response_code(400);
    exit();
}

// 3. Processar Eventos do Stripe
try {
    $isTestMode = isset($settings['isStripeTestMode']) ? filter_var($settings['isStripeTestMode'], FILTER_VALIDATE_BOOLEAN) : false;
    $stripeSecretKey = $isTestMode
        ? ($settings['stripeTestSecretKey'] ?? '')
        : ($settings['stripeLiveSecretKey'] ?? '');

    // CASO A: Primeira Assinatura Criada (O substituto blindado do antigo callbacks.php)
    if ($event_type === 'checkout.session.completed') {
        $session = $data['data']['object'];
        $userId = $session['client_reference_id'] ?? null;
        $customerId = $session['customer'] ?? null;
        $subscriptionId = $session['subscription'] ?? null;

        $planMeta = $session['metadata']['plan'] ?? 'monthly';
        $userPlanStr = ($planMeta === 'yearly') ? 'Pro (Anual)' : 'Pro (Mensal)';
        $intervalSql = ($planMeta === 'yearly') ? "INTERVAL 1 YEAR" : "INTERVAL 30 DAY";

        if ($userId && $subscriptionId && $customerId) {
            $priceId = null;
            if (!empty($stripeSecretKey)) {
                try {
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/subscriptions/" . urlencode($subscriptionId));
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
                                            $res = curl_exec($ch);
                    curl_close($ch);
                    
                    $subObj = json_decode($res, true);
                    if (isset($subObj['items']['data'][0]['price']['id'])) {
                        $priceId = $subObj['items']['data'][0]['price']['id'];
                    }
                } catch (Exception $subEx) {
                    error_log('[stripe_webhook] Erro ao buscar assinatura no Stripe: ' . $subEx->getMessage());
                }
            }

            $sql = "UPDATE users SET 
                    plan = :plan, 
                    subscription_status = 'active', 
                    credits = 9999,
                    current_period_end = DATE_ADD(NOW(), $intervalSql),
                    stripe_customer_id = :cust_id,
                    stripe_subscription_id = :sub_id,
                    stripe_price_id = :price_id
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'plan' => $userPlanStr,
                'cust_id' => $customerId,
                'sub_id' => $subscriptionId,
                'price_id' => $priceId,
                'id' => $userId
            ]);

            // TRACKING: Atualiza contador do cupom direto pelo payload seguro
            if (isset($session['metadata']['coupon_code']) && !empty($session['metadata']['coupon_code'])) {
                $couponCode = $session['metadata']['coupon_code'];
                $upd = $conn->prepare("UPDATE coupons SET times_used = times_used + 1 WHERE code = :code");
                $upd->execute(['code' => $couponCode]);
            }
        }
    }

    // CASO B: Pagamento de Renovação bem sucedido
    if ($event_type === 'invoice.payment_succeeded') {
        $subscriptionId = $data['data']['object']['subscription'] ?? null;
        $billingReason = $data['data']['object']['billing_reason'] ?? '';
        $priceId = $data['data']['object']['lines']['data'][0]['price']['id'] ?? null;

        if ($subscriptionId && $billingReason === 'subscription_cycle') {
            $amount = $data['data']['object']['amount_paid'] ?? 0;
            $intervalSql = ($amount > 10000) ? "INTERVAL 1 YEAR" : "INTERVAL 30 DAY";

            $sql = "UPDATE users SET 
                    subscription_status = 'active', 
                    credits = 9999,
                    current_period_end = DATE_ADD(NOW(), $intervalSql),
                    stripe_price_id = COALESCE(:price_id, stripe_price_id)
                    WHERE stripe_subscription_id = :sub_id";

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'sub_id' => $subscriptionId,
                'price_id' => $priceId
            ]);
        }
    }

    // CASO C: Assinatura Expirada / Deletada (Evita evasão e reverte de forma severa)
    if ($event_type === 'customer.subscription.deleted') {
        $subscriptionId = $data['data']['object']['id'] ?? null;

        if ($subscriptionId) {
            $sql = "UPDATE users SET subscription_status = 'expired', plan = 'Gratuito', credits = 0 WHERE stripe_subscription_id = :sub_id";
            $stmt = $conn->prepare($sql);
            $stmt->execute(['sub_id' => $subscriptionId]);
        }
    }

    // CASO D: Pagamento Falhou (Mantém pending ou past_due)
    if ($event_type === 'invoice.payment_failed') {
        $subscriptionId = $data['data']['object']['subscription'] ?? null;

        if ($subscriptionId) {
            $sql = "UPDATE users SET subscription_status = 'past_due' WHERE stripe_subscription_id = :sub_id";
            $stmt = $conn->prepare($sql);
            $stmt->execute(['sub_id' => $subscriptionId]);
        }
    }

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Internal event process error: " . $e->getMessage()]);
    exit();
}

http_response_code(200);
?>