
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { refreshProfile, user, isLoading } = useAuth();

    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [navigating, setNavigating] = useState(false);
    const [activatedPlan, setActivatedPlan] = useState<string>('Pro');
    const hasRun = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Extraction function to robustly parse session_id from any location in URL
    const getSessionId = useCallback((): string => {
        // 1. Try standard query param
        const urlParams = new URLSearchParams(window.location.search);
        let id = urlParams.get('session_id');
        if (id) return id;

        // 2. Try query param inside Hash (common in HashRouter)
        const hash = window.location.hash;
        const match = hash.match(/[?&]session_id=([^&/]+)/);
        if (match && match[1]) {
            return match[1];
        }

        // 3. Try fallback match on full URL
        const hrefMatch = window.location.href.match(/[?&]session_id=([^&/]+)/);
        if (hrefMatch && hrefMatch[1]) {
            return hrefMatch[1];
        }

        return '';
    }, []);

    const sessionId = getSessionId();

    // Direct Stripe verification - bypasses webhook dependency entirely
    const verifyWithStripe = useCallback(async (): Promise<{ active: boolean; plan?: string } | null> => {
        if (!sessionId) return null;
        try {
            const res = await apiClient.post<any>('/api/stripe_verify.php', { session_id: sessionId });
            if (res.error || !res.data) return null;
            if (res.data.status === 'active') {
                return { active: true, plan: res.data.plan || 'Pro' };
            }
            return { active: false };
        } catch {
            return null;
        }
    }, [sessionId]);

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            navigate('/login');
            return;
        }
        if (hasRun.current) return;
        hasRun.current = true;

        let attempt = 0;
        const maxAttempts = 15;

        const poll = async () => {
            attempt++;

            // Strategy 1: Try direct Stripe verification (most reliable)
            if (sessionId) {
                const result = await verifyWithStripe();
                if (result?.active) {
                    // Stripe confirmed payment AND activated DB. Now sync React state.
                    await refreshProfile();
                    setActivatedPlan(result.plan || 'Pro');
                    setStatus('success');
                    return;
                }
            }

            // Strategy 2: Fallback to polling the user profile (webhook may have updated it)
            try {
                await refreshProfile();
                const stored = localStorage.getItem('iaplay_session');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const plan = (parsed.plan || '').toUpperCase();
                    const subStatus = parsed.subscriptionStatus || parsed.subscription_status || '';

                    const isActive = subStatus === 'active' ||
                        plan.includes('PRO') ||
                        plan.includes('ANUAL') ||
                        plan.includes('MENSAL') ||
                        plan.includes('VIP') ||
                        plan.includes('VITALÍCIO');

                    if (isActive) {
                        setActivatedPlan(parsed.plan || 'Pro');
                        setStatus('success');
                        return;
                    }
                }
            } catch { }

            if (attempt < maxAttempts) {
                timerRef.current = setTimeout(poll, 2000);
            } else {
                // After 30s, show error with retry option
                setStatus('error');
            }
        };

        // Start polling after 2s to give webhook/verify time
        timerRef.current = setTimeout(poll, 2000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isLoading, user, navigate, refreshProfile, sessionId, verifyWithStripe]);

    const handleContinue = async () => {
        setNavigating(true);
        try {
            // Final sync: ensure React state has latest data before navigating
            await refreshProfile();
        } catch { }
        // Use React Router navigate - preserves React state, no page reload
        navigate('/dashboard', { replace: true });
    };

    const handleRetry = async () => {
        setStatus('processing');
        hasRun.current = false;
        // Re-trigger the verification
        const result = await verifyWithStripe();
        if (result?.active) {
            await refreshProfile();
            setActivatedPlan(result.plan || 'Pro');
            setStatus('success');
        } else {
            try {
                await refreshProfile();
                const stored = localStorage.getItem('iaplay_session');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const subStatus = parsed.subscriptionStatus || parsed.subscription_status || '';
                    const plan = (parsed.plan || '').toUpperCase();
                    if (subStatus === 'active' || plan.includes('PRO') || plan.includes('ANUAL') || plan.includes('VIP')) {
                        setActivatedPlan(parsed.plan || 'Pro');
                        setStatus('success');
                        return;
                    }
                }
            } catch { }
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl">

                {status === 'processing' && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Ativando sua conta...</h2>
                        <p className="text-zinc-400">Estamos confirmando o pagamento e liberando seu acesso.</p>
                        <p className="text-xs text-zinc-600 mt-4">Não feche esta página.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-6">
                            <CheckCircle2 className="w-10 h-10 text-black" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-4">Tudo Pronto!</h1>
                        <p className="text-zinc-400 text-sm mb-8">
                            Sua assinatura <strong>IAPLAY {activatedPlan}</strong> foi ativada com sucesso. <br />
                            Você já pode criar projetos ilimitados.
                        </p>

                        <button
                            onClick={handleContinue}
                            disabled={navigating}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                        >
                            {navigating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Carregando...</>
                            ) : (
                                <>Acessar seu painel <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>

                        <div className="mt-6 pt-6 border-t border-white/10 w-full">
                            <div className="flex items-center justify-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" /> Acesso Liberado
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-red-400">
                        <AlertCircle className="w-16 h-16 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Houve um problema</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            O pagamento foi processado, mas não conseguimos ativar automaticamente.
                        </p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700"
                        >
                            Tentar Novamente
                        </button>
                        <p className="text-xs text-zinc-600 mt-4">Se persistir, contate o suporte.</p>
                    </div>
                )}

            </div>
        </div>
    );
};
