import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanTier, SubscriptionStatus } from '../types';
import { apiClient } from '../services/apiClient';
import { generateUUID } from '../utils/uuid';

export const DEFAULT_LOCAL_USER: User = {
    id: 'local-creator',
    name: 'Produtor Musical',
    email: 'produtor@iaplay.local',
    plan: PlanTier.ADMIN,
    credits: 999999,
    isVerified: true,
    isBlocked: false,
    subscriptionStatus: 'active',
    googleApiKey: '',
    openaiApiKey: '',
    groqApiKey: '',
    cerebrasApiKey: '',
    openrouterApiKey: '',
    nvidiaApiKey: '',
    mistralApiKey: '',
    togetherApiKey: '',
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'llama3.2',
    maestroUrl: 'http://127.0.0.1:42003',
    creativeContext: ''
};

interface AuthContextType {
    user: User | null;
    tempEmail: string | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    verifyEmail: (code: string) => Promise<void>;
    logout: () => void;
    startTrial: () => Promise<void>;
    updateApiKeys: (keys: { google?: string; openai?: string; groq?: string; cerebras?: string; openrouter?: string; nvidia?: string; nvidiaModel?: string; mistral?: string; together?: string; ollamaUrl?: string; ollamaModel?: string; maestroUrl?: string }) => void;
    cancelSubscription: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

/** Maps raw PHP API response data to a typed User object. */
const rawDataToUser = (data: any): User => ({
    id: data.id || DEFAULT_LOCAL_USER.id,
    name: data.name || DEFAULT_LOCAL_USER.name,
    email: data.email || DEFAULT_LOCAL_USER.email,
    plan: PlanTier.ADMIN,
    credits: 999999,
    isVerified: true,
    isBlocked: false,
    subscriptionStatus: 'active',
    trialEndsAt: undefined,
    currentPeriodEnd: undefined,
    googleApiKey: data.googleApiKey || data.google_api_key || '',
    openaiApiKey: data.openaiApiKey || data.openai_api_key || '',
    groqApiKey: data.groqApiKey || data.groq_api_key || '',
    cerebrasApiKey: data.cerebrasApiKey || data.cerebras_api_key || '',
    openrouterApiKey: data.openrouterApiKey || data.openrouter_api_key || '',
    nvidiaApiKey: data.nvidiaApiKey || data.nvidia_api_key || '',
    mistralApiKey: data.mistralApiKey || data.mistral_api_key || '',
    togetherApiKey: data.togetherApiKey || data.together_api_key || '',
    ollamaUrl: data.ollamaUrl || data.ollama_url || 'http://127.0.0.1:11434',
    ollamaModel: data.ollamaModel || data.ollama_model || 'llama3.2',
    maestroUrl: data.maestroUrl || data.maestro_url || 'http://127.0.0.1:42003',
    creativeContext: data.creativeContext || data.creative_context || '',
    stripePriceId: ''
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(() => {
        const stored = localStorage.getItem('iaplay_session');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_LOCAL_USER, ...parsed, plan: PlanTier.ADMIN };
            } catch (e) { }
        }
        return DEFAULT_LOCAL_USER;
    });
    const [tempEmail, setTempEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Garante que o usuário local esteja persistido com privilégios completos
        const stored = localStorage.getItem('iaplay_session');
        if (!stored) {
            localStorage.setItem('iaplay_session', JSON.stringify(DEFAULT_LOCAL_USER));
        }
    }, []);

    const saveSession = (u: User) => {
        setUser(u);
        localStorage.setItem('iaplay_session', JSON.stringify(u));
    };

    const login = async (email: string, pass: string) => {
        try {
            const res = await apiClient.post<any>('/api/auth.php?action=login', { email, password: pass });
            if (res.error) throw new Error(res.error);
            const userSession = rawDataToUser(res.data);
            if (userSession.isBlocked) throw new Error("Esta conta foi suspensa.");
            saveSession(userSession);
        } catch (error: any) {
            if (error.message?.includes("verificado")) {
                setTempEmail(email);
            }
            console.error("Login Error:", error.message);
            throw error;
        }
    };

    const register = async (
        name: string,
        email: string,
        pass: string,
        cpf?: string,
        cep?: string,
        address?: string,
        city?: string,
        state?: string
    ) => {
        try {
            // Anti-Fraud Device Fingerprint Generation
            const device_fingerprint = btoa(navigator.userAgent + window.screen.width + window.screen.height).substring(0, 32);

            const res = await apiClient.post<any>('/api/auth.php?action=register', {
                id: generateUUID(),
                name,
                email,
                password: pass,
                cpf,
                cep,
                address,
                city,
                state,
                device_fingerprint
            });
            if (res.error) throw new Error(res.error);

            setTempEmail(email);
        } catch (error) {
            console.error("Register Error:", error);
            throw error;
        }
    };

    const verifyEmail = async (code: string) => {
        if (!tempEmail) throw new Error("Email desconhecido.");

        try {
            const res = await apiClient.post<any>('/api/auth.php?action=verify', { email: tempEmail, code });
            if (res.error) throw new Error(res.error);
            saveSession(rawDataToUser(res.data));
            setTempEmail(null);
        } catch (error: any) {
            console.error("Verify Email Error:", error.message);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('iaplay_session');
        // Opcional: chamar logout no backend para destruir a sessão PHP
        apiClient.get('/api/auth.php?action=logout').catch(() => { });
        window.location.hash = "/login";
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const res = await apiClient.post<any>('/api/auth.php?action=get_user', { id: user.id });
            if (res.data && !res.error) {
                saveSession(rawDataToUser(res.data));
            }
        } catch (e) {
            // Silencioso em modo local Pinokio / offline
        }
    };

    const startTrial = async () => { };

    const upgradePlan = async (_plan: PlanTier, _duration: 'monthly' | 'yearly', _sessionId?: string) => {
        if (!user) return;
        await refreshProfile();
    };

    const cancelSubscription = async () => {
        if (!user) return;
        try {
            const res = await apiClient.post('/api/stripe_cancel.php', { user_id: user.id });
            if (res.error) throw new Error(res.error);
            await refreshProfile();
        } catch (e) {
            const updated = { ...user, subscriptionStatus: 'canceled' as SubscriptionStatus };
            saveSession(updated);
        }
    };

    const updateApiKeys = (keys: { google?: string; openai?: string; groq?: string; cerebras?: string; openrouter?: string; nvidia?: string; nvidiaModel?: string; mistral?: string; together?: string; ollamaUrl?: string; ollamaModel?: string; maestroUrl?: string }) => {
        const currentUser = user || DEFAULT_LOCAL_USER;
        const updatedUser = { ...currentUser };
        if (keys.google !== undefined) updatedUser.googleApiKey = keys.google;
        if (keys.openai !== undefined) updatedUser.openaiApiKey = keys.openai;
        if (keys.groq !== undefined) updatedUser.groqApiKey = keys.groq;
        if (keys.cerebras !== undefined) updatedUser.cerebrasApiKey = keys.cerebras;
        if (keys.openrouter !== undefined) updatedUser.openrouterApiKey = keys.openrouter;
        if (keys.nvidia !== undefined) updatedUser.nvidiaApiKey = keys.nvidia;
        if (keys.nvidiaModel !== undefined) updatedUser.nvidiaModel = keys.nvidiaModel;
        if (keys.mistral !== undefined) updatedUser.mistralApiKey = keys.mistral;
        if (keys.together !== undefined) updatedUser.togetherApiKey = keys.together;
        if (keys.ollamaUrl !== undefined) updatedUser.ollamaUrl = keys.ollamaUrl;
        if (keys.ollamaModel !== undefined) updatedUser.ollamaModel = keys.ollamaModel;
        if (keys.maestroUrl !== undefined) updatedUser.maestroUrl = keys.maestroUrl;
        saveSession(updatedUser);

        // Atualiza também o cache de configurações do sistema para redundância
        try {
            const storedSettings = localStorage.getItem('iaplay_system_settings');
            const currentSettings = storedSettings ? JSON.parse(storedSettings) : {};
            const newSettings = {
                ...currentSettings,
                googleApiKey: updatedUser.googleApiKey,
                groqApiKey: updatedUser.groqApiKey,
                openaiApiKey: updatedUser.openaiApiKey,
                cerebrasApiKey: updatedUser.cerebrasApiKey,
                openrouterApiKey: updatedUser.openrouterApiKey,
                nvidiaApiKey: updatedUser.nvidiaApiKey,
                nvidiaModel: updatedUser.nvidiaModel,
                mistralApiKey: updatedUser.mistralApiKey,
                togetherApiKey: updatedUser.togetherApiKey,
                ollamaUrl: updatedUser.ollamaUrl,
                ollamaModel: updatedUser.ollamaModel
            };
            localStorage.setItem('iaplay_system_settings', JSON.stringify(newSettings));
        } catch (e) {}

        try {
            apiClient.post('/api/auth.php?action=update_keys', {
                id: currentUser.id,
                google: keys.google,
                openai: keys.openai,
                groq: keys.groq,
                cerebras: keys.cerebras,
                openrouter: keys.openrouter,
                nvidia: keys.nvidia,
                mistral: keys.mistral,
                together: keys.together
            }).catch(() => {});
        } catch (e) {}
    };

    const updateProfile = async (data: { name?: string; password?: string, creativeContext?: string }) => {
        if (!user) return;

        try {
            await apiClient.post('/api/auth.php?action=update', {
                id: user.id,
                name: data.name || user.name,
                password: data.password,
                creative_context: data.creativeContext !== undefined ? data.creativeContext : user.creativeContext
            });
        } catch (error: any) {
            console.warn("Update Profile backend notice (local mode active):", error.message);
        }

        const updatedUser = { ...user };
        if (data.name) updatedUser.name = data.name;
        if (data.creativeContext !== undefined) updatedUser.creativeContext = data.creativeContext;
        saveSession(updatedUser);
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            await apiClient.post<any>('/api/auth.php?action=delete_account', { id: user.id });
        } catch (e) {}
        setUser(null);
        localStorage.removeItem('iaplay_session');
        window.location.hash = "/dashboard";
    };

    return (
        <AuthContext.Provider value={{ user, tempEmail, login, register, verifyEmail, logout, startTrial, upgradePlan, cancelSubscription, updateApiKeys, updateProfile, refreshProfile, deleteAccount, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
