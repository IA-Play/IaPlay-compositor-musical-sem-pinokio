<?php
/**
 * IAPLAY SimpleMailer — Envio SMTP Seguro
 * 
 * Implementação raw-socket SMTP com:
 * - Validação de credenciais antes da conexão
 * - Sanitização de headers contra injection
 * - Headers de entregabilidade (Message-ID, X-Mailer, DKIM-friendly)
 * - Logging detalhado para diagnóstico
 * - Tratamento robusto de erros
 */
class SimpleMailer
{
    private $host;
    private $port;
    private $username;
    private $password;
    private $fromEmail;
    private $fromName;
    private $lastError = '';

    public function __construct()
    {
        $config = require 'mail_config.php';
        $this->host = $config['host'];
        $this->port = (int)$config['port'];
        $this->username = $config['username'];
        $this->password = $config['password'];
        $this->fromEmail = $config['from_email'];
        $this->fromName = $config['from_name'];
    }

    /**
     * Retorna o último erro ocorrido (para debugging)
     */
    public function getLastError(): string
    {
        return $this->lastError;
    }

    /**
     * Envia um e-mail via SMTP
     * 
     * @param string $to      Endereço de destino
     * @param string $subject Assunto do e-mail
     * @param string $body    Corpo HTML do e-mail
     * @return bool           True se enviado com sucesso
     * @throws Exception      Em caso de falha na conexão ou envio
     */
    public function send($to, $subject, $body)
    {
        // 1. VALIDAÇÃO PRÉ-ENVIO
        if (empty($this->password)) {
            $this->lastError = 'SMTP_PASS não está configurada. Defina no .env.php ou no painel da Hostinger.';
            error_log('[SimpleMailer] ERRO CRÍTICO: ' . $this->lastError);
            throw new Exception($this->lastError);
        }

        if (empty($this->username) || empty($this->host)) {
            $this->lastError = 'Configuração SMTP incompleta (host ou username vazio).';
            error_log('[SimpleMailer] ERRO: ' . $this->lastError);
            throw new Exception($this->lastError);
        }

        $to = filter_var($to, FILTER_SANITIZE_EMAIL);
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->lastError = "Endereço de e-mail inválido: $to";
            error_log('[SimpleMailer] ERRO: ' . $this->lastError);
            throw new Exception($this->lastError);
        }

        // 2. SANITIZAÇÃO — Remover newlines do Subject para prevenir header injection
        $subject = str_replace(["\r", "\n", "\t"], '', $subject);
        // Encode Subject para suportar UTF-8 corretamente
        $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        // 3. CONEXÃO SMTP
        $context = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true
            ]
        ]);

        $protocol = ($this->port == 465) ? "ssl://" : "";
        $serverAddress = "{$protocol}{$this->host}:{$this->port}";

        error_log("[SimpleMailer] Conectando a {$serverAddress}...");

        $socket = @stream_socket_client(
            $serverAddress,
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) {
            $this->lastError = "Falha na conexão SMTP com {$serverAddress}: $errstr ($errno)";
            error_log('[SimpleMailer] ' . $this->lastError);
            throw new Exception($this->lastError);
        }

        try {
            // Lê saudação do servidor
            $greeting = $this->readResponse($socket);
            error_log("[SimpleMailer] Saudação: " . trim($greeting));

            // EHLO
            $this->sendCommand($socket, "EHLO {$this->host}");

            // AUTH LOGIN
            $this->sendCommand($socket, "AUTH LOGIN");
            $this->sendCommand($socket, base64_encode($this->username), 'AUTH_USER');
            $this->sendCommand($socket, base64_encode($this->password), 'AUTH_PASS');

            error_log("[SimpleMailer] Autenticação SMTP bem-sucedida.");

            // MAIL FROM / RCPT TO
            $this->sendCommand($socket, "MAIL FROM: <{$this->fromEmail}>");
            $this->sendCommand($socket, "RCPT TO: <{$to}>");

            // DATA
            $this->sendCommand($socket, "DATA");

            // 4. HEADERS DE ENTREGABILIDADE
            $messageId = '<' . uniqid('iaplay_', true) . '@' . parse_url("https://{$this->host}", PHP_URL_HOST) . '>';
            $boundary = md5(uniqid(time()));

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "Content-Transfer-Encoding: base64\r\n";
            $headers .= "From: {$this->fromName} <{$this->fromEmail}>\r\n";
            $headers .= "To: {$to}\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "Date: " . date("r") . "\r\n";
            $headers .= "Message-ID: {$messageId}\r\n";
            $headers .= "X-Mailer: IAPLAY-Mailer/2.0\r\n";
            $headers .= "X-Priority: 3\r\n";

            // Encode body em base64 para evitar problemas com caracteres especiais e linhas longas
            $encodedBody = chunk_split(base64_encode($body));

            // Envia headers + corpo
            fputs($socket, "{$headers}\r\n{$encodedBody}\r\n.\r\n");

            // 5. VERIFICAÇÃO DE ACEITE (Código 250)
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) != '250') {
                throw new Exception("Servidor rejeitou o e-mail: $response");
            }

            error_log("[SimpleMailer] ✅ E-mail enviado com sucesso para {$to}");

            $this->sendCommand($socket, "QUIT");
            fclose($socket);

            return true;

        } catch (Exception $e) {
            // Garante fechar o socket em caso de erro
            if (is_resource($socket)) {
                @fputs($socket, "QUIT\r\n");
                @fclose($socket);
            }
            throw $e;
        }
    }

    /**
     * Envia um comando SMTP e verifica a resposta
     */
    private function sendCommand($socket, $cmd, $label = null)
    {
        fputs($socket, $cmd . "\r\n");
        $response = $this->readResponse($socket);

        // Códigos 4xx e 5xx são erros SMTP
        $code = (int)substr($response, 0, 3);
        if ($code >= 400) {
            // Não logar a senha em claro
            $safeCmd = ($label === 'AUTH_PASS') ? 'AUTH_PASS [REDACTED]' : ($label ?: $cmd);
            $this->lastError = "Erro SMTP no comando [{$safeCmd}]: $response";
            error_log('[SimpleMailer] ' . $this->lastError);
            throw new Exception($this->lastError);
        }

        return $response;
    }

    /**
     * Lê a resposta do servidor SMTP (multi-line aware)
     */
    private function readResponse($socket)
    {
        $response = "";
        while ($str = @fgets($socket, 515)) {
            $response .= $str;
            // Resposta SMTP termina quando a 4ª posição é espaço (ex: "250 OK")
            // Hífen (ex: "250-SIZE") indica continuação
            if (substr($str, 3, 1) == " ")
                break;
        }
        return $response;
    }
}
?>