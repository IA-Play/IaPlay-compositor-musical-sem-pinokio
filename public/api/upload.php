<?php
require_once 'config.php';
require_once 'auth_guard.php';

// CORS é gerenciado pelo auth_guard.php — não sobrescrever
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");

// ---------------------------------------------------------------
// SEGURANÇA: Requer usuário autenticado para qualquer upload.
// ---------------------------------------------------------------
checkAuth();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uploadDir = '../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Bloquear execução PHP dentro da pasta de uploads via .htaccess
$htaccess = $uploadDir . '.htaccess';
if (!file_exists($htaccess)) {
    file_put_contents($htaccess, "php_flag engine off\nOptions -Indexes\n");
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhum arquivo enviado ou erro no upload.']);
    exit;
}

$file = $_FILES['file'];

if (!is_uploaded_file($file['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo inválido ou não originado por upload HTTP.']);
    exit;
}

// ---------------------------------------------------------------
// SEGURANÇA: Validar MIME type real usando finfo (não o informado
// pelo cliente, que pode ser falsificado).
// ---------------------------------------------------------------
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$realMime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!array_key_exists($realMime, $allowedMimes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Apenas imagens JPG, PNG, WEBP e GIF são permitidas.']);
    exit;
}

$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo muito grande (máx 5MB).']);
    exit;
}

// Extensão derivada do MIME real, nunca do nome original do arquivo
$safeExt = $allowedMimes[$realMime];
$filename = uniqid('img_', true) . '.' . $safeExt;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $domain = $protocol . '://' . $_SERVER['HTTP_HOST'];
    $publicUrl = $domain . '/uploads/' . $filename;
    echo json_encode(['success' => true, 'url' => $publicUrl]);
}
else {
    error_log('[upload.php] Falha ao mover arquivo para ' . $targetPath);
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar arquivo no servidor.']);
}
?>
