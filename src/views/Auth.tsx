import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, Music, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useModal } from '../components/ModalProvider';

export const Auth: React.FC<{ type: 'login' | 'register' }> = ({ type }) => {
    const { login, register, verifyEmail } = useAuth();
    const { showAlert } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        cpf: '', cep: '', address: '', city: '', state: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'form' | 'verify' | 'forgot_email' | 'forgot_reset'>('form');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Separate function for Forgot Password API
    const requestReset = async (email: string) => {
        const res = await fetch('/api/auth.php?action=forgot_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Erro ao solicitar reset.");
        }
    };

    const executeReset = async (email: string, code: string, password: string) => {
        const res = await fetch('/api/auth.php?action=reset_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email, code, password })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erro ao redefinir senha.");
        }
    };

    // === CPF Validation Algorithm ===
    const validateCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/[^\d]+/g, '');
        if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
        let sum = 0, rest;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        return rest === parseInt(cleanCPF.substring(10, 11));
    };

    // === ViaCEP API Integration ===
    const fetchAddress = async (cepValue: string) => {
        const cleanCep = cepValue.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro + (data.bairro ? ` - ${data.bairro}` : ''),
                        city: data.localidade,
                        state: data.uf
                    }));
                }
            } catch (err) {
                console.error("ViaCEP Fetch Error:", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        if (type === 'register' && step === 'form') {
            const cleanEmail = formData.email.trim().toLowerCase();
            if (!cleanEmail.endsWith('@gmail.com')) {
                setError('Cadastro exclusivo para contas do Gmail (@gmail.com) durante a fase de testes.');
                setLoading(false);
                return;
            }
        }

        try {
            if (step === 'forgot_email') {
                await requestReset(formData.email);
                setStep('forgot_reset');
                setSuccessMsg("Código enviado para seu email!");
            }
            else if (step === 'forgot_reset') {
                await executeReset(formData.email, verificationCode, formData.password);
                await showAlert("Senha redefinida com sucesso! Faça login agora.");
                setStep('form');
                navigate('/login');
            }
            else if (type === 'login') {
                await login(formData.email, formData.password);
                const from = (location.state as any)?.from;
                if (from) {
                    navigate(from.pathname + from.search + from.hash);
                } else {
                    navigate('/dashboard');
                }
            } else { // This 'else' corresponds to type === 'register'
                // Registro direto de testador beta
                await register(
                    formData.name,
                    formData.email.trim().toLowerCase(),
                    formData.password,
                    formData.cpf || '',
                    formData.cep || '',
                    formData.address || '',
                    formData.city || '',
                    formData.state || ''
                );
                await showAlert("🎉 Conta de Testador criada com sucesso! Acesso 100% gratuito liberado. Faça login para começar!");
                navigate('/login');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (step === 'forgot_email') return 'Recuperar Senha';
        if (step === 'forgot_reset') return 'Redefinir Senha';
        return type === 'login' ? 'Acesse sua conta' : 'Criar conta Grátis';
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface border-r border-white/10 p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent opacity-50" />

                <Link to="/" className="relative z-10 flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-black" />
                    </div>
                    <span className="font-bold text-white tracking-tight text-xl">IAPLAY</span>
                </Link>

                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        {type === 'login' ? 'Bem-vindo de volta.' : 'Comece sua jornada.'}
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Domine a criação musical com IA. Junte-se à elite dos produtores.
                    </p>
                </div>

                <div className="relative z-10 text-zinc-500 text-sm">
                    © 2024 IAPLAY Inc.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#09090b]">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        {step.includes('forgot') && (
                            <button onClick={() => setStep('form')} className="mb-4 text-sm text-zinc-500 hover:text-white flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Voltar
                            </button>
                        )}

                        <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>

                        {step === 'form' && (
                            <p className="text-zinc-400 mt-2">
                                {type === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                <Link to={type === 'login' ? '/register' : '/login'} className="text-primary hover:underline ml-1 font-medium">
                                    {type === 'login' ? 'Cadastre-se' : 'Entrar'}
                                </Link>
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-sm text-red-400">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2 text-sm text-green-400">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* FORGOT PASSWORD FLOW */}
                        {step === 'forgot_email' && (
                            <div className="animate-in fade-in slide-in-from-right-8">
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email da conta</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        )}

                        {step === 'forgot_reset' && (
                            <div className="animate-in fade-in slide-in-from-right-8 space-y-4">
                                <div className="p-3 bg-zinc-800 rounded text-sm text-zinc-300">
                                    Código enviado para: <strong>{formData.email}</strong>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Código de Verificação</label>
                                    <input
                                        required
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white text-center text-xl tracking-widest focus:border-primary outline-none"
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nova Senha</label>
                                    <input
                                        required
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        placeholder="Nova senha segura"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'form' && (
                            <>
                                {type === 'register' && (
                                    <>
                                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
                                            <span>✨ <strong>Acesso Testador Liberado:</strong> 100% gratuito para e-mails do Gmail (@gmail.com).</span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome Completo</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Seu nome ou nome artístico"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="seu@email.com"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase">Senha</label>
                                        {type === 'login' && (
                                            <button type="button" onClick={() => setStep('forgot_email')} className="text-xs text-primary hover:underline">
                                                Esqueci minha senha
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        required
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            disabled={loading}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {step === 'forgot_reset' ? 'Confirmar' : step === 'forgot_email' ? 'Enviar Código' : type === 'login' ? 'Entrar' : 'Criar Conta'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
