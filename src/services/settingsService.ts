
import { SystemSettings, DEFAULT_SETTINGS } from "../types";

const LOCAL_SETTINGS_KEY = 'iaplay_system_settings';

// Cache em memória
let cachedSettings: SystemSettings = { ...DEFAULT_SETTINGS };
let isLoaded = false;
export let isSettingsLoadedFromServer = false;

const mergeList = (savedList: string[] | undefined, defaultList: string[]): string[] => {
    if (!savedList || !Array.isArray(savedList) || savedList.length === 0) return defaultList;
    const set = new Set(savedList);
    for (const item of defaultList) {
        set.add(item);
    }
    return Array.from(set);
};

const loadLocalSettings = (): SystemSettings => {
    try {
        const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                listInstruments: mergeList(parsed.listInstruments, DEFAULT_SETTINGS.listInstruments),
                listSentiments: mergeList(parsed.listSentiments, DEFAULT_SETTINGS.listSentiments),
                listStyles: mergeList(parsed.listStyles, DEFAULT_SETTINGS.listStyles),
                promptLyrics: (parsed.promptLyrics && parsed.promptLyrics.includes("CHAOS THEORY")) 
                    ? parsed.promptLyrics 
                    : DEFAULT_SETTINGS.promptLyrics,
                promptInstrumental: parsed.promptInstrumental || DEFAULT_SETTINGS.promptInstrumental,
                promptStructure: (parsed.promptStructure && parsed.promptStructure.includes("DYNAMIC STYLE ADAPTATION")) 
                    ? parsed.promptStructure 
                    : DEFAULT_SETTINGS.promptStructure,
                promptRemix: parsed.promptRemix || DEFAULT_SETTINGS.promptRemix,
                promptLength: parsed.promptLength || DEFAULT_SETTINGS.promptLength,
                promptStyles: (parsed.promptStyles && parsed.promptStyles.includes("STYLE DESCRIPTION ARCHITECT")) 
                    ? parsed.promptStyles 
                    : DEFAULT_SETTINGS.promptStyles,
                promptAnalyze: parsed.promptAnalyze || DEFAULT_SETTINGS.promptAnalyze,
                promptCompress: parsed.promptCompress || DEFAULT_SETTINGS.promptCompress,
                promptForensic: parsed.promptForensic || DEFAULT_SETTINGS.promptForensic,
                promptScore: parsed.promptScore || DEFAULT_SETTINGS.promptScore,
                blogPosts: (parsed.blogPosts && parsed.blogPosts.length > 0 && parsed.blogPosts.some((p: any) => p.id === 'post-atualizacao-v3-5-0-gerador-yue2-multilingue-correcoes'))
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

    try {
        const res = await fetch(`api/settings.php?t=${Date.now()}`, {
            credentials: 'same-origin'
        });

        if (res.ok) {
            let text = await res.text();
            let cleanText = text.trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace >= 0 && lastBrace >= firstBrace) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            if (cleanText && cleanText.startsWith('{')) {
                let remoteData = JSON.parse(cleanText);

                if (remoteData && remoteData.encrypted_payload) {
                    const binaryString = atob(remoteData.encrypted_payload);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    const decodedStr = new TextDecoder().decode(bytes);
                    remoteData = JSON.parse(decodedStr);
                }

                if (remoteData && Object.keys(remoteData).length > 0) {
                    cachedSettings = {
                        ...cachedSettings,
                        ...remoteData
                    };
                    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(cachedSettings));
                    isSettingsLoadedFromServer = true;
                }
            }
        }
    } catch (e) {
        // Silencia erro em modo local Pinokio / offline
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

    // Tenta sincronizar com API caso exista
    try {
        const jsonStr = JSON.stringify(settings);
        const encodedPayload = btoa(unescape(encodeURIComponent(jsonStr)));

        await fetch('api/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ payload: encodedPayload })
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

