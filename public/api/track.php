
<?php
require_once 'config.php';

// Endpoint para rastrear cliques de email
// Uso: iaplay.app/api/track.php?c=[CAMPAIGN_ID]&u=[URL_ENCODED]

$campaignId = isset($_GET['c']) ? intval($_GET['c']) : 0;
$destinationUrl = isset($_GET['u']) ? base64_decode($_GET['u']) : '';

if ($campaignId > 0) {
    try {
        // Incrementa o contador de cliques
        $stmt = $conn->prepare("UPDATE email_campaigns SET clicks_count = clicks_count + 1 WHERE id = :id");
        $stmt->execute(['id' => $campaignId]);
    } catch (Exception $e) {
        // Ignora erros silenciosamente para não quebrar o redirect
    }
}

// SEGURANÇA: Bloquear open redirect - apenas permitir URLs do domínio próprio
$allowedDomains = ['iaplay.app', 'www.iaplay.app', 'localhost'];
$parsedUrl = parse_url($destinationUrl);
$isSafe = false;
if ($parsedUrl && isset($parsedUrl['host'])) {
    foreach ($allowedDomains as $domain) {
        if (strcasecmp($parsedUrl['host'], $domain) === 0) {
            $isSafe = true;
            break;
        }
    }
}

// Se URL não é segura ou inválida, redireciona para a home
if (!$isSafe || !$destinationUrl) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $destinationUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/';
}

// Redireciona
header("Location: " . $destinationUrl);
exit();
?>
