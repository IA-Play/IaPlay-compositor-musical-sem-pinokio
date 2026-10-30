<?php
require_once 'config.php';
require_once 'SimpleMailer.php';
require_once 'auth_guard.php';


// ---------------------------------------------------------------
// SEGURANÇA: Apenas administradores autenticados podem acessar.
// ---------------------------------------------------------------
checkAdmin();

// HEADERS ANTI-CACHE
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

// URL base para o tracking
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'];

// NOTA: Migrações de banco foram removidas deste arquivo para não
// executar ALTER TABLE a cada requisição. Execute migrate.php uma única vez.

try {

    if ($method === 'GET') {
        if ($action === 'list_users') {
            $stmt = $conn->prepare("SELECT id, name, email, plan, credits, is_verified, is_blocked, subscription_status, current_period_end, created_at, last_login FROM users ORDER BY created_at DESC");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($users);
        }

        // --- COUPONS LIST ---
        if ($action === 'list_coupons') {
            $conn->exec("CREATE TABLE IF NOT EXISTS coupons (
                id VARCHAR(50) PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_percent INT NOT NULL,
                active TINYINT(1) DEFAULT 1,
                times_validated INT DEFAULT 0,
                times_used INT DEFAULT 0,
                max_uses INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");

            try {
                $conn->exec("ALTER TABLE coupons ADD COLUMN max_uses INT DEFAULT NULL");
            } catch (Exception $e) {}

            $stmt = $conn->prepare("SELECT * FROM coupons ORDER BY created_at DESC");
            $stmt->execute();
            $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($coupons);
        }

        // --- CAMPAIGNS LIST (EMAIL) ---
        if ($action === 'list_campaigns') {
            $conn->exec("CREATE TABLE IF NOT EXISTS email_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject VARCHAR(255) NOT NULL,
                target_group VARCHAR(50) NOT NULL,
                sent_count INT DEFAULT 0,
                clicks_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");

            $stmt = $conn->prepare("SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 50");
            $stmt->execute();
            $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($campaigns);
        }

        elseif ($action === 'list_premium_files') {
            $stmt = $conn->prepare("SELECT * FROM premium_files ORDER BY criado_em DESC");
            $stmt->execute();
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($files);
            exit;
        }
    }

    if ($method === 'POST') {

        if ($action === 'delete_user') {
            if (!isset($data->id))
                throw new Exception("ID necessário");
            $userId = $data->id;
            $conn->beginTransaction();
            try {
                $stmt = $conn->prepare("DELETE FROM projects WHERE user_id = :id");
                $stmt->execute(['id' => $userId]);
                $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
                $stmt->execute(['id' => $userId]);
                $conn->commit();
                echo json_encode(["success" => true]);
            }
            catch (Exception $e) {
                $conn->rollBack();
                throw $e;
            }
        }
        elseif ($action === 'toggle_block') {
            $stmt = $conn->prepare("UPDATE users SET is_blocked = :block WHERE id = :id");
            $stmt->execute(['block' => $data->isBlocked ? 1 : 0, 'id' => $data->id]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'update_user_fields') {
            $id = $data->id;
            $fields = [
                'name' => $data->name,
                'email' => $data->email,
                'plan' => $data->plan,
                'credits' => intval($data->credits),
                'is_verified' => $data->isVerified ? 1 : 0,
                'subscription_status' => $data->subscriptionStatus,
                'current_period_end' => $data->currentPeriodEnd ?: null
            ];

            $setClauses = [];
            foreach ($fields as $key => $val) {
                $setClauses[] = "$key = :$key";
            }

            $sql = "UPDATE users SET " . implode(", ", $setClauses) . " WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $fields['id'] = $id;
            $stmt->execute($fields);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'force_activate') {
            $id = $data->id;
            $plan = $data->plan;
            $duration = $data->duration;
            // SEGURANÇA: Sanitizar para prevenir SQL injection (valor concatenado na query)
            $intervalSql = ($duration === 'yearly') ? "INTERVAL 1 YEAR" : "INTERVAL 30 DAY";
            $sql = "UPDATE users SET plan = :plan, subscription_status = 'active', credits = 9999, current_period_end = DATE_ADD(NOW(), $intervalSql) WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute(['plan' => $plan, 'id' => $id]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'admin_reset_password') {
            $id = $data->id;
            $newPassword = $data->password;
            if (!$newPassword)
                throw new Exception("Senha obrigatória");
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = :pass WHERE id = :id");
            $stmt->execute(['pass' => $hash, 'id' => $id]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'add_user') {
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(['email' => $data->email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(["error" => "Email já existe"]);
                exit();
            }
            $passHash = password_hash($data->password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO users (id, name, email, password, plan, credits, is_verified, is_blocked, subscription_status, current_period_end) 
                    VALUES (:id, :name, :email, :password, :plan, :credits, 1, 0, :status, NULL)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'id' => $data->id,
                'name' => $data->name,
                'email' => $data->email,
                'password' => $passHash,
                'plan' => $data->plan,
                'credits' => $data->credits,
                'status' => $data->status
            ]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'resend_verification') {
            $id = $data->id;
            $stmt = $conn->prepare("SELECT email, name, verification_code FROM users WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $code = $user['verification_code'];
                if (!$code) {
                    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
                    $upd = $conn->prepare("UPDATE users SET verification_code = :code WHERE id = :id");
                    $upd->execute(['code' => $code, 'id' => $id]);
                }
                $mailer = new SimpleMailer();
                $body = "<div style='font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: 0 auto;'><h2 style='color: #8b5cf6; text-align: center;'>Ative sua conta no IAPLAY</h2><p>Olá <strong>{$user['name']}</strong>,</p><p>Notamos que você se cadastrou mas ainda não ativou sua conta.</p><p>Para começar a criar músicas com IA, use o código abaixo:</p><div style='text-align: center; margin: 30px 0;'><h1 style='font-size: 32px; color: #333; background: #f3f4f6; padding: 15px 30px; display: inline-block; letter-spacing: 8px; border-radius: 8px; border: 2px dashed #8b5cf6;'>$code</h1></div><p style='text-align: center;'><a href='https://iaplay.app/#/login' style='background: #8b5cf6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;'>Ir para Login</a></p></div>";
                $mailer->send($user['email'], "Lembrete: Ative sua conta IAPLAY", $body);
                echo json_encode(["success" => true]);
            }
            else {
                throw new Exception("Usuário não encontrado.");
            }
        }

        // --- TRACKABLE BULK EMAIL ---
        elseif ($action === 'send_bulk_email') {
            $subject = $data->subject;
            $bodyContent = $data->content;
            $target = $data->target;

            if (!$subject || !$bodyContent)
                throw new Exception("Assunto e conteúdo obrigatórios.");

            // 1. Criar a Campanha no DB
            $conn->exec("CREATE TABLE IF NOT EXISTS email_campaigns (id INT AUTO_INCREMENT PRIMARY KEY, subject VARCHAR(255) NOT NULL, target_group VARCHAR(50) NOT NULL, sent_count INT DEFAULT 0, clicks_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            $stmt = $conn->prepare("INSERT INTO email_campaigns (subject, target_group) VALUES (:sub, :grp)");
            $stmt->execute(['sub' => $subject, 'grp' => $target]);
            $campaignId = $conn->lastInsertId();

            // 2. Preparar Tracking Links
            // Regex para encontrar todos os href="..." e substituir pelo tracking
            $trackedBody = preg_replace_callback('/href=["\'](http[^"\']+)["\']/', function ($matches) use ($baseUrl, $campaignId) {
                $originalUrl = $matches[1];
                // Se já for link de tracking, ignora
                if (strpos($originalUrl, 'track.php') !== false)
                    return $matches[0];

                $encodedUrl = base64_encode($originalUrl);
                $trackingUrl = "$baseUrl/api/track.php?c=$campaignId&u=$encodedUrl";
                return 'href="' . $trackingUrl . '"';
            }, $bodyContent);

            // 3. Selecionar Usuários
            $sql = "SELECT email, name FROM users";
            if ($target === 'free')
                $sql .= " WHERE plan = 'Gratuito'";
            elseif ($target === 'pro')
                $sql .= " WHERE plan LIKE 'Pro%'";
            elseif ($target === 'pending')
                $sql .= " WHERE subscription_status = 'pending_payment'";

            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 4. Enviar
            $mailer = new SimpleMailer();
            $sentCount = 0;

            foreach ($users as $user) {
                $personalizedBody = str_replace('{name}', $user['name'], $trackedBody);
                $finalHtml = "<div style='font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;'>$personalizedBody<hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'><p style='font-size: 11px; color: #999; text-align: center;'>Enviado por IAPLAY Studio.</p></div>";
                try {
                    $mailer->send($user['email'], $subject, $finalHtml);
                    $sentCount++;
                }
                catch (Exception $e) {
                }
            }

            // 5. Atualizar contagem
            $upd = $conn->prepare("UPDATE email_campaigns SET sent_count = :cnt WHERE id = :id");
            $upd->execute(['cnt' => $sentCount, 'id' => $campaignId]);

            echo json_encode(["success" => true, "sent" => $sentCount]);
        }

        // --- CHARGE PENDING USERS (NEW) ---
        elseif ($action === 'send_payment_link_bulk') {
            error_reporting(0); // Silencia warnings do PHP para não corromper o JSON retornado
            try {
                $sql = "SELECT email, name FROM users WHERE subscription_status IN ('pending_payment', 'expired')";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($users) === 0) {
                    echo json_encode(["success" => true, "sent" => 0, "message" => "Nenhum usuário pendente encontrado."]);
                    exit();
                }

                $mailer = new SimpleMailer();
                $sentCount = 0;
                $failCount = 0;
                $lastError = "";

                foreach ($users as $user) {
                    $checkoutUrl = "$baseUrl/#/checkout/monthly";
                    $body = "
                        <div style='font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;'>
                            <h2 style='color: #8b5cf6; text-align: center;'>Aviso de Assinatura Pendente</h2>
                            <p>Olá <strong>{$user['name']}</strong>,</p>
                            <p>Identificamos que a sua assinatura do IAPLAY Studio encontra-se pendente ou expirada. Para não perder acesso à plataforma e aos seus projetos, por favor, regularize o seu pagamento.</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='$checkoutUrl' style='background: #8b5cf6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;'>Renovar Acesso Agora</a>
                            </div>
                            <p style='font-size: 12px; color: #666; text-align: center;'>Se você já realizou o pagamento, aguarde alguns minutos enquanto o sistema processa.</p>
                            <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'>
                            <p style='font-size: 11px; color: #999; text-align: center;'>Equipe IAPLAY Studio.</p>
                        </div>
                    ";
                    try {
                        $mailer->send($user['email'], "Pagamento Pendente - IAPLAY Studio", $body);
                        $sentCount++;
                    }
                    catch (Exception $e) {
                        $failCount++;
                        $lastError = $e->getMessage();
                    }
                }

                if ($sentCount === 0 && $failCount > 0) {
                    echo json_encode(["success" => false, "error" => "Falha no envio (Ex: SMTP Configuração Inválida): " . $lastError]);
                }
                else {
                    echo json_encode(["success" => true, "sent" => $sentCount, "failed" => $failCount]);
                }
            }
            catch (Exception $e) {
                echo json_encode(["success" => false, "error" => "Erro interno no servidor SQL: " . $e->getMessage()]);
            }
        }

        // --- COUPONS CRUD & VALIDATE ---
        elseif ($action === 'create_coupon') {
            $code = strtoupper(trim($data->code));
            $discount = intval($data->discount);
            $max_uses = isset($data->max_uses) && $data->max_uses !== '' ? intval($data->max_uses) : null;
            $id = uniqid();
            if (!$code || $discount <= 0 || $discount > 100)
                throw new Exception("Dados inválidos.");
            $conn->exec("CREATE TABLE IF NOT EXISTS coupons (id VARCHAR(50) PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, discount_percent INT NOT NULL, active TINYINT(1) DEFAULT 1, times_validated INT DEFAULT 0, times_used INT DEFAULT 0, max_uses INT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            
            try {
                $conn->exec("ALTER TABLE coupons ADD COLUMN max_uses INT DEFAULT NULL");
            } catch (Exception $e) {}

            $stmt = $conn->prepare("INSERT INTO coupons (id, code, discount_percent, active, max_uses) VALUES (:id, :code, :disc, 1, :max_uses)");
            $stmt->execute(['id' => $id, 'code' => $code, 'disc' => $discount, 'max_uses' => $max_uses]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'delete_coupon') {
            $stmt = $conn->prepare("DELETE FROM coupons WHERE id = :id");
            $stmt->execute(['id' => $data->id]);
            echo json_encode(["success" => true]);
        }
        elseif ($action === 'validate_coupon') {
            $code = strtoupper(trim($data->code));
            try {
                $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code AND active = 1");
                $stmt->execute(['code' => $code]);
                $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($coupon) {
                    // TRACKING: Incrementa validação (tentativa de uso)
                    $upd = $conn->prepare("UPDATE coupons SET times_validated = times_validated + 1 WHERE id = :id");
                    $upd->execute(['id' => $coupon['id']]);

                    echo json_encode(["success" => true, "discount" => $coupon['discount_percent']]);
                }
                else {
                    http_response_code(404);
                    echo json_encode(["error" => "Cupom inválido"]);
                }
            }
            catch (Exception $e) {
                http_response_code(404);
                echo json_encode(["error" => "Erro interno ou cupom inválido."]);
            }
        }

        // --- CREATE PREMIUM FILE ---
        elseif ($action === 'create_premium_file') {
            $id = trim($data->id ?? '');
            $titulo = trim($data->titulo ?? '');
            $descricao = trim($data->descricao ?? '');
            $url_arquivo = trim($data->url_arquivo ?? '');

            if (empty($id) || empty($titulo) || empty($url_arquivo)) {
                throw new Exception("ID, título e link do arquivo são obrigatórios.");
            }

            $stmt = $conn->prepare("INSERT INTO premium_files (id, titulo, descricao, url_arquivo) VALUES (:id, :titulo, :descricao, :url_arquivo)");
            $stmt->execute([
                'id' => $id,
                'titulo' => $titulo,
                'descricao' => $descricao,
                'url_arquivo' => $url_arquivo
            ]);
            echo json_encode(["success" => true]);
            exit;
        }

        // --- UPDATE PREMIUM FILE ---
        elseif ($action === 'update_premium_file') {
            $id = trim($data->id ?? '');
            $titulo = trim($data->titulo ?? '');
            $descricao = trim($data->descricao ?? '');
            $url_arquivo = trim($data->url_arquivo ?? '');

            if (empty($id) || empty($titulo) || empty($url_arquivo)) {
                throw new Exception("ID, título e link do arquivo são obrigatórios.");
            }

            $stmt = $conn->prepare("UPDATE premium_files SET titulo = :titulo, descricao = :descricao, url_arquivo = :url_arquivo WHERE id = :id");
            $stmt->execute([
                'id' => $id,
                'titulo' => $titulo,
                'descricao' => $descricao,
                'url_arquivo' => $url_arquivo
            ]);
            echo json_encode(["success" => true]);
            exit;
        }

        // --- DELETE PREMIUM FILE ---
        elseif ($action === 'delete_premium_file') {
            $id = trim($data->id ?? '');
            if (empty($id)) {
                throw new Exception("ID necessário.");
            }

            // Buscar arquivo para saber se é local e deletar do disco
            $stmt = $conn->prepare("SELECT url_arquivo FROM premium_files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($file) {
                $filename = basename($file['url_arquivo']);
                $localPath = __DIR__ . '/../../premium_uploads/' . $filename;
                if (file_exists($localPath) && !is_dir($localPath)) {
                    unlink($localPath);
                }
            }

            $stmt = $conn->prepare("DELETE FROM premium_files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            echo json_encode(["success" => true]);
            exit;
        }

        // --- UPLOAD PREMIUM FILE ---
        elseif ($action === 'upload_premium_file') {
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['error' => 'Nenhum arquivo enviado ou erro no upload.']);
                exit;
            }

            $file = $_FILES['file'];

            if (!is_uploaded_file($file['tmp_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Arquivo inválido.']);
                exit;
            }

            // Validar MIME type real usando finfo
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $realMime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            $allowedMimes = [
                // Zip/Compressed
                'application/zip' => 'zip',
                'application/x-zip-compressed' => 'zip',
                'application/x-zip' => 'zip',
                'multipart/x-zip' => 'zip',
                // Documentos
                'application/pdf' => 'pdf',
                'text/plain' => 'txt',
                // Audio
                'audio/mpeg' => 'mp3',
                'audio/mp3' => 'mp3',
                'audio/wav' => 'wav',
                'audio/x-wav' => 'wav',
                // Imagens
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
            ];

            if (!array_key_exists($realMime, $allowedMimes)) {
                http_response_code(400);
                echo json_encode(['error' => 'Tipo de arquivo não permitido. Apenas ZIP, PDF, MP3, WAV e Imagens são suportados.']);
                exit;
            }

            $maxSize = 100 * 1024 * 1024; // 100MB
            if ($file['size'] > $maxSize) {
                http_response_code(400);
                echo json_encode(['error' => 'Arquivo muito grande (máximo 100MB).']);
                exit;
            }

            $safeExt = $allowedMimes[$realMime];
            // Sanitizar nome original
            $origName = pathinfo($file['name'], PATHINFO_FILENAME);
            $cleanName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $origName);
            $filename = 'premium_' . $cleanName . '_' . uniqid() . '.' . $safeExt;
            
            $uploadDir = __DIR__ . '/../../premium_uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $targetPath = $uploadDir . $filename;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                echo json_encode(['success' => true, 'url' => $filename]);
                exit;
            } else {
                error_log('[admin.php upload_premium] Falha ao mover para ' . $targetPath);
                http_response_code(500);
                echo json_encode(['error' => 'Falha ao salvar arquivo no servidor.']);
                exit;
            }
        }
    }

}
catch (PDOException $e) {
    error_log('[admin.php] PDO Erro: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erro interno no banco de dados."]);
}
catch (Exception $e) {
    error_log('[admin.php] Exception: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(["error" => "Erro ao processar a requisição. Tente novamente."]);
}
?>