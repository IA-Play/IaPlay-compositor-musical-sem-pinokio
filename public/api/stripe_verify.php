<?php
/**
 * stripe_verify.php
 * Verifica diretamente no Stripe se uma sessão de checkout foi paga.
 * Se sim, ativa o plano do usuário no banco de dados.
 * Isso funciona como backup caso o webhook demore ou falhe.
 */
require_once 'config.php';
require_once 'auth_guard.php';

checkAuth();
header("Content-Type: application/json");

try {
    $input = json_decode(file_get_contents("php://input"), true);
    $sessionId = $input['session_id'] ?? '';
    $userId = $_SESSION['user_id'] ?? '';

    if (empty($sessionId) || empty($userId)) {
        http_response_code(400);
        echo json_encode(["error" => "Parâmetros inválidos."]);
        exit();
    }

    // Carregar chave do Stripe
    $stmt = $conn->prepare("SELECT settings_json FROM system_settings WHERE id = 1");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $settings = json_decode($row['settings_json'], true);

    $isTestMode = isset($settings['isStripeTestMode']) ? filter_var($settings['isStripeTestMode'], FILTER_VALIDATE_BOOLEAN) : false;
    $stripeSecretKey = $isTestMode
        ? ($settings['stripeTestSecretKey'] ?? '')
        : ($settings['stripeLiveSecretKey'] ?? '');

    if (empty($stripeSecretKey)) {
        throw new Exception("Chave do Stripe não configurada.");
    }

    // Buscar sessão de checkout no Stripe
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/checkout/sessions/" . urlencode($sessionId));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
    

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        throw new Exception('Erro ao verificar sessão: ' . curl_error($ch));
    }
    curl_close($ch);

    $session = json_decode($result, true);

    if (isset($session['error'])) {
        throw new Exception("Stripe: " . ($session['error']['message'] ?? 'Sessão inválida'));
    }

    // Verificar se a sessão pertence ao usuário e foi paga
    $sessionUserId = $session['client_reference_id'] ?? '';
    $paymentStatus = $session['payment_status'] ?? '';
    $subscriptionId = $session['subscription'] ?? '';
    $customerId = $session['customer'] ?? '';
    $planMeta = $session['metadata']['plan'] ?? 'monthly';

    if ($sessionUserId !== $userId) {
        http_response_code(403);
        echo json_encode(["error" => "Sessão não pertence ao usuário."]);
        exit();
    }

    if ($paymentStatus !== 'paid') {
        echo json_encode([
            "status" => "pending",
            "payment_status" => $paymentStatus,
            "message" => "Pagamento ainda não confirmado."
        ]);
        exit();
    }

    // Pagamento confirmado! Verificar se já está ativado no banco
    $stmt = $conn->prepare("SELECT subscription_status, plan FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($currentUser && $currentUser['subscription_status'] === 'active' && 
        (stripos($currentUser['plan'], 'Pro') !== false || stripos($currentUser['plan'], 'VIP') !== false)) {
        // Já ativado (pelo webhook provavelmente)
        echo json_encode([
            "status" => "active",
            "plan" => $currentUser['plan'],
            "subscription_status" => $currentUser['subscription_status']
        ]);
        exit();
    }

    // Buscar detalhes da assinatura no Stripe para pegar o Price ID
    $priceId = null;
    if (!empty($subscriptionId) && !empty($stripeSecretKey)) {
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
            error_log('[stripe_verify] Erro ao buscar assinatura no Stripe: ' . $subEx->getMessage());
        }
    }

    // Ativar o plano diretamente (o webhook não processou ainda)
    $userPlanStr = ($planMeta === 'yearly') ? 'Pro (Anual)' : 'Pro (Mensal)';
    $intervalSql = ($planMeta === 'yearly') ? "INTERVAL 1 YEAR" : "INTERVAL 30 DAY";

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

    // Processar cupom se existir
    $couponCode = $session['metadata']['coupon_code'] ?? '';
    if (!empty($couponCode)) {
        try {
            $stmt = $conn->prepare("UPDATE coupons SET times_used = times_used + 1 WHERE code = :code");
            $stmt->execute(['code' => $couponCode]);
        } catch (Exception $e) {
            error_log('[stripe_verify] Coupon update error: ' . $e->getMessage());
        }
    }

    echo json_encode([
        "status" => "active",
        "plan" => $userPlanStr,
        "subscription_status" => "active"
    ]);

} catch (Exception $e) {
    error_log('[stripe_verify] Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
