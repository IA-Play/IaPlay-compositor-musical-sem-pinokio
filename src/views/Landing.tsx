import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Mic2, Zap, ArrowRight, CheckCircle2, Music4, Lock, Sparkles, Layers, Sliders, Play, Copy, ExternalLink, BookOpen, XCircle, Gauge, Radio, AlignLeft, Music, DollarSign, TrendingUp, AlertOctagon, Terminal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { getSystemSettings, initSettings } from '../services/settingsService';
import { SEO } from '../components/SEO';
import { useLanguage } from '../contexts/LanguageContext';

export const Landing: React.FC = () => {
    const [settings, setSettings] = useState(getSystemSettings());
    const { t, language } = useLanguage();
    const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const fresh = await initSettings();
            setSettings(fresh);
        };
        load();
    }, []);

    const scrollToFeatures = () => {
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const copyPrompt = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPromptId(id);
        setTimeout(() => setCopiedPromptId(null), 2000);
    };

    // Helper to colorize prompts for display
    const highlightPrompt = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('[')) {
                return <span key={i} className="text-purple-400 font-bold block mt-2">{line}</span>;
            }
            if (line.startsWith('(')) {
                return <span key={i} className="text-yellow-500/80 text-xs italic block">{line}</span>;
            }
            return <span key={i} className="text-zinc-300 block">{line}</span>;
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans">
            <SEO />
            <Navbar />

            <main id="main-content">
                {/* 1️⃣ HERO: PROMESSA AGRESSIVA & PERDA */}
                <header className="relative min-h-[90vh] pt-32 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
                    {/* Background FX - Animated */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 blur-[140px] rounded-full pointer-events-none"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-bold tracking-wider uppercase text-zinc-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10"
                        >
                            <motion.span
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"
                            />
                            {t('hero.badge')}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-5xl md:text-8xl font-black tracking-tighter leading-tight"
                        >
                            {t('hero.title_start')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-pulse">{t('hero.title_end')}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light"
                        >
                            {t('hero.subtitle')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8 relative"
                        >
                            <a href="https://pinokio.co/posts/01m0jmva8zw723vmywwp8jvk35" target="_blank" rel="noopener noreferrer" aria-label="Baixar IAPLAY Studio no Pinokio" className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(59,130,246,0.35)] overflow-hidden">
                                <span className="absolute inset-0 w-full h-full -ml-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                                <span className="relative z-10 flex items-center gap-2">📥 Baixar no Pinokio <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" /></span>
                            </a>
                            <button onClick={scrollToFeatures} aria-label="Ver mais recursos detalhados da orquestração de prompts" className="w-full md:w-auto px-10 py-5 bg-transparent glass-panel text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors cursor-pointer">
                                {t('hero.cta_secondary')}
                            </button>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            className="text-xs text-zinc-600 pt-4 uppercase tracking-widest font-semibold"
                        >
                            {t('hero.no_card')}
                        </motion.p>
                    </div>
                </header>

                {/* LOGOS DE IAS DE MÚSICA COMPATÍVEIS */}
                <section className="py-10 bg-black/60 border-y border-white/5 relative z-10">
                    <div className="max-w-6xl mx-auto px-6 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-6">
                            Gere prompts de alta precisão prontos para usar nas principais IAs de música:
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity">
                            {/* Suno Badge Logo */}
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:border-primary transition-colors">
                                    <span className="font-black text-sm text-primary">S</span>
                                </div>
                                <span className="font-black tracking-wider text-lg text-white group-hover:text-primary transition-colors">SUNO AI</span>
                            </div>

                            {/* Udio Badge Logo */}
                            <div className="flex items-center gap-group cursor-pointer">
                                <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
                                    <span className="font-black text-sm text-cyan-400">U</span>
                                </div>
                                <span className="font-black tracking-wider text-lg text-white group-hover:text-cyan-400 transition-colors">UDIO</span>
                            </div>

                            {/* Stable Audio Badge Logo */}
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 group-hover:border-yellow-400 transition-colors">
                                    <span className="font-black text-sm text-yellow-400">SA</span>
                                </div>
                                <span className="font-black tracking-wider text-lg text-white group-hover:text-yellow-400 transition-colors">STABLE AUDIO</span>
                            </div>

                            {/* MusicGen Badge Logo */}
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30 group-hover:border-green-400 transition-colors">
                                    <span className="font-black text-sm text-green-400">MG</span>
                                </div>
                                <span className="font-black tracking-wider text-lg text-white group-hover:text-green-400 transition-colors">MUSICGEN (META)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2️⃣ VILÃO: COMPARATIVO VISUAL */}
                <section aria-labelledby="problema-heading" className="py-20 bg-zinc-950 border-y border-white/5 overflow-hidden">
                    <div className="max-w-6xl mx-auto px-6">
                        <motion.h2
                            id="problema-heading"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-3xl md:text-4xl font-bold text-center mb-12"
                        >
                            {t('features.problem_title')}
                        </motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            {/* The Wrong Way */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                                className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-4 right-4 text-red-500 opacity-10 pointer-events-none"><XCircle className="w-32 h-32" /></div>

                                <div className="relative z-10 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2"><XCircle className="w-5 h-5" /> {t('features.amateur_title')}</h3>

                                    <div className="bg-zinc-900 border border-red-500/30 p-4 rounded-xl mb-6 font-mono text-xs text-zinc-500">
                                        "Crie uma música rock triste"
                                    </div>

                                    <ul className="space-y-4 text-zinc-400 text-sm flex-1">
                                        <li className="flex gap-3"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> <span><strong>Desperdício:</strong> Você gasta 50 créditos para ter 1 resultado aceitável.</span></li>
                                        <li className="flex gap-3"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> <span><strong>Aleatório:</strong> A IA ignora seus pedidos de instrumentos específicos.</span></li>
                                        <li className="flex gap-3"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> <span><strong>Métrica Quebrada:</strong> Letras que não encaixam no ritmo ("robóticas").</span></li>
                                    </ul>
                                </div>
                            </motion.div>

                            {/* The IAPLAY Way */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.05)] glass-card"
                            >
                                <div className="absolute top-4 right-4 text-green-500 opacity-10 pointer-events-none"><CheckCircle2 className="w-32 h-32" /></div>

                                <div className="relative z-10 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {t('features.iaplay_title')}</h3>

                                    <div className="bg-black border border-green-500/30 p-4 rounded-xl mb-6 font-mono text-xs text-zinc-300 relative overflow-hidden shadow-inner">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                                        <span className="text-primary font-bold">[Verse 1]</span> <span className="text-zinc-500">(Whispered vocals, minimal bass)</span><br />
                                        Shadows dancing on the wall...<br />
                                        <span className="text-primary font-bold mt-2 inline-block">[Chorus]</span> <span className="text-zinc-500">(Explosive Drums, Distorted Guitars)</span><br />
                                        TEAR IT DOWN!
                                    </div>

                                    <ul className="space-y-4 text-zinc-300 text-sm flex-1">
                                        <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <span><strong>Economia:</strong> Gere certo na primeira tentativa.</span></li>
                                        <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <span><strong>Controle Total:</strong> Meta-tags ocultas forçam a IA a obedecer.</span></li>
                                        <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <span><strong>Métrica Perfeita:</strong> Otimizador lírico ajusta sílabas para o BPM.</span></li>
                                    </ul>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="text-center mt-12 text-zinc-500 text-sm italic"
                        >
                            “Um gera frustração. O outro gera hits.”
                        </motion.div>
                    </div>
                </section>

                {/* 3️⃣ MECANISMO ÚNICO & CONTROLE (BENTO BOX) */}
                <section id="features" aria-labelledby="arsenal-heading" className="py-32 overflow-hidden bg-black relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-primary/5 pointer-events-none" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase mb-6 border border-primary/20">
                                <Terminal className="w-4 h-4" aria-hidden="true" /> Mecanismo Proprietário
                            </div>
                            <h2 id="arsenal-heading" className="text-4xl md:text-5xl font-bold mb-6">{t('features.arsenal_title')}</h2>
                            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                                {t('features.arsenal_desc')}
                            </p>
                        </motion.div>

                        {/* Bento Box Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">

                            {/* Box 1: Masterização (Large Span) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="md:col-span-2 md:row-span-1 glass-card rounded-3xl p-8 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/15 transition-colors" />
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl w-fit"><Radio className="w-6 h-6 text-primary" /></div>
                                    <div>
                                        <h4 className="font-bold text-white text-2xl mb-2">Masterização & Textura</h4>
                                        <p className="text-sm text-zinc-400 max-w-md">Não peça "som antigo". Comande com precisão militar: "Lo-Fi, Cassette Tape Hiss, Vinyl Crackle" e veja a IA obedecer.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Box 2: Efeitos FX (Vertical Span) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="md:col-span-1 md:row-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group flex flex-col"
                            >
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-accent/5 to-transparent" />
                                <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl w-fit mb-6"><Zap className="w-6 h-6 text-accent" /></div>
                                <h4 className="font-bold text-white text-2xl mb-4">Rack de Efeitos FX</h4>
                                <p className="text-sm text-zinc-400 flex-1">Adicione Autotune, Reverb de Catedral, Sidechain ou Bitcrusher com um clique.</p>

                                {/* Mini UI Simulation inside Box 2 */}
                                <div className="p-4 bg-black/50 rounded-xl border border-white/5 mt-auto">
                                    <div className="flex justify-between text-[10px] text-zinc-500 mb-2 font-bold uppercase"><span>Reverb (Wet)</span><span className="text-primary">85%</span></div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-primary shadow-[0_0_10px_#ff6b3d]" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Box 3: Controle de Ritmo */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="md:col-span-1 md:row-span-1 glass-card rounded-3xl p-8 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.1),transparent_50%)]" />
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl w-fit"><Gauge className="w-6 h-6 text-green-400" /></div>
                                    <div>
                                        <h4 className="font-bold text-white text-xl mb-2">Controle de Ritmo</h4>
                                        <p className="text-sm text-zinc-400">Defina se a bateria é "Sincopada", "4x4 House" ou "Half-time".</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Box 4: Interactive UI Simulation (Span 1) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="md:col-span-1 md:row-span-1 glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center border-primary/20"
                            >
                                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5"><Sliders className="w-3 h-3" /> Tags Injetadas</span>
                                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /></div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5 block">Instrumentos</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-mono">808 Bass</span>
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-mono">Synth</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5 block">Vibe</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 bg-primary text-white rounded text-[10px] font-bold shadow-[0_0_10px_#ff6b3d]">Cinematic</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 4️⃣ ROI & ECONOMIA (MATH) */}
                <section aria-labelledby="roi-heading" className="py-24 bg-white text-black border-y border-zinc-200 overflow-hidden">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <motion.h2
                            id="roi-heading"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-3xl md:text-4xl font-black mb-12 tracking-tight"
                        >
                            {t('roi.title')}
                        </motion.h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="p-8 bg-zinc-100 rounded-3xl border border-zinc-200"
                            >
                                <div className="text-zinc-500 text-sm font-bold uppercase mb-2">{t('roi.calc_waste')}</div>
                                <div className="text-5xl font-black text-red-500 flex items-center justify-center gap-2">
                                    <TrendingUp className="w-8 h-8" /> $$$
                                </div>
                                <p className="text-zinc-600 mt-4 text-sm px-8">
                                    Tempo perdido testando prompts aleatórios, ouvindo resultados ruins e comprando mais créditos.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full z-10 hidden md:block">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                                <div className="p-8 bg-black text-white rounded-3xl shadow-2xl transform scale-105">
                                    <div className="text-zinc-400 text-sm font-bold uppercase mb-2">{t('roi.calc_save')}</div>
                                    <div className="text-5xl font-black text-green-400 flex items-center justify-center gap-2">
                                        <DollarSign className="w-8 h-8" /> Zero
                                    </div>
                                    <p className="text-zinc-400 mt-4 text-sm px-8">
                                        {t('roi.verdict')}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 5️⃣ ANTI-PERSONA (EXCLUSÃO) */}
                <section className="py-24 bg-[#050505] overflow-hidden">
                    <div className="max-w-3xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="p-10 border border-red-900/30 bg-red-950/5 rounded-3xl text-center"
                        >
                            <div className="inline-block p-3 bg-red-500/10 rounded-full mb-6 max-w-fit mx-auto">
                                <AlertOctagon className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-red-500 mb-8">{t('anti_persona.title')}</h2>

                            <div className="space-y-4 text-left max-w-lg mx-auto mb-8">
                                <p className="text-zinc-300 text-lg">{t('anti_persona.p1')}</p>
                                <p className="text-zinc-300 text-lg">{t('anti_persona.p2')}</p>
                                <p className="text-zinc-300 text-lg">{t('anti_persona.p3')}</p>
                            </div>

                            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest border-t border-red-900/30 pt-6 inline-block">
                                {t('anti_persona.conclusion')}
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* 6️⃣ SHOWCASE (PROVA SOCIAL) */}
                <section aria-labelledby="showcase-heading" className="py-24 bg-zinc-900/30 border-y border-white/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <h2 id="showcase-heading" className="text-3xl md:text-4xl font-bold mb-4">{t('features.showcase_title')}</h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto">
                                {t('features.showcase_desc')}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(settings.showcaseItems || []).map((item, index) => (
                                <motion.article
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    key={item.id}
                                    className="group relative bg-[#09090b] border border-white/10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-primary/20 flex flex-col h-full glass-card"
                                >
                                    <div className="h-48 w-full bg-zinc-800 relative overflow-hidden">
                                        {item.coverImage ? (
                                            <img src={item.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100" alt={item.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                <Music className="w-12 h-12 text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 z-10">
                                            <h3 className="text-xl font-bold text-white leading-tight mb-1">{item.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded shadow-[0_0_10px_#ff6b3d]">
                                                    {item.style}
                                                </span>
                                            </div>
                                        </div>
                                        <a href={item.audioUrl} target="_blank" rel="noreferrer" className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 z-20">
                                            <Play className="w-4 h-4 fill-black ml-0.5" />
                                        </a>
                                    </div>
                                    <div className="p-6 flex-1 bg-[#09090b] relative z-10">
                                        <div className="relative bg-zinc-900/50 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-zinc-400 h-24 overflow-hidden">
                                            {item.promptUsed}
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7️⃣ CTA FINAL (FOMO) */}
                <section aria-labelledby="cta-heading" className="py-32 px-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 max-w-3xl mx-auto"
                    >
                        <h2 id="cta-heading" className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                            {t('cta_final.title')}
                        </h2>
                        <div className="flex justify-center">
                            <a href="https://pinokio.co/posts/01m0jmva8zw723vmywwp8jvk35" target="_blank" rel="noopener noreferrer" aria-label="Baixar IAPLAY Studio no Pinokio" className="group px-12 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-extrabold rounded-full hover:scale-105 transition-transform shadow-[0_0_50px_rgba(59,130,246,0.4)] flex items-center gap-3 relative overflow-hidden">
                                <span className="absolute inset-0 w-full h-full -ml-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                                <span className="relative z-10 flex items-center gap-2">
                                    📥 Baixar no Pinokio
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                </span>
                            </a>
                        </div>
                        <p className="mt-6 text-zinc-500 text-sm">Instalação 1-Click • Compatível com Windows, Mac e Linux via Pinokio</p>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 bg-black border-t border-white/10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_#ff6b3d]">
                            <Music4 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">IAPLAY</span>
                    </div>
                    <p className="text-zinc-500 text-sm">© 2024 IAPLAY Compositor Musical. Todos os direitos reservados.</p>
                    <div className="flex justify-center gap-6 mt-6 text-sm text-zinc-400">
                        <a href="https://pinokio.co/posts/01m0jmva8zw723vmywwp8jvk35" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">Download no Pinokio</a>
                        <Link to="/tutorial" className="hover:text-white transition-colors">Tutorial</Link>
                        <Link to="/dashboard" className="hover:text-white transition-colors">Estúdio</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
