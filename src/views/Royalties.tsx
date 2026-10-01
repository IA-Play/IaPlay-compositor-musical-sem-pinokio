
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Calculator, Info, ShieldCheck, TrendingUp,
    DollarSign, Music2, Globe, FileCheck,
    ArrowRight, Lightbulb, BadgeCheck, ExternalLink
} from 'lucide-react';

const RATES = {
    spotify: 0.004,
    apple: 0.008,
    youtube: 0.001,
    tidal: 0.012
};

export const Royalties: React.FC = () => {
    const { t } = useLanguage();
    const [streams, setStreams] = useState({
        spotify: 10000,
        apple: 2000,
        youtube: 50000,
        tidal: 500
    });
    const [conversionRate, setConversionRate] = useState(5.10); // USD to BRL

    const calculateEarnings = () => {
        const usd = (streams.spotify * RATES.spotify) +
            (streams.apple * RATES.apple) +
            (streams.youtube * RATES.youtube) +
            (streams.tidal * RATES.tidal);
        return {
            usd: usd.toFixed(2),
            brl: (usd * conversionRate).toFixed(2)
        };
    };

    const earnings = calculateEarnings();

    return (
        <div className="min-h-screen bg-background text-white pb-20">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-12">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight italic uppercase">Negócios & Royalties</h1>
                    </div>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        Gerencie o lado profissional da sua carreira. Calcule ganhos projetados e aprenda como registrar suas obras corretamente.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: CALCULATOR */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Calculator className="w-40 h-40" />
                            </div>

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-primary" /> Estimativa de Ganhos Digitais
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                                            <span>Spotify Streams</span>
                                            <span className="text-white">{streams.spotify.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1000000" step="1000"
                                            value={streams.spotify}
                                            onChange={(e) => setStreams({ ...streams, spotify: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                                            <span>YouTube Views</span>
                                            <span className="text-white">{streams.youtube.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1000000" step="1000"
                                            value={streams.youtube}
                                            onChange={(e) => setStreams({ ...streams, youtube: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                                            <span>Apple Music</span>
                                            <span className="text-white">{streams.apple.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1000000" step="1000"
                                            value={streams.apple}
                                            onChange={(e) => setStreams({ ...streams, apple: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
                                            <span>Câmbio (USD/BRL)</span>
                                            <span className="text-white">R$ {conversionRate}</span>
                                        </div>
                                        <input
                                            type="number" step="0.1"
                                            value={conversionRate}
                                            onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-zinc-300 outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center text-center">
                                    <span className="text-xs font-bold text-primary uppercase mb-2">Total Estimado</span>
                                    <span className="text-4xl font-black text-white">$ {earnings.usd}</span>
                                    <span className="text-zinc-500 text-xs mt-1">Dólares Americanos</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                                    <span className="text-xs font-bold text-zinc-400 uppercase mb-2">Convertido</span>
                                    <span className="text-4xl font-black text-green-400">R$ {earnings.brl}</span>
                                    <span className="text-zinc-500 text-xs mt-1">Reais Brasileiros</span>
                                </div>
                            </div>

                            <p className="mt-6 text-[10px] text-zinc-500 italic text-center">
                                *Valores baseados em médias de mercado. O payout real varia por país de origem do stream e tipo de contrato com distribuidora.
                            </p>
                        </div>

                        {/* REGISTRATION GUIDE */}
                        <div className="bg-surface border border-white/10 rounded-3xl p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Music2 className="w-5 h-5 text-zinc-400" /> Guia de Registro Profissional
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition-colors group">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                                        <BadgeCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-bold mb-2">ISWC (Obra)</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        O DNA da composição. Identifica a letra e melodia. É emitido pela sua associação (UBC, Abramus, etc) ao registrar a música no ECAD.
                                    </p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                        <FileCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-bold mb-2">ISRC (Fonograma)</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        O DNA da gravação. Identifica aquele arquivo de áudio específico. Essencial para receber royalties de execução pública e digital.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-start gap-4">
                                <div className="p-2 bg-violet-500/20 rounded-lg shrink-0">
                                    <Lightbulb className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Passo a Passo para o Sucesso</h4>
                                    <ul className="text-sm text-zinc-400 space-y-2 mt-3">
                                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Filie-se a uma associação musical vinculada ao ECAD.</li>
                                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Declare sua obra para gerar o ISWC.</li>
                                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Gere o ISRC ao finalizar a masterização no Estúdio.</li>
                                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Suba para as plataformas via agregadora (OneRPM, DistroKid, etc).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: HIGHLIGHTS/TIPS */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 h-full">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-emerald-400" /> Ecossistema Musical
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ECAD</label>
                                    <p className="text-xs text-zinc-400">Orgão central que arrecada valores de rádios, TVs, shows e estabelecimentos comerciais no Brasil.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Editora</label>
                                    <p className="text-xs text-zinc-400">Administra os direitos autorais da composição e busca oportunidades de sincronização (filmes, games).</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agregadora</label>
                                    <p className="text-xs text-zinc-400">Distribui sua música no Spotify, Deezer, TikTok e repassa os royalties mecânicos/digitais.</p>
                                </div>
                            </div>

                            <div className="mt-12 bg-zinc-800/50 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" /> Checkpoint de Segurança
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                            <BadgeCheck className="w-3 h-3 text-green-400" />
                                        </div>
                                        <span className="text-[11px] text-zinc-400 leading-tight">Nunca compartilhe seus logins de agregadora com terceiros.</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                            <BadgeCheck className="w-3 h-3 text-green-400" />
                                        </div>
                                        <span className="text-[11px] text-zinc-400 leading-tight">Guarde os certificados de registro gerados pelo IAPLAY.</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.open('https://www.ecad.org.br/', '_blank')}
                                className="w-full mt-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all">
                                Consultar Base do ECAD <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};
