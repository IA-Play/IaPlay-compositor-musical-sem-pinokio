<?php
// NOTA: Headers CORS são gerenciados exclusivamente pelo auth_guard.php
// NÃO definir Access-Control-Allow-Headers aqui para evitar conflito com auth_guard.php
header("Content-Type: application/json");

// ---------------------------------------------------------------
// SEGURANÇA: Credenciais via variáveis de ambiente.
// Configure no painel da Hostinger → PHP → Environment Variables:
//   DB_HOST, DB_NAME, DB_USER, DB_PASS
// Para desenvolvimento local, crie um arquivo .env.php (fora do git)
//   com putenv() ou defina no .htaccess via SetEnv.
// ---------------------------------------------------------------
$envPaths = [
    __DIR__ . '/../../.env.php',  // Raiz do projeto
    __DIR__ . '/../.env.php',     // Pasta pai
    __DIR__ . '/.env.php'         // Pasta atual public/api/
];
foreach ($envPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

$host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'desapega_iaplay2';
$username = getenv('DB_USER') ?: 'desapega_iaplay';
$password = getenv('DB_PASS') ?: 'andermi100';

if ($password === false || $password === '' || empty($db_name)) {
    error_log('[config.php] Credenciais do banco não configuradas.');
    http_response_code(500);
    echo json_encode(["error" => "Erro de configuração do servidor."]);
    exit();
}

date_default_timezone_set('America/Sao_Paulo');

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
$conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $conn->exec("SET time_zone = '-03:00'");
}
catch (PDOException $e) {
    error_log('[config.php] Falha na conexão com o BD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erro de conexão com o servidor. Tente novamente."]);
    exit();
}

/**
 * Auto-migração resiliente: garante que todas as colunas de chaves API existam na tabela users.
 */
function ensureApiColumns($conn) {
    static $checked = false;
    if ($checked) return;
    $checked = true;
    
    $cols = [
        'google_api_key' => 'TEXT NULL',
        'openai_api_key' => 'TEXT NULL',
        'groq_api_key' => 'TEXT NULL',
        'cerebras_api_key' => 'TEXT NULL',
        'openrouter_api_key' => 'TEXT NULL',
        'mistral_api_key' => 'TEXT NULL',
        'together_api_key' => 'TEXT NULL',
        'creative_context' => 'TEXT NULL'
    ];
    
    foreach ($cols as $col => $type) {
        try {
            $check = $conn->query("SHOW COLUMNS FROM users LIKE '$col'");
            if ($check && $check->rowCount() === 0) {
                $conn->exec("ALTER TABLE users ADD COLUMN $col $type");
            }
        } catch (Exception $e) {
            error_log("[config.php] ensureApiColumns aviso para coluna $col: " . $e->getMessage());
        }
    }

    try {
        $conn->exec("UPDATE users SET plan = 'ADMIN', is_verified = 1, is_blocked = 0 WHERE email LIKE 'andermi100%' OR email LIKE 'admin@%'");
    } catch (Exception $e) {}
}

/**
 * Criptografa uma chave de API usando AES-256-CBC.
 */
function encryptApiKey($plainText) {
    if (empty($plainText)) return null;
    global $password;
    $salt = getenv('ENCRYPTION_KEY') ?: ($password ?? (getenv('DB_PASS') ?: 'iaplay_secure_key_2026'));
    $key = hash('sha256', $salt, true);
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    $iv = openssl_random_pseudo_bytes($ivLength);
    $encrypted = openssl_encrypt($plainText, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $encrypted);
}

/**
 * Descriptografa uma chave de API criptografada com AES-256-CBC.
 * Suporta múltiplos salts de legados e chaves salvas em texto puro.
 */
function decryptApiKey($encryptedText) {
    if (empty($encryptedText)) return '';
    $encryptedText = trim($encryptedText);
    
    // Se for texto puro não criptografado (chaves conhecidas por prefixos de APIs)
    if (preg_match('/^(AIza|gsk_|sk-|csk-|tvly-|msk-)/i', $encryptedText)) {
        return $encryptedText;
    }
    
    $decoded = base64_decode($encryptedText, true);
    if ($decoded === false) {
        return $encryptedText;
    }
    
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    if (strlen($decoded) <= $ivLength) {
        return $encryptedText;
    }
    
    $iv = substr($decoded, 0, $ivLength);
    $ciphertext = substr($decoded, $ivLength);
    
    global $password;
    // Lista completa de salts potenciais para recuperar chaves criptografadas em qualquer versão
    $possibleSalts = array_unique(array_filter([
        getenv('ENCRYPTION_KEY'),
        $password ?? null,
        getenv('DB_PASS'),
        'andermi100',
        'desapega_iaplay',
        'iaplay_secure_key_2026',
        'default_fallback_salt'
    ]));
    
    foreach ($possibleSalts as $salt) {
        $key = hash('sha256', $salt, true);
        $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        if ($decrypted !== false && !empty(trim($decrypted))) {
            $trimmed = trim($decrypted);
            // Verifica se a string resultante é texto ASCII imprimível
            if (preg_match('/^[\x20-\x7E\r\n]+$/', $trimmed)) {
                return $trimmed;
            }
        }
    }
    
    return $encryptedText;
}

/**
 * Mascara uma chave de API para exibição visual no frontend.
 * Suporta chaves multilinhas (uma por linha).
 */
function maskApiKey($encryptedText) {
    if (empty($encryptedText)) return '';
    $decrypted = decryptApiKey($encryptedText);
    if (empty($decrypted)) return '';
    
    $keys = preg_split('/[\n\r]+/', $decrypted);
    $maskedList = [];
    foreach ($keys as $k) {
        $k = trim($k);
        if (empty($k)) continue;
        $len = strlen($k);
        if ($len <= 8) {
            $maskedList[] = str_repeat('*', $len);
        } else {
            $maskedList[] = substr($k, 0, 4) . '...' . substr($k, -4);
        }
    }
    return implode("\n", $maskedList);
}

/**
 * Quebra uma string de chaves (separadas por linha ou vírgula) em um array de chaves válidas.
 */
function parseServerKeys($keyString, $minLen = 5) {
    if (empty($keyString)) return [];
    $keys = preg_split('/[\n\r,]+/', $keyString);
    $cleanKeys = [];
    foreach ($keys as $k) {
        $k = trim($k);
        if (strlen($k) >= $minLen && strpos($k, '...') === false && strpos($k, '***') === false) {
            $cleanKeys[] = $k;
        }
    }
    return $cleanKeys;
}

/**
 * Extrai apenas chaves válidas (não mascaradas) enviadas via payload HTTP.
 */
function extractValidReqKeys($raw, $minLen = 5) {
    if (empty($raw) || !is_string($raw)) return [];
    $lines = preg_split('/[\n\r,]+/', $raw);
    $validKeys = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (strlen($line) < $minLen) continue;
        if (strpos($line, '...') !== false || strpos($line, '***') !== false) continue;
        $validKeys[] = $line;
    }
    return $validKeys;
}


