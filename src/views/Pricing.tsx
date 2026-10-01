
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Check, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSystemSettings, initSettings } from '../services/settingsService';

export const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [settings, setSettings] = useState(getSystemSettings());
    
    const queryParams = new URLSearchParams(location.search);
    const alertMessage = queryParams.get('message') || (location.state as any)?.message;

    useEffect(() => {
        const load = async () => {
            const fresh = await initSettings();
            setSettings(fresh);
        };
        load();
    }, []);

    const handleSubscribe = (plan: 'monthly' | 'yearly') => {
        if (!user) {
            navigate('/register');
            return;
        }
        navigate(`/checkout/${plan}`);
    };

    return (
        <div className="min-h-screen bg-background text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                {alertMessage && (
                    <div className="max-w-xl mx-auto mb-12 p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <AlertCircle className="w-6 h-6 text-purple-400 shrink-0" />
                        <p className="text-sm font-medium text-left">{alertMessage}</p>
                    </div>
                )}

                <div className="mb-12 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <Zap className="w-4 h-4" /> Programa Beta Testador
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Acesso Gratuito para Testadores</h1>
                    <p className="text-zinc-400 text-lg">
                        Todas as ferramentas e recursos do IAPLAY estão liberados sem custos durante nosso período de testes com contas @gmail.com.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto p-10 rounded-3xl bg-zinc-900 border border-primary/30 shadow-2xl shadow-primary/10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary border border-primary/30">
                        <Zap className="w-8 h-8 fill-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Plano Testador VIP</h3>
                    <div className="text-5xl font-extrabold text-white mb-6">R$ 0 <span className="text-lg font-normal text-zinc-400">/ 100% Gratuito</span></div>

                    <ul className="space-y-4 mb-8 w-full text-left max-w-md">
                        <li className="flex gap-3 text-sm text-zinc-200"><Check className="w-5 h-5 text-primary shrink-0" /> Gerador de Prompts e Letras com IA</li>
                        <li className="flex gap-3 text-sm text-zinc-200"><Check className="w-5 h-5 text-primary shrink-0" /> Suporte a Chaves Próprias (Gemini 3.6, Groq, OpenAI)</li>
                        <li className="flex gap-3 text-sm text-zinc-200"><Check className="w-5 h-5 text-primary shrink-0" /> Arsenal Criativo e Metrônomo Avançado</li>
                        <li className="flex gap-3 text-sm text-zinc-200"><Check className="w-5 h-5 text-primary shrink-0" /> Projetos Ilimitados na Nuvem</li>
                        <li className="flex gap-3 text-sm text-zinc-200"><Check className="w-5 h-5 text-primary shrink-0" /> Galeria de Downloads e Recursos VIP</li>
                    </ul>

                    {user ? (
                        <button onClick={() => navigate('/editor')} className="w-full max-w-md py-4 bg-primary hover:bg-[#e05626] text-white font-bold rounded-xl transition-all shadow-lg text-lg">
                            Acessar Estúdio Musical
                        </button>
                    ) : (
                        <button onClick={() => navigate('/register')} className="w-full max-w-md py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-lg text-lg">
                            Criar Conta Gratuita com Gmail
                        </button>
                    )}
                </div>

                <div className="mt-12 flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <ShieldCheck className="w-4 h-4" /> Nenhum cartão de crédito necessário. Cadastro exclusivo para contas @gmail.com.
                </div>
            </div>
        </div>
    );
};
