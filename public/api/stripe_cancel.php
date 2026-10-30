<?php
require_once 'config.php';
require_once 'auth_guard.php';

checkAuth();

header("Content-Type: application/json");

try {
    $data = json_decode(file_get_contents("php://input"));
    $userId = isset($data->user_id) ? $data->user_id : null;

    if (!$userId) throw new Exception("ID do usuário necessário.");

    // SEGURANÇA (IDOR): Apenas o próprio usuário logado ou um admin pode cancelar.
    if ($_SESSION['user_id'] !== $userId) {
        checkAdmin();
    }

    // 1. Buscar Sub ID no Banco
    $stmt = $conn->prepare("SELECT stripe_subscription_id FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['stripe_subscription_id'])) {
        // Se não tiver ID do Stripe, apenas cancela localmente (legado ou erro)
        $sql = "UPDATE users SET subscription_status = 'canceled' WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->execute(['id' => $userId]);
        echo json_encode(["success" => true, "message" => "Cancelado localmente (Sem ID Stripe)"]);
        exit;
    }

    $subId = $user['stripe_subscription_id'];

    // 2. Obter Chave Secreta
    $stmt = $conn->prepare("SELECT settings_json FROM system_settings WHERE id = 1");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $settings = json_decode($row['settings_json'], true);
    
    $isTestMode = isset($settings['isStripeTestMode']) ? $settings['isStripeTestMode'] : false;
    $stripeSecretKey = $isTestMode 
        ? ($settings['stripeTestSecretKey'] ?? '') 
        : ($settings['stripeLiveSecretKey'] ?? '');

    if (empty($stripeSecretKey)) throw new Exception("Stripe API Key não configurada.");

    // 3. Chamar Stripe API para Cancelar (cancel_at_period_end = true)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/subscriptions/" . $subId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ":");
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['cancel_at_period_end' => 'true']));
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $response = json_decode($result, true);

    if ($httpCode >= 400) {
        throw new Exception("Stripe Error: " . ($response['error']['message'] ?? 'Erro desconhecido'));
    }

    // 4. Atualizar Status Local
    $sql = "UPDATE users SET subscription_status = 'canceled' WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->execute(['id' => $userId]);

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>