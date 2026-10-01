export interface OllamaModelInfo {
    name: string;
    size?: string;
    parameterSize?: string;
    family?: string;
}

export const POPULAR_OLLAMA_MODELS = [
    { name: "gemma2:9b", desc: "Google Gemma 2 9B (Ultra Criativo para Letras e Rimas)" },
    { name: "llama3.2", desc: "Meta Llama 3.2 (3B - Leve, Rápido e Excelente para Qualquer PC)" },
    { name: "deepseek-r1:8b", desc: "DeepSeek R1 8B (Raciocínio Avançado e Métricas)" },
    { name: "deepseek-r1:1.5b", desc: "DeepSeek R1 1.5B (Ultra-Leve para PCs mais modestos)" },
    { name: "qwen2.5:7b", desc: "Qwen 2.5 7B (Excelente em Português e Rimas Musicais)" },
    { name: "mistral:7b", desc: "Mistral 7B (Ótimo para Poesia, Harmonia e Letras)" },
    { name: "phi3:mini", desc: "Microsoft Phi-3 Mini (3.8B - Muito Rápido)" }
];

let _isOllamaOnlineCached: boolean = false;
try {
    _isOllamaOnlineCached = localStorage.getItem('iaplay_ollama_online') === 'true';
} catch (e) { }

export const setIsOllamaOnlineCached = (status: boolean) => {
    _isOllamaOnlineCached = status;
    try {
        localStorage.setItem('iaplay_ollama_online', String(status));
    } catch (e) { }
};

export const getIsOllamaOnlineSync = (): boolean => {
    return _isOllamaOnlineCached;
};

export const getOllamaEndpoint = (): string => {
    try {
        const stored = localStorage.getItem('iaplay_session');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.ollamaUrl && parsed.ollamaUrl.trim()) {
                return parsed.ollamaUrl.trim().replace(/\/+$/, '');
            }
        }
    } catch (e) { }
    return 'http://127.0.0.1:11434';
};

export const getOllamaCandidateEndpoints = (preferred?: string): string[] => {
    const candidates: string[] = [];
    const base = (preferred || getOllamaEndpoint()).replace(/\/+$/, '');

    // 1. Prioriza proxy local do Vite (evita 100% de bloqueios CORS e falhas IPv6 no Windows)
    if (typeof window !== 'undefined' && (!preferred || preferred.includes('localhost') || preferred.includes('127.0.0.1'))) {
        candidates.push('/api/ollama');
    }

    // 2. Endpoint local do servidor Python do IAPLAY (porta 42024 - com auto-start e relay resiliente)
    if (typeof window !== 'undefined') {
        candidates.push('http://127.0.0.1:42024/api/v1/ollama');
    }

    // 3. Adiciona o endpoint base preferencial e variações de IP
    if (base && !base.startsWith('/')) {
        candidates.push(base);
        if (base.includes('localhost')) {
            candidates.push(base.replace('localhost', '127.0.0.1'));
        } else if (base.includes('127.0.0.1')) {
            candidates.push(base.replace('127.0.0.1', 'localhost'));
        }
    } else {
        candidates.push('http://127.0.0.1:11434');
        candidates.push('http://localhost:11434');
    }

    return Array.from(new Set(candidates));
};

/**
 * Tenta iniciar o daemon do Ollama no PC através do backend Python do IAPLAY.
 */
export const startOllamaViaServer = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('http://127.0.0.1:42024/api/v1/ollama/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            return data.status === 'online' || data.status === 'starting';
        }
    } catch (e) { }
    return false;
};

/**
 * Consulta a API local do Ollama e retorna todos os modelos instalados/baixados.
 */
export const fetchInstalledOllamaModels = async (customEndpoint?: string, autoWake = true): Promise<OllamaModelInfo[]> => {
    const candidates = getOllamaCandidateEndpoints(customEndpoint);
    
    const queryCandidates = async (): Promise<OllamaModelInfo[]> => {
        for (const endpoint of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const res = await fetch(`${endpoint}/api/tags`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) continue;

                const data = await res.json();
                if (data && Array.isArray(data.models)) {
                    setIsOllamaOnlineCached(true);
                    return data.models.map((m: any) => {
                        const sizeMb = m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : '';
                        return {
                            name: m.name || m.model,
                            size: sizeMb,
                            parameterSize: m.details?.parameter_size || '',
                            family: m.details?.family || ''
                        };
                    });
                }
            } catch (e) {
                // Tenta próximo endpoint candidato
            }
        }
        return [];
    };

    let models = await queryCandidates();
    if (models.length === 0 && autoWake) {
        // Tenta acordar o Ollama se estiver dormindo
        const waking = await startOllamaViaServer();
        if (waking) {
            await new Promise(r => setTimeout(r, 1500));
            models = await queryCandidates();
        }
    }

    if (models.length > 0) {
        setIsOllamaOnlineCached(true);
    } else {
        setIsOllamaOnlineCached(false);
    }

    return models;
};

/**
 * Verifica se o Ollama está online e respondendo.
 */
export const checkOllamaStatus = async (customEndpoint?: string, autoWake = false): Promise<boolean> => {
    const candidates = getOllamaCandidateEndpoints(customEndpoint);
    for (const endpoint of candidates) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                setIsOllamaOnlineCached(true);
                return true;
            }
        } catch (e) {
            // Tenta próximo endpoint candidato
        }
    }

    if (autoWake) {
        const woke = await startOllamaViaServer();
        if (woke) {
            await new Promise(r => setTimeout(r, 1500));
            return checkOllamaStatus(customEndpoint, false);
        }
    }

    setIsOllamaOnlineCached(false);
    return false;
};
