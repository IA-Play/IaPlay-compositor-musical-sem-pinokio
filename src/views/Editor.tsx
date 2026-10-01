import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Project, AIProvider, MusicType, MusicPlatform, AudioQuality, DetailedInstruction, YuETrack } from '../types';
import { ArsenalModal } from '../components/Arsenal';
import { YuEGenerationModal } from '../components/YuEGenerationModal';
import { SectionRulesModal } from '../components/SectionRulesModal';
import { checkMaestroStatus } from '../services/maestroService';
import { saveProject } from '../services/projectService';
import {
    generateLyrics,
    optimizeLyrics,
    structureSunoPrompt,
    generateStyleTags,
    generateByArtistFlow,
    analyzeArtistDNA,
    fetchArtistSongs,
    hasKeyForProvider,
    getProviderKeyUrl,
    parseStructuredPrompt,
    NVIDIA_FREE_MODELS
} from '../services/aiService';
import {
    ArrowLeft, Save, Copy, Loader2,
    Sliders, Check, Cpu, FileText,
    Mic2, X, Share2, Database, LayoutTemplate, MoreHorizontal, FileAudio, Wand2,
    Upload, Download, HelpCircle, RefreshCw, Key, ExternalLink, AlertCircle, Music, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSystemSettings } from '../services/settingsService';
import { GuidedTour, TourStep } from '../components/GuidedTour';
import { fetchInstalledOllamaModels, OllamaModelInfo, checkOllamaStatus } from '../services/ollamaService';
import { generateUUID } from '../utils/uuid';
import { useAIStream } from '../services/useAIStream';


interface EditorProps {
    project: Project;
    setProject: (p: Project | ((prev: Project) => Project)) => void;
    onSave: (p?: Project) => void;
    saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
}

export const Editor: React.FC<EditorProps> = ({ project, setProject, onSave, saveStatus }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user, updateApiKeys } = useAuth();
    const { isStreaming, streamedText } = useAIStream();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [showArsenal, setShowArsenal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [copyFeedback, setCopyFeedback] = useState("");
    const [styleInput, setStyleInput] = useState("");
    const [customInstruction, setCustomInstruction] = useState("");

    const [activeTab, setActiveTab] = useState<'controls' | 'lyrics' | 'output'>('lyrics');
    const [showTour, setShowTour] = useState(false);

    // Feature States
    const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
        const saved = localStorage.getItem('iaplay_preferred_provider');
        if (saved && Object.values(AIProvider).includes(saved as AIProvider)) {
            if (saved === AIProvider.OLLAMA && !hasKeyForProvider(AIProvider.OLLAMA)) {
                if (hasKeyForProvider(AIProvider.GOOGLE)) return AIProvider.GOOGLE;
                if (hasKeyForProvider(AIProvider.NVIDIA)) return AIProvider.NVIDIA;
                if (hasKeyForProvider(AIProvider.GROQ)) return AIProvider.GROQ;
                if (hasKeyForProvider(AIProvider.OPENROUTER)) return AIProvider.OPENROUTER;
                return AIProvider.GOOGLE;
            }
            return saved as AIProvider;
        }
        if (hasKeyForProvider(AIProvider.GOOGLE)) return AIProvider.GOOGLE;
        if (hasKeyForProvider(AIProvider.NVIDIA)) return AIProvider.NVIDIA;
        if (hasKeyForProvider(AIProvider.GROQ)) return AIProvider.GROQ;
        if (hasKeyForProvider(AIProvider.OPENROUTER)) return AIProvider.OPENROUTER;
        return AIProvider.GOOGLE;
    });
    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [quickApiKey, setQuickApiKey] = useState("");
    const [quickKeySaved, setQuickKeySaved] = useState(false);
    const [showYuEModal, setShowYuEModal] = useState(false);
    const [showSectionRulesModal, setShowSectionRulesModal] = useState(false);
    const [maestroOnline, setMaestroOnline] = useState<boolean | null>(null);

    const hasStructuredPrompt = Boolean(
        (project.promptFinal && project.promptFinal.trim().length > 10) ||
        (generatedPrompt && generatedPrompt.trim().length > 10)
    );

    useEffect(() => {
        checkMaestroStatus().then(res => setMaestroOnline(res.online)).catch(() => setMaestroOnline(false));
    }, []);

    const handleSelectProvider = (p: AIProvider) => {
        setAiProvider(p);
        localStorage.setItem('iaplay_preferred_provider', p);
        setQuickApiKey("");
        setQuickKeySaved(false);
    };

    const handleSaveQuickKey = () => {
        const key = quickApiKey.trim();
        if (!key) return;
        const keyMap: Record<string, string> = {
            [AIProvider.GOOGLE]: 'google',
            [AIProvider.GROQ]: 'groq',
            [AIProvider.OPENROUTER]: 'openrouter',
            [AIProvider.NVIDIA]: 'nvidia',
            [AIProvider.CEREBRAS]: 'cerebras',
            [AIProvider.OPENAI]: 'openai',
            [AIProvider.MISTRAL]: 'mistral',
            [AIProvider.TOGETHER]: 'together',
        };
        const field = keyMap[aiProvider];
        if (field) {
            updateApiKeys({ [field]: key } as any);
            setQuickKeySaved(true);
            setQuickApiKey("");
            setTimeout(() => setQuickKeySaved(false), 3000);
        }
    };

    // Ollama Dynamic Detection
    const [ollamaModels, setOllamaModels] = useState<OllamaModelInfo[]>([]);
    const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>(() => user?.ollamaModel || 'llama3.2');
    const [loadingOllama, setLoadingOllama] = useState(false);
    const [isOllamaOnline, setIsOllamaOnline] = useState<boolean | null>(null);

    const refreshOllama = async () => {
        setLoadingOllama(true);
        const online = await checkOllamaStatus();
        setIsOllamaOnline(online);
        if (online) {
            const models = await fetchInstalledOllamaModels();
            setOllamaModels(models);
            if (models.length > 0 && !models.some(m => m.name === selectedOllamaModel)) {
                setSelectedOllamaModel(models[0].name);
                updateApiKeys({ ollamaModel: models[0].name });
            }
        }
        setLoadingOllama(false);
    };

    useEffect(() => {
        refreshOllama();
    }, [aiProvider]);

    // NVIDIA NIM Model Selection
    const [selectedNvidiaModel, setSelectedNvidiaModel] = useState<string>(
        () => user?.nvidiaModel || localStorage.getItem('iaplay_nvidia_model') || 'nvidia/llama-3.1-nemotron-70b-instruct'
    );

    const handleSelectNvidiaModel = (modelId: string) => {
        setSelectedNvidiaModel(modelId);
        localStorage.setItem('iaplay_nvidia_model', modelId);
        updateApiKeys({ nvidiaModel: modelId });
    };

    const [sysSettings, setSysSettings] = useState(getSystemSettings());

    const tourSteps: TourStep[] = [
        {
            target: '[data-tour="arsenal"]',
            title: 'Arsenal de Produção',
            content: 'Injete metadados técnicos de estúdio (BPM, ambiência, reverbs, distorções). Isso força as IAs (Suno/Udio) a respeitarem a sua visão em vez de gerarem arranjos aleatórios.',
            position: 'right'
        },
        {
            target: '[data-tour="lyric-engine"]',
            title: 'Motor Lírico IA',
            content: 'Componha do zero ou otimize letras existentes. O otimizador de métrica ajusta as sílabas e quebras de linha para casar perfeitamente com o ritmo e BPM escolhidos.',
            position: 'right'
        },
        {
            target: '[data-tour="dna"]',
            title: 'Autópsia de DNA Sônico',
            content: 'Analise e copie a identidade sônica de qualquer artista consagrado. O motor mapeia instrumentos, ritmos e efeitos característicos diretamente para o seu Arsenal.',
            position: 'right'
        },
        {
            target: '[data-tour="structured-prompt"]',
            title: 'Prompt Estruturado Final',
            content: 'Aqui está seu prompt profissional compilado com meta-tags precisas. Copie e cole na tela de criação do Suno/Udio para obter o resultado ideal de primeira!',
            position: 'left'
        }
    ];

    useEffect(() => {
        setSysSettings(getSystemSettings());
        
        // Disparar o tour automaticamente para novos usuários
        const completed = localStorage.getItem('iaplay_tour_completed');
        if (completed !== 'true') {
            const timer = setTimeout(() => {
                setShowTour(true);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    // --- IMPORT & EXPORT ACTIONS ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (!event.target?.result || typeof event.target.result !== 'string') return;
                const rawData = JSON.parse(event.target.result);
                if (!rawData.title || !rawData.arsenal) {
                    showAlert(t('dashboard.invalid_file') || "Arquivo inválido");
                    return;
                }
                setProject({
                    ...rawData,
                    id: project.id,
                    userId: project.userId,
                    updatedAt: new Date()
                });
                showAlert(t('dashboard.import_success') || "Projeto importado com sucesso!");
            } catch (err) {
                console.error(err);
                showAlert(t('dashboard.import_error') || "Erro ao importar arquivo");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `iaplay-project-${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        placeholder?: string;
        value: string;
        type: 'prompt' | 'alert' | 'select' | 'key_missing';
        options?: string[];
        onConfirm: (val: string) => void;
    }>({ isOpen: false, title: '', value: '', type: 'alert', options: [], onConfirm: () => { } });

    const showPrompt = (title: string, placeholder?: string): Promise<string | null> => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                placeholder,
                value: '',
                type: 'prompt',
                options: [],
                onConfirm: (val) => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(val || null);
                }
            });
        });
    };

    const showSelect = (title: string, options: string[]): Promise<string | null> => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                value: '',
                type: 'select',
                options,
                onConfirm: (val) => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(val || null);
                }
            });
        });
    };

    const showAlert = (title: string): Promise<void> => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                value: '',
                type: 'alert',
                options: [],
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    resolve();
                }
            });
        });
    };

    const runWithFailover = async (msg: string, task: () => Promise<void>) => {
        setIsLoading(true);
        setLoadingMessage(msg);
        try {
            await task();
        } catch (e: any) {
            console.error(e);
            const errStr = e.message || t('messages.generic_error');
            if (errStr.includes("Nenhuma chave") || errStr.includes("API key") || errStr.includes("chave do Google") || errStr.includes("chave da Groq") || errStr.includes("chave do OpenRouter") || errStr.includes("chave da Cerebras")) {
                setModalConfig({
                    isOpen: true,
                    title: errStr,
                    value: '',
                    type: 'key_missing',
                    options: [],
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                showAlert(errStr);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    // --- HELPER ACTIONS ---

    const addStyleTag = (tag: string) => {
        if (!project.styles.includes(tag)) {
            setProject({ ...project, styles: [...project.styles, tag] });
        }
        setStyleInput("");
    };

    const removeStyleTag = (tag: string) => {
        setProject({ ...project, styles: project.styles.filter(s => s !== tag) });
    };

    const handleStyleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && styleInput.trim()) {
            addStyleTag(styleInput.trim());
        }
    };

    const insertTag = (tag: string) => {
        const textToInsert = (project.lyrics && !project.lyrics.endsWith('\n') ? '\n' : '') + `${tag}\n`;
        const updated = (project.lyrics || '') + textToInsert;
        setProject({ ...project, lyrics: updated });
    };

    // AI Actions
    const handleGenerateLyrics = async () => {
        const theme = await showPrompt(
            t('editor.prompt_theme') || "Sobre o que sera a musica?",
            t('editor.prompt_theme_ex') || "Ex: Um guerreiro enfrentando seus medos..."
        );
        if (!theme) return;

        await runWithFailover(t('messages.generating_lyrics') || "Compondo sua letra...", async () => {
            const result = await generateLyrics(
                { ...project, title: theme || project.title },
                aiProvider,
                theme,
                user?.creativeContext
            );
            if (!result || result.trim().length < 10) {
                throw new Error("A IA retornou uma resposta vazia. Verifique suas chaves de API ou conexao com o Ollama.");
            }
            // Salva a versao anterior no historico (Melhoria 5)
            pushToHistory('lyrics', result, 'Gerada: ' + new Date().toLocaleTimeString());
        });
    };

    const handleOptimizeLyrics = async () => {
        await runWithFailover(t('messages.polishing'), async () => {
            const result = await optimizeLyrics(project.lyrics, aiProvider);
            setProject({ ...project, lyrics: result });
        });
    };

    const handleGenerateStructure = async () => {
        // Se houver texto digitado no input de estilo que ainda não foi adicionado
        let currentStyles = [...(project.styles || [])];
        if (styleInput && styleInput.trim()) {
            const trimmed = styleInput.trim();
            if (!currentStyles.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
                currentStyles.push(trimmed);
            }
            setStyleInput('');
        }

        const projectToStructure = {
            ...project,
            styles: currentStyles
        };
        setProject(projectToStructure);

        await runWithFailover(t('messages.prompt_engineering'), async () => {
            const result = await structureSunoPrompt(projectToStructure, aiProvider);
            setGeneratedPrompt(result);

            // Parsing inteligente do resultado estruturado (letra e estilo)
            const parsed = parseStructuredPrompt(result);
            const targetPlatformName = projectToStructure.targetPlatform || 'Suno';
            const timestamp = new Date().toLocaleTimeString();

            setProject(prev => {
                // Guarda versão anterior do prompt estruturado no histórico
                const pHistory = [...(prev.promptHistory || [])];
                if (prev.promptFinal && prev.promptFinal.trim()) {
                    pHistory.unshift({
                        label: `${targetPlatformName} · ${timestamp}`,
                        value: prev.promptFinal,
                        at: new Date().toISOString()
                    });
                    if (pHistory.length > 20) pHistory.length = 20;
                }

                // Guarda versão anterior da letra no histórico antes de aplicar a estruturada
                const lHistory = [...(prev.lyricsHistory || [])];
                const hasNewStructuredLyrics = Boolean(parsed.lyricsText && parsed.lyricsText.length > 10);
                if (hasNewStructuredLyrics && prev.lyrics && prev.lyrics.trim()) {
                    lHistory.unshift({
                        label: `Original pré-estrutura · ${timestamp}`,
                        value: prev.lyrics,
                        at: new Date().toISOString()
                    });
                    if (lHistory.length > 20) lHistory.length = 20;
                }

                const updatedExtracted = parsed.tags.length > 0
                    ? parsed.tags
                    : (currentStyles.length > 0 ? currentStyles : prev.extractedStyles);

                return {
                    ...prev,
                    styles: currentStyles.length > 0 ? currentStyles : prev.styles,
                    promptFinal: result,
                    promptHistory: pHistory,
                    lyrics: hasNewStructuredLyrics ? parsed.lyricsText : prev.lyrics,
                    lyricsHistory: lHistory,
                    stylePrompt: parsed.styleText || prev.stylePrompt,
                    extractedStyles: updatedExtracted
                };
            });
        });
    };

    // --- MELHORIA 5: Historico de prompts e letras (restaurar versoes) ---
    const pushToHistory = (
        field: 'promptFinal' | 'lyrics',
        newValue: string,
        label: string
    ) => {
        const key = field === 'promptFinal' ? 'promptHistory' : 'lyricsHistory';
        const history = [...(project[key] || [])];
        const current = project[field];
        if (current && current.trim()) {
            history.unshift({
                label: label,
                value: current,
                at: new Date().toISOString()
            });
            // Mantem apenas as 20 ultimas versoes
            if (history.length > 20) history.length = 20;
        }
        setProject({
            ...project,
            [field]: newValue,
            [key]: history
        } as any);
    };

    const restoreFromHistory = (field: 'promptFinal' | 'lyrics', index: number) => {
        const key = field === 'promptFinal' ? 'promptHistory' : 'lyricsHistory';
        const history = project[key] || [];
        if (index >= 0 && index < history.length) {
            setProject({
                ...project,
                [field]: history[index].value
            } as any);
        }
    };

    const handleTrackSaved = (newTrack: YuETrack) => {
        const existing = project.tracks || [];
        setProject({
            ...project,
            tracks: [newTrack, ...existing]
        });
    };

    const handleSaveSectionRules = (newPromptFinal: string) => {
        const targetPlatformName = project.targetPlatform || 'Suno';
        const timestamp = new Date().toLocaleTimeString();
        const pHistory = [...(project.promptHistory || [])];
        if (project.promptFinal && project.promptFinal.trim()) {
            pHistory.unshift({
                label: `Regras de Seção · ${timestamp}`,
                value: project.promptFinal,
                at: new Date().toISOString()
            });
            if (pHistory.length > 20) pHistory.length = 20;
        }

        const parsed = parseStructuredPrompt(newPromptFinal);
        const hasNewStructuredLyrics = Boolean(parsed.lyricsText && parsed.lyricsText.length > 10);

        const updatedProject: Project = {
            ...project,
            promptFinal: newPromptFinal,
            promptHistory: pHistory,
            lyrics: hasNewStructuredLyrics ? parsed.lyricsText : project.lyrics,
            stylePrompt: parsed.styleText || project.stylePrompt,
            extractedStyles: parsed.tags.length > 0 ? parsed.tags : project.extractedStyles
        };

        setProject(updatedProject);
        setGeneratedPrompt(newPromptFinal);
        saveProject(updatedProject);
        onSave(updatedProject);
        showAlert("Regras de seção e efeitos vocais aplicados com sucesso ao Prompt Final!");
    };

    // --- MELHORIA 4: Presets de arsenal (salvar/carregar/reutilizar) ---
    const [showPresets, setShowPresets] = useState(false);
    const [presetName, setPresetName] = useState('');
    const PRESETS_KEY = 'iaplay_arsenal_presets';

    const loadPresets = (): { name: string; arsenal: any }[] => {
        try {
            const stored = localStorage.getItem(PRESETS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    };

    const savePreset = () => {
        const name = presetName.trim() || ('Preset ' + new Date().toLocaleTimeString());
        const presets = loadPresets();
        const idx = presets.findIndex(p => p.name === name);
        const newPreset = { name, arsenal: { ...project.arsenal } };
        if (idx >= 0) presets[idx] = newPreset;
        else presets.push(newPreset);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
        setPresetName('');
        showAlert('Preset "' + name + '" salvo com sucesso!');
    };

    const applyPreset = (name: string) => {
        const presets = loadPresets();
        const p = presets.find(x => x.name === name);
        if (p) {
            setProject({ ...project, arsenal: { ...p.arsenal } });
            showAlert('Preset "' + name + '" aplicado!');
        }
    };

    const deletePreset = (name: string) => {
        const presets = loadPresets().filter(p => p.name !== name);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
        showAlert('Preset "' + name + '" removido.');
    };

    // --- Selecionar plataforma (Melhoria 3) ---
    const changePlatform = (platform: MusicPlatform) => {
        setProject({ ...project, targetPlatform: platform });
    };



    const handleExtractTags = async () => {
        // Prioridade máxima: Usar o prompt estruturado completo (project.promptFinal) se disponível
        const hasPrompt = project.promptFinal && project.promptFinal.trim().length > 20;
        
        let fullPromptContext = "";
        if (hasPrompt) {
            fullPromptContext = project.promptFinal.trim();
        } else if (project.lyrics && project.lyrics.trim().length > 0) {
            const userStyles = project.styles || [];
            const arsenalInstruments = project.arsenal?.instruments || [];
            fullPromptContext = `Title: ${project.title || "Untitled"}\nStyle: ${userStyles.join(', ')}\nAtmosphere/Feeling: ${project.sentiment || "Neutral"}\nInstruments/Arsenal: ${arsenalInstruments.join(', ')}\n\n[LYRICS]\n${project.lyrics}`;
        } else {
            return;
        }

        await runWithFailover(t('messages.extracting_tags') || "Sintetizando Style Description...", async () => {
            const styleDesc = await generateStyleTags(fullPromptContext, aiProvider);
            if (!styleDesc || styleDesc.trim().length === 0) {
                throw new Error("A IA retornou uma resposta vazia. Verifique se o modelo de IA está ativo e respondendo.");
            }
            const cleanDesc = styleDesc.trim();
            console.log("[Editor] Style Description sintetizado com sucesso:", cleanDesc);
            setProject(prev => ({
                ...prev,
                stylePrompt: cleanDesc,
                extractedStyles: [cleanDesc]
            }));
        });
    };

    const handleArtistMode = async () => {
        const artist = await showPrompt(t('editor.prompt_artist'), t('editor.prompt_artist_ex'));
        if (!artist) return;

        setIsLoading(true);
        setLoadingMessage("Buscando sucessos do artista...");
        let songs: string[] = [];
        try {
            songs = await fetchArtistSongs(artist);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }

        if (songs.length === 0) {
            await showAlert("Não foi possível encontrar músicas famosas para este artista no momento. Tente novamente.");
            return;
        }

        const selectedSong = await showSelect(`Qual música do ${artist} você quer como inspiração?`, songs);
        if (!selectedSong) return;

        await runWithFailover(t('messages.channeling_artist').replace('{artist}', artist), async () => {
            // Pass the selected song as the topic
            const { generatedLyrics } = await generateByArtistFlow(artist, project.styles, selectedSong, aiProvider);
            setProject({ ...project, lyrics: generatedLyrics, artistInspiration: artist });
            await showAlert(`Letra recriada e inspirada na vibe de "${selectedSong}" do ${artist}!`);
        });
    };

    const handleSonicDNA = async () => {
        const artistName = await showPrompt(t('editor.prompt_dna'), t('editor.prompt_dna_ex'));
        if (!artistName) return;
        await runWithFailover(t('messages.autopsy'), async () => {
            const dna = await analyzeArtistDNA(artistName, aiProvider);

            // Mapper to clean up and ensure types match
            const newArsenal = {
                ...project.arsenal,
                instruments: Array.from(new Set([...project.arsenal.instruments, ...(dna.arsenal?.instruments || [])])),
                rhythm: Array.from(new Set([...project.arsenal.rhythm, ...(dna.arsenal?.ritmo || [])])),
                atmosphere: Array.from(new Set([...project.arsenal.atmosphere, ...(dna.arsenal?.atmosfera || [])])),
                effects: Array.from(new Set([...project.arsenal.effects, ...(dna.arsenal?.efeitos || [])]))
            };

            const dnaInstruction: DetailedInstruction = {
                id: generateUUID(),
                section: "VOCAL DNA",
                instruction: dna.vocalDnaInstruction || dna.goldenPrompt
            };

            setProject({
                ...project,
                title: project.title === t('editor.new_idea') ? `DNA: ${dna.artist || artistName}` : project.title,
                artistInspiration: dna.artist || artistName,
                sentiment: dna.sentiment || project.sentiment,
                styles: Array.from(new Set([...project.styles, ...(dna.styleTags || [])])),
                arsenal: newArsenal,
                detailedInstructions: [dnaInstruction, ...project.detailedInstructions]
            });

            await showAlert(t('editor.dna_success'));
        });
    };



    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(t('common.copied'));
        setTimeout(() => setCopyFeedback(""), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-screen bg-background text-white overflow-hidden font-sans"
        >
            <Navbar />

            {/* SUB-HEADER / TOOLBAR */}
            <div className="h-14 border-b border-white/10 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{t('editor.project_caps')}</span>
                        <span className="font-bold text-sm text-white truncate max-w-[200px]">{project.title}</span>
                    </div>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                        IAPLAY Studio (YuE2)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {copyFeedback && <span className="text-green-400 text-xs font-bold animate-pulse">{copyFeedback}</span>}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />

                    <button
                        onClick={handleImportClick}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title={t('dashboard.btn_import') || "Importar JSON"}
                    >
                        <Upload className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleExport}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title={t('common.export_json') || "Exportar JSON"}
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowTour(true)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Iniciar Tour Guiado"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onSave}
                        className={`px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${saveStatus === 'unsaved' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-green-600 text-white hover:bg-green-500'}`}
                    >
                        <Save className="w-4 h-4" /> {saveStatus === 'saved' ? t('editor.saved') : t('editor.btn_save')}
                    </button>
                </div>
            </div>

            {/* MAIN 3-COLUMN LAYOUT */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* 1. LEFT SIDEBAR - CONTROLS (340px) */}
                <div className={`${activeTab === 'controls' ? 'flex' : 'hidden'} md:flex w-full md:w-[340px] border-r border-white/10 bg-zinc-900 overflow-y-auto custom-scrollbar pt-2 flex-col`}>
                    <div className="p-5 space-y-6">

                        {/* AI Engine */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-primary" /> {t('editor.engine')}</span>
                                {aiProvider !== AIProvider.OLLAMA && hasKeyForProvider(aiProvider) && (
                                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> {t('editor.key_active')}
                                    </span>
                                )}
                            </div>
                            <select
                                value={aiProvider}
                                onChange={(e) => handleSelectProvider(e.target.value as AIProvider)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary outline-none"
                            >
                                <option value={AIProvider.GOOGLE}>Google Gemini {hasKeyForProvider(AIProvider.GOOGLE) ? '✅' : '🔑'}</option>
                                <option value={AIProvider.OLLAMA}>🦙 Ollama Local {isOllamaOnline ? '✅' : '(Offline ❌)'}</option>
                                <option value={AIProvider.NVIDIA}>🟢 NVIDIA NIM {hasKeyForProvider(AIProvider.NVIDIA) ? '✅' : '(Grátis 🔑)'}</option>
                                <option value={AIProvider.GROQ}>⚡ Groq (Llama 3.3) {hasKeyForProvider(AIProvider.GROQ) ? '✅' : '(Grátis 🔑)'}</option>
                                <option value={AIProvider.CEREBRAS}>🚀 Cerebras Cloud {hasKeyForProvider(AIProvider.CEREBRAS) ? '✅' : '(Grátis 🔑)'}</option>
                                <option value={AIProvider.OPENROUTER}>🌐 OpenRouter {hasKeyForProvider(AIProvider.OPENROUTER) ? '✅' : '(Grátis 🔑)'}</option>
                                <option value={AIProvider.MISTRAL}>🇫🇷 Mistral AI {hasKeyForProvider(AIProvider.MISTRAL) ? '✅' : '🔑'}</option>
                                <option value={AIProvider.TOGETHER}>Together AI {hasKeyForProvider(AIProvider.TOGETHER) ? '✅' : '🔑'}</option>
                                <option value={AIProvider.OPENAI}>OpenAI (GPT-4o) {hasKeyForProvider(AIProvider.OPENAI) ? '✅' : '🔑'}</option>
                            </select>

                            {/* INLINE QUICK API KEY SETUP */}
                            {aiProvider !== AIProvider.OLLAMA && !hasKeyForProvider(aiProvider) && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-in fade-in">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                                        <span className="flex items-center gap-1.5">
                                            <Key className="w-3.5 h-3.5" />
                                            {t('editor.key_required')}
                                        </span>
                                        <a
                                            href={getProviderKeyUrl(aiProvider)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                                        >
                                            {t('editor.get_free_key')} <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="password"
                                            value={quickApiKey}
                                            onChange={(e) => setQuickApiKey(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveQuickKey()}
                                            placeholder={t('editor.paste_key_placeholder')}
                                            className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-primary outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveQuickKey}
                                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#e05626] transition-colors"
                                        >
                                            {t('editor.btn_save')}
                                        </button>
                                    </div>
                                    {quickKeySaved && (
                                        <p className="text-[10px] text-emerald-400 font-bold animate-in fade-in">
                                            ✅ {t('editor.key_saved_success')}
                                        </p>
                                    )}
                                    {isOllamaOnline && (
                                        <div className="flex items-center justify-between text-[10px] pt-0.5 text-zinc-400">
                                            <span>{t('editor.or_use_local')}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectProvider(AIProvider.OLLAMA)}
                                                className="text-emerald-400 hover:underline font-bold"
                                            >
                                                🦙 {t('editor.switch_to_ollama')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* OLLAMA LOCAL DYNAMIC MODEL PICKER */}
                            {aiProvider === AIProvider.OLLAMA && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                            <span className={`w-2 h-2 rounded-full ${isOllamaOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                            {isOllamaOnline ? `${t('editor.ollama_online')} (${ollamaModels.length} modelo(s))` : t('editor.ollama_offline')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={refreshOllama}
                                            disabled={loadingOllama}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                            title={t('editor.refresh_models_title')}
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${loadingOllama ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {ollamaModels.length > 0 ? (
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">{t('editor.downloaded_model')}</label>
                                            <select
                                                value={selectedOllamaModel}
                                                onChange={(e) => {
                                                    setSelectedOllamaModel(e.target.value);
                                                    updateApiKeys({ ollamaModel: e.target.value });
                                                }}
                                                className="w-full bg-black border border-emerald-500/40 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                                            >
                                                {ollamaModels.map(m => (
                                                    <option key={m.name} value={m.name}>
                                                        {m.name} {m.size ? `(${m.size})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-zinc-400 space-y-1">
                                            <p>{isOllamaOnline ? t('editor.no_ollama_models') : t('editor.start_ollama_hint')}</p>
                                            <p className="font-mono bg-black/60 p-1.5 rounded text-emerald-400 border border-white/5 select-all">
                                                ollama run llama3.2
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* NVIDIA NIM MODEL PICKER */}
                            {aiProvider === AIProvider.NVIDIA && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5 animate-in fade-in">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {t('editor.nvidia_nim_models')}
                                        </span>
                                        <a
                                            href="https://build.nvidia.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                                        >
                                            build.nvidia.com <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                            {t('editor.nvidia_active_model')}
                                        </label>
                                        <select
                                            value={selectedNvidiaModel}
                                            onChange={(e) => handleSelectNvidiaModel(e.target.value)}
                                            className="w-full bg-black border border-emerald-500/40 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
                                        >
                                            {NVIDIA_FREE_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} {m.badge ? `• [${m.badge}]` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {(() => {
                                            const current = NVIDIA_FREE_MODELS.find(m => m.id === selectedNvidiaModel);
                                            if (!current) return null;
                                            return (
                                                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5">
                                                    <span className="text-emerald-400 font-bold">{current.badge}</span>: {current.description}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <input
                                value={project.title}
                                onChange={(e) => setProject({ ...project, title: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-primary outline-none"
                                placeholder={t('editor.music_title')}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={project.language}
                                    onChange={e => setProject({ ...project, language: e.target.value as any })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-zinc-300"
                                >
                                    <option value="Português (Brasil)">{t('editor.pt_br')}</option>
                                    <option value="Inglês">{t('editor.en')}</option>
                                    <option value="Espanhol">{t('editor.es')}</option>
                                </select>
                                <select
                                    value={project.sentiment}
                                    onChange={e => setProject({ ...project, sentiment: e.target.value })}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-zinc-300"
                                >
                                    {(sysSettings?.listSentiments || ["Neutro", "Feliz", "Triste", "Épico", "Romântico", "Agressivo"]).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 px-1 cursor-pointer group">
                                <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${project.musicType === MusicType.INSTRUMENTAL ? 'bg-primary border-primary' : 'border-zinc-600 bg-transparent'}`} onClick={() => setProject({ ...project, musicType: project.musicType === MusicType.INSTRUMENTAL ? MusicType.VOCAL : MusicType.INSTRUMENTAL })}>
                                    {project.musicType === MusicType.INSTRUMENTAL && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{t('editor.instrumental')}</span>
                            </label>
                        </section>

                        <div className="h-px bg-white/5 w-full" />

                        {/* Sound Engineering */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                                <Sliders className="w-3 h-3" /> {t('editor.style_production')}
                            </div>

                            {/* Tags Input */}
                            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-900/90 border border-white/10 rounded-lg min-h-[38px] max-h-24 overflow-y-auto custom-scrollbar focus-within:border-primary/50 transition-colors">
                                {project.styles.map((tag, i) => (
                                    <span key={i} className="text-[9px] font-medium bg-black border border-primary/40 text-primary px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                        {tag}
                                        <button onClick={() => removeStyleTag(tag)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                                    </span>
                                ))}
                                <input
                                    value={styleInput}
                                    onChange={(e) => setStyleInput(e.target.value)}
                                    onKeyDown={handleStyleKeyDown}
                                    className="flex-1 bg-transparent text-[11px] text-white outline-none min-w-[70px]"
                                    placeholder={t('editor.tags_placeholder')}
                                />
                            </div>

                            {/* Quick Suggestions & Autocomplete com Rolagem Compacta */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                                    <span>{styleInput.trim() ? t('editor.matching_rhythms') : t('editor.suggestions')}</span>
                                    {styleInput.trim() && (
                                        <span className="text-[9px] text-primary/80 lowercase font-normal">{t('editor.filtering_by')} "{styleInput}"</span>
                                    )}
                                </div>
                                <div className="max-h-24 overflow-y-auto custom-scrollbar p-1.5 bg-black/50 border border-white/5 rounded-lg flex flex-wrap gap-1">
                                    {((sysSettings?.listStyles || ["Pop", "Trap", "Synthwave"]) as string[])
                                        .filter((s: string) => 
                                            !project.styles.includes(s) &&
                                            (!styleInput.trim() || s.toLowerCase().includes(styleInput.trim().toLowerCase()))
                                        )
                                        .map((s: string) => (
                                            <button 
                                                key={s} 
                                                onClick={() => addStyleTag(s)} 
                                                className="text-[9px] px-2 py-0.5 bg-zinc-900 hover:bg-primary/20 hover:border-primary/40 border border-white/5 rounded text-zinc-300 hover:text-white transition-all flex items-center gap-1 shrink-0"
                                            >
                                                <span>+</span>
                                                <span>{s}</span>
                                            </button>
                                        ))}
                                    {styleInput.trim() && !project.styles.includes(styleInput.trim()) && (
                                        <button
                                            onClick={() => addStyleTag(styleInput.trim())}
                                            className="text-[9px] px-2 py-0.5 bg-primary/20 border border-primary/50 text-white rounded hover:bg-primary transition-all font-semibold flex items-center gap-1 shrink-0"
                                        >
                                            <span>{t('editor.create_tag')} "{styleInput.trim()}"</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <select
                                value={project.arsenal.quality}
                                onChange={e => setProject({ ...project, arsenal: { ...project.arsenal, quality: e.target.value as AudioQuality } })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 mt-2"
                            >
                                <option value={AudioQuality.MASTERED}>{t('editor.quality_mastered')}</option>
                                <option value={AudioQuality.STUDIO}>{t('editor.quality_studio')}</option>
                                <option value={AudioQuality.RAW}>{t('editor.quality_raw')}</option>
                            </select>

                            <button 
                                data-tour="arsenal"
                                onClick={() => setShowArsenal(true)} 
                                className="w-full py-3 bg-gradient-to-r from-primary to-[#ff8f66] hover:from-[#e05626] hover:to-primary rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all border border-white/10"
                            >
                                <Database className="w-3 h-3" /> {t('editor.open_arsenal')}
                            </button>
                        </section>

                        <div className="h-px bg-white/5 w-full" />

                        {/* Lyric Engine Grid */}
                        <section data-tour="lyric-engine" className="space-y-3 pb-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                                <FileText className="w-3 h-3" /> {t('editor.lyrics_generator')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleGenerateLyrics} className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-colors group">
                                    <Wand2 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-medium text-zinc-300">{t('editor.btn_generate')}</span>
                                </button>
                                <button onClick={handleArtistMode} className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-colors group">
                                    <Mic2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-medium text-zinc-300">{t('editor.btn_artist')}</span>
                                </button>
                                <button onClick={handleOptimizeLyrics} className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-colors group">
                                    <LayoutTemplate className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-medium text-zinc-300">{t('editor.btn_optimize')}</span>
                                </button>
                                <button 
                                    data-tour="dna"
                                    onClick={handleSonicDNA} 
                                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-colors group"
                                >
                                    <FileAudio className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-medium text-zinc-300">{t('editor.btn_sonic_dna')}</span>
                                </button>
                            </div>
                        </section>

                    </div>
                </div>

                {/* 2. CENTER - EDITOR (Fluid) */}
                <div className={`${activeTab === 'lyrics' ? 'flex' : 'hidden'} md:flex flex-1 bg-[#050505] p-4 md:p-8 flex flex-col relative overflow-hidden`}>
                    <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col h-full">

                        {/* Editor Header (Mac Style) */}
                        <div className="bg-zinc-900 rounded-t-xl border border-white/10 p-3 flex items-center justify-between select-none">
                            <div className="flex gap-1.5 ml-2 items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 hover:bg-red-500 transition-colors" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 hover:bg-yellow-500 transition-colors" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 hover:bg-green-500 transition-colors" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-3">{t('editor.composition_editor')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(project.lyrics)} className="mr-2 text-zinc-500 hover:text-white transition-colors" title={t('editor.copy_lyrics')}>
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Text Area */}
                        <textarea
                            value={isStreaming ? streamedText : project.lyrics}
                            onChange={(e) => !isStreaming && setProject({ ...project, lyrics: e.target.value })}
                            readOnly={isStreaming}
                            className={`flex-1 w-full bg-zinc-900/50 border-x border-b border-white/10 rounded-b-xl p-4 md:p-8 text-base md:text-lg font-mono leading-relaxed focus:outline-none resize-none text-zinc-200 placeholder-zinc-700 custom-scrollbar focus:bg-zinc-900/80 transition-colors ${isStreaming ? 'opacity-90' : ''}`}
                            placeholder={t('editor.placeholder_lyrics')}
                            spellCheck={false}
                        />

                        <div className="absolute bottom-6 md:bottom-12 right-10 md:right-14 text-[10px] text-zinc-600 font-mono pointer-events-none">
                            {project.lyrics.length} / 4000
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT SIDEBAR - PROMPT & OUTPUT (320px) */}
                <div className={`${activeTab === 'output' ? 'flex' : 'hidden'} md:flex w-full md:w-[320px] border-l border-white/10 bg-zinc-900 overflow-y-auto custom-scrollbar flex-col p-5 gap-5 shrink-0`}>

                    {/* BOTÃO PRINCIPAL DE ESTRUTURAÇÃO */}
                    <button
                        type="button"
                        onClick={handleGenerateStructure}
                        className="w-full py-3.5 bg-primary hover:bg-[#e05626] rounded-xl font-bold text-white shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xs uppercase tracking-wider"
                    >
                        <Cpu className="w-4 h-4" /> {t('editor.structure_final')}
                    </button>

                    {/* Prompt Output */}
                    <div data-tour="structured-prompt" className="flex-1 flex flex-col min-h-[260px]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                                {t('editor.structured_prompt_title')}
                            </label>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => copyToClipboard(project.promptFinal || generatedPrompt)} className="text-zinc-500 hover:text-white transition-colors" title={t('common.copy')}>
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-black border border-white/10 rounded-xl p-3.5 relative group">
                            <textarea
                                value={project.promptFinal || generatedPrompt}
                                onChange={(e) => setProject({ ...project, promptFinal: e.target.value })}
                                className="w-full h-full bg-transparent text-[11px] font-mono text-green-500/90 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                                placeholder={
                                    project.targetPlatform === MusicPlatform.UDIO
                                        ? "[UDIO PROMPT TAGS]\nfemale vocalist, synthwave, 80s, punchy bass, analog synths, reverb, 120 bpm\n\n[CUSTOM LYRICS]\n[Verse]\n...\n[Chorus]\n..."
                                        : project.targetPlatform === MusicPlatform.MUREKA
                                            ? "[SONG DESCRIPTION & PROMPT]\nGenre: ... Mood: ... Instruments: ... Vocals: ...\n\n[LYRICS & STRUCTURE]\n[Verse 1]\n...\n[Chorus]\n..."
                                            : project.targetPlatform === MusicPlatform.MAESTRO
                                                ? "[MUSIC STYLE / ALT_PROMPT]\nAcoustic Pop, warm expressive vocal, 90 BPM...\n\n[LETRA ESTRUTURADA YUE2]\n[Verse 1]\n...\n[Chorus]\n..."
                                                : "[STYLE OF MUSIC / PROMPT]\nacoustic folk, emotive male vocals, 110 bpm, guitar...\n\n[LETRA ESTRUTURADA]\n[Intro]\n[Verse 1]\n..."
                                }
                            />
                        </div>
                    </div>

                    {/* Style Description (Suno / Udio / YuE2) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Style Description (Suno / Udio / YuE2)
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                    ((project.stylePrompt || (project.extractedStyles || []).join(', ')) || '').length > 979
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : ((project.stylePrompt || (project.extractedStyles || []).join(', ')) || '').length >= 650
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                    {((project.stylePrompt || (project.extractedStyles || []).join(', ')) || '').length} / 979
                                </span>
                            </div>
                            <button
                                onClick={handleExtractTags}
                                className="text-[10px] bg-primary/20 hover:bg-primary/30 border border-primary/40 px-2 py-0.5 rounded text-primary hover:text-white transition-colors flex items-center gap-1 font-bold"
                            >
                                <Sparkles className="w-3 h-3" />
                                {t('editor.style_description_architect')}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={project.stylePrompt || (project.extractedStyles || []).join(', ')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setProject({
                                        ...project,
                                        stylePrompt: val,
                                        extractedStyles: [val]
                                    });
                                }}
                                rows={3}
                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-[11px] text-zinc-200 focus:outline-none focus:border-primary/50 resize-y custom-scrollbar leading-relaxed font-mono"
                                placeholder={t('editor.style_description_placeholder')}
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => copyToClipboard(project.stylePrompt || (project.extractedStyles || []).join(', '))}
                                className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Copy className="w-3 h-3" />
                                {t('editor.copy_style_description')}
                            </button>
                        </div>
                    </div>

                    {/* GERAR MÚSICA COM YUE2 (MAESTRO LOCAL) */}
                    <div className="p-3.5 bg-gradient-to-br from-primary/15 via-orange-950/20 to-zinc-900 border border-primary/30 rounded-xl flex flex-col gap-2.5 shadow-lg shadow-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                                    {t('editor.yue_neural_local')}
                                </span>
                            </div>
                            <span className={`flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full border ${
                                maestroOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border-white/5'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${maestroOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                                {maestroOnline ? t('editor.yue_ready') : t('editor.yue_offline')}
                            </span>
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-snug">
                            {t('editor.yue_neural_desc')}
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowYuEModal(true)}
                            className="w-full py-2.5 bg-primary hover:bg-[#e05626] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            <Wand2 className="w-3.5 h-3.5" /> {t('editor.yue_generate_action')}
                        </button>

                        {project.tracks && project.tracks.length > 0 && (
                            <div className="text-[10px] text-zinc-400 pt-1.5 border-t border-white/5 flex items-center justify-between">
                                <span>{t('editor.tracks_ready')} <strong className="text-white">{project.tracks.length}</strong></span>
                                <button
                                    type="button"
                                    onClick={() => setShowYuEModal(true)}
                                    className="text-primary hover:underline text-[10px] font-medium"
                                >
                                    {t('editor.listen_in_player')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Advanced Tools */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block">{t('editor.tools')}</label>
                            {hasStructuredPrompt ? (
                                <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                    {t('editor.tools_available')}
                                </span>
                            ) : (
                                <span className="text-[9px] font-medium text-zinc-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-full">
                                    {t('editor.tools_requires_final')}
                                </span>
                            )}
                        </div>

                        <button 
                            type="button"
                            onClick={() => {
                                if (hasStructuredPrompt) {
                                    setShowSectionRulesModal(true);
                                } else {
                                    showAlert("⚠️ O prompt final da música ainda não foi estruturado!\n\nClique no botão laranja 'GERAR PROMPT FINAL' primeiro para criar a estrutura das seções. Depois você poderá personalizar as regras, voz rasgada, melismas e efeitos de cada parte da música.");
                                }
                            }}
                            className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all mb-2 ${
                                hasStructuredPrompt
                                    ? 'bg-zinc-800 hover:bg-primary/20 text-white border border-primary/40 hover:border-primary shadow-sm shadow-primary/10 cursor-pointer'
                                    : 'bg-zinc-900 border border-white/5 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/60'
                            }`}
                            title={hasStructuredPrompt ? "Editar regras e efeitos vocais por seção" : "Gere o prompt final primeiro para liberar"}
                        >
                            <Sliders className={`w-3.5 h-3.5 ${hasStructuredPrompt ? 'text-primary' : 'text-zinc-500'}`} />
                            {t('editor.detailed_instructions')}
                            {hasStructuredPrompt && (
                                <span className="text-[10px] text-primary/80 font-normal">
                                    {t('editor.customize_section')}
                                </span>
                            )}
                        </button>

                        <div className="relative">
                            <input
                                className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-700 pr-16"
                                placeholder={t('editor.remix_placeholder') || "Ex: Deixe mais agressivo, voz rasgada..."}
                                value={customInstruction}
                                onChange={(e) => setCustomInstruction(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (hasStructuredPrompt) {
                                            setShowSectionRulesModal(true);
                                        } else {
                                            showAlert("⚠️ O prompt final da música ainda não foi estruturado. Clique em 'GERAR PROMPT FINAL' primeiro.");
                                        }
                                    }
                                }}
                            />
                            {customInstruction.trim() && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasStructuredPrompt) {
                                            setShowSectionRulesModal(true);
                                        } else {
                                            showAlert("⚠️ O prompt final da música ainda não foi estruturado. Clique em 'GERAR PROMPT FINAL' primeiro.");
                                        }
                                    }}
                                    className="absolute right-1.5 top-1.5 px-2 py-0.5 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded text-[10px] font-bold transition-colors"
                                >
                                    {t('editor.open_action')}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowYuEModal(true)}
                        className="w-full py-3.5 bg-primary hover:bg-[#e05626] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-primary/30 mt-auto transition-colors text-white shadow-lg shadow-primary/25"
                    >
                        <Music className="w-4 h-4 text-white" />
                        {t('editor.produce_music_yue2')}
                    </button>
                </div>

                {/* Mobile Navigation Tabs */}
                <div className="md:hidden flex border-t border-white/10 bg-zinc-950 p-2 gap-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'controls' ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/5 text-zinc-400'}`}
                    >
                        <Sliders className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">{t('editor.tab_controls')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('lyrics')}
                        className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'lyrics' ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/5 text-zinc-400'}`}
                    >
                        <FileText className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">{t('editor.tab_lyrics')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === 'output' ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/5 text-zinc-400'}`}
                    >
                        <Cpu className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">{t('editor.tab_output')}</span>
                    </button>
                </div>

            </div>

            <ArsenalModal
                isOpen={showArsenal}
                onClose={() => setShowArsenal(false)}
                settings={project.arsenal}
                onChange={(newArsenal) => setProject({ ...project, arsenal: newArsenal })}
            />



            {/* Global Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-center p-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-8 mb-2">{loadingMessage}</h2>
                    <p className="text-zinc-300 text-sm max-w-lg leading-relaxed">
                        {aiProvider === AIProvider.OLLAMA 
                            ? t('editor.ollama_waiting_msg')
                            : t('editor.cloud_waiting_msg')}
                    </p>
                    <div className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{aiProvider === AIProvider.OLLAMA ? t('editor.ollama_waiting_sub') : t('editor.cloud_waiting_sub')}</span>
                    </div>
                </div>
            )}

            {/* CUSTOM MODAL SYSTEM (Prompt, Select & Alert) */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in zoom-in duration-300">
                        {modalConfig.type === 'key_missing' ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="text-xs text-zinc-300 space-y-1">
                                        <p className="font-bold text-white text-sm">{t('editor.missing_key_title')}</p>
                                        <p className="leading-relaxed text-zinc-300">{modalConfig.title}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                                            navigate('/settings');
                                        }}
                                        className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-[#e05626] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <Key className="w-4 h-4" /> {t('editor.btn_settings_key')}
                                    </button>

                                    {isOllamaOnline && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setModalConfig(prev => ({ ...prev, isOpen: false }));
                                                handleSelectProvider(AIProvider.OLLAMA);
                                            }}
                                            className="w-full py-2.5 bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            🦙 {t('editor.btn_ollama_local')}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => modalConfig.onConfirm('')}
                                        className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors text-center"
                                    >
                                        {t('common.close')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-sm font-bold text-white whitespace-pre-wrap leading-relaxed">{modalConfig.title}</h2>
                                {modalConfig.type === 'prompt' && (
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-primary/50"
                                        placeholder={modalConfig.placeholder}
                                        value={modalConfig.value}
                                        onChange={(e) => setModalConfig({ ...modalConfig, value: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && modalConfig.onConfirm(modalConfig.value)}
                                    />
                                )}
                                {modalConfig.type === 'select' && modalConfig.options && modalConfig.options.length > 0 && (
                                    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                                        {modalConfig.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setModalConfig({ ...modalConfig, value: opt })}
                                                className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${modalConfig.value === opt ? 'bg-primary/20 border-primary/50 text-white' : 'bg-black border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end mt-2">
                                    {modalConfig.type !== 'alert' && (
                                        <button
                                            className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-transparent transition-colors"
                                            onClick={() => modalConfig.onConfirm('')}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    )}
                                    <button
                                        className="px-5 py-2 min-w-[100px] rounded-lg text-xs font-bold text-white bg-primary hover:bg-[#e05626] shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        onClick={() => modalConfig.onConfirm(modalConfig.value)}
                                    >
                                        {modalConfig.type === 'prompt' ? t('common.confirm_action') : modalConfig.type === 'select' ? (t('common.choose') || 'Escolher') : t('common.ok')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Regras de Seção & Efeitos Vocais */}
            <SectionRulesModal
                isOpen={showSectionRulesModal}
                onClose={() => setShowSectionRulesModal(false)}
                promptFinal={project.promptFinal || generatedPrompt}
                onSave={handleSaveSectionRules}
                targetPlatform={project.targetPlatform}
            />

            <YuEGenerationModal
                isOpen={showYuEModal}
                onClose={() => setShowYuEModal(false)}
                initialLyrics={project.promptFinal || generatedPrompt || project.lyrics}
                initialStyle={(project.stylePrompt && project.stylePrompt.trim().length > 0) ? project.stylePrompt : ((project.extractedStyles && project.extractedStyles.length > 0) ? project.extractedStyles.join(', ') : project.styles.join(', '))}
                structuredPrompt={project.promptFinal || generatedPrompt}
                projectTitle={project.title}
                onTrackSaved={handleTrackSaved}
                existingTracks={project.tracks || []}
            />

            <GuidedTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={() => setShowTour(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

        </motion.div>
    );
};

