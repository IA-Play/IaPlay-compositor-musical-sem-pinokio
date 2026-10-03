
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { getSystemSettings, saveSystemSettings, resetSystemSettings, initSettings } from '../services/settingsService';
import { SystemSettings, isUserAdmin } from '../types';
import { Save, RefreshCw, Sliders, Music, Sparkles, Download, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../components/ModalProvider';

const promptLabels: Record<string, string> = {
    promptLyrics: "Mestre: Gerador de Letras",
    promptInstrumental: "Mestre: Gerador Instrumental",
    promptOptimize: "Mestre: Otimizador de Métrica",
    promptStructure: "Mestre: Estruturador (Suno/Udio)",
    promptRemix: "Mestre: Remix & Transferência de Estilo",
    promptLength: "Mestre: Ajuste de Tamanho",
    promptStyles: "Mestre: Style Description Architect (Suno / Udio / YuE2)",
    promptAnalyze: "Mestre: Analista de Briefing (Assistente)",
    promptCompress: "Mestre: Compressor de Prompt",
    promptForensic: "Mestre: DNA Sônico (Análise Forense)",
    promptScore: "Mestre: Leitor de Partituras (Vision OMR)"
};

export const Admin: React.FC = () => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();
    const initialSettings = getSystemSettings();
    const [settings, setSettings] = useState<SystemSettings>(initialSettings);
    const [rawLists, setRawLists] = useState({
        listInstruments: initialSettings.listInstruments?.join('\n') || '',
        listStyles: initialSettings.listStyles?.join('\n') || '',
        listSentiments: initialSettings.listSentiments?.join('\n') || ''
    });
    const [activeTab, setActiveTab] = useState<'prompts' | 'lists'>('prompts');
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        const refreshSettings = async () => {
            const fresh = await initSettings();
            setSettings(fresh);
            setRawLists({
                listInstruments: fresh.listInstruments?.join('\n') || '',
                listStyles: fresh.listStyles?.join('\n') || '',
                listSentiments: fresh.listSentiments?.join('\n') || ''
            });
        };
        refreshSettings();
    }, [user, navigate]);

    const handleSave = async () => {
        setSavingSettings(true);
        try {
            const parseList = (text: string) => text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const toSave: SystemSettings = {
                ...settings,
                listInstruments: parseList(rawLists.listInstruments),
                listStyles: parseList(rawLists.listStyles),
                listSentiments: parseList(rawLists.listSentiments)
            };
            await saveSystemSettings(toSave);
            setSettings(toSave);
            await showAlert("Configurações e Prompts Mestres salvos com sucesso!");
        } catch (error: any) {
            await showAlert(error.message || "Erro ao salvar.");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleReset = async () => {
        if (await showConfirm("Restaurar todos os Prompts Mestres e Listas para os valores padrão originais?")) {
            const def = resetSystemSettings();
            setSettings(def);
            setRawLists({
                listInstruments: def.listInstruments?.join('\n') || '',
                listStyles: def.listStyles?.join('\n') || '',
                listSentiments: def.listSentiments?.join('\n') || ''
            });
            await showAlert("Padrões restaurados!");
        }
    };

    const handleExportBackup = () => {
        const parseList = (text: string) => text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const dataToExport: SystemSettings = {
            ...settings,
            listInstruments: parseList(rawLists.listInstruments),
            listStyles: parseList(rawLists.listStyles),
            listSentiments: parseList(rawLists.listSentiments)
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iaplay_backup_prompts_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                if (parsed && typeof parsed === 'object') {
                    const parseList = (text: string) => text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    const merged: SystemSettings = {
                        ...settings,
                        ...parsed,
                        listInstruments: Array.isArray(parsed.listInstruments) ? parsed.listInstruments : parseList(rawLists.listInstruments),
                        listStyles: Array.isArray(parsed.listStyles) ? parsed.listStyles : parseList(rawLists.listStyles),
                        listSentiments: Array.isArray(parsed.listSentiments) ? parsed.listSentiments : parseList(rawLists.listSentiments)
                    };
                    await saveSystemSettings(merged);
                    setSettings(merged);
                    setRawLists({
                        listInstruments: merged.listInstruments?.join('\n') || '',
                        listStyles: merged.listStyles?.join('\n') || '',
                        listSentiments: merged.listSentiments?.join('\n') || ''
                    });
                    await showAlert("Backup de Prompts Mestres e Listas importado e salvo com sucesso!");
                }
            } catch (err: any) {
                await showAlert("Erro ao ler o arquivo JSON: " + (err.message || "Formato inválido."));
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleListTextChange = (key: 'listInstruments' | 'listStyles' | 'listSentiments', value: string) => {
        setRawLists(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-background text-white font-sans">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-12">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Sliders className="w-7 h-7 text-primary" />
                            Painel Administrativo
                        </h1>
                        <p className="text-zinc-400 text-sm">Personalize os Prompts Mestres de IA e Listas de Produção do IAPLAY Studio.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors border border-white/10">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <span>Importar JSON</span>
                            <input
                                type="file"
                                accept=".json,application/json"
                                onChange={handleImportBackup}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={handleExportBackup}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors border border-white/10"
                            title="Baixar cópia de segurança de todos os Prompts e Listas em JSON"
                        >
                            <Download className="w-4 h-4 text-cyan-400" />
                            <span>Exportar JSON</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors border border-white/10"
                        >
                            <RefreshCw className="w-4 h-4 text-zinc-400" /> Restaurar Padrões
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={savingSettings}
                            className="px-5 py-2 bg-primary hover:bg-[#e05626] rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {savingSettings ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 overflow-x-auto custom-scrollbar pb-2">
                    {[
                        { id: 'prompts', label: '🧠 Prompts Mestres (IA)', icon: Sparkles },
                        { id: 'lists', label: '🎼 Listas (Estilos & Sons)', icon: Music }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 border-b-2 font-bold whitespace-nowrap text-sm flex items-center gap-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-white'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="min-h-[500px]">
                    {/* TAB PROMPTS MESTRES */}
                    {activeTab === 'prompts' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs text-zinc-300">
                                <p className="font-bold text-white mb-1">💡 Dica de Engenharia de Prompt:</p>
                                <p>Estes são os prompts mestres que guiam as inteligências artificiais na geração de letras, arranjos, métrica e estruturação Suno/Udio. Você pode customizar as tags de substituição como <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-primary">[TÍTULO DA MÚSICA]</code>, <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-primary">[IDIOMA]</code>, <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-primary">[SENTIMENTO]</code>, <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-primary">[ESTILOS]</code> e <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-primary">[ARSENAL]</code>.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['promptLyrics', 'promptInstrumental', 'promptOptimize', 'promptStructure', 'promptRemix', 'promptLength', 'promptStyles', 'promptAnalyze', 'promptCompress', 'promptForensic', 'promptScore'].map(key => (
                                    <div key={key} className="bg-surface p-5 rounded-2xl border border-white/10 flex flex-col space-y-2">
                                        <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                                            {promptLabels[key] || key}
                                        </label>
                                        <textarea
                                            value={(settings as any)[key] || ''}
                                            onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                                            rows={8}
                                            className="w-full bg-black/70 border border-white/10 focus:border-primary outline-none rounded-xl p-3 text-xs font-mono text-zinc-200 custom-scrollbar resize-y"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB LISTAS */}
                    {activeTab === 'lists' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                            <div className="bg-surface p-5 rounded-2xl border border-white/10 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-primary uppercase tracking-wider block">Lista de Instrumentos</label>
                                    <p className="text-[11px] text-zinc-400">Um instrumento por linha para o Arsenal.</p>
                                </div>
                                <textarea
                                    value={rawLists.listInstruments}
                                    onChange={e => handleListTextChange('listInstruments', e.target.value)}
                                    className="w-full h-96 bg-black/70 border border-white/10 focus:border-primary outline-none rounded-xl p-3 text-xs font-mono text-zinc-200 custom-scrollbar"
                                />
                            </div>

                            <div className="bg-surface p-5 rounded-2xl border border-white/10 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-primary uppercase tracking-wider block">Lista de Estilos Musicais</label>
                                    <p className="text-[11px] text-zinc-400">Um estilo/gênero por linha.</p>
                                </div>
                                <textarea
                                    value={rawLists.listStyles}
                                    onChange={e => handleListTextChange('listStyles', e.target.value)}
                                    className="w-full h-96 bg-black/70 border border-white/10 focus:border-primary outline-none rounded-xl p-3 text-xs font-mono text-zinc-200 custom-scrollbar"
                                />
                            </div>

                            <div className="bg-surface p-5 rounded-2xl border border-white/10 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-primary uppercase tracking-wider block">Lista de Sentimentos (Vibes)</label>
                                    <p className="text-[11px] text-zinc-400">Um sentimento/humor por linha.</p>
                                </div>
                                <textarea
                                    value={rawLists.listSentiments}
                                    onChange={e => handleListTextChange('listSentiments', e.target.value)}
                                    className="w-full h-96 bg-black/70 border border-white/10 focus:border-primary outline-none rounded-xl p-3 text-xs font-mono text-zinc-200 custom-scrollbar"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

