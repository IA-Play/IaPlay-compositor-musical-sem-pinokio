<?php
/**
 * download.php
 * Rota protegida para download de arquivos premium e listagem.
 * Apenas usuários autenticados e com assinatura Stripe ativa podem acessar.
 */
require_once 'config.php';
require_once 'auth_guard.php';

// 1. Validar Autenticação Básica (Sessão do Usuário)
checkAuth();

$userId = $_SESSION['user_id'];

try {
    // 2. Buscar informações do usuário no BD para validação Stripe rígida
    $userStmt = $conn->prepare("SELECT plan, subscription_status, stripe_price_id FROM users WHERE id = :id");
    $userStmt->execute(['id' => $userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(["error" => "Usuário não encontrado."]);
        exit();
    }

    // 3. Validação de Acesso: Admins têm acesso irrestrito
    $hasAccess = false;
    $userPlan = strtoupper(trim($user['plan'] ?? ''));
    $isAdmin = ($userPlan === 'ADMIN' || $userPlan === 'VITALÍCIO (ADMIN)' || strpos($userPlan, 'ADMIN') !== false);

    if ($isAdmin) {
        $hasAccess = true;
    } else {
        // Para não-admins, verificar status da assinatura (active ou trialing)
        $subStatus = $user['subscription_status'] ?? '';
        if ($subStatus === 'active' || $subStatus === 'trialing') {
            // Verificar se IDs de preços específicos foram configurados via variáveis de ambiente
            $monthlyPriceId = getenv('STRIPE_PRICE_MONTHLY');
            $yearlyPriceId = getenv('STRIPE_PRICE_YEARLY');

            if (!empty($monthlyPriceId) || !empty($yearlyPriceId)) {
                $allowedPrices = [];
                if (!empty($monthlyPriceId)) $allowedPrices[] = trim($monthlyPriceId);
                if (!empty($yearlyPriceId)) $allowedPrices[] = trim($yearlyPriceId);

                // Validação Rígida por ID de preço
                if (in_array($user['stripe_price_id'], $allowedPrices)) {
                    $hasAccess = true;
                }
            } else {
                // Fallback: se nenhum ID de preço foi configurado, valida pelo nome do plano
                if (stripos($userPlan, 'PRO') !== false || stripos($userPlan, 'VIP') !== false || stripos($userPlan, 'MENSAL') !== false || stripos($userPlan, 'ANUAL') !== false) {
                    $hasAccess = true;
                }
            }
        }
    }

    if (!$hasAccess) {
        http_response_code(403);
        echo json_encode([
            "error" => "Acesso negado. Este download requer uma assinatura ativa mensal ou anual do iaplay.",
            "code" => "SUBSCRIBER_ONLY"
        ]);
        exit();
    }

    $action = isset($_GET['action']) ? trim($_GET['action']) : '';

    // --- LISTAGEM DE ARQUIVOS (Disponível apenas para assinantes ativos) ---
    if ($action === 'list') {
        $stmt = $conn->prepare("SELECT id, titulo, descricao, criado_em FROM premium_files ORDER BY criado_em DESC");
        $stmt->execute();
        $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($files);
        exit();
    }

    // --- DOWNLOAD DE ARQUIVO ---
    $fileId = isset($_GET['id']) ? trim($_GET['id']) : '';

    if (empty($fileId)) {
        http_response_code(400);
        echo json_encode(["error" => "ID do arquivo é necessário."]);
        exit();
    }

    // 4. Buscar o arquivo na tabela premium_files
    $fileStmt = $conn->prepare("SELECT * FROM premium_files WHERE id = :id");
    $fileStmt->execute(['id' => $fileId]);
    $premiumFile = $fileStmt->fetch(PDO::FETCH_ASSOC);

    if (!$premiumFile) {
        http_response_code(404);
        echo json_encode(["error" => "Arquivo não encontrado."]);
        exit();
    }

    $fileUrl = $premiumFile['url_arquivo'];

    // 5. Determinar se é armazenamento local ou externo
    // Se for local (apenas nome do arquivo ou caminho dentro de premium_uploads)
    $localPath = __DIR__ . '/../../premium_uploads/' . basename($fileUrl);

    if (file_exists($localPath) && !is_dir($localPath)) {
        // Limpar buffers de saída para evitar corrupção de arquivos zip/binários
        if (ob_get_level()) {
            ob_end_clean();
        }

        // Definir Headers adequados para download forçado
        $originalName = basename($fileUrl);
        // Higienizar nome de saída com base no título do arquivo premium
        $cleanTitle = preg_replace('/[^A-Za-z0-9_\-]/', '_', $premiumFile['titulo']);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $downloadName = $cleanTitle . '.' . $extension;

        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $downloadName . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($localPath));
        
        // Registrar atividade/log de download se necessário
        try {
            $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, ip_address, action, metadata) VALUES (:user_id, :ip, 'download_premium_file', :meta)");
            $logStmt->execute([
                'user_id' => $userId,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'meta' => json_encode(['file_id' => $fileId, 'file_title' => $premiumFile['titulo']])
            ]);
        } catch (Exception $logEx) {}

        readfile($localPath);
        exit();
    } else {
        // Se for URL externa, registrar log e redirecionar
        try {
            $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, ip_address, action, metadata) VALUES (:user_id, :ip, 'redirect_premium_file', :meta)");
            $logStmt->execute([
                'user_id' => $userId,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'meta' => json_encode(['file_id' => $fileId, 'file_title' => $premiumFile['titulo'], 'external_url' => $fileUrl])
            ]);
        } catch (Exception $logEx) {}

        header("Location: " . $fileUrl);
        exit();
    }

} catch (PDOException $e) {
    error_log('[download.php] Erro de BD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erro interno no servidor ao processar o download."]);
}
?>
