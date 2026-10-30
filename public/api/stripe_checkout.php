<?php
require_once 'config.php';
require_once 'auth_guard.php';

// SEGURANÇA: Requer autenticação para criar sessão de checkout.
checkAuth();

// CORS gerenciado pelo auth_guard.php
header("Content-Type: application/json");

try {
    $stmt = $conn->prepare("SELECT settings_json FROM system_settings WHERE id = 1");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $settings = json_decode($row['settings_json'], true);

    $isTestMode = isset($settings['isStripeTestMode']) ? filter_var($settings['isStripeTestMode'], FILTER_VALIDATE_BOOLEAN) : false;
    $stripeSecretKey = $isTestMode 
        ? ($settings['stripeTestSecretKey'] ?? '') 
        : ($settings['stripeLiveSecretKey'] ?? '');

    if (empty($stripeSecretKey))
        throw new Exception("Chave Secreta do Stripe não configurada no Painel Admin.");

    $input = json_decode(file_get_contents("php://input"), true);
    $planType = isset($input['plan']) ? $input['plan'] : 'monthly';
    $userEmail = isset($input['email']) ? $input['email'] : '';
    $userId = isset($input['id']) ? $input['id'] : '';
    $couponCode = isset($input['coupon']) ? trim(strtoupper($input['coupon'])) : '';

    if (!$userEmail || !$userId)
        throw new Exception("Email e ID do usuário necessários.");

    $priceStr = ($planType === 'yearly') ? ($settings['yearlyPrice'] ?? '299.90') : ($settings['monthlyPrice'] ?? '39.90');
    $priceAmount = floatval(str_replace(',', '.', str_replace('.', '', $priceStr))) * 100;

    $productName = ($planType === 'yearly') ? "IAPLAY Pro (Anual)" : "IAPLAY Pro (Mensal)";

    if (!empty($couponCode)) {
        try {
            $conn->exec("ALTER TABLE coupons ADD COLUMN max_uses INT DEFAULT NULL");
        } catch (Exception $e) {}

        $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code AND active = 1");
        $stmt->execute(['code' => $couponCode]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($coupon) {
            $canUse = true;
            if (!empty($coupon['max_uses']) && $coupon['max_uses'] > 0) {
                if ($coupon['times_used'] >= $coupon['max_uses']) {
                    $canUse = false;
                }
            }

            if ($canUse) {
                $discount = intval($coupon['discount_percent']);
                $priceAmount = $priceAmount * (1 - ($discount / 100));
                $productName .= " ({$discount}% OFF)";
            } else {
                $couponCode = ''; // Limpa o código do cupom se atingiu o limite
            }
        }
    }

    $interval = ($planType === 'yearly') ? 'year' : 'month';
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $domain = $protocol . "://" . $_SERVER['HTTP_HOST'];

    $ch = curl_init();

    // METADATA: Inclui o cupom para processar no callback
    $payload = [
        'payment_method_types' => ['card'],
        'line_items' => [
            [
                'price_data' => [
                    'currency' => 'brl',
                    'product_data' => [
                        'name' => $productName,
                        'description' => 'Acesso total ao IAPLAY Studio'
                    ],
                    'unit_amount' => intval($priceAmount),
                    'recurring' => ['interval' => $interval]
                ],
                'quantity' => 1,
            ]
        ],
        'mode' => 'subscription',
        'success_url' => $domain . '/#/payment/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => $domain . '/#/pricing',
        'customer_email' => $userEmail,
        'client_reference_id' => $userId,
        'metadata' => [
            'coupon_code' => $couponCode,
            'plan' => $planType
        ]
    ];

    curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/checkout/sessions");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

    $result = curl_exec($ch);
    if (curl_errno($ch))
        throw new Exception('Erro cURL: ' . curl_error($ch));
    curl_close($ch);

    $response = json_decode($result, true);

    if (isset($response['error']))
        throw new Exception("Stripe Error: " . $response['error']['message']);
    if (!isset($response['url']))
        throw new Exception("Stripe não retornou uma URL válida.");

    echo json_encode(['url' => $response['url']]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>