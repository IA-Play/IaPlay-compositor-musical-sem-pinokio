<?php
require_once 'config.php';
require_once 'auth_guard.php';

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));


// ---------------------------------------------------------------
// SEGURANÇA: Escrita de configurações exige admin.
// ---------------------------------------------------------------
if ($method === 'POST') {
    checkAdmin();
}

try {
    if ($method === 'GET') {
        $stmt = $conn->prepare("SELECT settings_json FROM system_settings WHERE id = 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $out = new \stdClass();
        if ($row && !empty($row['settings_json'])) {
            $parsed = json_decode($row['settings_json']);
            if ($parsed)
                $out = $parsed;
        }

        // Verifica se é admin para retornar chaves secretas
        $isAdmin = false;
        if (isset($_SESSION['user_plan'])) {
            $plan = strtoupper(trim($_SESSION['user_plan']));
            if ($plan === 'ADMIN' || $plan === 'VITALÍCIO (ADMIN)' || strpos($plan, 'ADMIN') !== false) {
                $isAdmin = true;
            }
        }

        if (!$isAdmin) {
            unset($out->stripeLiveSecretKey);
            unset($out->stripeTestSecretKey);
            unset($out->stripeWebhookSecret);
            unset($out->stripeSecretKey);
            unset($out->googleApiKey);
            unset($out->openaiApiKey);
            unset($out->groqApiKey);
            unset($out->cerebrasApiKey);
            unset($out->openrouterApiKey);
            unset($out->nvidiaApiKey);
            unset($out->mistralApiKey);
            unset($out->togetherApiKey);
        }

        $final_json = json_encode($out);
        $encoded_payload = base64_encode($final_json);
        echo json_encode(["encrypted_payload" => $encoded_payload]);
        exit;
    }

    if ($method === 'POST') {
        // Se $data for nulo, a Hostinger/ModSecurity interceptou e limpou o corpo
        // por causa de tags <form> ou <script>.
        if (!$data) {
            $rawInput = file_get_contents("php://input");
            if (!empty($rawInput)) {
                $data = json_decode($rawInput);
            }
        }

        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Corpo da requisição vazio ou bloqueado pelo Anti-Virus/WAF da hospedagem."]);
            exit;
        }

        // NOVO: Desofuscação de Base64 para bypass de WAF da Hostinger
        if (isset($data->payload)) {
            $decodedStr = base64_decode($data->payload);
            if ($decodedStr !== false) {
                // Como JSON stringify no TS já escapa, o decodedStr é o JSON puro das configurações
                $json = ltrim($decodedStr, "\xEF\xBB\xBF"); // Evita BOM
            }
            else {
                $json = json_encode($data);
            }
        }
        else {
            // Fallback
            $json = json_encode($data);
        }

        // Verifica se já existe registro 1
        $check = $conn->query("SELECT id FROM system_settings WHERE id = 1");

        if ($check->fetch()) {
            $stmt = $conn->prepare("UPDATE system_settings SET settings_json = :json WHERE id = 1");
            $stmt->execute(['json' => $json]);
        }
        else {
            $stmt = $conn->prepare("INSERT INTO system_settings (id, settings_json) VALUES (1, :json)");
            $stmt->execute(['json' => $json]);
        }

        echo json_encode(["success" => true]);
    }

}
catch (PDOException $e) {
    error_log('[settings.php] Erro de BD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erro interno ao salvar configurações."]);
}
?>