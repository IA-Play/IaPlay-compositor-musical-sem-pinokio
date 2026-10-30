<?php
// 1. Basic security validation
require_once 'auth_guard.php';
checkAuth();

$input_data = file_get_contents("php://input");
$request = json_decode($input_data, true);

if (!$request || !isset($request['prompt']) || !isset($request['provider'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request. Provider and prompt are required."]);
    exit;
}

// SEGURANÇA: Limite de tamanho do prompt para evitar abuso
if (strlen($request['prompt']) > 50000) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Prompt muito longo (máximo 50.000 caracteres)."]);
    exit;
}

// 2. Load Config and Check Freemium Limit
require_once 'config.php';
$userId = $_SESSION['user_id'];
$userPlan = $_SESSION['user_plan'] ?? 'Gratuito';

// 1. Extrair chaves enviadas diretamente no payload ou carregar do BD/Ambiente
$reqUserKeys = isset($request['userKeys']) && is_array($request['userKeys']) ? $request['userKeys'] : [];

$userKeysRow = null;
try {
    ensureApiColumns($conn);
    $keysStmt = $conn->prepare("SELECT google_api_key, openai_api_key, groq_api_key, cerebras_api_key, openrouter_api_key, mistral_api_key, together_api_key FROM users WHERE id = :id");
    $keysStmt->execute(['id' => $userId]);
    $userKeysRow = $keysStmt->fetch(PDO::FETCH_ASSOC) ?: null;
} catch (Exception $dbEx) {
    error_log('[ai.php] Erro ao carregar chaves do banco: ' . $dbEx->getMessage());
}

$sysData = [];
try {
    $sysStmt = $conn->query("SELECT settings_json FROM system_settings WHERE id = 1");
    $sysRow = $sysStmt->fetch(PDO::FETCH_ASSOC);
    if ($sysRow && !empty($sysRow['settings_json'])) {
        $sysData = json_decode($sysRow['settings_json'], true) ?: [];
    }
} catch (Exception $sysEx) {}

function getProviderKeys($reqKeyName, $dbColName, $sysKeyName, $envVarName, $reqUserKeys, $userKeysRow, $sysData) {
    $keys = [];
    
    // 1. Chaves não mascaradas do request
    $reqKeys = extractValidReqKeys($reqUserKeys[$reqKeyName] ?? '');
    foreach ($reqKeys as $k) {
        if (!in_array($k, $keys)) $keys[] = $k;
    }
    
    // 2. Chaves descriptografadas do BD do usuário
    if (!empty($userKeysRow[$dbColName])) {
        $dbDecrypted = decryptApiKey($userKeysRow[$dbColName]);
        $dbKeys = parseServerKeys($dbDecrypted);
        foreach ($dbKeys as $k) {
            if (!in_array($k, $keys)) $keys[] = $k;
        }
    }
    
    // 3. Chaves do system_settings
    if (!empty($sysData[$sysKeyName])) {
        $sysKeys = parseServerKeys($sysData[$sysKeyName]);
        foreach ($sysKeys as $k) {
            if (!in_array($k, $keys)) $keys[] = $k;
        }
    }
    
    // 4. Variáveis de ambiente
    $envVal = getenv($envVarName);
    if (!empty($envVal)) {
        $envKeys = parseServerKeys($envVal);
        foreach ($envKeys as $k) {
            if (!in_array($k, $keys)) $keys[] = $k;
        }
    }
    
    return $keys;
}

$googleKeys = getProviderKeys('google', 'google_api_key', 'googleApiKey', 'GOOGLE_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$openaiKeys = getProviderKeys('openai', 'openai_api_key', 'openaiApiKey', 'OPENAI_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$groqKeys = getProviderKeys('groq', 'groq_api_key', 'groqApiKey', 'GROQ_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$cerebrasKeys = getProviderKeys('cerebras', 'cerebras_api_key', 'cerebrasApiKey', 'CEREBRAS_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$openrouterKeys = getProviderKeys('openrouter', 'openrouter_api_key', 'openrouterApiKey', 'OPENROUTER_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$mistralKeys = getProviderKeys('mistral', 'mistral_api_key', 'mistralApiKey', 'MISTRAL_API_KEY', $reqUserKeys, $userKeysRow, $sysData);
$togetherKeys = getProviderKeys('together', 'together_api_key', 'togetherApiKey', 'TOGETHER_API_KEY', $reqUserKeys, $userKeysRow, $sysData);

$provider = $request['provider']; // 'Google', 'OpenAI', 'Groq', 'Cerebras', 'OpenRouter', 'Mistral', 'Together'

$activeKeys = [];
if ($provider === 'Google') $activeKeys = $googleKeys;
elseif ($provider === 'OpenAI') $activeKeys = $openaiKeys;
elseif ($provider === 'Groq') $activeKeys = $groqKeys;
elseif ($provider === 'Cerebras') $activeKeys = $cerebrasKeys;
elseif ($provider === 'OpenRouter') $activeKeys = $openrouterKeys;
elseif ($provider === 'Mistral') $activeKeys = $mistralKeys;
elseif ($provider === 'Together') $activeKeys = $togetherKeys;

$hasUserKey = count($activeKeys) > 0;

$isFreeUser = false;
$usage = null;
$limit = 2; // Default fallback
$today = date('Y-m-d');

// Verificar se é usuário gratuito (sem chave própria)
$isFreeUser = !$hasUserKey;
$usage = null;

function incrementFreeUsage($conn, $userId, $today, $usageExists) {
    if ($usageExists) {
        $updateStmt = $conn->prepare("UPDATE daily_usage SET prompts_used_today = prompts_used_today + 1 WHERE user_id = :uid AND last_reset_date = :today");
        $updateStmt->execute(['uid' => $userId, 'today' => $today]);
    } else {
        $insertStmt = $conn->prepare("INSERT INTO daily_usage (user_id, prompts_used_today, last_reset_date) VALUES (:uid, 1, :today)");
        $insertStmt->execute(['uid' => $userId, 'today' => $today]);
    }
}

// Configurações e Prompt
$prompt = $request['prompt'];
$systemInstruction = isset($request['systemInstruction']) ? $request['systemInstruction'] : null;
$images = isset($request['images']) ? $request['images'] : null; // Para visão

// Helper para chamada CURL
function makeRequest($url, $method, $headers, $body) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    // Enable SSL verification for security (Critical for production)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        $error_msg = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL Error: " . $error_msg);
    }
    
    curl_close($ch);
    return ["code" => $httpCode, "response" => $response];
}

try {
    $resultText = "";
    $isStream = isset($request['stream']) && $request['stream'] === true;
    
    if ($isStream) {
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
    }

    if ($provider === 'OpenAI') {
        $url = "https://api.openai.com/v1/chat/completions";
        
        if (empty($openaiKeys)) {
            throw new Exception("Chave API OpenAI não configurada. Vá em Configurações > Chaves de API e adicione sua chave OpenAI.");
        }
        
        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        $openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo'];
        $oaiSuccess = false;
        $oaiLastCode = 0;
        $oaiLastResp = '';

        // LOOP EXTERNO: Modelos | LOOP INTERNO: Chaves API (Linhas)
        foreach ($openaiModels as $oaiModel) {
            foreach ($openaiKeys as $keyIndex => $openaiKey) {
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $openaiKey
                ];

                $body = [
                    "model" => $oaiModel,
                    "messages" => $messages,
                    "temperature" => 0.7,
                    "stream" => $isStream
                ];

                if ($isStream) {
                    $testBody = [
                        "model" => $oaiModel,
                        "messages" => [["role" => "user", "content" => "test"]],
                        "max_tokens" => 5
                    ];
                    $testRes = makeRequest($url, "POST", $headers, $testBody);
                    
                    if ($testRes['code'] >= 400) {
                        error_log("[ai.php] OpenAI Stream (Chave Linha " . ($keyIndex+1) . "): Modelo {$oaiModel} indisponível ({$testRes['code']}). Tentando próximo...");
                        continue;
                    }

                    if ($isFreeUser) {
                        incrementFreeUsage($conn, $userId, $today, $usage);
                    }
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) {
                        echo $data;
                        ob_flush();
                        flush();
                        return strlen($data);
                    });
                    curl_exec($ch);
                    curl_close($ch);
                    exit();
                }

                $res = makeRequest($url, "POST", $headers, $body);
                $oaiLastCode = $res['code'];
                $oaiLastResp = $res['response'];

                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $resultText = $data['choices'][0]['message']['content'] ?? "";
                    $oaiSuccess = true;
                    error_log("[ai.php] OpenAI modelo {$oaiModel} respondeu com sucesso (Chave Linha " . ($keyIndex+1) . ").");
                    break 2;
                }

                error_log("[ai.php] OpenAI modelo {$oaiModel} falhou ({$res['code']}) na chave linha " . ($keyIndex+1) . ". Tentando próxima chave/modelo...");
            }
        }

        if (!$oaiSuccess && !$isStream) {
            throw new Exception("OpenAI API Error ({$oaiLastCode}): Todas as chaves e modelos falharam. " . $oaiLastResp);
        }

    } else if ($provider === 'Groq') {
        $url = "https://api.groq.com/openai/v1/chat/completions";
        
        if (empty($groqKeys)) {
            throw new Exception("Chave API Groq não configurada. Vá em Configurações > Chaves de API e adicione sua chave Groq.");
        }
        
        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        // Modelos oficiais ativos da Groq em ordem de prioridade
        $groqModels = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'llama-3.2-11b-vision-instruct',
            'llama-3.2-3b-preview',
            'llama3-70b-8192',
            'llama3-8b-8192',
            'mixtral-8x7b-32768',
            'gemma2-9b-it',
            'deepseek-r1-distill-llama-70b'
        ];
        $groqSuccess = false;
        $groqLastCode = 0;
        $groqLastResp = '';

        // LOOP EXTERNO: Modelos | LOOP INTERNO: Chaves API (Linhas)
        foreach ($groqModels as $groqModel) {
            foreach ($groqKeys as $keyIndex => $groqKey) {
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $groqKey
                ];

                $body = [
                    "model" => $groqModel,
                    "messages" => $messages,
                    "temperature" => 0.6,
                    "max_tokens" => 8192
                ];

                $res = makeRequest($url, "POST", $headers, $body);
                $groqLastCode = $res['code'];
                $groqLastResp = $res['response'];
                
                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $resultText = $data['choices'][0]['message']['content'] ?? "";
                    $groqSuccess = true;
                    error_log("[ai.php] Groq modelo {$groqModel} respondeu com sucesso (Chave Linha " . ($keyIndex+1) . ").");
                    break 2;
                }

                error_log("[ai.php] Groq modelo {$groqModel} falhou ({$res['code']}) na chave linha " . ($keyIndex+1) . ". Tentando próxima chave/modelo...");
            }
        }

        if (!$groqSuccess) {
            throw new Exception("Groq API Error ({$groqLastCode}): Todas as chaves e modelos Groq falharam. " . $groqLastResp);
        }

    } else if ($provider === 'Cerebras') {
        if (empty($cerebrasKeys)) {
            throw new Exception("Chave API Cerebras Cloud não configurada. Vá em Configurações > Chaves de API e adicione sua chave Cerebras.");
        }
        $cerebrasModels = ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'];
        $cerebrasSuccess = false;
        $cerebrasLastCode = 0;
        $cerebrasLastResp = '';

        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        foreach ($cerebrasModels as $modelName) {
            foreach ($cerebrasKeys as $keyIndex => $apiKey) {
                $endpoint = "https://api.cerebras.ai/v1/chat/completions";
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $apiKey
                ];
                $body = [
                    "model" => $modelName,
                    "messages" => $messages,
                    "temperature" => 0.7
                ];

                $res = makeRequest($endpoint, "POST", $headers, $body);
                $cerebrasLastCode = $res['code'];
                $cerebrasLastResp = $res['response'];

                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $output = $data['choices'][0]['message']['content'] ?? '';
                    if (!empty(trim($output))) {
                        $cerebrasSuccess = true;
                        $resultText = trim($output);
                        break 2;
                    }
                }
            }
        }
        if (!$cerebrasSuccess) {
            throw new Exception("Cerebras API Error ({$cerebrasLastCode}): Todas as chaves e modelos Cerebras falharam. " . $cerebrasLastResp);
        }

    } else if ($provider === 'OpenRouter') {
        if (empty($openrouterKeys)) {
            throw new Exception("Chave API OpenRouter não configurada. Vá em Configurações > Chaves de API e adicione sua chave OpenRouter.");
        }
        $openrouterModels = [
            'google/gemini-2.5-flash-lite:free',
            'google/gemini-2.0-flash-exp:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'deepseek/deepseek-r1:free',
            'deepseek/deepseek-r1-distill-llama-70b:free',
            'qwen/qwen-2.5-coder-32b-instruct',
            'meta-llama/llama-3.1-8b-instruct:free',
            'mistralai/mistral-7b-instruct:free',
            'openrouter/auto'
        ];
        $openrouterSuccess = false;
        $openrouterLastCode = 0;
        $openrouterLastResp = '';

        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        foreach ($openrouterModels as $modelName) {
            foreach ($openrouterKeys as $keyIndex => $apiKey) {
                $endpoint = "https://openrouter.ai/api/v1/chat/completions";
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $apiKey,
                    "HTTP-Referer: https://iaplay.app",
                    "X-Title: IAPLAY"
                ];
                $body = [
                    "model" => $modelName,
                    "messages" => $messages,
                    "temperature" => 0.7
                ];

                $res = makeRequest($endpoint, "POST", $headers, $body);
                $openrouterLastCode = $res['code'];
                $openrouterLastResp = $res['response'];

                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $output = $data['choices'][0]['message']['content'] ?? '';
                    if (!empty(trim($output))) {
                        $openrouterSuccess = true;
                        $resultText = trim($output);
                        break 2;
                    }
                }
            }
        }
        if (!$openrouterSuccess) {
            throw new Exception("OpenRouter API Error ({$openrouterLastCode}): Todas as chaves e modelos OpenRouter falharam. " . $openrouterLastResp);
        }

    } else if ($provider === 'Mistral') {
        if (empty($mistralKeys)) {
            throw new Exception("Chave API Mistral AI não configurada. Vá em Configurações > Chaves de API e adicione sua chave Mistral.");
        }
        $mistralModels = ['mistral-small-latest', 'pixtral-12b-2409', 'open-mistral-7b', 'open-mixtral-8x7b'];
        $mistralSuccess = false;
        $mistralLastCode = 0;
        $mistralLastResp = '';

        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        foreach ($mistralModels as $modelName) {
            foreach ($mistralKeys as $keyIndex => $apiKey) {
                $endpoint = "https://api.mistral.ai/v1/chat/completions";
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $apiKey
                ];
                $body = [
                    "model" => $modelName,
                    "messages" => $messages,
                    "temperature" => 0.7
                ];

                $res = makeRequest($endpoint, "POST", $headers, $body);
                $mistralLastCode = $res['code'];
                $mistralLastResp = $res['response'];

                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $output = $data['choices'][0]['message']['content'] ?? '';
                    if (!empty(trim($output))) {
                        $mistralSuccess = true;
                        $resultText = trim($output);
                        break 2;
                    }
                }
            }
        }
        if (!$mistralSuccess) {
            throw new Exception("Mistral API Error ({$mistralLastCode}): Todas as chaves e modelos Mistral falharam. " . $mistralLastResp);
        }

    } else if ($provider === 'Together') {
        if (empty($togetherKeys)) {
            throw new Exception("Chave API Together AI não configurada. Vá em Configurações > Chaves de API e adicione sua chave Together.");
        }
        $togetherModels = [
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            'mistralai/Mixtral-8x7B-Instruct-v0.1',
            'deepseek-ai/DeepSeek-R1-Distill-Llama-70B'
        ];
        $togetherSuccess = false;
        $togetherLastCode = 0;
        $togetherLastResp = '';

        $messages = [];
        if ($systemInstruction) {
            $messages[] = ["role" => "system", "content" => $systemInstruction];
        }
        $messages[] = ["role" => "user", "content" => $prompt];

        foreach ($togetherModels as $modelName) {
            foreach ($togetherKeys as $keyIndex => $apiKey) {
                $endpoint = "https://api.together.xyz/v1/chat/completions";
                $headers = [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $apiKey
                ];
                $body = [
                    "model" => $modelName,
                    "messages" => $messages,
                    "temperature" => 0.7
                ];

                $res = makeRequest($endpoint, "POST", $headers, $body);
                $togetherLastCode = $res['code'];
                $togetherLastResp = $res['response'];

                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $output = $data['choices'][0]['message']['content'] ?? '';
                    if (!empty(trim($output))) {
                        $togetherSuccess = true;
                        $resultText = trim($output);
                        break 2;
                    }
                }
            }
        }
        if (!$togetherSuccess) {
            throw new Exception("Together API Error ({$togetherLastCode}): Todas as chaves e modelos Together falharam. " . $togetherLastResp);
        }

    } else {
        // Default Google Gemini
        if (empty($googleKeys)) {
            throw new Exception("Chave API Google Gemini não configurada. Vá em Configurações > Chaves de API e adicione sua chave Gemini.");
        }
        
        $streamSuffix = $isStream ? "streamGenerateContent?alt=sse&key=" : "generateContent?key=";
        $headers = ["Content-Type: application/json"];
        $contents = [];
        
        if ($images) {
             $mimeType = "image/jpeg";
             $rawData = $images;
             if (preg_match('/^data:(.+);base64,(.+)$/', $images, $matches)) {
                 $mimeType = $matches[1];
                 $rawData = $matches[2];
             }
             $contents[] = [
                 "parts" => [
                     ["inlineData" => ["mimeType" => $mimeType, "data" => $rawData]],
                     ["text" => $prompt]
                 ]
             ];
        } else {
             $contents[] = [
                 "role" => "user",
                 "parts" => [["text" => $prompt]]
             ];
        }

        $body = [
            "contents" => $contents,
            "safetySettings" => [
                ["category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE"],
                ["category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE"],
                ["category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE"],
                ["category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE"]
            ]
        ];

        if ($systemInstruction) {
            $body["systemInstruction"] = [
                "parts" => [["text" => $systemInstruction]]
            ];
        }

        if (isset($request['useSearch']) && $request['useSearch'] === true) {
            $body["tools"] = [["googleSearch" => new stdClass()]];
        }

        $streamModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

        if ($isStream) {
            $streamSuccess = false;
            
            foreach ($streamModels as $streamModel) {
                foreach ($googleKeys as $keyIndex => $apiKey) {
                    $streamUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$streamModel}:{$streamSuffix}" . $apiKey;
                    $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$streamModel}:generateContent?key=" . $apiKey;
                    $testBody = ["contents" => [["role" => "user", "parts" => [["text" => "test"]]]]];
                    
                    $ch = curl_init($testUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testBody));
                    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
                    $testRes = curl_exec($ch);
                    $testCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    
                    if ($testCode >= 400) {
                        error_log("[ai.php] Stream: Modelo {$streamModel} indisponível ({$testCode}) na chave linha " . ($keyIndex+1) . ". Tentando próximo...");
                        continue;
                    }
                    
                    if ($isFreeUser) {
                        incrementFreeUsage($conn, $userId, $today, $usage);
                    }
                    $ch = curl_init($streamUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) {
                        echo $data;
                        ob_flush();
                        flush();
                        return strlen($data);
                    });
                    curl_exec($ch);
                    curl_close($ch);
                    $streamSuccess = true;
                    break 2;
                }
            }
            
            if (!$streamSuccess) {
                echo "data: " . json_encode(["error" => "Todos os modelos e chaves Gemini falharam ou estão sem cota."]) . "\n\n";
            }
            exit();
        }

        $modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        $firstErrorCode = 0;
        $firstErrorResponse = '';
        $lastErrorCode = 0;
        $lastErrorResponse = '';
        $success = false;
        
        // LOOP EXTERNO: Modelos | LOOP INTERNO: Chaves API (Linhas)
        foreach ($modelsToTry as $modelName) {
            foreach ($googleKeys as $keyIndex => $apiKey) {
                $modelUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key=" . $apiKey;
                
                $res = makeRequest($modelUrl, "POST", $headers, $body);
                $lastErrorCode = $res['code'];
                $lastErrorResponse = $res['response'];

                if ($firstErrorCode === 0) {
                    $firstErrorCode = $res['code'];
                    $firstErrorResponse = $res['response'];
                }
                
                if ($res['code'] < 400) {
                    $data = json_decode($res['response'], true);
                    $success = true;
                    error_log("[ai.php] Modelo Gemini {$modelName} respondeu com sucesso (Chave Linha " . ($keyIndex+1) . ").");
                    break 2;
                }
                
                error_log("[ai.php] Modelo Gemini {$modelName} falhou ({$res['code']}) na chave linha " . ($keyIndex+1) . ". Tentando próximo...");
            }
        }
        
        if (!$success) {
            $errCode = $firstErrorCode ?: $lastErrorCode;
            $errResp = $firstErrorResponse ?: $lastErrorResponse;
            throw new Exception("Google API Error ({$errCode}): " . $errResp);
        }
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            $resultText = $data['candidates'][0]['content']['parts'][0]['text'];
        } else {
            $resultText = "{}";
        }
    }

    if ($isFreeUser && !$isStream) {
        incrementFreeUsage($conn, $userId, $today, $usage);
    }

    echo json_encode(["status" => "success", "text" => trim($resultText)]);

} catch (Exception $e) {
    $rawMsg = $e->getMessage();
    $lowerMsg = strtolower($rawMsg);
    
    // Traduz erros técnicos de API em mensagens amigáveis
    $friendlyMessage = $rawMsg;
    
    if (strpos($lowerMsg, 'quota') !== false || strpos($lowerMsg, '429') !== false || strpos($lowerMsg, 'rate limit') !== false || strpos($lowerMsg, 'resource_exhausted') !== false) {
        $friendlyMessage = "LIMITE DE USO EXCEDIDO: A cota da API de IA foi atingida. Aguarde alguns minutos ou configure sua própria chave API nas Configurações para evitar este limite.";
    } elseif (strpos($lowerMsg, '401') !== false || strpos($lowerMsg, 'unauthorized') !== false || strpos($lowerMsg, 'invalid api key') !== false) {
        $friendlyMessage = "CHAVE API INVÁLIDA: Verifique se suas chaves de API estão corretas nas Configurações.";
    } elseif (strpos($lowerMsg, '403') !== false || strpos($lowerMsg, 'forbidden') !== false || strpos($lowerMsg, 'permission') !== false) {
        $friendlyMessage = "ACESSO NEGADO: Sua chave de API não tem permissão para este modelo. Verifique nas configurações da sua conta de IA.";
    } elseif (strpos($lowerMsg, '500') !== false || strpos($lowerMsg, '503') !== false || strpos($lowerMsg, 'internal') !== false) {
        $friendlyMessage = "ERRO TEMPORÁRIO: O servidor da IA está instável no momento. Tente novamente em alguns segundos.";
    } elseif (strpos($lowerMsg, 'curl') !== false || strpos($lowerMsg, 'connection') !== false) {
        $friendlyMessage = "ERRO DE CONEXÃO: Não foi possível conectar ao servidor de IA. Verifique sua conexão.";
    }
    
    // Log do erro real para debug do administrador
    error_log('[ai.php] Erro: ' . $rawMsg);
    
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $friendlyMessage, "debug" => $rawMsg]);
}
