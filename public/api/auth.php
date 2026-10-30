<?php
require_once 'config.php';
require_once 'SimpleMailer.php';

header("Content-Type: application/json; charset=UTF-8");

require_once 'auth_guard.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

if ($method === 'POST') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // --- LOGIN ---
    if ($action === 'login') {
        $email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
        $password = $data->password;

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email e senha são obrigatórios."]);
            exit();
        }

        try {
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                // Bloqueio de acesso removido - verificação de e-mail não é mais necessária

                if ($user['is_blocked'] == 1) {
                    http_response_code(403);
                    echo json_encode(["error" => "Conta suspensa."]);
                    exit();
                }

                $userEmail = strtolower(trim($user['email'] ?? ''));
                if (strpos($userEmail, 'andermi100') === 0 || strpos($userEmail, 'admin@') === 0) {
                    $user['plan'] = 'ADMIN';
                }

                // O usuário entrou com sucesso, vamos registrar o último login
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_plan'] = $user['plan'];

                // AUTO-EXPIRE TRIAL: Verifica se o trial expirou e atualiza o status (apenas para não-admins)
                if ($user['plan'] !== 'ADMIN' && $user['subscription_status'] === 'trialing' && !empty($user['trial_ends_at'])) {
                    $trialEnd = new DateTime($user['trial_ends_at']);
                    $now = new DateTime();
                    if ($now > $trialEnd) {
                        $expireStmt = $conn->prepare("UPDATE users SET subscription_status = 'expired', plan = 'Expirado' WHERE id = :id");
                        $expireStmt->execute(['id' => $user['id']]);
                        $user['subscription_status'] = 'expired';
                        $user['plan'] = 'Expirado';
                        $_SESSION['user_plan'] = 'Expirado';
                    }
                }

                $updateLogin = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
                $updateLogin->execute(['id' => $user['id']]);

                unset($user['password']);
                unset($user['verification_code']);

                $user['googleApiKey'] = maskApiKey($user['google_api_key'] ?? '');
                $user['openaiApiKey'] = maskApiKey($user['openai_api_key'] ?? '');
                $user['groqApiKey'] = maskApiKey($user['groq_api_key'] ?? '');
                $user['cerebrasApiKey'] = maskApiKey($user['cerebras_api_key'] ?? '');
                $user['openrouterApiKey'] = maskApiKey($user['openrouter_api_key'] ?? '');
                $user['mistralApiKey'] = maskApiKey($user['mistral_api_key'] ?? '');
                $user['togetherApiKey'] = maskApiKey($user['together_api_key'] ?? '');
                $user['currentPeriodEnd'] = $user['current_period_end'];
                $user['creativeContext'] = $user['creative_context'] ?? '';

                echo json_encode($user);
            }
            else {
                http_response_code(401);
                echo json_encode(["error" => "Credenciais inválidas."]);
            }
        }
        catch (PDOException $e) {
            error_log('[auth.php login] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erro interno ao fazer login."]);
        }
    }

    // --- FORGOT PASSWORD (REQUEST CODE) ---
    elseif ($action === 'forgot_password') {
        $email = filter_var($data->email, FILTER_SANITIZE_EMAIL);

        try {
            $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $rawCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $expiryTime = time() + 3600; // 1 hora de expiração
                $codeRecord = $rawCode . '|' . $expiryTime;

                // Salva o código temporário no campo verification_code
                $stmt = $conn->prepare("UPDATE users SET verification_code = :code WHERE id = :id");
                $stmt->execute(['code' => $codeRecord, 'id' => $user['id']]);

                $mailer = new SimpleMailer();
                $body = "
                    <div style='font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 8px;'>
                        <h2 style='color: #8b5cf6;'>Recuperação de Senha</h2>
                        <p>Olá <strong>{$user['name']}</strong>,</p>
                        <p>Use o código abaixo para redefinir sua senha:</p>
                        <h1 style='font-size: 32px; color: #333; background: #f3f4f6; padding: 10px; display: inline-block; letter-spacing: 4px; border-radius: 4px;'>$rawCode</h1>
                        <p style='margin-top:20px; font-size: 12px; color: #666;'>Este código expira em 1 hora.</p>
                        <p style='font-size: 12px; color: #666;'>Se você não solicitou, ignore este e-mail.</p>
                    </div>
                ";
                try {
                    $mailer->send($email, "Redefinir Senha - IAPLAY", $body);
                }
                catch (Exception $mailEx) {
                    error_log('[auth.php forgot_password] Falha ao enviar e-mail de reset: ' . $mailEx->getMessage());
                    // CORREÇÃO: Informar o frontend que o e-mail falhou
                    http_response_code(503);
                    echo json_encode(["error" => "Não foi possível enviar o e-mail de recuperação. Tente novamente em alguns minutos."]);
                    exit();
                }
            }

            // Retorna sucesso (se o user não existe, retorna sucesso por segurança anti-enumeration)
            echo json_encode(["success" => true]);

        }
        catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro de servidor ao processar recuperação."]);
        }
    }

    // --- RESET PASSWORD (EXECUTE) ---
    elseif ($action === 'reset_password') {
        $email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
        $code = trim($data->code);
        $newPassword = $data->password;

        try {
            $stmt = $conn->prepare("SELECT id, verification_code FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && !empty($user['verification_code'])) {
                $parts = explode('|', $user['verification_code']);
                $recordCode = $parts[0];
                $expiryTime = isset($parts[1]) ? (int)$parts[1] : 0;

                if ($recordCode === $code && ($expiryTime === 0 || time() <= $expiryTime)) {
                    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

                    // Atualiza senha e limpa o código
                    $stmt = $conn->prepare("UPDATE users SET password = :pass, verification_code = NULL WHERE id = :id");
                    $stmt->execute(['pass' => $hash, 'id' => $user['id']]);

                    echo json_encode(["success" => true]);
                }
                else {
                    http_response_code(400);
                    echo json_encode(["error" => "Código inválido ou expirado."]);
                }
            }
            else {
                http_response_code(400);
                echo json_encode(["error" => "Código inválido."]);
            }
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro ao redefinir senha."]);
        }
    }

    // --- GET USER (SYNC) ---
    elseif ($action === 'get_user') {
        // SEGURANÇA: Requer autenticação. Usuário só pode ver seus próprios dados.
        checkAuth();
        $requestedId = $data->id ?? null;
        if (empty($requestedId)) {
            http_response_code(400);
            echo json_encode(["error" => "ID é obrigatório."]);
            exit();
        }
        // IDOR: Só permite acessar dados do próprio usuário (admin pode ver qualquer um)
        if ($_SESSION['user_id'] !== $requestedId) {
            checkAdmin();
        }
        $id = $requestedId;
        try {
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                unset($user['password']);
                unset($user['verification_code']);

                $userEmail = strtolower(trim($user['email'] ?? ''));
                if (strpos($userEmail, 'andermi100') === 0 || strpos($userEmail, 'admin@') === 0) {
                    $user['plan'] = 'ADMIN';
                }

                // AUTO-EXPIRE TRIAL
                if ($user['plan'] !== 'ADMIN' && $user['subscription_status'] === 'trialing' && !empty($user['trial_ends_at'])) {
                    $trialEnd = new DateTime($user['trial_ends_at']);
                    $now = new DateTime();
                    if ($now > $trialEnd) {
                        $expireStmt = $conn->prepare("UPDATE users SET subscription_status = 'expired', plan = 'Expirado' WHERE id = :id");
                        $expireStmt->execute(['id' => $user['id']]);
                        $user['subscription_status'] = 'expired';
                        $user['plan'] = 'Expirado';
                    }
                }

                $user['googleApiKey'] = maskApiKey($user['google_api_key'] ?? '');
                $user['openaiApiKey'] = maskApiKey($user['openai_api_key'] ?? '');
                $user['groqApiKey'] = maskApiKey($user['groq_api_key'] ?? '');
                $user['cerebrasApiKey'] = maskApiKey($user['cerebras_api_key'] ?? '');
                $user['openrouterApiKey'] = maskApiKey($user['openrouter_api_key'] ?? '');
                $user['mistralApiKey'] = maskApiKey($user['mistral_api_key'] ?? '');
                $user['togetherApiKey'] = maskApiKey($user['together_api_key'] ?? '');
                $user['currentPeriodEnd'] = $user['current_period_end'];
                $user['creativeContext'] = $user['creative_context'] ?? '';

                echo json_encode($user);
            }
            else {
                http_response_code(404);
                echo json_encode(["error" => "Usuário não encontrado."]);
            }
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro ao buscar usuário."]);
        }
    }

    // --- RESTORE SESSION (COOKIE-BASED ONLY) ---
    elseif ($action === 'restore_session') {
        $userId = $data->id ?? null;
        if (empty($userId)) {
            http_response_code(400);
            echo json_encode(["error" => "ID é obrigatório."]);
            exit();
        }

        // SEGURANÇA: Só permite "restaurar" a sessão se ela já estiver ativa no PHP e corresponder ao ID enviado.
        // Se a sessão expirou no servidor, o usuário DEVE fazer login novamente via login comum.
        if (isset($_SESSION['user_id']) && $_SESSION['user_id'] === $userId) {
            try {
                $stmt = $conn->prepare("SELECT id, email, plan, is_blocked FROM users WHERE id = :id");
                $stmt->execute(['id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    if ($user['is_blocked'] == 1) {
                        session_destroy();
                        http_response_code(403);
                        echo json_encode(["error" => "Conta suspensa."]);
                        exit();
                    }

                    $userEmail = strtolower(trim($user['email'] ?? ''));
                    if (strpos($userEmail, 'andermi100') === 0 || strpos($userEmail, 'admin@') === 0) {
                        $user['plan'] = 'ADMIN';
                    }

                    // Atualiza o plano da sessão por segurança
                    $_SESSION['user_plan'] = $user['plan'];

                    echo json_encode(["success" => true]);
                    exit();
                }
            } catch (PDOException $e) {
                error_log('[auth.php restore_session] ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(["error" => "Erro interno ao restaurar sessão."]);
                exit();
            }
        }

        // Se a sessão PHP não existe ou o ID não corresponde, retorna 401
        http_response_code(401);
        echo json_encode(["error" => "Sessão expirada. Faça login novamente."]);
        exit();
    }

    // --- REGISTER ---
    elseif ($action === 'register') {
        // SEGURANÇA: Gerar UUID no servidor para evitar IDOR
        // O cliente pode enviar um ID, mas é ignorado em favor de um UUID seguro
        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
        $name = trim(strip_tags($data->name ?? ''));
        $email = filter_var(trim($data->email ?? ''), FILTER_SANITIZE_EMAIL);
        
        if (empty($name) || strlen($name) < 2 || strlen($name) > 100) {
            http_response_code(400);
            echo json_encode(["error" => "Nome inválido (deve ter entre 2 e 100 caracteres)."]);
            exit();
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) {
            http_response_code(400);
            echo json_encode(["error" => "Por favor, insira um e-mail válido."]);
            exit();
        }

        $emailLower = strtolower(trim($email));
        if (substr($emailLower, -10) !== '@gmail.com') {
            http_response_code(400);
            echo json_encode(["error" => "Cadastro liberado exclusivamente para contas do Gmail (@gmail.com) durante a fase de testes gratuitos."]);
            exit();
        }

        $cpf = preg_replace('/[^0-9]/', '', $data->cpf ?? '');
        $cep = preg_replace('/[^0-9]/', '', $data->cep ?? '');
        $address = strip_tags($data->address ?? '');
        $city = strip_tags($data->city ?? '');
        $state = strip_tags($data->state ?? '');
        $fingerprint = strip_tags($data->device_fingerprint ?? '');
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        // SEGURANÇA: Validar força da senha
        $rawPassword = $data->password ?? '';
        if (strlen($rawPassword) < 6) {
            http_response_code(400);
            echo json_encode(["error" => "A senha deve ter no mínimo 6 caracteres."]);
            exit();
        }

        $password = password_hash($rawPassword, PASSWORD_DEFAULT);
        $plan = 'Gratuito';

        try {
            ensureApiColumns($conn);
            // Verifica email duplicado
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(['email' => $emailLower]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(["error" => "Este e-mail do Gmail já está cadastrado."]);
                exit();
            }

            // Registrar usuario já verificado como testador ativo gratuito
            $sql = "INSERT INTO users (id, name, email, password, plan, cpf, cep, address, city, state, is_verified, subscription_status, credits, trial_ends_at) VALUES (:id, :name, :email, :password, :plan, :cpf, :cep, :address, :city, :state, 1, 'active', 9999, DATE_ADD(NOW(), INTERVAL 365 DAY))";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'id' => $id,
                'name' => $name,
                'email' => $emailLower,
                'password' => $password,
                'plan' => $plan,
                'cpf' => $cpf,
                'cep' => $cep,
                'address' => $address,
                'city' => $city,
                'state' => $state
            ]);

            // Registrar log de atividade anti-fraude (não-crítico: falha silenciosa)
            try {
                $logSql = "INSERT INTO activity_logs (user_id, ip_address, device_fingerprint, action) VALUES (:uid, :ip, :device, 'register_account')";
                $logStmt = $conn->prepare($logSql);
                $logStmt->execute([
                    'uid' => $id,
                    'ip' => $ip_address,
                    'device' => $fingerprint
                ]);
            } catch (Exception $logEx) {
                error_log('[auth.php] Activity log failed (non-critical): ' . $logEx->getMessage());
            }

            // Envia e-mail de boas-vindas com as credenciais de acesso
            $siteUrl = (isset($_SERVER['HTTPS']) ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'];
            $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
            $mailer = new SimpleMailer();
            $body = "
                <div style='font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;'>
                    <div style='background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
                        <h1 style='color: white; margin: 0; font-size: 28px;'>&#127925; Bem-vindo ao IAPLAY!</h1>
                    </div>
                    <div style='background: #fafafa; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;'>
                        <p style='font-size: 16px;'>Olá, <strong>$safeName</strong>!</p>
                        <p>Sua conta foi criada com sucesso. Aqui estão suas credenciais de acesso:</p>
                        <div style='background: #1a1a2e; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace;'>
                            <p style='margin: 5px 0;'>&#128231; <strong>E-mail:</strong> $safeEmail</p>
                            <p style='margin: 5px 0;'>Use a senha que você cadastrou no formulário para acessar.</p>
                        </div>
                        <p style='font-size: 14px; color: #555;'>Para acessar o IAPLAY, você precisa primeiro escolher um plano. Clique no botão abaixo:</p>
                        <div style='text-align: center; margin: 25px 0;'>
                            <a href='{$siteUrl}/#/pricing' style='background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;'>Ver Planos e Assinar</a>
                        </div>
                        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                        <p style='font-size: 12px; color: #999; text-align: center;'>Guarde este e-mail. Se você tiver problemas para acessar, entre em contato conosco.</p>
                    </div>
                </div>
            ";

            $emailSent = true;
            try {
                $mailer->send($email, "Bem-vindo ao IAPLAY! Suas credenciais de acesso", $body);
            }
            catch (Exception $mailEx) {
                $emailSent = false;
                error_log('[auth.php register] Falha ao enviar welcome email: ' . $mailEx->getMessage());
            }

            $response = ["success" => true, "id" => $id, "redirect" => "pricing"];
            if (!$emailSent) {
                $response["warning"] = "Conta criada, mas não foi possível enviar o e-mail de boas-vindas. Verifique a configuração SMTP.";
            }
            echo json_encode($response);

        }
        catch (Exception $e) {
            error_log('[auth.php] Erro interno no registro: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erro interno no registro."]);
        }
    }

    // --- VERIFY ---
    elseif ($action === 'verify') {
        $email = $data->email;
        $code = trim($data->code);

        try {
            $stmt = $conn->prepare("SELECT id, verification_code FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(["error" => "Usuário não encontrado."]);
                exit();
            }

            if ($user['verification_code'] === $code) {
                $stmt = $conn->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = :id");
                $stmt->execute(['id' => $user['id']]);

                $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
                $stmt->execute(['id' => $user['id']]);
                $freshUser = $stmt->fetch(PDO::FETCH_ASSOC);

                unset($freshUser['password']);
                unset($freshUser['verification_code']);
                $freshUser['googleApiKey'] = maskApiKey($freshUser['google_api_key'] ?? '');
                $freshUser['openaiApiKey'] = maskApiKey($freshUser['openai_api_key'] ?? '');
                $freshUser['groqApiKey'] = maskApiKey($freshUser['groq_api_key'] ?? '');
                $freshUser['cerebrasApiKey'] = maskApiKey($freshUser['cerebras_api_key'] ?? '');
                $freshUser['openrouterApiKey'] = maskApiKey($freshUser['openrouter_api_key'] ?? '');
                $freshUser['mistralApiKey'] = maskApiKey($freshUser['mistral_api_key'] ?? '');
                $freshUser['togetherApiKey'] = maskApiKey($freshUser['together_api_key'] ?? '');
                $freshUser['currentPeriodEnd'] = $freshUser['current_period_end'];
                $freshUser['creativeContext'] = $freshUser['creative_context'] ?? '';

                echo json_encode($freshUser);
            }
            else {
                http_response_code(400);
                echo json_encode(["error" => "Código incorreto."]);
            }
        }
        catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro servidor."]);
        }
    }

    // --- UPDATE SUBSCRIPTION ---
    // SEGURANÇA: Apenas admin pode ativar planos manualmente.
    // A ativação por pagamento ocorre exclusivamente via stripe_webhook.php (HMAC).
    elseif ($action === 'update_subscription') {
        checkAdmin();
        if (!isset($data->id)) {
            http_response_code(400);
            echo json_encode(["error" => "ID is required"]);
            exit();
        }

        $id = $data->id;
        $plan = $data->plan;
        $status = $data->status;

        // Duração: Se for 'yearly', adiciona 1 ano. Se não, 1 mês.
        $duration = isset($data->duration) ? $data->duration : 'monthly';
        $intervalSql = ($duration === 'yearly') ? "INTERVAL 1 YEAR" : "INTERVAL 30 DAY";

        try {
            // Verifica se o usuário existe primeiro
            $check = $conn->prepare("SELECT id FROM users WHERE id = :id");
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                http_response_code(404);
                echo json_encode(["error" => "User not found for ID: $id"]);
                exit();
            }

            // ATUALIZAÇÃO ROBUSTA COM CÁLCULO DE DATA NO MYSQL
            // Resetamos creditos para 9999 e definimos status active
            $sql = "UPDATE users SET 
                    plan = :plan, 
                    subscription_status = :status, 
                    credits = 9999,
                    current_period_end = DATE_ADD(NOW(), $intervalSql)
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);

            $params = [
                ':plan' => $plan,
                ':status' => $status,
                ':id' => $id
            ];

            if ($stmt->execute($params)) {
                $count = $stmt->rowCount();
                echo json_encode(["success" => true, "affected" => $count]);
            }
            else {
                throw new Exception("Execute failed");
            }

        }
        catch (Exception $e) {
            error_log('[auth.php update_subscription] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erro ao atualizar assinatura."]);
        }
    }



    // --- UPDATE KEYS ---
    elseif ($action === 'update_keys') {
        checkAuth();
        $id = $data->id;
        if ($_SESSION['user_id'] !== $id) {
            checkAdmin();
        }
        try {
            ensureApiColumns($conn);
            $checkStmt = $conn->prepare("SELECT google_api_key, openai_api_key, groq_api_key, cerebras_api_key, openrouter_api_key, mistral_api_key, together_api_key FROM users WHERE id = :id");
            $checkStmt->execute(['id' => $id]);
            $currentKeys = $checkStmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $google = isset($data->google) ? $data->google : null;
            $openai = isset($data->openai) ? $data->openai : null;
            $groq = isset($data->groq) ? $data->groq : null;
            $cerebras = isset($data->cerebras) ? $data->cerebras : null;
            $openrouter = isset($data->openrouter) ? $data->openrouter : null;
            $mistral = isset($data->mistral) ? $data->mistral : null;
            $together = isset($data->together) ? $data->together : null;

            $processKeys = function($newInputStr, $existingEncryptedFromDb) {
                // Se o campo não foi enviado na requisição, mantém o valor atual do banco
                if ($newInputStr === null) {
                    return $existingEncryptedFromDb;
                }
                
                $newInputStr = trim($newInputStr);
                
                // Se o usuário limpou o campo intencionalmente, remove a chave (NULL)
                if ($newInputStr === '') {
                    return null;
                }
                
                $oldDecryptedStr = decryptApiKey($existingEncryptedFromDb ?? '');
                $rawOldLines = preg_split('/[\n\r,]+/', $oldDecryptedStr ?? '');
                $oldKeys = [];
                foreach ($rawOldLines as $kLine) {
                    $kLine = trim($kLine);
                    if (!empty($kLine)) {
                        $oldKeys[] = $kLine;
                    }
                }
                
                $inputLines = preg_split('/[\n\r,]+/', $newInputStr);
                $finalKeys = [];
                $hasMaskedInput = false;
                
                foreach ($inputLines as $index => $line) {
                    $line = trim($line);
                    if (empty($line)) continue;
                    
                    // Se a linha contiver a máscara de segurança (ex: AIza...1234 ou ***)
                    if (strpos($line, '...') !== false || strpos($line, '***') !== false) {
                        $hasMaskedInput = true;
                        $matchedKey = null;
                        
                        // Busca uma chave unmasked correspondente no banco antigo
                        foreach ($oldKeys as $oldKey) {
                            if (strpos($oldKey, '...') !== false || strpos($oldKey, '***') !== false) {
                                continue; // Ignora chaves corrompidas do banco antigo
                            }
                            $prefixMatch = (substr($line, 0, 4) === substr($oldKey, 0, 4));
                            $suffixMatch = (substr($line, -4) === substr($oldKey, -4));
                            if ($prefixMatch && $suffixMatch) {
                                $matchedKey = $oldKey;
                                break;
                            }
                        }
                        
                        // Fallback por índice se o banco antigo tinha uma chave válida na mesma posição
                        if (!$matchedKey && isset($oldKeys[$index])) {
                            $cand = $oldKeys[$index];
                            if (strpos($cand, '...') === false && strpos($cand, '***') === false) {
                                $matchedKey = $cand;
                            }
                        }
                        
                        if ($matchedKey && !in_array($matchedKey, $finalKeys)) {
                            $finalKeys[] = $matchedKey;
                        }
                    } else {
                        // Chave nova não-mascarada colada pelo usuário
                        if (strlen($line) >= 5 && !in_array($line, $finalKeys)) {
                            $finalKeys[] = $line;
                        }
                    }
                }
                
                // Se havia linhas mascaradas e não conseguimos resgatar nenhuma chave unmasked,
                // MAS tínhamos um registro no banco, PRESERVA o registro existente para NÃO APAGAR a chave do usuário!
                if (empty($finalKeys) && $hasMaskedInput && !empty($existingEncryptedFromDb)) {
                    return $existingEncryptedFromDb;
                }
                
                if (empty($finalKeys)) {
                    return null;
                }
                
                return encryptApiKey(implode("\n", $finalKeys));
            };

            $finalGoogle = $processKeys($google, $currentKeys['google_api_key'] ?? null);
            $finalOpenai = $processKeys($openai, $currentKeys['openai_api_key'] ?? null);
            $finalGroq = $processKeys($groq, $currentKeys['groq_api_key'] ?? null);
            $finalCerebras = $processKeys($cerebras, $currentKeys['cerebras_api_key'] ?? null);
            $finalOpenrouter = $processKeys($openrouter, $currentKeys['openrouter_api_key'] ?? null);
            $finalMistral = $processKeys($mistral, $currentKeys['mistral_api_key'] ?? null);
            $finalTogether = $processKeys($together, $currentKeys['together_api_key'] ?? null);

            $stmt = $conn->prepare("UPDATE users SET google_api_key = :google, openai_api_key = :openai, groq_api_key = :groq, cerebras_api_key = :cerebras, openrouter_api_key = :openrouter, mistral_api_key = :mistral, together_api_key = :together WHERE id = :id");
            $stmt->execute([
                'google' => $finalGoogle,
                'openai' => $finalOpenai,
                'groq' => $finalGroq,
                'cerebras' => $finalCerebras,
                'openrouter' => $finalOpenrouter,
                'mistral' => $finalMistral,
                'together' => $finalTogether,
                'id' => $id
            ]);
            echo json_encode(["success" => true]);
        }
        catch (Exception $e) {
            error_log('[auth.php update_keys error] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erro ao salvar chaves de API."]);
        }
    }

    // --- UPDATE PROFILE ---
    elseif ($action === 'update') {
        checkAuth();
        $id = $data->id;
        if ($_SESSION['user_id'] !== $id) {
            checkAdmin();
        }
        $name = strip_tags($data->name);
        $newPass = isset($data->password) ? $data->password : null;
        $creativeCtx = isset($data->creative_context) ? $data->creative_context : null;
        try {
            if ($newPass) {
                $hashed = password_hash($newPass, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE users SET name = :name, password = :pass, creative_context = :ctx WHERE id = :id");
                $stmt->execute(['name' => $name, 'pass' => $hashed, 'ctx' => $creativeCtx, 'id' => $id]);
            }
            else {
                $stmt = $conn->prepare("UPDATE users SET name = :name, creative_context = :ctx WHERE id = :id");
                $stmt->execute(['name' => $name, 'ctx' => $creativeCtx, 'id' => $id]);
            }
            echo json_encode(["success" => true]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro ao atualizar perfil."]);
        }
    }

    // --- DELETE ACCOUNT ---
    elseif ($action === 'delete_account') {
        checkAuth();
        $id = $data->id;
        if ($_SESSION['user_id'] !== $id) {
            checkAdmin();
        }
        $conn->beginTransaction();
        try {
            // Delete projects belonging to the user
            $stmt = $conn->prepare("DELETE FROM projects WHERE user_id = :id");
            $stmt->execute(['id' => $id]);

            // Delete daily usage logs belonging to the user
            $stmt = $conn->prepare("DELETE FROM daily_usage WHERE user_id = :id");
            $stmt->execute(['id' => $id]);

            // Delete the user record
            $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute(['id' => $id]);

            $conn->commit();

            // Destroy session
            session_destroy();

            echo json_encode(["success" => true]);
        }
        catch (Exception $e) {
            $conn->rollBack();
            error_log('[auth.php delete_account] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Erro ao deletar conta do servidor."]);
        }
    }

    // --- VALIDATE COUPON ---
    elseif ($action === 'validate_coupon') {
        checkAuth();
        $code = strtoupper(trim($data->code));
        try {
            // Garante que a coluna max_uses existe na tabela coupons
            try {
                $conn->exec("ALTER TABLE coupons ADD COLUMN max_uses INT DEFAULT NULL");
            } catch (Exception $e) {}

            $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code AND active = 1");
            $stmt->execute(['code' => $code]);
            $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($coupon) {
                // Verifica limite de uso se max_uses estiver definido e for maior que 0
                if (!empty($coupon['max_uses']) && $coupon['max_uses'] > 0) {
                    if ($coupon['times_used'] >= $coupon['max_uses']) {
                        http_response_code(400);
                        echo json_encode(["error" => "Este cupom atingiu o limite máximo de usos."]);
                        exit();
                    }
                }

                // TRACKING: Incrementa validação (tentativa de uso)
                $upd = $conn->prepare("UPDATE coupons SET times_validated = times_validated + 1 WHERE id = :id");
                $upd->execute(['id' => $coupon['id']]);

                echo json_encode(["success" => true, "discount" => $coupon['discount_percent']]);
            }
            else {
                http_response_code(404);
                echo json_encode(["error" => "Cupom inválido ou inativo."]);
            }
        }
        catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erro ao validar cupom."]);
        }
    }
}
?>