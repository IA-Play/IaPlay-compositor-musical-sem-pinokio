<?php
/**
 * iaplay auth_guard.php
 * Proteção de Elite para APIs PHP
 */
/**
 * Configuração de CORS Dinâmica para suportar Credenciais (Cookies)
 */
function setCORSHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (!empty($origin)) {
        // Permitir apenas do domínio oficial iaplay.app (e subdomínios) ou localhost/127.0.0.1 (para dev)
        $allowedPatterns = [
            '/^https?:\/\/(www\.)?iaplay\.app$/',
            '/^https?:\/\/[a-z0-9\-]+\.iaplay\.app$/',
            '/^http:\/\/localhost(:\d+)?$/',
            '/^http:\/\/127\.0\.0\.1(:\d+)?$/'
        ];
        $isValid = false;
        foreach ($allowedPatterns as $pattern) {
            if (preg_match($pattern, $origin)) {
                $isValid = true;
                break;
            }
        }
        if ($isValid) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Credentials: true");
            header("Vary: Origin");
        }
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Chamar CORS antes de qualquer output
setCORSHeaders();

// Detecção robusta de HTTPS (para Proxies/Load Balancers)
$isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
    ($_SERVER['SERVER_PORT'] == 443)
);

// Evita erro de session_start duplicado (pode ocorrer em includes encadeados)
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => $isHttps,
        'cookie_samesite' => 'Lax',
        'cookie_path' => '/',
        'cookie_lifetime' => 86400 * 7, // 7 dias
    ]);
}

/**
 * Verifica se o usuário está autenticado
 * Se não estiver, bloqueia a execução e retorna 401
 */
function checkAuth()
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            "status" => "error",
            "message" => "SESSÃO EXPIRADA: Por favor, faça login novamente para continuar.",
            "code" => "UNAUTHORIZED"
        ]);
        exit();
    }
}

/**
 * Verifica se o usuário é ADMIN
 */
function checkAdmin()
{
    checkAuth();
    
    $userId = $_SESSION['user_id'];
    $plan = strtoupper(trim($_SESSION['user_plan'] ?? ''));
    
    // Se a sessão já possui privilégios de Admin
    if ($plan === 'ADMIN' || $plan === 'VITALÍCIO (ADMIN)' || $plan === 'VITALICIO (ADMIN)' || strpos($plan, 'ADMIN') !== false) {
        return true;
    }
    
    // Fallback: verificar diretamente no banco de dados
    global $conn;
    if ($conn) {
        try {
            $stmt = $conn->prepare("SELECT plan, email FROM users WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            $u = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($u) {
                $dbPlan = strtoupper(trim($u['plan'] ?? ''));
                $dbEmail = strtolower(trim($u['email'] ?? ''));
                if ($dbPlan === 'ADMIN' || strpos($dbPlan, 'ADMIN') !== false || strpos($dbEmail, 'andermi100') === 0 || strpos($dbEmail, 'admin@') === 0) {
                    $_SESSION['user_plan'] = 'ADMIN';
                    return true;
                }
            }
        } catch (Exception $e) {}
    }
    
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        "status" => "error",
        "message" => "ACESSO NEGADO: Esta operação requer privilégios de administrador.",
        "code" => "FORBIDDEN"
    ]);
    exit();
}
