<?php
// ---------------------------------------------------------------
// CONFIGURAÇÃO SMTP — IAPLAY
// Em produção, defina variáveis de ambiente para sobrescrever os fallbacks.
// ---------------------------------------------------------------

$smtpPass = getenv('SMTP_PASS') ?: 'andermi100';

if (empty($smtpPass)) {
    error_log('[mail_config.php] ERRO CRÍTICO: SMTP_PASS não está definida.');
}

return [
    'host'       => getenv('SMTP_HOST') ?: 'mail.iaplay.app',
    'port'       => (int)(getenv('SMTP_PORT') ?: 465),
    'username'   => getenv('SMTP_USER') ?: 'suporte@iaplay.app',
    'password'   => $smtpPass,
    'from_email' => getenv('SMTP_FROM') ?: 'suporte@iaplay.app',
    'from_name'  => getenv('SMTP_FROM_NAME') ?: 'IAPLAY Security'
];
?>