
import { SystemSettings, DEFAULT_SETTINGS } from "../types";

const LOCAL_SETTINGS_KEY = 'iaplay_system_settings';

// Cache em memória
let cachedSettings: SystemSettings = { ...DEFAULT_SETTINGS };
let isLoaded = false;
export let isSettingsLoadedFromServer = false;

const loadLocalSettings = (): SystemSettings => {
    try {
        const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Garante que se a lista de estilos guardada for a antiga curta (sem Sertanejo), atualiza com os estilos brasileiros
            const hasBrazilianStyles = parsed.listStyles && parsed.listStyles.some((s: string) => s.includes('Sertanejo') || s.includes('Forró'));
            const listStyles = hasBrazilianStyles ? parsed.listStyles : DEFAULT_SETTINGS.listStyles;

            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                listInstruments: parsed.listInstruments && parsed.listInstruments.length >= DEFAULT_SETTINGS.listInstruments.length 
                    ? parsed.listInstruments 
                    : DEFAULT_SETTINGS.listInstruments,
                listSentiments: parsed.listSentiments || DEFAULT_SETTINGS.listSentiments,
                listStyles: listStyles,
                                promptLyrics: (parsed.promptLyrics && parsed.promptLyrics.includes("ELITE HUMAN SONGWRITER")) 
                    ? parsed.promptLyrics 
                    : DEFAULT_SETTINGS.promptLyrics,
                promptInstrumental: parsed.promptInstrumental || DEFAULT_SETTINGS.promptInstrumental,
                promptOptimize: (parsed.promptOptimize && parsed.promptOptimize.includes("ELITE RHYTHM DOCTOR"))
                    ? parsed.promptOptimize
                    : DEFAULT_SETTINGS.promptOptimize,
                promptStructure: (parsed.promptStructure && parsed.promptStructure.includes("IMMUTABLE-LYRICS FORMATTER")) 
                    ? parsed.promptStructure 
                    : DEFAULT_SETTINGS.promptStructure,
                promptRemix: parsed.promptRemix || DEFAULT_SETTINGS.promptRemix,
                promptLength: parsed.promptLength || DEFAULT_SETTINGS.promptLength,
                promptStyles: (parsed.promptStyles && parsed.promptStyles.includes("MASTER SONIC STYLE ARCHITECT")) 
                    ? parsed.promptStyles 
                    : DEFAULT_SETTINGS.promptStyles,
                promptAnalyze: (parsed.promptAnalyze && parsed.promptAnalyze.includes("MASTER A&R"))
                    ? parsed.promptAnalyze
                    : DEFAULT_SETTINGS.promptAnalyze,
                promptCompress: (parsed.promptCompress && parsed.promptCompress.includes("MASTER LOSSLESS AUDIO PROMPT COMPRESSOR"))
                    ? parsed.promptCompress
                    : DEFAULT_SETTINGS.promptCompress,
                promptForensic: (parsed.promptForensic && parsed.promptForensic.includes("MASTER SONIC DNA FORENSIC ARCHITECT"))
                    ? parsed.promptForensic
                    : DEFAULT_SETTINGS.promptForensic,
                promptScore: (parsed.promptScore && parsed.promptScore.includes("MASTER MUSIC THEORY ANALYST"))
                    ? parsed.promptScore
                    : DEFAULT_SETTINGS.promptScore,
                blogPosts: (parsed.blogPosts && parsed.blogPosts.length > 0)
                    ? parsed.blogPosts
                    : DEFAULT_SETTINGS.blogPosts,
                showcaseItems: (parsed.showcaseItems && parsed.showcaseItems.length > 0)
                    ? parsed.showcaseItems
                    : DEFAULT_SETTINGS.showcaseItems,
            };
        }
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
};

export const initSettings = async (): Promise<SystemSettings> => {
    cachedSettings = loadLocalSettings();

    // Tenta sincronizar com a API local do servidor Python (42024) ou o arquivo settings.json estático
    try {
        let res: Response | null = null;
        try {
            res = await fetch(`http://127.0.0.1:42024/api/v1/settings?t=${Date.now()}`);
        } catch (_) {
            res = await fetch(`/settings.json?t=${Date.now()}`);
        }

        if (res && res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                cachedSettings = {
                    ...cachedSettings,
                    ...data
                };
                localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(cachedSettings));
                isSettingsLoadedFromServer = true;
            }
        }
    } catch (e) {
        // Fallback transparente para o modo local
    }

    (window as any).__systemSettings = cachedSettings;
    isLoaded = true;
    return cachedSettings;
};

export const getSystemSettings = (): SystemSettings => {
    if (!isLoaded) {
        cachedSettings = loadLocalSettings();
    }
    return cachedSettings;
};

export const saveSystemSettings = async (settings: SystemSettings) => {
    cachedSettings = settings;
    try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}

    (window as any).__systemSettings = cachedSettings;

    // Persiste no backend Python para salvar no disco public/settings.json
    try {
        await fetch('http://127.0.0.1:42024/api/v1/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    } catch (e) {}
};

export const resetSystemSettings = () => {
    cachedSettings = { ...DEFAULT_SETTINGS };
    try {
        localStorage.removeItem(LOCAL_SETTINGS_KEY);
    } catch (e) {}
    return cachedSettings;
};

