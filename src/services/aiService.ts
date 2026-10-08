
import { Project, AIProvider, ArsenalSettings, DetailedInstruction, Language, MusicType, Sentiment, MusicPlatform } from "../types";
import { getSystemSettings } from "./settingsService";
import { getOllamaCandidateEndpoints, startOllamaViaServer, getIsOllamaOnlineSync } from "./ollamaService";

// --- API CLIENTS WITH INTERNAL ROTATION (VIA SECURE BACKEND) ---

// --- API CLIENTS WITH INTERNAL ROTATION (VIA SECURE BACKEND) ---

// --- DIRECT CLIENT-SIDE AI GENERATION ENGINE ---

export interface NvidiaModelOption {
    id: string;
    name: string;
    badge: string;
    description: string;
}

export const NVIDIA_FREE_MODELS: NvidiaModelOption[] = [
    {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        name: 'Llama 3.1 Nemotron 70B (NVIDIA)',
        badge: 'Recomendado ⭐',
        description: 'Otimizado pela NVIDIA, ultra-rápido, raciocínio afiado e gratuito'
    },
    {
        id: 'mistralai/mistral-large-2-instruct',
        name: 'Mistral Large 2 (123B)',
        badge: 'Top para Letras ✍️',
        description: 'Excelente para rimas, métrica poética e português brasileiro natural'
    },
    {
        id: 'nv-mistralai/mistral-nemo-12b-instruct',
        name: 'Mistral NeMo 12B',
        badge: 'Ultra Rápido ⚡',
        description: 'Respostas quase instantâneas com baixo consumo de tokens'
    },
    {
        id: 'mistralai/mixtral-8x22b-v0.1',
        name: 'Mixtral 8x22B MoE',
        badge: 'MoE Potente 🧠',
        description: 'Mistura de especialistas com enorme versatilidade de estilos'
    },
    {
        id: 'deepseek-ai/deepseek-v4.1-flash',
        name: 'DeepSeek v4.1 Flash',
        badge: 'Criativo 💡',
        description: 'Inovador para letras conceituais, metáforas e harmonias'
    },
    {
        id: 'google/gemma-3-12b-it',
        name: 'Google Gemma 3 12B',
        badge: 'Google 🌟',
        description: 'Modelo moderno do Google rodando nos servidores da NVIDIA'
    },
    {
        id: 'nvidia/nemotron-4-340b-instruct',
        name: 'Nemotron 4 340B',
        badge: 'Modelo Gigante 👑',
        description: 'O maior modelo instruído da NVIDIA para composições ricas'
    },
    {
        id: 'meta/llama2-70b',
        name: 'Meta Llama 2 70B',
        badge: 'Meta Clássico',
        description: 'Modelo consagrado para estruturação musical'
    }
];

const getStoredUserKeys = () => {
    let keys: Record<string, string> = {
        google: '',
        openai: '',
        groq: '',
        cerebras: '',
        openrouter: '',
        nvidia: '',
        nvidiaModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
        mistral: '',
        together: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2'
    };

    try {
        const stored = localStorage.getItem('iaplay_session');
        if (stored) {
            const parsed = JSON.parse(stored);
            keys.google = parsed.googleApiKey || parsed.google || parsed.google_api_key || keys.google;
            keys.openai = parsed.openaiApiKey || parsed.openai || parsed.openai_api_key || keys.openai;
            keys.groq = parsed.groqApiKey || parsed.groq || parsed.groq_api_key || keys.groq;
            keys.cerebras = parsed.cerebrasApiKey || parsed.cerebras || parsed.cerebras_api_key || keys.cerebras;
            keys.openrouter = parsed.openrouterApiKey || parsed.openrouter || parsed.openrouter_api_key || keys.openrouter;
            keys.nvidia = parsed.nvidiaApiKey || parsed.nvidia || parsed.nvidia_api_key || keys.nvidia;
            keys.nvidiaModel = parsed.nvidiaModel || parsed.nvidia_model || localStorage.getItem('iaplay_nvidia_model') || keys.nvidiaModel;
            keys.mistral = parsed.mistralApiKey || parsed.mistral || parsed.mistral_api_key || keys.mistral;
            keys.together = parsed.togetherApiKey || parsed.together || parsed.together_api_key || keys.together;
            keys.ollamaUrl = parsed.ollamaUrl || parsed.ollama_url || keys.ollamaUrl;
            keys.ollamaModel = parsed.ollamaModel || parsed.ollama_model || keys.ollamaModel;
        }
    } catch (e) {}

    try {
        const sys = getSystemSettings();
        if (sys) {
            if (!keys.google && sys.googleApiKey) keys.google = sys.googleApiKey;
            if (!keys.groq && sys.groqApiKey) keys.groq = sys.groqApiKey;
            if (!keys.openai && sys.openaiApiKey) keys.openai = sys.openaiApiKey;
            if (!keys.openrouter && sys.openrouterApiKey) keys.openrouter = sys.openrouterApiKey;
            if (!keys.nvidia && sys.nvidiaApiKey) keys.nvidia = sys.nvidiaApiKey;
            if (!keys.cerebras && sys.cerebrasApiKey) keys.cerebras = sys.cerebrasApiKey;
            if (!keys.mistral && sys.mistralApiKey) keys.mistral = sys.mistralApiKey;
            if (!keys.together && sys.togetherApiKey) keys.together = sys.togetherApiKey;
            if (sys.ollamaUrl && keys.ollamaUrl === 'http://localhost:11434') keys.ollamaUrl = sys.ollamaUrl;
            if (sys.ollamaModel && keys.ollamaModel === 'llama3.2') keys.ollamaModel = sys.ollamaModel;
        }
    } catch (e) {}

    try {
        if (!keys.google && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
            keys.google = (import.meta as any).env.VITE_GEMINI_API_KEY;
        }
        if (!keys.groq && (import.meta as any).env?.VITE_GROQ_API_KEY) {
            keys.groq = (import.meta as any).env.VITE_GROQ_API_KEY;
        }
    } catch (e) {}

    return keys;
};

const extractKeys = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return raw
        .split(/[\n,;]+/)
        .map(k => k.trim())
        .filter(k => k.length > 5 && !k.includes('...') && !k.includes('***'));
};

export const hasKeyForProvider = (provider: AIProvider): boolean => {
    if (provider === AIProvider.OLLAMA) {
        return getIsOllamaOnlineSync();
    }
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    switch (provider) {
        case AIProvider.GOOGLE:
            return extractKeys(userKeys.google).length > 0 || extractKeys(settings.googleApiKey).length > 0;
        case AIProvider.GROQ:
            return extractKeys(userKeys.groq).length > 0 || extractKeys(settings.groqApiKey).length > 0;
        case AIProvider.OPENROUTER:
            return extractKeys(userKeys.openrouter).length > 0 || extractKeys(settings.openrouterApiKey).length > 0;
        case AIProvider.NVIDIA:
            return extractKeys(userKeys.nvidia).length > 0 || extractKeys(settings.nvidiaApiKey).length > 0;
        case AIProvider.CEREBRAS:
            return extractKeys(userKeys.cerebras).length > 0 || extractKeys(settings.cerebrasApiKey).length > 0;
        case AIProvider.OPENAI:
            return extractKeys(userKeys.openai).length > 0 || extractKeys(settings.openaiApiKey).length > 0;
        case AIProvider.MISTRAL:
            return extractKeys(userKeys.mistral).length > 0 || extractKeys(settings.mistralApiKey).length > 0;
        case AIProvider.TOGETHER:
            return extractKeys(userKeys.together).length > 0 || extractKeys(settings.togetherApiKey).length > 0;
        default:
            return false;
    }
};

export const resolveEffectiveProvider = (preferred?: AIProvider): AIProvider => {
    // 1. Se o fornecedor preferido foi passado e tem chave configurada (ou Ollama online), usa ele
    if (preferred && hasKeyForProvider(preferred)) {
        return preferred;
    }

    // 2. Tenta recuperar do localStorage a preferência do usuário se estiver configurada
    try {
        const saved = localStorage.getItem('iaplay_preferred_provider') as AIProvider;
        if (saved && hasKeyForProvider(saved)) {
            return saved;
        }
    } catch (e) { }

    // 3. Procura o primeiro provedor em nuvem com chave ativa
    const cloudPriority = [
        AIProvider.GOOGLE,
        AIProvider.GROQ,
        AIProvider.NVIDIA,
        AIProvider.OPENROUTER,
        AIProvider.CEREBRAS,
        AIProvider.MISTRAL,
        AIProvider.TOGETHER,
        AIProvider.OPENAI
    ];

    for (const p of cloudPriority) {
        if (hasKeyForProvider(p)) return p;
    }

    // 4. Se o Ollama estiver confirmado online, pode ser utilizado
    if (hasKeyForProvider(AIProvider.OLLAMA)) {
        return AIProvider.OLLAMA;
    }

    // 5. Fallback padrão: o preferido informado ou Google Gemini
    return preferred || AIProvider.GOOGLE;
};

export const getProviderKeyUrl = (provider: AIProvider): string => {
    switch (provider) {
        case AIProvider.GOOGLE:
            return "https://aistudio.google.com/app/apikey";
        case AIProvider.GROQ:
            return "https://console.groq.com/keys";
        case AIProvider.CEREBRAS:
            return "https://cloud.cerebras.ai/";
        case AIProvider.OPENROUTER:
            return "https://openrouter.ai/keys";
        case AIProvider.NVIDIA:
            return "https://build.nvidia.com/settings/api-keys";
        case AIProvider.OPENAI:
            return "https://platform.openai.com/api-keys";
        case AIProvider.MISTRAL:
            return "https://console.mistral.ai/api-keys/";
        case AIProvider.TOGETHER:
            return "https://api.together.ai/settings/api-keys";
        default:
            return "https://aistudio.google.com/app/apikey";
    }
};

// 1. GOOGLE GEMINI (Direct Client-Side)
const callGoogle = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.google),
        ...extractKeys(settings.googleApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave do Google Gemini configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da Google AI Studio (ou utilize o Ollama 100% grátis).");
    }

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const body: any = {
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7
                    }
                };

                if (systemInstruction) {
                    body.systemInstruction = {
                        parts: [{ text: systemInstruction }]
                    };
                }

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("Google Gemini", lastError || "Todas as tentativas falharam."));
};

// 2. GROQ (Direct Client-Side)
const callGroq = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.groq),
        ...extractKeys(settings.groqApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da Groq configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da Groq.");
    }

    const models = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'llama3-70b-8192',
        'llama3-8b-8192'
    ];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key.trim()}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const msg = errData?.error?.message || `HTTP ${res.status}`;
                    console.warn(`[Groq] Modelo ${model} falhou:`, msg);
                    lastError = msg;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
                console.warn(`[Groq] Erro de rede no modelo ${model}:`, lastError);
            }
        }
    }

    throw new Error(friendlyApiError("Groq", lastError || "Todas as tentativas falharam."));
};

// 3. OPENROUTER (Direct Client-Side)
const callOpenRouter = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.openrouter),
        ...extractKeys(settings.openrouterApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave do OpenRouter configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave do OpenRouter.");
    }

    const models = [
        'google/gemini-2.5-flash-lite:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-r1:free',
        'qwen/qwen-2.5-coder-32b-instruct',
        'openrouter/auto'
    ];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`,
                        'HTTP-Referer': 'http://localhost:5173',
                        'X-Title': 'IAPLAY Studio'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("OpenRouter", lastError || "Todas as tentativas falharam."));
};

// 4. CEREBRAS (Direct Client-Side)
const callCerebras = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.cerebras),
        ...extractKeys(settings.cerebrasApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da Cerebras configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da Cerebras.");
    }

    const models = ['llama-3.3-70b', 'llama3.1-8b', 'llama3.1-70b'];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("Cerebras", lastError || "Todas as tentativas falharam."));
};

// 5. OPENAI (Direct Client-Side)
const callOpenAI = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.openai),
        ...extractKeys(settings.openaiApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da OpenAI configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da OpenAI.");
    }

    const models = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("OpenAI", lastError || "Todas as tentativas falharam."));
};

// 6. MISTRAL (Direct Client-Side)
const callMistral = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.mistral),
        ...extractKeys(settings.mistralApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da Mistral configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da Mistral.");
    }

    const models = ['mistral-small-latest', 'open-mistral-7b', 'pixtral-12b-2409'];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("Mistral", lastError || "Todas as tentativas falharam."));
};

// 7. TOGETHER (Direct Client-Side)
const callTogether = async (prompt: string, systemInstruction?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.together),
        ...extractKeys(settings.togetherApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da Together AI configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da Together AI.");
    }

    const models = [
        'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        'deepseek-ai/DeepSeek-R1-Distill-Llama-70B'
    ];
    let lastError = "";

    for (const key of keys) {
        for (const model of models) {
            try {
                const messages: any[] = [];
                if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.together.xyz/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${res.status}`;
                    continue;
                }

                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    return text.trim();
                }
            } catch (err: any) {
                lastError = err.message || String(err);
            }
        }
    }

    throw new Error(friendlyApiError("Together AI", lastError || "Todas as tentativas falharam."));
};

// 8. OLLAMA (LOCAL 100% OFFLINE) CALLER
export const callOllama = async (prompt: string, systemInstruction?: string, model?: string, url?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();

    const endpointsToTry = getOllamaCandidateEndpoints(url || userKeys.ollamaUrl || settings.ollamaUrl);

    let modelToUse = (model || userKeys.ollamaModel || settings.ollamaModel || 'llama3.2').trim();

    // 1. Tentar descobrir endpoint funcional e consultar modelos instalados
    let activeEndpoint = endpointsToTry[0];
    let installedModels: string[] = [];

    const discoverModels = async () => {
        for (const ep of endpointsToTry) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);
                const tagsRes = await fetch(`${ep}/api/tags`, { signal: controller.signal }).catch(() => null);
                clearTimeout(timeoutId);

                if (tagsRes && tagsRes.ok) {
                    const tagsData = await tagsRes.json().catch(() => ({}));
                    if (tagsData.models && Array.isArray(tagsData.models) && tagsData.models.length > 0) {
                        installedModels = tagsData.models.map((m: any) => m.name || m.model).filter(Boolean);
                        activeEndpoint = ep;
                        return true;
                    }
                }
            } catch (e) {}
        }
        return false;
    };

    let hasModels = await discoverModels();
    if (!hasModels) {
        // Tenta acordar o Ollama caso esteja fechado ou dormindo
        const woke = await startOllamaViaServer();
        if (woke) {
            await new Promise(r => setTimeout(r, 1500));
            hasModels = await discoverModels();
        }
    }

    if (!hasModels || installedModels.length === 0) {
        throw new Error("Ollama não está em execução ou não possui modelos instalados no seu computador. Inicie o Ollama ou use um provedor em nuvem gratuito (Google Gemini, Groq ou NVIDIA NIM) nas opções acima.");
    }

    // Se temos modelos instalados, verificar se o modelo pedido existe ou fazer fallback inteligente
    if (installedModels.length > 0) {
        const exactMatch = installedModels.find(n => n === modelToUse || n.startsWith(`${modelToUse}:`));
        if (exactMatch) {
            modelToUse = exactMatch;
        } else if (!installedModels.includes(modelToUse)) {
            console.warn(`[Ollama] Modelo '${modelToUse}' não encontrado entre os instalados: [${installedModels.join(', ')}]. Usando '${installedModels[0]}'.`);
            modelToUse = installedModels[0];
        }
    }

    let lastErrorDetail = "";

    // 2. Tentar endpoint nativo /api/generate
    for (const ep of [activeEndpoint, ...endpointsToTry.filter(e => e !== activeEndpoint)]) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const res = await fetch(`${ep}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    prompt: prompt,
                    system: systemInstruction,
                    stream: false
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.response) return data.response.trim();
            } else {
                const errData = await res.json().catch(() => null);
                lastErrorDetail = errData?.error || `HTTP ${res.status} ${res.statusText}`;
            }
        } catch (err: any) {
            lastErrorDetail = err.message || String(err);
        }
    }

    // 3. Fallback para /v1/chat/completions (OpenAI-compatible)
    for (const ep of [activeEndpoint, ...endpointsToTry.filter(e => e !== activeEndpoint)]) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const messages: any[] = [];
            if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
            messages.push({ role: 'user', content: prompt });

            const res = await fetch(`${ep}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    messages,
                    temperature: 0.7
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text) return text.trim();
            } else {
                const errData = await res.json().catch(() => null);
                lastErrorDetail = errData?.error || `HTTP ${res.status} ${res.statusText}`;
            }
        } catch (err: any) {
            lastErrorDetail = err.message || String(err);
        }
    }

    // Tratar mensagens de erro específicas para orientar o usuário com precisão
    const lowerErr = (lastErrorDetail || "").toLowerCase();
    if (lowerErr.includes("not found") || lowerErr.includes("pulling")) {
        throw new Error(`Ollama: O modelo '${modelToUse}' não está baixado no seu computador. Execute 'ollama run ${modelToUse}' no terminal ou escolha um modelo disponível nas Configurações.`);
    }
    if (lowerErr.includes("memory") || lowerErr.includes("vram") || lowerErr.includes("cuda") || lowerErr.includes("allocate") || lowerErr.includes("exit status 1") || lowerErr.includes("terminated")) {
        throw new Error(`Ollama: Memória insuficiente (VRAM/RAM) para rodar o modelo '${modelToUse}'. Esse modelo é muito pesado para o hardware. Selecione um modelo mais leve como 'llama3.2' (3B) ou 'deepseek-r1:1.5b' nas Configurações.`);
    }
    if (lastErrorDetail && !lowerErr.includes("abort") && !lowerErr.includes("failed to fetch")) {
        throw new Error(`Ollama (${modelToUse}): ${lastErrorDetail}`);
    }

    throw new Error(`Ollama (Local): Falha ao conectar ao Ollama (${activeEndpoint}). Certifique-se de que o aplicativo do Ollama está aberto no seu PC/Pinokio e há pelo menos um modelo disponível (modelo tentado: '${modelToUse}'). Você também pode usar provedores em nuvem nas Configurações.`);
};


// --- MELHORIA 6: Erros de API mais claros (traducao de erros comuns) ---
const friendlyApiError = (providerLabel: string, raw: string): string => {
    const msg = (raw || "").toLowerCase();
    if (msg.includes("api key not valid") || msg.includes("invalid_api_key") || msg.includes("api key has been invalidated")) {
        return `${providerLabel}: a sua API key esta invalida ou foi revogada. Verifique em "Configuracoes" > "Chaves de IA & Ollama".`;
    }
    if (msg.includes("invalid x-goog-api-key")) {
        return `${providerLabel} (Google): API key invalida. Verifique a chave no Google AI Studio e atualize em "Configuracoes".`;
    }
    if (msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
        return `${providerLabel}: limite de requicoes/quota atingido. Aguarde alguns minutos ou use outro provedor (Ollama local e gratis e ilimitado).`;
    }
    if (msg.includes("billing") || msg.includes("payment") || msg.includes("account is not in good standing")) {
        return `${providerLabel}: conta com pendencia de faturamento. Regularize a conta no provedor ou use outro provedor.`;
    }
    if (msg.includes("model not found") || msg.includes("not supported") || msg.includes("decommissioned") || msg.includes("has been retired")) {
        return `${providerLabel}: modelo disponivel nao existe mais. O sistema ja tenta outros modelos automaticamente.`;
    }
    if (msg.includes("fetch failed") || msg.includes("networkerror") || msg.includes("failed to fetch") || msg.includes("timeout") || msg.includes("timed out")) {
        return `${providerLabel}: sem conexao de rede ou servidor demorou demais. Verifique sua internet (ou o Ollama local).`;
    }
    if (msg.includes("cors")) {
        return `${providerLabel}: bloqueado pelo navegador (CORS). Tente outro provedor ou o Ollama local.`;
    }
    if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("403")) {
        return `${providerLabel}: chave rejeitada (401/403). Confira se copiou a API key completa.`;
    }
    return `${providerLabel}: ${raw || "erro desconhecido"}`;
};

// 9. NVIDIA NIM (Multi-layer caller com Relay Local + Proxy Vite + Direct + Timeout de 25s)
export const callNvidia = async (prompt: string, systemInstruction?: string, modelOverride?: string): Promise<string> => {
    const userKeys = getStoredUserKeys();
    const settings = getSystemSettings();
    const keys = [
        ...extractKeys(userKeys.nvidia),
        ...extractKeys(settings.nvidiaApiKey)
    ];

    if (keys.length === 0) {
        throw new Error("Nenhuma chave da NVIDIA NIM configurada. Vá em 'Chaves de IA & Ollama' e insira sua chave da NVIDIA.");
    }

    const preferredModel = (modelOverride || userKeys.nvidiaModel || localStorage.getItem('iaplay_nvidia_model') || 'nvidia/llama-3.1-nemotron-70b-instruct').trim();

    // Modelos ativos verificados na NVIDIA NIM (sem modelos expirados como llama-3.3-70b)
    const fallbackModels = [
        preferredModel,
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'mistralai/mistral-large-2-instruct',
        'nv-mistralai/mistral-nemo-12b-instruct',
        'mistralai/mixtral-8x22b-v0.1',
        'deepseek-ai/deepseek-v4.1-flash'
    ];
    // Remove duplicatas preservando a ordem de prioridade
    const modelsToTry = Array.from(new Set(fallbackModels));

    // Endpoints candidatos (Relay Python na 42024 -> Proxy Vite -> Direto)
    const candidateEndpoints = [
        'http://127.0.0.1:42024/api/v1/ai/nvidia',
        '/api/nvidia/v1/chat/completions',
        'https://integrate.api.nvidia.com/v1/chat/completions'
    ];

    let lastError = "";

    for (const key of keys) {
        for (const model of modelsToTry) {
            for (const endpoint of candidateEndpoints) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 25000);

                    const messages: any[] = [];
                    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
                    messages.push({ role: 'user', content: prompt });

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model,
                            messages,
                            temperature: 0.7,
                            max_tokens: 2048
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        lastError = errData?.detail || errData?.error?.message || `HTTP ${res.status}`;
                        // Se o relay local não estiver respondendo, tenta o próximo endpoint imediatamente
                        if (endpoint.includes('42024') && (res.status === 404 || res.status === 502)) {
                            continue;
                        }
                        // Se for erro de modelo não encontrado ou aposentado, pula para o próximo modelo
                        if (res.status === 404 || res.status === 410 || lastError.toLowerCase().includes('model') || lastError.toLowerCase().includes('end of life')) {
                            break;
                        }
                        continue;
                    }

                    const data = await res.json();
                    const text = data?.choices?.[0]?.message?.content;
                    if (text && text.trim().length > 0) {
                        return text.trim();
                    }
                } catch (err: any) {
                    lastError = err.message || String(err);
                }
            }
        }
    }

    throw new Error(friendlyApiError("NVIDIA NIM", lastError || "Todas as tentativas com modelos NVIDIA NIM falharam."));
};

const executeProvider = async (prompt: string, provider: AIProvider, systemInstruction?: string): Promise<string> => {
    switch (provider) {
        case AIProvider.OLLAMA:
            return await callOllama(prompt, systemInstruction);
        case AIProvider.GROQ:
            return await callGroq(prompt, systemInstruction);
        case AIProvider.OPENROUTER:
            return await callOpenRouter(prompt, systemInstruction);
        case AIProvider.NVIDIA:
            return await callNvidia(prompt, systemInstruction);
        case AIProvider.CEREBRAS:
            return await callCerebras(prompt, systemInstruction);
        case AIProvider.OPENAI:
            return await callOpenAI(prompt, systemInstruction);
        case AIProvider.MISTRAL:
            return await callMistral(prompt, systemInstruction);
        case AIProvider.TOGETHER:
            return await callTogether(prompt, systemInstruction);
        case AIProvider.GOOGLE:
        default:
            return await callGoogle(prompt, systemInstruction);
    }
};

const unifiedGenerate = async (prompt: string, provider?: AIProvider, systemInstruction?: string): Promise<string> => {
    const effectiveProvider = resolveEffectiveProvider(provider);
    let primaryErrorMsg = "";
    const fallbackErrors: string[] = [];

    try {
        return await executeProvider(prompt, effectiveProvider, systemInstruction);
    } catch (primaryError: any) {
        primaryErrorMsg = primaryError.message || String(primaryError);
        console.warn(`[Fallback] Fornecedor primario (${effectiveProvider}) falhou:`, primaryErrorMsg);

        // Ordem estrategica de fallback APENAS para provedores configurados com chave
        const fallbacks = [
            AIProvider.GOOGLE,
            AIProvider.GROQ,
            AIProvider.NVIDIA,
            AIProvider.OPENROUTER,
            AIProvider.CEREBRAS,
            AIProvider.MISTRAL,
            AIProvider.TOGETHER,
            AIProvider.OPENAI
        ].filter(p => p !== effectiveProvider && hasKeyForProvider(p));

        // Só inclui Ollama no fallback se estiver comprovadamente online
        if (effectiveProvider !== AIProvider.OLLAMA && hasKeyForProvider(AIProvider.OLLAMA)) {
            fallbacks.push(AIProvider.OLLAMA);
        }

        for (const fb of fallbacks) {
            try {
                console.log(`[Fallback] Tentando fornecedor alternativo configurado: ${fb}...`);
                const result = await executeProvider(prompt, fb, systemInstruction);
                console.log(`[Fallback] Sucesso com ${fb}!`);
                return result;
            } catch (err: any) {
                const errMsg = err.message || String(err);
                fallbackErrors.push(`[${fb}] -> ${errMsg}`);
            }
        }

        const friendlyMsg = friendlyApiError(effectiveProvider, primaryErrorMsg);
        throw new Error(friendlyMsg);
    }
};



// --- HELPER: Garante que um valor seja sempre um array ---
const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
};

// --- TRADUÇÃO DOS TIPOS DE VOZ DO ARSENAL PARA INGLÊS ---
export const translateVoiceTypesToEnglish = (voiceTypes: any): string[] => {
    const arr = ensureArray(voiceTypes);
    const map: Record<string, string> = {
        "Voz Feminina": "Female Lead Vocals",
        "Voz Masculina": "Male Lead Vocals",
        "Dupla Sertaneja Masculina": "Male Country Duo Vocals, Dual Harmonies",
        "Dupla Sertaneja Feminina": "Female Country Duo Vocals, Dual Harmonies",
        "Dueto Misto (Masc + Fem)": "Male and Female Duet, Dual Lead Vocals",
        "Coral / Backing Vocals": "Choir Backing Vocals, Layered Harmonies",
        "Vocal Infantil": "Child Vocals",
        "Gang Vocals (Coro de Estádio)": "Gang Vocals, Stadium Crowd Chorus",
        "Voz Rasgada e Rouca": "Raspy Gritty Vocals",
        "Voz Aveludada": "Velvety Smooth Vocals",
        "Voz Potente / Belting": "Powerful Belting Vocals",
        "Voz Suave e Intimista": "Soft Intimate Vocals",
        "Voz Sussurrada": "Whispered Breathless Vocals",
        "Voz Aguda e Cristalina": "Bright Crystalline High Vocals",
        "Voz Grave e Encorpada": "Deep Resonant Low Vocals",
        "Voz com Drive / Distorção": "Vocal Drive, Controlled Distortion",
        "Falsete Emotivo": "Emotional Falsetto, Head Voice",
        "Vocal Melismático / R&B Gospel": "Melismatic Vocal Runs, Gospel Riffs",
        "Flow Rápido / Rítmico": "Fast Rhythmic Flow, Precise Cadence",
        "Vocal Melancólico e Emocional": "Melancholic Emotional Vocals"
    };

    return arr.map(v => (typeof v === 'string' && map[v.trim()]) ? map[v.trim()] : String(v).trim()).filter(Boolean);
};

// --- HELPER TO FORMAT ARSENAL ---
const formatArsenalForPrompt = (arsenal: ArsenalSettings): string => {
    const instruments = ensureArray(arsenal.instruments);
    const atmosphere = ensureArray(arsenal.atmosphere);
    const mastering = ensureArray(arsenal.mastering);
    const effects = ensureArray(arsenal.effects);
    const rhythm = ensureArray(arsenal.rhythm);
    const rawVoiceTypes = ensureArray(arsenal.voiceTypes);
    const englishVoiceTypes = translateVoiceTypesToEnglish(rawVoiceTypes);
    const voiceSummary = englishVoiceTypes.length > 0
        ? englishVoiceTypes.join(", ")
        : "Free Choice / Natural";

    return `
    - Vocal Profile / Voice Type & Gender (NON-NEGOTIABLE HIGH PRIORITY): ${voiceSummary}
    - Instruments (High Priority): ${instruments.join(", ") || "Free Choice"}
    - Atmosphere: ${atmosphere.join(", ") || "Standard"}
    - Reverb: ${arsenal.isReverbActive ? `Active (${arsenal.reverbLevel !== undefined ? arsenal.reverbLevel : 50}%)` : "Dry"}
    - Mastering: ${mastering.join(", ") || "Standard"}
    - Effects: ${effects.join(", ") || "None"}
    - Rhythm: ${rhythm.join(", ") || "Standard"}
    - Constraint: ${arsenal.forceInstruments ? "STRICT: Use ONLY listed instruments." : "Flexible."}
  `;
};

// 1️⃣ & 2️⃣ — GENERATE LYRICS or INSTRUMENTAL
export const generateLyrics = async (
    project: Project,
    provider: AIProvider,
    currentInput: string = "",
    creativeContext?: string
): Promise<string> => {
    try {
        const settings = getSystemSettings();
        let prompt = "";
        const styles = ensureArray(project.styles);

        // Converte os estilos selecionados em uma string
        const styleContext = styles.length > 0 ? styles.join(", ") : "Livre";

        if (project.musicType === MusicType.INSTRUMENTAL) {
            prompt = settings.promptInstrumental
                .replace("[INTRO]", "Intro")
                .replace("[TÍTULO DA MÚSICA]", project.title)
                .replace("[SENTIMENTO]", project.sentiment)
                .replace("Title:", `Title: "${project.title}"`)
                + `\n\nCONTEXT:\nTitle: ${project.title}\nFeeling: ${project.sentiment}\nStyles: ${styles.join(", ")}`;
        } else {
            const userInstruction = currentInput.trim().length > 0 ? currentInput : project.title;
            prompt = settings.promptLyrics
                .replace("[IDIOMA]", project.language)
                .replace("[TÍTULO DA MÚSICA]", userInstruction)
                .replace("[SENTIMENTO]", project.sentiment)
                .replace("[ESTILOS]", styleContext);

            // Se o usuário acidentalmente removeu a tag [TÍTULO DA MÚSICA] de suas configurações no painel admin,
            // garantimos que a instrução do tema ainda será passada à IA.
            if (!settings.promptLyrics.includes("[TÍTULO DA MÚSICA]")) {
                prompt += `\n\nTEMA FORNECIDO PELO USUÁRIO (Obrigatório seguir): ${userInstruction}`;
            }

            // INJEÇÃO RÍGIDA DE ESTILO (apenas se a tag [ESTILOS] não estiver já no prompt mestre)
            if (!settings.promptLyrics.includes("[ESTILOS]")) {
                prompt += `\n\nESTILO MUSICAL ALVO: ${styleContext} (Use APENAS o vocabulário e a temática deste gênero. Se for Gospel, use linguagem cristã. Se for Trap, use gírias urbanas. Se for MPB, use poesia culta. NÃO MISTURE GÊNEROS).`;
            }

            if (project.artistInspiration) {
                prompt += `\n\nINSPIRAÇÃO DE ARTISTA: Tente emular o estilo de escrita de: ${project.artistInspiration}, mas mantendo a fidelidade ao estilo musical solicitado acima.`;
            }

            if (creativeContext && creativeContext.trim().length > 0) {
                prompt += `\n\n[MEMÓRIA CRIATIVA / DNA SÔNICO DO ARTISTA]\nO usuário definiu suas regras perenes de composição: "${creativeContext}"\n**INSTRUÇÃO CRÍTICA: Você DEVE observar e aplicar essas preferências estéticas na letra gerada.**`;
            }
        }

        console.log("=== ENVIANDO PARA A IA ===");
        console.log(prompt);
        console.log("==========================");

        return await unifiedGenerate(prompt, provider);
    } catch (error) {
        console.error("Erro ao gerar letra:", error);
        throw error;
    }
};

// 3️⃣ — OTIMIZAR LETRA
export const optimizeLyrics = async (lyrics: string, provider?: AIProvider): Promise<string> => {
    const settings = getSystemSettings();
    let prompt = settings.promptOptimize
        .replace("[IDIOMA]", "Português (Brasil)");
    
    if (prompt.includes("[LYRICS_CONTENT]")) {
        prompt = prompt.replace("[LYRICS_CONTENT]", lyrics);
    } else {
        prompt += `\n\n[LETRA ORIGINAL]\n${lyrics}`;
    }
    return await unifiedGenerate(prompt, provider);
};

/**
 * Remove [Production Note: ...], [Prod: ...], cabeçalhos globais e colchetes órfãos
 * de uma letra prévia, preservando 100% da letra original e tags estruturais e vocais
 * para que a reestruturação receba uma base limpa ao mudar de gênero.
 */
export const stripProductionNotes = (text: string): string => {
    if (!text || !text.trim()) return '';
    return text
        .replace(/\[(?:Production\s+Note|Prod|Nota\s+de\s+Produ[çc][aã]o):[^\]]*\]/gi, '')
        .replace(/\[PROMPT_GLOBAL:[^\]]*\]/gi, '')
        .replace(/^\s*\[(?:BRAZILIAN\s+PORTUGUESE|PORTUGUESE|ENGLISH|SPANISH|LATIN\s+SPANISH|FRENCH|GERMAN|ITALIAN|JAPANESE|KOREAN|CHINESE)\]\s*/im, '')
        .split(/\r?\n/)
        .filter(line => {
            const t = line.trim();
            return t !== ']' && t !== '[' && t !== '[]' && t !== ']]' && t !== '[[';
        })
        .map(line => line.replace(/^\s*\]+\s*/, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

/**
 * Fornece a instrumentação e atmosfera autêntica para gêneros musicais comuns
 * quando o usuário altera o estilo, garantindo obediência estrita da IA ao novo gênero.
 */
export const getGenreArrangementHint = (styles: string[]): string => {
    const joined = styles.join(" ").toLowerCase();
    if (joined.includes("pagode") || joined.includes("samba")) {
        return "Cavaquinho, Tantã, Pandeiro, Surdo, Repique de mão, Violão de 6 e 7 cordas, syncopated samba swing, acoustic percussion, pagode backing chorus";
    }
    if (joined.includes("sertanejo") || joined.includes("arrocha") || joined.includes("modão")) {
        return "Sanfona / Accordion, Viola Caipira, Acoustic Guitars, punchy modern bass and drums, emotional vocal projection";
    }
    if (joined.includes("worship") || joined.includes("gospel") || joined.includes("louvor")) {
        return "Dynamic piano, fingerpicked acoustic guitar, ambient synth pads, cinematic strings, building drum dynamics, soaring vocals";
    }
    if (joined.includes("forró") || joined.includes("piseiro") || joined.includes("pisadinha") || joined.includes("baião")) {
        return "Sanfona / Accordion, Zabumba, Triângulo, syncopated bass, danceable pulse";
    }
    if (joined.includes("trap") || joined.includes("hip hop") || joined.includes("rap")) {
        return "808 sub bass, rapid hi-hat rolls, crisp snare, filtered ambient synths, rhythmic cadence";
    }
    if (joined.includes("rock") || joined.includes("metal") || joined.includes("punk")) {
        return "Distorted electric guitar riffs, punchy bass guitar, driving acoustic rock drums, powerful gritty vocal attitude";
    }
    if (joined.includes("funk") || joined.includes("funk br")) {
        return "130-150 BPM syncopated beat, punchy sub-bass, vocal chops, energetic delivery";
    }
    if (joined.includes("mpb") || joined.includes("bossa nova") || joined.includes("bossa")) {
        return "Nylon acoustic guitar, delicate jazz harmonies, subtle percussion, warm intimate vocal";
    }
    if (joined.includes("reggaeton") || joined.includes("latin")) {
        return "Dembow rhythm, deep sub synth bass, crisp snare, catchy synth hooks, intimate autotune vocals";
    }
    return "";
};

// 4️⃣ — ESTRUTURAR PROMPT (Suno, Udio, Mureka, YuE2)
export const structureSunoPrompt = async (
    project: Project,
    provider: AIProvider
): Promise<string> => {
    try {
        const settings = getSystemSettings();
        const detailedInstructions = project.detailedInstructions.map(d => `- SECTION [${d.section}]: ${d.instruction}`).join("\n");
        
        // Coleta e deduplica estilos ativos do projeto
        const rawStyles = [
            ...ensureArray(project.styles),
            ...ensureArray(project.extractedStyles)
        ];
        const uniqueStylesMap = new Map<string, string>();
        for (const s of rawStyles) {
            if (typeof s === 'string' && s.trim()) {
                const lower = s.trim().toLowerCase();
                if (!uniqueStylesMap.has(lower)) {
                    uniqueStylesMap.set(lower, s.trim());
                }
            }
        }
        let activeStyles = Array.from(uniqueStylesMap.values());
        if (activeStyles.length === 0 && project.stylePrompt && project.stylePrompt.trim()) {
            activeStyles = [project.stylePrompt.trim()];
        }
        if (activeStyles.length === 0) {
            activeStyles = ["Livre / Contemporâneo"];
        }

        const genreHint = getGenreArrangementHint(activeStyles);
        const arsenalInstruments = ensureArray(project.arsenal?.instruments);
        const combinedInstruments = arsenalInstruments.length > 0
            ? arsenalInstruments.join(", ")
            : (genreHint || "Free Choice / Natural Arrangement");

        const rawVoiceTypes = ensureArray(project.arsenal?.voiceTypes);
        const englishVoiceTypes = translateVoiceTypesToEnglish(rawVoiceTypes);
        const vocalInstruction = englishVoiceTypes.length > 0 ? englishVoiceTypes.join(", ") : "";

        const hasFemaleVocal = rawVoiceTypes.some(v => /feminin/i.test(v)) || englishVoiceTypes.some(v => /female/i.test(v));
        const hasMaleVocal = rawVoiceTypes.some(v => /masculin/i.test(v)) || englishVoiceTypes.some(v => /\bmale\b/i.test(v));

        const enrichedArsenal = {
            ...project.arsenal,
            instruments: arsenalInstruments.length > 0 ? arsenalInstruments : (genreHint ? [genreHint] : [])
        };
        const arsenalData = formatArsenalForPrompt(enrichedArsenal);

        const platform = project.targetPlatform || MusicPlatform.SUNO;

        const platformInstructions = {
            [MusicPlatform.SUNO]: `
PLATAFORMA ALVO: Suno.ai
ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
1. [STYLE OF MUSIC / PROMPT]
(Tags concisas de gêneros, BPM, vocais e instrumentos para colar na caixa "Style of Music" do Suno)

2. [LETRA ESTRUTURADA]
(Estruture a letra completa com metatags precisas do Suno: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Guitar Solo], [Drop], [Outro], [End] e diretrizes de performance nos colchetes).
`.trim(),
            [MusicPlatform.UDIO]: `
PLATAFORMA ALVO: Udio
ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
1. [UDIO PROMPT TAGS]
(Tags descritivas separadas por vírgula para a caixa Prompt do Udio: gênero, tipo de vocal, instrumentos, ambiência, BPM, ex: "female vocalist, synthwave, 80s, melancholic, punchy bass, analog synths, reverb, 120 bpm")

2. [CUSTOM LYRICS]
(Estruture a letra com tags suportadas pelo Udio: [Verse], [Chorus], [Bridge], [Drop], [Instrumental], [Guitar Solo], [Outro], [End]).
`.trim(),
            [MusicPlatform.MUREKA]: `
PLATAFORMA ALVO: Mureka.ai
ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
1. [SONG DESCRIPTION & PROMPT]
(Descrição detalhada para o prompt do Mureka: Gênero, Mood, Instrumentos, Tipo de Vocal, Andamento/BPM e Masterização)

2. [LYRICS & STRUCTURE]
(Letra completa organizada com seções [Intro], [Verse 1], [Chorus], [Bridge], [Outro]).
`.trim(),
            [MusicPlatform.MAESTRO]: `
PLATAFORMA ALVO: Maestro (YuE2 Local)
ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
1. [MUSIC STYLE / ALT_PROMPT]
(Descrição de estilo concisa e direta para a caixa de estilo do YuE2: gênero musical, tipo e timbre do vocal, instrumentos principais, atmosfera, andamento/BPM. Ex: "Acoustic Pop, warm expressive vocal, fingerpicked acoustic guitar, soft piano, emotive, 90 BPM").

2. [LETRA ESTRUTURADA YUE2]
(Estruture a letra completa com seções claras separadas por linhas em branco no formato padrão YuE2: [Verse], [Chorus], [Bridge], [Outro]. Repita o refrão explicitamente e mantenha frases curtas e cantáveis).
`.trim()
        }[platform] || "";

        // Limpa notas de produção antigas da letra de entrada para que a nova reestruturação receba uma base pura
        const cleanInputLyrics = stripProductionNotes(project.lyrics);

        let prompt = settings.promptStructure
            .replace("[IDIOMA]", project.language)
            .replace("[ESTILOS]", activeStyles.join(", "))
            .replace("[ARTISTA]", project.artistInspiration || "Creative Freedom")
            .replace("[SENTIMENTO]", project.sentiment)
            .replace("[ARSENAL]", arsenalData)
            .replace("[DETAILED_INSTRUCTIONS]", detailedInstructions || "None.");

        if (prompt.includes("[LYRICS_CONTENT]")) {
            prompt = prompt.replace("[LYRICS_CONTENT]", cleanInputLyrics);
        }
        else if (prompt.includes("[LYRICS INPUT]")) {
            const inputPayload = `
### OFFICIAL LYRICS (DO NOT MODIFY):
${cleanInputLyrics}

### ADDITIONAL PRODUCTION INSTRUCTIONS:
${detailedInstructions || "No additional specific instructions."}
        `.trim();
            prompt = prompt.replace("[LYRICS INPUT]", inputPayload);
        }
        else {
            prompt += `\n\n[LYRICS]\n${cleanInputLyrics}`;
        }

        const vocalDirective = vocalInstruction
            ? `- Target Vocal Profile: ${vocalInstruction}. You MUST include "${vocalInstruction}" in [PROMPT_GLOBAL] and describe the vocal delivery in the [Production Note: ...] blocks.`
            : "";

        const dynamicStyleOverrideInstruction = `
CRITICAL - NEW MUSICAL STYLE, VOCAL PROFILE & RESTRUCTURING ENFORCEMENT:
- Target Musical Style: ${activeStyles.join(", ")}
${vocalDirective ? vocalDirective + '\n' : ''}- Target Atmosphere / Emotion: ${project.sentiment}
- Target Instrumentation: ${combinedInstruments}
- MANDATORY PRODUCTION NOTES: You MUST generate 100% fresh, authentic [Production Note: ...] for each section strictly adhering to "${activeStyles.join(", ")}"${vocalInstruction ? ' and vocal profile "' + vocalInstruction + '"' : ''}. NEVER reuse or preserve old instruments or arrangements from another genre.
- MANDATORY [PROMPT_GLOBAL]: Must end with the vocal profile and active style keywords: "${vocalInstruction ? vocalInstruction + ', ' : ''}${activeStyles.join(", ")}${project.sentiment && project.sentiment !== 'Neutro' ? ', ' + project.sentiment : ''}". NEVER leave [PROMPT_GLOBAL] empty or ending with a trailing comma.
- 100% LYRICS PRESERVATION: Every line of the song lyrics must be reproduced word for word with zero omissions.
`.trim();

        // Injeta instrucao especializada de plataforma com protocolo rigido anti-omissao
        const zeroTruncationInstruction = `
CRITICAL INSTRUCTION - ZERO TRUNCATION & 100% LYRIC PRESERVATION:
- Do NOT use ellipses "..." or placeholders anywhere.
- Every single verse, chorus, bridge, and line from the source lyrics MUST be printed in full, word for word.
- If a chorus repeats, reproduce the complete chorus lyrics every single time.
- Do NOT swap, combine, or duplicate verses (Verse 1 must not be repeated as Verse 2).
- Keep all original lyrics 100% intact from start to finish.
`.trim();

        prompt += `\n\n${platformInstructions}\n\n${dynamicStyleOverrideInstruction}\n\n${zeroTruncationInstruction}\n\nIMPORTANTE: Retorne a estrutura completa preservando toda a letra fornecida e aplicando todas as tags musicais apropriadas para ${platform}. NUNCA OMITA VERSOS NEM USE RETICÊNCIAS "...".`;

        const rawResult = await unifiedGenerate(prompt, provider);
        
        // Recupera seções truncadas com reticências (...) caso o modelo tenha omitido letras
        let restored = restoreTruncatedSections(rawResult, cleanInputLyrics || project.lyrics);

        // Remove colchetes órfãos indevidos
        restored = restored
            .split(/\r?\n/)
            .filter(line => {
                const t = line.trim();
                return t !== ']' && t !== '[' && t !== '[]' && t !== ']]' && t !== '[[';
            })
            .map(line => line.replace(/^\s*\]+\s*/, ''))
            .join('\n');

        // VALIDAÇÃO & REPARO RÍGIDO DE [PROMPT_GLOBAL]
        const cleanStyleString = activeStyles.join(", ");
        const sentimentString = project.sentiment && project.sentiment !== "Neutro" ? project.sentiment : "";
        const primaryHint = genreHint || (arsenalInstruments.slice(0, 4).join(", "));
        const vocalKeywords = englishVoiceTypes.length > 0 ? englishVoiceTypes.join(", ") : "";
        const styleKeywords = [vocalKeywords, cleanStyleString, sentimentString, primaryHint].filter(Boolean).join(", ");

        const globalMatch = restored.match(/\[PROMPT_GLOBAL:\s*([^\]]*)\]/i);
        if (globalMatch) {
            let globalContent = globalMatch[1].trim();
            const endsWithComma = /,\s*$/.test(globalContent);
            const hasAnyStyle = activeStyles.some(s => globalContent.toLowerCase().includes(s.toLowerCase()));

            if (endsWithComma || !hasAnyStyle || globalContent.endsWith("pristine clarity,") || globalContent.length < 160) {
                globalContent = globalContent.replace(/,\s*$/, '').trim();
                if (!hasAnyStyle) {
                    globalContent = `${globalContent}, ${styleKeywords}`;
                }
            }

            // Injeta o perfil vocal no [PROMPT_GLOBAL] caso o modelo tenha omitido
            if (vocalKeywords) {
                const vocalLower = vocalKeywords.toLowerCase();
                const alreadyHasVocal = globalContent.toLowerCase().includes(vocalLower) ||
                    (hasFemaleVocal && /female/i.test(globalContent)) ||
                    (hasMaleVocal && /\bmale\b/i.test(globalContent));

                if (!alreadyHasVocal) {
                    globalContent = `${globalContent}, ${vocalKeywords}`;
                }
            }

            restored = restored.replace(globalMatch[0], `[PROMPT_GLOBAL: ${globalContent}]`);
        } else {
            // Injeta [PROMPT_GLOBAL] caso o modelo tenha omitido
            const langMatch = restored.match(/^\s*(\[[A-Z\s]+\])\s*\n/i);
            const defaultGlobal = `[PROMPT_GLOBAL: Ultra-realistic professional studio recording, high-fidelity audio, clean and transparent mix, high-end mastering, authentic human vocal performance, expressive emotion, zero AI artifacts, commercial-grade audio, cinematic depth, pristine clarity, industry-standard production, Studio Isolation, ${styleKeywords}]`;
            if (langMatch) {
                restored = restored.replace(langMatch[0], `${langMatch[1]}\n${defaultGlobal}\n\n`);
            } else {
                restored = `${defaultGlobal}\n\n${restored}`;
            }
        }

        // Assegura que as Production Notes reflitam o gênero do vocal se especificado
        if (hasFemaleVocal) {
            restored = restored.replace(
                /(\[Production Note:[^\]]*?)(?:(the\s+)?\b(vocals|lead vocals?|vocalist|vocal performance|vocal delivery)\b)([^\]]*?\])/gi,
                (match, prefix, theWord, vocalWord, suffix) => {
                    if (/female|feminina/i.test(match)) return match;
                    const leadArticle = theWord ? theWord : '';
                    return `${prefix}${leadArticle}female ${vocalWord}${suffix}`;
                }
            );
        } else if (hasMaleVocal && !hasFemaleVocal) {
            restored = restored.replace(
                /(\[Production Note:[^\]]*?)(?:(the\s+)?\b(vocals|lead vocals?|vocalist|vocal performance|vocal delivery)\b)([^\]]*?\])/gi,
                (match, prefix, theWord, vocalWord, suffix) => {
                    if (/\bmale\b|masculina/i.test(match)) return match;
                    const leadArticle = theWord ? theWord : '';
                    return `${prefix}${leadArticle}male ${vocalWord}${suffix}`;
                }
            );
        }

        // Formata o resultado para a plataforma selecionada sem perda de dados
        return formatForPlatform(restored, platform);
    } catch (error) {
        console.error("Erro ao estruturar prompt:", error);
        throw error;
    }
};

/**
 * Extrai um mapa de seções e suas respectivas letras a partir de um texto original.
 */
export const extractSectionsMap = (text: string): Map<string, string> => {
    const map = new Map<string, string>();
    if (!text || !text.trim()) return map;

    const sectionRegex = /(?:^|\n)\s*(\[(?:Intro|Verse\s*\d*|Chorus\s*\d*|Refr[aã]o\s*\d*|Bridge\s*\d*|Ponte\s*\d*|Drop\s*\d*|Outro\s*\d*|Pre-Chorus\s*\d*)[^\]]*\])/gi;
    const matches: { tag: string; index: number; fullMatch: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = sectionRegex.exec(text)) !== null) {
        matches.push({ tag: match[1], index: match.index, fullMatch: match[0] });
    }

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const rawContent = next
            ? text.substring(current.index + current.fullMatch.length, next.index)
            : text.substring(current.index + current.fullMatch.length);

        const cleanLyrics = rawContent
            .replace(/\[Production\s+Note:[^\]]*\]/gi, '')
            .replace(/\[Prod:[^\]]*\]/gi, '')
            .trim();

        if (cleanLyrics && cleanLyrics !== '...' && cleanLyrics !== '…') {
            const key = current.tag.toLowerCase().replace(/\s+/g, ' ').trim();
            map.set(key, cleanLyrics);
            const baseTag = key.replace(/\s*\d+/, '');
            if (!map.has(baseTag)) {
                map.set(baseTag, cleanLyrics);
            }
        }
    }

    return map;
};

/**
 * Corrige e restaura qualquer seção lírica que o modelo tenha truncado com reticências (...)
 * ou duplicado erroneamente.
 */
export const restoreTruncatedSections = (generated: string, original: string): string => {
    if (!generated || !original) return generated;
    const originalSections = extractSectionsMap(original);
    if (originalSections.size === 0) return generated;

    let result = generated;

    // 1. Substitui seções onde o corpo lírico foi substituído por reticências (...) ou (…)
    result = result.replace(
        /(\[(?:Intro|Verse\s*\d*|Chorus\s*\d*|Refr[aã]o\s*\d*|Bridge\s*\d*|Ponte\s*\d*|Drop\s*\d*|Outro\s*\d*|Pre-Chorus\s*\d*)[^\]]*\]\s*)(?:\.{3,}|…)([\s\S]*?(?=(?:\[(?:Intro|Verse|Chorus|Refr[aã]o|Bridge|Ponte|Drop|Outro|Pre-Chorus)|$)))/gi,
        (match, sectionHeader, restOfSection) => {
            const tagKey = sectionHeader.trim().toLowerCase().replace(/\s+/g, ' ');
            const baseTagKey = tagKey.replace(/\s*\d+/, '');
            const recoveredLyrics = originalSections.get(tagKey) || originalSections.get(baseTagKey);

            if (recoveredLyrics) {
                const trimmedRest = restOfSection.trim();
                return `${sectionHeader.trim()}\n${recoveredLyrics}\n${trimmedRest ? '\n' + trimmedRest : ''}\n\n`;
            }
            return match;
        }
    );

    // 2. Corrige duplicação indevida de Verse 1 dentro de Verse 2
    const verse1Original = originalSections.get('[verse 1]') || originalSections.get('[verse]');
    const verse2Original = originalSections.get('[verse 2]');
    if (verse1Original && verse2Original && verse1Original !== verse2Original) {
        const verse2Regex = /(\[Verse\s*2[^\]]*\]\s*)([\s\S]*?)(?=\n\s*\[(?:Production\s+Note|Prod|Chorus|Bridge|Verse|Outro)|$)/i;
        const v2Match = result.match(verse2Regex);
        if (v2Match) {
            const currentV2Lyrics = v2Match[2].trim();
            const firstLineV1 = verse1Original.split('\n')[0].trim();
            if (currentV2Lyrics.includes(firstLineV1) && !currentV2Lyrics.includes(verse2Original.split('\n')[0].trim())) {
                result = result.replace(verse2Regex, `$1${verse2Original}\n`);
            }
        }
    }

    return result;
};

// --- Suporte nativo ao Suno, Udio e Mureka.ai ---
export const formatForPlatform = (rawPrompt: string, platform: MusicPlatform): string => {
    const cleaned = (rawPrompt || "").trim();

    // Limpar markdown de bloco de codigo sem mutilar o conteudo interno
    let text = cleaned
        .replace(/^```[a-zA-Z]*\n/gm, "")
        .replace(/```$/gm, "")
        .trim();

    return text;
};

/**
 * Faz o parsing automático do retorno de estruturação de prompts,
 * separando a Letra Estruturada (com tags musicais [Verse], [Chorus] etc.)
 * e o Estilo / Tags Sonoras para que sejam propagados imediatamente
 * para os campos de geração e reprodução musical (YuE2, Suno, etc).
 */
export const parseStructuredPrompt = (raw: string): { styleText: string; lyricsText: string; tags: string[] } => {
    if (!raw || !raw.trim()) {
        return { styleText: '', lyricsText: '', tags: [] };
    }

    let styleText = '';
    let lyricsText = '';

    // Detecta tag de idioma no início (ex: [BRAZILIAN PORTUGUESE], [ENGLISH], [SPANISH])
    const langMatch = raw.match(/^\s*(\[(?:BRAZILIAN\s+PORTUGUESE|PORTUGUESE|ENGLISH|SPANISH|LATIN\s+SPANISH|FRENCH|GERMAN|ITALIAN|JAPANESE|KOREAN|CHINESE)\])/i);
    const langTag = langMatch ? langMatch[1] : '';

    // Regex para identificar o cabeçalho da seção de letra estruturada de todas as plataformas
    const lyricsHeaderMatch = raw.match(
        /(?:^|\n)(?:(?:\d+[\.\)]|#{1,4})\s*)?\[(?:LETRA\s+ESTRUTURADA(?:\s+YUE2)?|CUSTOM\s+LYRICS|LYRICS\s*(?:&|AND)\s*STRUCTURE|LETRA|LYRICS)\][^\n]*/i
    );

    if (lyricsHeaderMatch && lyricsHeaderMatch.index !== undefined) {
        const splitIndex = lyricsHeaderMatch.index + lyricsHeaderMatch[0].length;
        const beforeLyrics = raw.substring(0, lyricsHeaderMatch.index).trim();
        lyricsText = raw.substring(splitIndex).trim();

        // Extrai a seção de estilo anterior à letra
        const styleHeaderMatch = beforeLyrics.match(
            /(?:^|\n)(?:(?:\d+[\.\)]|#{1,4})\s*)?\[(?:STYLE\s+OF\s+MUSIC(?:\s*\/\s*PROMPT)?|MUSIC\s+STYLE(?:\s*\/\s*ALT_PROMPT)?|UDIO\s+PROMPT\s+TAGS|SONG\s+DESCRIPTION\s*&?\s*PROMPT|STYLE|PROMPT\s+TAGS)\][^\n]*/i
        );

        if (styleHeaderMatch && styleHeaderMatch.index !== undefined) {
            styleText = beforeLyrics.substring(styleHeaderMatch.index + styleHeaderMatch[0].length).trim();
        } else {
            styleText = beforeLyrics;
        }

        // Se houver uma tag de idioma no cabeçalho geral mas ausente na letra, preserva no topo da letra
        if (langTag && !lyricsText.toLowerCase().includes(langTag.toLowerCase())) {
            lyricsText = `${langTag}\n\n${lyricsText}`;
        }
    } else {
        // Fallback: se não houver o cabeçalho padrão, busca a primeira metatag musical clássica [Intro], [Verse], etc.
        const metaTagMatch = raw.match(/(?:^|\n)\s*(\[(?:Intro|Verse|Chorus|Refr[aã]o|Ponte|Bridge|Drop|Outro|Pre-Chorus)[^\]]*\])/i);
        if (metaTagMatch && metaTagMatch.index !== undefined) {
            const beforeMeta = raw.substring(0, metaTagMatch.index).trim();

            // Verifica se há [PROMPT_GLOBAL: ...]
            const globalMatch = beforeMeta.match(/\[PROMPT_GLOBAL:\s*([^\]]+)\]/i);
            if (globalMatch) {
                styleText = globalMatch[1].trim();
            } else {
                // Remove a tag de idioma da seção de estilo
                styleText = beforeMeta.replace(/^\s*\[(?:BRAZILIAN\s+PORTUGUESE|PORTUGUESE|ENGLISH|SPANISH|LATIN\s+SPANISH|FRENCH|GERMAN|ITALIAN|JAPANESE|KOREAN|CHINESE)\]\s*/i, '').trim();
            }

            const lyricsBody = raw.substring(metaTagMatch.index).trim();
            // Mantém a tag de idioma no topo da letra estruturada
            if (langTag) {
                lyricsText = `${langTag}\n\n${lyricsBody}`;
            } else {
                lyricsText = lyricsBody;
            }
        } else {
            lyricsText = raw.trim();
        }
    }

    // Remove eventuais instruções de template entre parênteses no início de cada seção
    styleText = styleText.replace(/^\s*\((?:insira|digite|cole|insert|style here)[^\)]*\)\s*\n?/im, '').trim();
    lyricsText = lyricsText
        .replace(/^\s*\((?:insira|digite|cole|insert|lyrics here|adicione)[^\)]*\)\s*\n?/im, '')
        .split(/\r?\n/)
        .filter(line => {
            const t = line.trim();
            return t !== ']' && t !== '[' && t !== '[]' && t !== ']]' && t !== '[[';
        })
        .map(line => line.replace(/^\s*\]+\s*/, ''))
        .join('\n')
        .trim();

    // Extrai tags separadas por vírgula ou linha, filtrando boilerplate da Golden String
    let effectiveStyleForTags = styleText;
    if (effectiveStyleForTags.includes("Studio Isolation,")) {
        effectiveStyleForTags = effectiveStyleForTags.split("Studio Isolation,")[1] || "";
    } else if (effectiveStyleForTags.includes("industry-standard production,")) {
        effectiveStyleForTags = effectiveStyleForTags.split("industry-standard production,")[1] || "";
    }

    const tags = effectiveStyleForTags
        ? effectiveStyleForTags
              .split(/[,;\n]+/)
              .map(t => t.trim().replace(/^[-*•]\s*/, ''))
              .filter(t => t.length > 1 && !t.startsWith('(') && !t.startsWith('['))
        : [];

    return { styleText, lyricsText, tags };
};

// --- OTHERS ---

export const remixStructure = async (currentPrompt: string, instruction: string, provider?: AIProvider): Promise<string> => {
    const settings = getSystemSettings();
    const prompt = settings.promptRemix
        .replace("[INSTRUÇÃO]", instruction)
        .replace("[PROMPT ORIGINAL]", currentPrompt);
    return await unifiedGenerate(prompt, provider);
};

export const adjustPromptLength = async (currentPrompt: string, min: number = 100, max: number = 3000, provider?: AIProvider): Promise<string> => {
    const settings = getSystemSettings();
    const prompt = settings.promptLength
        .replace("[MIN]", min.toString())
        .replace("[MAX]", max.toString())
        + `\n\nINPUT PROMPT:\n${currentPrompt}`;
    try { return await unifiedGenerate(prompt, provider); } catch (e) { return currentPrompt; }
};

export const compressFinalPrompt = async (currentPrompt: string, provider?: AIProvider): Promise<string> => {
    const settings = getSystemSettings();
    let prompt = settings.promptCompress;
    if (prompt.includes("[PROMPT ORIGINAL]")) {
        prompt = prompt.replace("[PROMPT ORIGINAL]", currentPrompt);
    } else if (prompt.includes("[INPUT_PROMPT]")) {
        prompt = prompt.replace("[INPUT_PROMPT]", currentPrompt);
    } else {
        prompt += `\n\n${currentPrompt}`;
    }
    try { return await unifiedGenerate(prompt, provider); } catch (e) { throw new Error("Falha ao comprimir."); }
};

export const generateStyleTags = async (fullPrompt: string, provider?: AIProvider): Promise<string> => {
    const settings = getSystemSettings();
    let prompt = settings.promptStyles || "";
    if (prompt.includes("[PROMPT COMPLETO]")) {
        prompt = prompt.replace("[PROMPT COMPLETO]", fullPrompt);
    } else if (prompt.includes("[INPUT_PROMPT]")) {
        prompt = prompt.replace("[INPUT_PROMPT]", fullPrompt);
    } else if (prompt.includes("[PROMPT]")) {
        prompt = prompt.replace("[PROMPT]", fullPrompt);
    } else {
        prompt += `\n\n# INPUT\n\n${fullPrompt}`;
    }
    
    console.log("[aiService] generateStyleTags iniciado com provedor:", provider);
    let result = await unifiedGenerate(prompt, provider);
    
    // Pós-processamento de limpeza para assegurar estrita aderência ao contrato:
    result = result.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/```$/gm, '').trim();
    result = result.replace(/^(Style Description|Final Style Description|Style|Music Style|Description|Prompt):\s*/i, '').trim();
    if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1).trim();
    }
    
    // Garantir limite absoluto de 979 caracteres do prompt mestre
    if (result.length > 979) {
        const truncated = result.slice(0, 979);
        const lastPunct = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf(';'), truncated.lastIndexOf(','));
        if (lastPunct > 500) {
            result = truncated.slice(0, lastPunct + (truncated[lastPunct] === '.' ? 1 : 0)).trim();
        } else {
            result = truncated.trim();
        }
    }
    
    console.log("[aiService] generateStyleTags concluído. Caracteres:", result.length);
    return result;
};

export const analyzeBriefing = async (briefing: string, provider?: AIProvider): Promise<any> => {
    const settings = getSystemSettings();
    let prompt = settings.promptAnalyze;
    if (prompt.includes("[RAW USER IDEA]")) {
        prompt = prompt.replace("[RAW USER IDEA]", briefing);
    } else if (prompt.includes("[BRIEF]")) {
        prompt = prompt.replace("[BRIEF]", briefing);
    } else {
        prompt += `\n\n${briefing}`;
    }
    try {
        const textRaw = await unifiedGenerate(prompt, provider);
        const jsonMatch = textRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        const result = JSON.parse(jsonMatch[0]);

        return {
            global: result.global || {},
            arsenal: {
                instruments: ensureArray(result.arsenal?.instrumentos),
                atmosphere: ensureArray(result.arsenal?.atmosfera),
                mastering: ensureArray(result.arsenal?.masterizacao),
                effects: ensureArray(result.arsenal?.efeitos),
                rhythm: ensureArray(result.arsenal?.ritmo),
                forceInstruments: result.arsenal?.apenasInstrumentosSelecionados || false,
                reverbLevel: result.arsenal?.reverbLevel || 50,
                isReverbActive: result.arsenal?.reverbLevel ? true : false
            },
            detailedInstructions: (result.detailedInstructions || []).map((i: any) => ({
                id: crypto.randomUUID(), section: i.section || "Global", instruction: i.instruction || ""
            }))
        };
    } catch (e) { return { global: {}, arsenal: {}, detailedInstructions: [] }; }
};

export const fetchArtistSongs = async (artistName: string, provider?: AIProvider): Promise<string[]> => {
    const prompt = `List 5 iconic songs by "${artistName}". JSON array of strings only.`;
    try {
        const textRaw = await unifiedGenerate(prompt, provider);
        const text = textRaw?.replace(/```json|```/g, '').trim() || "[]";
        return JSON.parse(text);
    } catch (e) { return []; }
};

// FIX: Aceitar e usar os estilos do projeto para evitar alucinações de gênero
export const generateByArtistFlow = async (artistName: string, styles: string[] = [], topic: string, provider?: AIProvider) => {
    const settings = getSystemSettings();
    const styleContext = styles.length > 0 ? styles.join(", ") : "Livre";

    const prompt = settings.promptLyrics
        .replace("[IDIOMA]", "Português (Brasil)")
        .replace("[TÍTULO DA MÚSICA]", topic)
        .replace("[SENTIMENTO]", `Estilo de ${artistName}`)
        + `\n\nCONTEXTO: Inspire-se na escrita de ${artistName}.`
        + `\n\nIMPORTANTE - GÊNERO MUSICAL: ${styleContext} (Mantenha o vocabulário e o tema estritamente dentro deste gênero. Ex: Se for Gospel, mantenha religioso. Se for Rap, mantenha urbano).`;

    return { generatedLyrics: await unifiedGenerate(prompt, provider) };
};



export const analyzeArtistDNA = async (artistName: string, provider: AIProvider = AIProvider.GOOGLE): Promise<any> => {
    const settings = getSystemSettings();
    const system = settings.promptForensic.split('\n')[0]; // Extract first line as role
    const prompt = settings.promptForensic.replace("[ARTIST_NAME]", artistName);

    let lastRawText = "";

    const runAnalysis = async (p: string) => {
        try {
            const sysInstruction = "You are a Musicological Technical Analyst. Return ONLY JSON without any formatting.";
            const textRaw = await unifiedGenerate(p, provider, sysInstruction);

            lastRawText = textRaw;
            // Clear markdown code blocks if present
            const cleanedText = textRaw.replace(/```json|```/g, '').trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                lastRawText = "NO JSON DETECTED. RAW: " + textRaw;
                return null;
            }
            try {
                // Remove trailing commas which often break JSON.parse
                const strictJson = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
                return JSON.parse(strictJson);
            } catch (e: any) {
                lastRawText = "JSON PARSE FAILED: " + e.message + " | RAW: " + jsonMatch[0].substring(0, 150) + "...";
                return null;
            }
        } catch (e: any) {
            lastRawText = "API ERROR: " + e.message;
            return null;
        }
    };

    let result = await runAnalysis(prompt);

    // Fallback strategy if blocked or invalid JSON
    if (!result) {
        console.warn("Retrying DNA analysis with simplified prompt for:", artistName);
        const fallbackPrompt = `Extract technical musical parameters for: ${artistName}. 
        Return JSON with keys: forensicBreakdown (text), goldenPrompt (technical descriptors in English), styleTags (array), sentiment (one of: Happy, Sad, Aggressive, Calm, Romantic, Epic, Melancholic), arsenal (object with instruments, ritmo, atmosfera, efeitos), vocalDnaInstruction (text).`;
        result = await runAnalysis(fallbackPrompt);
    }

    if (!result) {
        throw new Error(`FALHA NA DECODIFICAÇÃO. DETALHE: ${lastRawText}`);
    }

    return result;
};

export const translateBlogPost = async (content: any, targetLang: 'en' | 'es' | 'pt', provider?: AIProvider): Promise<any> => {
    const prompt = `Translate to ${targetLang === 'en' ? 'English' : targetLang === 'es' ? 'Spanish' : 'Portuguese'}. JSON structure: ${JSON.stringify(content)}`;
    try {
        const textRaw = await unifiedGenerate(prompt, provider);
        const text = textRaw?.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (e) { throw new Error("Translation failed"); }
};


