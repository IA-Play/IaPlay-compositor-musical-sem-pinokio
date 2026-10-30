<?php
/**
 * migrate.php
 * Executa as alterações de banco de dados para a Área de Downloads Premium.
 */
require_once 'config.php';

// Apenas administradores autenticados podem rodar migrações
require_once 'auth_guard.php';
checkAdmin();

header("Content-Type: application/json; charset=UTF-8");

try {
    $conn->beginTransaction();

    // 1. Criar tabela de arquivos premium
    $sqlPremiumFiles = "CREATE TABLE IF NOT EXISTS premium_files (
        id VARCHAR(50) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NULL,
        url_arquivo VARCHAR(500) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $conn->exec($sqlPremiumFiles);
    
    // 2. Adicionar/modificar colunas na tabela de usuários de forma segura
    $modifications = [
        "google_api_key_type" => "ALTER TABLE users MODIFY COLUMN google_api_key TEXT NULL",
        "openai_api_key_type" => "ALTER TABLE users MODIFY COLUMN openai_api_key TEXT NULL",
        "groq_api_key_type" => "ALTER TABLE users MODIFY COLUMN groq_api_key TEXT NULL",
        "stripe_customer_id" => "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) NULL",
        "stripe_subscription_id" => "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) NULL",
        "stripe_price_id" => "ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR(255) NULL",
        "current_period_end" => "ALTER TABLE users ADD COLUMN current_period_end DATETIME NULL",
        "cerebras_api_key" => "ALTER TABLE users ADD COLUMN cerebras_api_key TEXT NULL",
        "openrouter_api_key" => "ALTER TABLE users ADD COLUMN openrouter_api_key TEXT NULL",
        "mistral_api_key" => "ALTER TABLE users ADD COLUMN mistral_api_key TEXT NULL",
        "together_api_key" => "ALTER TABLE users ADD COLUMN together_api_key TEXT NULL"
    ];

    foreach ($modifications as $modName => $sql) {
        try {
            if (strpos($sql, 'ADD COLUMN') !== false) {
                $col = explode('ADD COLUMN', $sql)[1];
                $colName = trim(explode(' ', trim($col))[0]);
                $check = $conn->query("SHOW COLUMNS FROM users LIKE '$colName'");
                if ($check->rowCount() === 0) {
                    $conn->exec($sql);
                }
            } else {
                $conn->exec($sql);
            }
        } catch (PDOException $colEx) {
            error_log("[migrate.php] Aviso na modificação $modName: " . $colEx->getMessage());
        }
    }

    $conn->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Migrações executadas com sucesso! Tabela 'premium_files' e colunas do Stripe prontas."
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Falha ao rodar migrações: " . $e->getMessage()
    ]);
}
?>
