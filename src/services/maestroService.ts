/**
 * Maestro & YuE2 Music Generation Service
 * Integração direta com o motor neural YuE2 3B e Maestro.
 * Suporta geração neural, monitoramento de progresso, download direto de modelos e download de áudios WAV.
 */

export interface YuEGenerationOptions {
    lyrics: string;
    style: string;
    durationSeconds?: number;
    modelMode?: number; // 2: Direct (Recomendado), 0: Melody & Chords, 1: Melody only
    numInferenceSteps?: number; // 32 (Padrão)
    guidanceScale?: number; // 1.0
    seed?: number;
    abc?: string; // Partitura / Cifra opcional
    humanize?: boolean; // Remover digitais de IA e aplicar masterização analógica
    audioGuide?: string; // Arquivo ou caminho de áudio para Cover / Transcrição
    audioPromptType?: string; // "A" para extração de harmonia/melodia com SheetSage2
}

export interface YuEJobProgress {
    jobId: string;
    status: 'queued' | 'held' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';
    progress: number; // 0.0 a 1.0
    step: number;
    totalSteps: number;
    phase: string;
    message: string;
    outputFiles: string[];
    error?: string | null;
}

export interface MaestroStatus {
    online: boolean;
    endpoint: string;
    activeJobsCount: number;
    message?: string;
    modelsInstalled?: boolean;
    modelsProgress?: number;
    gpu?: string;
    device?: string;
    isLoadingPipeline?: boolean;
    pipelineLoadingPhase?: string;
    ollamaOnline?: boolean;
    ollamaInstalled?: boolean;
}

export interface ModelDownloadState {
    status: 'idle' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    current_file: string;
    downloaded_files: number;
    total_files: number;
    bytes_downloaded: number;
    total_bytes: number;
    progress: number;
    speed: string;
    error?: string | null;
}

export interface ModelStatusInfo {
    installed: boolean;
    total_files: number;
    installed_count: number;
    missing_files: Array<{ path: string; expected_size: number }>;
    installed_files: Array<{ path: string; location: string; size: number }>;
    total_size_bytes: number;
    installed_size_bytes: number;
    progress: number;
    ckpts_dir?: string;
    download?: ModelDownloadState;
}

const DEFAULT_MAESTRO_PORT = 42024;
const CANDIDATE_PORTS = [42024, 42003, 7860, 42000, 42001, 42002, 42004, 42005, 8000, 8080];

/**
 * Retorna o endpoint configurado ou armazenado do Maestro / YuE2.
 */
export const getMaestroEndpoint = (): string => {
    try {
        const stored = localStorage.getItem('iaplay_maestro_url');
        if (stored && stored.trim()) {
            return stored.trim().replace(/\/+$/, '');
        }

        const session = localStorage.getItem('iaplay_session');
        if (session) {
            const parsed = JSON.parse(session);
            if (parsed.maestroUrl && parsed.maestroUrl.trim()) {
                return parsed.maestroUrl.trim().replace(/\/+$/, '');
            }
        }
    } catch (e) { }

    return `http://127.0.0.1:${DEFAULT_MAESTRO_PORT}`;
};

/**
 * Salva o endpoint preferido no localStorage.
 */
export const saveMaestroEndpoint = (endpoint: string): void => {
    try {
        const cleaned = endpoint.trim().replace(/\/+$/, '');
        localStorage.setItem('iaplay_maestro_url', cleaned);
    } catch (e) { }
};

/**
 * Testa se um endpoint específico do motor está respondendo.
 */
export const probeEndpoint = async (url: string, timeoutMs = 1500): Promise<boolean> => {
    const cleanUrl = url.replace(/\/+$/, '');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`${cleanUrl}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        return false;
    }
};

/**
 * Detecta automaticamente em qual porta o motor YuE2 / Maestro está executando.
 */
export const detectMaestroEndpoint = async (): Promise<{ ok: boolean; endpoint: string }> => {
    const current = getMaestroEndpoint();
    if (await probeEndpoint(current, 1500)) {
        return { ok: true, endpoint: current };
    }

    for (const port of CANDIDATE_PORTS) {
        const candidate = `http://127.0.0.1:${port}`;
        if (candidate === current) continue;

        if (await probeEndpoint(candidate, 800)) {
            saveMaestroEndpoint(candidate);
            return { ok: true, endpoint: candidate };
        }
    }

    return { ok: false, endpoint: current };
};

/**
 * Verifica o status de saúde, conectividade e presença dos modelos.
 */
export const checkMaestroStatus = async (customEndpoint?: string): Promise<MaestroStatus> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${endpoint}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            return {
                online: true,
                endpoint,
                activeJobsCount: 0,
                modelsInstalled: data.models_installed ?? true,
                modelsProgress: data.models_progress ?? 1.0,
                gpu: data.gpu || 'GPU Ativa',
                device: data.device || 'cuda',
                isLoadingPipeline: data.is_loading_pipeline ?? false,
                pipelineLoadingPhase: data.pipeline_loading_phase || '',
                ollamaOnline: data.ollama_online ?? false,
                ollamaInstalled: data.ollama_installed ?? false,
                message: data.models_installed
                    ? `Motor YuE2 Conectado (${data.gpu || 'GPU Ativa'})`
                    : `Motor YuE2 Conectado (Modelos pendentes de download)`
            };
        }
    } catch (e) { }

    return {
        online: false,
        endpoint,
        activeJobsCount: 0,
        modelsInstalled: false,
        modelsProgress: 0,
        message: `Não foi possível conectar ao motor YuE2 em ${endpoint}. Inicie o IAPLAY via Pinokio.`
    };
};

/**
 * Verifica o status dos modelos YuE2 no servidor.
 */
export const fetchModelStatus = async (customEndpoint?: string): Promise<ModelStatusInfo> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    const res = await fetch(`${endpoint}/api/v1/models/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
        throw new Error(`Falha ao verificar status dos modelos: HTTP ${res.status}`);
    }
    return await res.json();
};

/**
 * Inicia o download direto dos modelos neurais YuE2 pelo IAPLAY.
 */
export const startModelDownload = async (customEndpoint?: string): Promise<{ status: string; message: string }> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    const res = await fetch(`${endpoint}/api/v1/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        throw new Error(`Falha ao iniciar download de modelos: HTTP ${res.status}`);
    }
    return await res.json();
};

/**
 * Consulta o progresso do download dos modelos neurais.
 */
export const fetchModelDownloadProgress = async (customEndpoint?: string): Promise<ModelDownloadState> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    const res = await fetch(`${endpoint}/api/v1/models/download/progress`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
        throw new Error(`Falha ao consultar progresso de download: HTTP ${res.status}`);
    }
    return await res.json();
};

/**
 * Cancela o download dos modelos neurais em andamento.
 */
export const cancelModelDownload = async (customEndpoint?: string): Promise<boolean> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    try {
        const res = await fetch(`${endpoint}/api/v1/models/download/cancel`, {
            method: 'POST'
        });
        return res.ok;
    } catch (e) {
        return false;
    }
};

/**
 * Submete uma requisição de geração de música ao YuE2.
 */
export const generateMusicWithYuE2 = async (
    options: YuEGenerationOptions,
    customEndpoint?: string
): Promise<{ jobId: string; status: string; endpoint: string }> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');

    // Se o seed não for informado, gera um seed aleatório de 8 dígitos
    const seed = (options.seed && options.seed > 0)
        ? options.seed
        : Math.floor(Math.random() * 900000000) + 10000000;

    const payload = {
        model_type: "yue2",
        generation_mode: "audio",
        prompt: options.lyrics.trim(),
        alt_prompt: options.style.trim(),
        duration_seconds: options.durationSeconds || 120,
        model_mode: options.modelMode !== undefined ? options.modelMode : 2,
        num_inference_steps: options.numInferenceSteps || 32,
        guidance_scale: options.guidanceScale || 1.0,
        seed: seed,
        humanize: options.humanize !== false,
        audio_guide: options.audioGuide || undefined,
        audio_prompt_type: options.audioPromptType || (options.audioGuide && options.modelMode !== 2 ? "A" : ""),
        custom_settings: {
            abc: options.abc ? options.abc.trim() : ""
        }
    };

    const res = await fetch(`${endpoint}/api/v1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Erro HTTP ${res.status}` }));
        throw new Error(err.detail || err.message || `Falha ao iniciar geração no YuE2 (${res.status})`);
    }

    const data = await res.json();
    return {
        jobId: data.job_id,
        status: data.status || 'queued',
        endpoint
    };
};

/**
 * Consulta a lista de jobs no YuE2 e extrai o status de um job específico.
 */
export const fetchJobProgress = async (
    jobId: string,
    customEndpoint?: string
): Promise<YuEJobProgress> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');

    const res = await fetch(`${endpoint}/api/v1/jobs`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
        throw new Error(`Falha ao consultar fila de tarefas no YuE2 (${res.status})`);
    }

    const data = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const job = jobs.find((j: any) => j.job_id === jobId || j.id === jobId);

    if (!job) {
        return {
            jobId,
            status: 'completed',
            progress: 1.0,
            step: 32,
            totalSteps: 32,
            phase: 'Finalizado',
            message: 'Música gerada com sucesso!',
            outputFiles: []
        };
    }

    return {
        jobId: job.job_id || job.id,
        status: job.status || 'unknown',
        progress: typeof job.progress === 'number' ? job.progress : 0,
        step: job.step || 0,
        totalSteps: job.total_steps || 32,
        phase: job.phase || '',
        message: job.message || '',
        outputFiles: Array.isArray(job.output_files) ? job.output_files : [],
        error: job.error || null
    };
};

/**
 * Cancela um job em execução no YuE2.
 */
export const cancelYuEJob = async (
    jobId: string,
    customEndpoint?: string
): Promise<boolean> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    try {
        const res = await fetch(`${endpoint}/api/v1/cancel/${encodeURIComponent(jobId)}`, {
            method: 'POST'
        });
        return res.ok;
    } catch (e) {
        return false;
    }
};

/**
 * Gera a URL para streaming de um arquivo de áudio gerado.
 */
export const getAudioFileUrl = (
    filename: string,
    customEndpoint?: string
): string => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    return `${endpoint}/api/v1/file/${encodeURIComponent(filename)}?workspace=default`;
};

/**
 * Gera a URL para download direto com cabeçalho de anexo.
 */
export const getAudioDownloadUrl = (
    filename: string,
    customEndpoint?: string
): string => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    return `${endpoint}/api/v1/download/${encodeURIComponent(filename)}`;
};

/**
 * Baixa diretamente o arquivo de áudio no navegador via Blob garantindo download no disco.
 */
export const downloadAudioFileDirectly = async (
    urlOrFilename: string,
    suggestedFilename?: string
): Promise<void> => {
    try {
        let fullUrl = urlOrFilename;
        let baseFilename = suggestedFilename || 'musica-iaplay.wav';

        if (!urlOrFilename.startsWith('http://') && !urlOrFilename.startsWith('https://')) {
            fullUrl = getAudioDownloadUrl(urlOrFilename);
            if (!suggestedFilename) {
                baseFilename = urlOrFilename;
            }
        }

        const res = await fetch(fullUrl);
        if (!res.ok) {
            throw new Error(`Falha HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = baseFilename.endsWith('.wav') ? baseFilename : `${baseFilename}.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (err) {
        console.warn("Falha no download via Blob, usando fallback direto:", err);
        const a = document.createElement('a');
        a.href = urlOrFilename;
        a.target = '_blank';
        a.download = suggestedFilename || 'musica-iaplay.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

/**
 * Lista as músicas geradas mais recentes no IAPLAY.
 */
export const fetchRecentOutputs = async (
    limit = 20,
    customEndpoint?: string
): Promise<Array<{ name: string; url: string; downloadUrl: string; size: number; createdAt: number }>> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    try {
        const res = await fetch(`${endpoint}/api/v1/outputs?limit=${limit}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return [];

        const data = await res.json();
        const outputs = Array.isArray(data.outputs) ? data.outputs : [];
        return outputs.map((o: any) => ({
            name: o.name,
            url: o.url.startsWith('http') ? o.url : `${endpoint}${o.url}`,
            downloadUrl: o.download_url ? `${endpoint}${o.download_url}` : `${endpoint}/api/v1/download/${encodeURIComponent(o.name)}`,
            size: o.size || 0,
            createdAt: o.created_at || Date.now()
        }));
    } catch (e) {
        return [];
    }
};

/**
 * Remove digitais de IA e aplica masterização analógica a um arquivo de áudio sob demanda.
 */
export const humanizeAudioFile = async (
    filename: string,
    options?: Record<string, any>,
    customEndpoint?: string
): Promise<{ ok: boolean; original_file: string; humanized_file: string; url: string; download_url: string; details: any }> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    const res = await fetch(`${endpoint}/api/v1/humanize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, options })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Erro HTTP ${res.status}` }));
        throw new Error(err.detail || err.message || `Falha ao humanizar áudio (${res.status})`);
    }

    const data = await res.json();
    return {
        ...data,
        url: data.url.startsWith('http') ? data.url : `${endpoint}${data.url}`,
        download_url: data.download_url.startsWith('http') ? data.download_url : `${endpoint}${data.download_url}`
    };
};

/**
 * Envia um arquivo de áudio de referência para cover e transcrição harmônica com SheetSage2.
 */
export const uploadAudioForCover = async (
    file: File,
    customEndpoint?: string
): Promise<{ ok: boolean; filename: string; original_name: string; filepath: string; url: string; size: number }> => {
    const endpoint = (customEndpoint || getMaestroEndpoint()).replace(/\/+$/, '');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${endpoint}/api/v1/upload_audio`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Erro HTTP ${res.status}` }));
        throw new Error(err.detail || err.message || `Falha ao enviar áudio de referência (${res.status})`);
    }

    const data = await res.json();
    return {
        ...data,
        url: data.url.startsWith('http') ? data.url : `${endpoint}${data.url}`
    };
};

