<?php
require_once 'config.php';
require_once 'auth_guard.php';

checkAuth(); // Proteção rígdida obrigatória em TODAS as ações.

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$method = $_SERVER['REQUEST_METHOD'];

$data = json_decode(file_get_contents("php://input"));

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Validar se usuário solicitou ID diferente do da sessão (IDOR protection)
$requestUserId = null;
if ($method === 'GET') {
    $requestUserId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
}
elseif ($data) {
    $requestUserId = isset($data->userId) ? $data->userId : null;
}

// target user is by default the session user
$targetUserId = $_SESSION['user_id'];

// If client explicitly requested a specific user ID, check permissions
if ($requestUserId && $requestUserId !== $_SESSION['user_id']) {
    checkAdmin(); // Apenas Admin pode ver/editar dados alheios
    $targetUserId = $requestUserId;
}

try {
    // --- LISTAR PROJETOS (GET) ---
    if ($method === 'GET') {
        $stmt = $conn->prepare("SELECT * FROM projects WHERE user_id = :uid ORDER BY updated_at DESC");
        $stmt->execute(['uid' => $targetUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $projects = [];
        foreach ($rows as $row) {
            $json = json_decode($row['data'], true);
            if (!is_array($json))
                $json = [];
            $projects[] = array_merge($json, [
                'id' => $row['id'],
                'userId' => $row['user_id'],
                'title' => $row['title'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ]);
        }
        echo json_encode($projects);
    }

    // --- SALVAR/CRIAR (POST) ---
    if ($method === 'POST') {
        if ($action === 'save') {
            $id = $data->id;
            $title = $data->title;
            $payload = clone $data;
            unset($payload->id);
            unset($payload->userId);
            unset($payload->title);
            $jsonData = json_encode($payload);

            $stmt = $conn->prepare("SELECT id FROM projects WHERE id = :id");
            $stmt->execute(['id' => $id]);

            if ($stmt->fetch()) {
                $sql = "UPDATE projects SET title = :title, data = :data WHERE id = :id AND user_id = :uid";
                $stmt = $conn->prepare($sql);
                $stmt->execute(['title' => $title, 'data' => $jsonData, 'id' => $id, 'uid' => $targetUserId]);
            }
            else {
                $sql = "INSERT INTO projects (id, user_id, title, data) VALUES (:id, :uid, :title, :data)";
                $stmt = $conn->prepare($sql);
                $stmt->execute(['id' => $id, 'uid' => $targetUserId, 'title' => $title, 'data' => $jsonData]);
            }
            echo json_encode(["success" => true]);
        }

        elseif ($action === 'delete') {
            $id = $data->id;
            // Prevent deleting another user's project by enforcing user_id scope
            if (isset($_SESSION['user_plan']) && (strpos(strtoupper(trim($_SESSION['user_plan'])), 'ADMIN') !== false)) {
                $stmt = $conn->prepare("DELETE FROM projects WHERE id = :id");
                $stmt->execute(['id' => $id]);
            }
            else {
                $stmt = $conn->prepare("DELETE FROM projects WHERE id = :id AND user_id = :uid");
                $stmt->execute(['id' => $id, 'uid' => $_SESSION['user_id']]);
            }
            echo json_encode(["success" => true]);
        }
    }

}
catch (PDOException $e) {
    error_log('[projects.php] PDO Erro: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Erro interno ao processar projetos."]);
}
?>