import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Play, Pause, Download, Music, Sparkles, RefreshCw,
    AlertCircle, CheckCircle2, Square, Volume2, VolumeX,
    Sliders, FileText, Disc3, Clock, Hash, Wand2, Radio,
    CloudDownload, HardDrive, Check, ShieldCheck,
    Upload, Music2, FileAudio
} from 'lucide-react';
import {
    checkMaestroStatus,
    detectMaestroEndpoint,
    generateMusicWithYuE2,
    fetchJobProgress,
    cancelYuEJob,
    getAudioFileUrl,
    getAudioDownloadUrl,
    downloadAudioFileDirectly,
    fetchModelStatus,
    startModelDownload,
    fetchModelDownloadProgress,
    cancelModelDownload,
    humanizeAudioFile,
    uploadAudioForCover,
    getMaestroEndpoint,
    saveMaestroEndpoint,
    MaestroStatus,
    YuEJobProgress,
    ModelStatusInfo,
    ModelDownloadState
} from '../services/maestroService';
import { parseStructuredPrompt } from '../services/aiService';
import { YuETrack } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface YuEGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLyrics: string;
    initialStyle: string;
    structuredPrompt?: string;
    projectTitle: string;
    onTrackSaved: (track: YuETrack) => void;
    existingTracks?: YuETrack[];
}

export const YuEGenerationModal: React.FC<YuEGenerationModalProps> = ({
    isOpen,
    onClose,
    initialLyrics,
    initialStyle,
    structuredPrompt,
    projectTitle,
    onTrackSaved,
    existingTracks = []
}) => {
    const { t } = useLanguage();

    // Form Inputs
    const [lyrics, setLyrics] = useState(initialLyrics);
    const [style, setStyle] = useState(initialStyle);
    const [durationSeconds, setDurationSeconds] = useState(120);
    const [modelMode, setModelMode] = useState<number>(2); // 2: Direct, 0: Chords, 1: Melody
    const [numSteps, setNumSteps] = useState(32);
    const [seed, setSeed] = useState<string>("");
    const [abcScore, setAbcScore] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [autoHumanize, setAutoHumanize] = useState(true);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [humanizeSuccess, setHumanizeSuccess] = useState<string | null>(null);

    // Audio Reference (Cover / SheetSage2) State
    const [audioGuideFile, setAudioGuideFile] = useState<File | null>(null);
    const [audioGuideData, setAudioGuideData] = useState<{ filename: string; original_name: string; url: string } | null>(null);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const audioGuideInputRef = useRef<HTMLInputElement | null>(null);

    // Connection & Maestro State
    const [maestroStatus, setMaestroStatus] = useState<MaestroStatus>({
        online: false,
        endpoint: getMaestroEndpoint(),
        activeJobsCount: 0
    });
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // Model Download & Status State
    const [modelStatus, setModelStatus] = useState<ModelStatusInfo | null>(null);
    const [isCheckingModel, setIsCheckingModel] = useState(false);
    const [isDownloadingModel, setIsDownloadingModel] = useState(false);
    const [modelDownloadProgress, setModelDownloadProgress] = useState<ModelDownloadState | null>(null);

    // Job Execution State
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressData, setProgressData] = useState<YuEJobProgress | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Audio Playback State
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
    const [currentAudioTitle, setCurrentAudioTitle] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pollingIntervalRef = useRef<any>(null);
    const modelPollingRef = useRef<any>(null);
    const timerIntervalRef = useRef<any>(null);

    // Sanitiza a letra para o motor neural YuE2, eliminando colchetes órfãos
    const sanitizeYuELyrics = (text: string): string => {
        if (!text) return '';
        return text
            .split(/\r?\n/)
            .filter(line => {
                const t = line.trim();
                return t !== ']' && t !== '[' && t !== '[]' && t !== ']]' && t !== '[[';
            })
            .map(line => line.replace(/^\s*\]+\s*/, ''))
            .join('\n')
            .trim();
    };

    // Sincroniza letra e estilo a partir do prompt estruturado
    const syncFromStructuredPrompt = () => {
        const fullStructured = (structuredPrompt && structuredPrompt.trim()) || (initialLyrics && initialLyrics.trim());
        if (!fullStructured) return;

        const parsed = parseStructuredPrompt(fullStructured);
        // Preserva o prompt estruturado integralmente como compilado no editor
        setLyrics(sanitizeYuELyrics(fullStructured));

        if (initialStyle && initialStyle.trim().length > 0) {
            setStyle(initialStyle);
        } else if (parsed.styleText && parsed.styleText.trim().length > 0) {
            setStyle(parsed.styleText);
        }
    };

    // Sync initial props when opened
    useEffect(() => {
        if (isOpen) {
            const fullStructured = (structuredPrompt && structuredPrompt.trim()) || (initialLyrics && initialLyrics.trim());
            if (fullStructured) {
                const parsed = parseStructuredPrompt(fullStructured);
                // Carrega o prompt estruturado integralmente exatamente como gerado e exibido no painel
                setLyrics(sanitizeYuELyrics(fullStructured));

                if (initialStyle && initialStyle.trim().length > 0) {
                    setStyle(initialStyle);
                } else if (parsed.styleText && parsed.styleText.trim().length > 0) {
                    setStyle(parsed.styleText);
                }
            } else if (initialLyrics) {
                setLyrics(sanitizeYuELyrics(initialLyrics));
                if (initialStyle) setStyle(initialStyle);
            }
            verifyConnection();
        } else {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (modelPollingRef.current) clearInterval(modelPollingRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    }, [isOpen]);

    // Keep inputs updated when parent values change
    useEffect(() => {
        const full = (structuredPrompt && structuredPrompt.trim()) || (initialLyrics && initialLyrics.trim());
        if (full) setLyrics(sanitizeYuELyrics(full));
    }, [initialLyrics, structuredPrompt]);

    useEffect(() => {
        if (initialStyle) setStyle(initialStyle);
    }, [initialStyle]);

    // Connection verify / auto-detect
    const verifyConnection = async () => {
        setIsCheckingStatus(true);
        try {
            const detected = await detectMaestroEndpoint();
            const status = await checkMaestroStatus(detected.endpoint);
            setMaestroStatus(status);

            if (status.online) {
                await checkModels(detected.endpoint);
            }
        } catch (e) {
            setMaestroStatus({
                online: false,
                endpoint: getMaestroEndpoint(),
                activeJobsCount: 0
            });
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Verifica status dos modelos no servidor
    const checkModels = async (endpoint?: string) => {
        setIsCheckingModel(true);
        try {
            const mStatus = await fetchModelStatus(endpoint);
            setModelStatus(mStatus);
            if (mStatus.download && mStatus.download.status === 'downloading') {
                setIsDownloadingModel(true);
                setModelDownloadProgress(mStatus.download);
                startModelDownloadPolling(endpoint);
            }
        } catch (e) {
            console.warn("Não foi possível obter status dos modelos:", e);
        } finally {
            setIsCheckingModel(false);
        }
    };

    // Inicia download direto dos modelos YuE2
    const handleStartModelDownload = async () => {
        setIsDownloadingModel(true);
        setErrorMessage(null);
        try {
            await startModelDownload();
            startModelDownloadPolling();
        } catch (err: any) {
            setIsDownloadingModel(false);
            setErrorMessage(err.message || "Erro ao iniciar download dos modelos.");
        }
    };

    // Polling do progresso do download dos modelos
    const startModelDownloadPolling = (endpoint?: string) => {
        if (modelPollingRef.current) clearInterval(modelPollingRef.current);

        modelPollingRef.current = setInterval(async () => {
            try {
                const progress = await fetchModelDownloadProgress(endpoint);
                setModelDownloadProgress(progress);

                if (progress.status === 'completed') {
                    clearInterval(modelPollingRef.current);
                    setIsDownloadingModel(false);
                    await checkModels(endpoint);
                } else if (progress.status === 'failed' || progress.status === 'cancelled') {
                    clearInterval(modelPollingRef.current);
                    setIsDownloadingModel(false);
                    if (progress.error) {
                        setErrorMessage(`Falha no download dos modelos: ${progress.error}`);
                    }
                    await checkModels(endpoint);
                }
            } catch (e) {
                console.error("Erro no polling de download de modelos:", e);
            }
        }, 1500);
    };

    const handleCancelModelDownload = async () => {
        try {
            await cancelModelDownload();
            if (modelPollingRef.current) clearInterval(modelPollingRef.current);
            setIsDownloadingModel(false);
            await checkModels();
        } catch (e) { }
    };

    // Elapsed timer while generating
    useEffect(() => {
        if (isGenerating) {
            setElapsedSeconds(0);
            timerIntervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isGenerating]);

    // Job Polling
    const startPolling = (jobId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const info = await fetchJobProgress(jobId);
                setProgressData(info);

                if (info.status === 'completed') {
                    clearInterval(pollingIntervalRef.current);
                    setIsGenerating(false);

                    let audioUrl = "";
                    let audioFilename = "";
                    if (info.outputFiles && info.outputFiles.length > 0) {
                        audioFilename = info.outputFiles[0];
                        audioUrl = getAudioFileUrl(audioFilename);
                    }

                    if (audioUrl) {
                        setCurrentAudioUrl(audioUrl);
                        setCurrentAudioTitle(`${projectTitle || 'Música'} · YuE2`);

                        const newTrack: YuETrack = {
                            id: `yue-${Date.now()}`,
                            jobId,
                            name: audioFilename || `${projectTitle || 'Música'} (YuE2)`,
                            audioUrl,
                            duration: durationSeconds,
                            lyricsSnippet: lyrics.substring(0, 100),
                            styleSnippet: style.substring(0, 80),
                            createdAt: new Date().toISOString(),
                            seed: seed ? parseInt(seed) : undefined
                        };
                        onTrackSaved(newTrack);
                    }
                } else if (info.status === 'failed' || info.status === 'cancelled') {
                    clearInterval(pollingIntervalRef.current);
                    setIsGenerating(false);
                    if (info.error) {
                        setErrorMessage(info.error);
                    }
                }
            } catch (err: any) {
                console.error("Erro no polling do YuE2:", err);
            }
        }, 1800);
    };

    // Form submission
    const handleStartGeneration = async () => {
        if (!lyrics.trim()) {
            setErrorMessage("Insira a letra da música antes de gerar.");
            return;
        }

        if (!style.trim()) {
            setErrorMessage("Descreva o estilo musical (gênero, instrumentos, vocais).");
            return;
        }

        if (modelStatus && !modelStatus.installed) {
            setErrorMessage("Os modelos neurais do YuE2 ainda não estão instalados. Clique no botão de download acima.");
            return;
        }

        setErrorMessage(null);
        setIsGenerating(true);
        setCurrentAudioUrl(null);
        setProgressData({
            jobId: 'novo',
            status: 'queued',
            progress: 0.02,
            step: 0,
            totalSteps: numSteps,
            phase: (modelMode !== 2 && audioGuideData) ? 'Analisando áudio com SheetSage2...' : 'Iniciando produção no YuE2...',
            message: (modelMode !== 2 && audioGuideData) ? 'Transcrevendo melodia e harmonia para partitura ABC...' : 'Alocando tensores neurais na GPU...',
            outputFiles: []
        });

        try {
            const parsedSeed = seed.trim() ? parseInt(seed.trim()) : undefined;
            const cleanLyrics = sanitizeYuELyrics(lyrics.trim());
            const res = await generateMusicWithYuE2({
                lyrics: cleanLyrics,
                style: style.trim(),
                durationSeconds,
                modelMode,
                numInferenceSteps: numSteps,
                seed: parsedSeed,
                abc: abcScore.trim() || undefined,
                humanize: autoHumanize,
                audioGuide: (modelMode !== 2 && audioGuideData) ? audioGuideData.filename : undefined,
                audioPromptType: (modelMode !== 2 && audioGuideData) ? "A" : ""
            });

            setActiveJobId(res.jobId);
            startPolling(res.jobId);
        } catch (err: any) {
            setIsGenerating(false);
            setErrorMessage(err.message || "Erro ao conectar com a API do YuE2.");
        }
    };

    const handleAudioUpload = async (file: File) => {
        if (!file) return;
        setIsUploadingAudio(true);
        setErrorMessage(null);
        try {
            // Medir duração do áudio para ajustar automaticamente o slider
            try {
                const objectUrl = URL.createObjectURL(file);
                const tempAudio = new Audio(objectUrl);
                tempAudio.onloadedmetadata = () => {
                    if (tempAudio.duration && !isNaN(tempAudio.duration) && tempAudio.duration > 0) {
                        const totalSecs = Math.ceil(tempAudio.duration);
                        const adjusted = Math.min(600, Math.max(30, Math.ceil(totalSecs / 10) * 10));
                        setDurationSeconds(adjusted);
                    }
                    URL.revokeObjectURL(objectUrl);
                };
            } catch (e) {
                console.warn("Não foi possível pré-calcular duração do áudio", e);
            }

            const res = await uploadAudioForCover(file);
            setAudioGuideFile(file);
            setAudioGuideData({
                filename: res.filename,
                original_name: res.original_name,
                url: res.url
            });
        } catch (err: any) {
            setErrorMessage(err.message || "Erro ao enviar áudio de referência.");
        } finally {
            setIsUploadingAudio(false);
        }
    };

    const removeAudioGuide = () => {
        setAudioGuideFile(null);
        setAudioGuideData(null);
        if (audioGuideInputRef.current) {
            audioGuideInputRef.current.value = "";
        }
    };

    // Humanização sob demanda de faixa existente
    const handleHumanizeTrack = async (targetFilename?: string) => {
        const fileToClean = targetFilename || (progressData?.outputFiles && progressData.outputFiles[0]) || "";
        if (!fileToClean) {
            setErrorMessage("Nenhum arquivo de áudio disponível para humanizar.");
            return;
        }

        setIsHumanizing(true);
        setHumanizeSuccess(null);
        setErrorMessage(null);
        try {
            const res = await humanizeAudioFile(fileToClean);
            if (res.ok) {
                setCurrentAudioUrl(res.url);
                setHumanizeSuccess(`Digitais de IA removidas! Áudio masterizado em PCM 24-bit com saturação de fita.`);
                if (progressData) {
                    setProgressData({
                        ...progressData,
                        outputFiles: [res.humanized_file, ...(progressData.outputFiles || [])]
                    });
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Erro ao processar remoção de digitais.");
        } finally {
            setIsHumanizing(false);
        }
    };

    const handleCancel = async () => {
        if (!activeJobId) return;
        try {
            await cancelYuEJob(activeJobId);
        } catch (e) { }
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setIsGenerating(false);
        setActiveJobId(null);
    };

    // Audio Playback Handlers
    const togglePlay = () => {
        if (!audioRef.current || !currentAudioUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!isOpen) return null;

    const areModelsMissing = maestroStatus.online && modelStatus && !modelStatus.installed;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                        {t('yue.title')}
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono font-bold">
                                            {t('yue.badge')}
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-xs text-zinc-400">
                                    {t('yue.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* Status do Motor & Close */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-xs">
                                <span className={`w-2 h-2 rounded-full ${maestroStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-[11px] font-medium text-zinc-300">
                                    {maestroStatus.online ? t('yue.online') : t('yue.offline')}
                                </span>
                                <button
                                    onClick={verifyConnection}
                                    disabled={isCheckingStatus || isCheckingModel}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    title={t('yue.verify_connection')}
                                >
                                    <RefreshCw className={`w-3 h-3 ${(isCheckingStatus || isCheckingModel) ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Pipeline Loading / Memory Allocation Notice */}
                    {maestroStatus.online && maestroStatus.isLoadingPipeline && (
                        <div className="px-5 py-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                            <div>
                                <p className="font-bold text-white">{t('yue.loading_pipeline')}</p>
                                <p className="text-[11px] text-amber-300/80">
                                    {maestroStatus.pipelineLoadingPhase || t('yue.loading_pipeline_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Offline Warning Banner */}
                    {!maestroStatus.online && (
                        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>
                                    {t('yue.offline_warning')}
                                </span>
                            </div>
                            <button
                                onClick={verifyConnection}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium rounded-lg text-[11px] border border-amber-500/30 transition-colors shrink-0"
                            >
                                {t('yue.btn_reconnect')}
                            </button>
                        </div>
                    )}

                    {/* Model Download Banner / In-Progress Card */}
                    {maestroStatus.online && isDownloadingModel && (
                        <div className="px-5 py-3.5 bg-blue-500/10 border-b border-blue-500/30 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-blue-300 font-semibold">
                                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span>{t('yue.downloading_models')} <code className="text-white font-mono">{modelDownloadProgress?.current_file || t('yue.starting')}</code></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {modelDownloadProgress?.speed && (
                                        <span className="text-[11px] text-blue-300/80 font-mono">{modelDownloadProgress.speed}</span>
                                    )}
                                    <span className="text-[11px] font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/40 font-mono">
                                        {Math.round((modelDownloadProgress?.progress || 0) * 100)}%
                                    </span>
                                    <button
                                        onClick={handleCancelModelDownload}
                                        className="text-[10px] text-red-400 hover:text-red-300 underline"
                                    >
                                        {t('yue.cancel')}
                                    </button>
                                </div>
                            </div>
                            <div className="w-full bg-blue-950/60 rounded-full h-2 overflow-hidden border border-blue-500/20">
                                <div
                                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(5, (modelDownloadProgress?.progress || 0) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-400">
                                {t('yue.download_files_status')
                                    .replace('{downloaded}', String(modelDownloadProgress?.downloaded_files || 0))
                                    .replace('{total}', String(modelDownloadProgress?.total_files || 5))}
                            </p>
                        </div>
                    )}

                    {areModelsMissing && !isDownloadingModel && (
                        <div className="px-5 py-3 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                            <div className="flex items-center gap-2.5">
                                <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">{t('yue.models_not_installed')}</p>
                                    <p className="text-[11px] text-amber-200/80">
                                        {t('yue.models_not_installed_desc')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartModelDownload}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all shrink-0 active:scale-95"
                            >
                                <CloudDownload className="w-4 h-4" /> {t('yue.btn_download_models')}
                            </button>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">

                        {/* Error Alert */}
                        {errorMessage && (
                            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="flex-1">{errorMessage}</div>
                                <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Letra / Lyrics Input */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-primary" /> {t('yue.lyrics_label')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {structuredPrompt && structuredPrompt.trim() && (
                                            <button
                                                type="button"
                                                onClick={syncFromStructuredPrompt}
                                                className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-all active:scale-95"
                                                title={t('yue.sync_structure_title')}
                                            >
                                                <Sparkles className="w-3 h-3 text-amber-400" />
                                                {t('yue.btn_sync_structure')}
                                            </button>
                                        )}
                                        <span className="text-[10px] text-zinc-500 font-mono">Tags: [Verse], [Chorus]</span>
                                    </div>
                                </div>
                                <textarea
                                    value={lyrics}
                                    onChange={(e) => setLyrics(e.target.value)}
                                    disabled={isGenerating}
                                    rows={8}
                                    placeholder={t('yue.lyrics_placeholder')}
                                    className="w-full flex-1 bg-zinc-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono custom-scrollbar resize-none leading-relaxed"
                                />
                                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                                    <span>{t('yue.lyrics_hint')}</span>
                                    <span>{lyrics.length} {t('yue.characters')}</span>
                                </div>
                            </div>

                            {/* Estilo Sonoro & Configurações */}
                            <div className="flex flex-col space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Disc3 className="w-3.5 h-3.5 text-orange-400" /> {t('yue.style_label')}
                                        </label>
                                        <span className="text-[10px] text-zinc-500">{t('yue.style_hint')}</span>
                                    </div>
                                    <textarea
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        disabled={isGenerating}
                                        rows={3}
                                        placeholder={t('yue.style_placeholder')}
                                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none"
                                    />
                                </div>

                                {/* Duração Máxima */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 text-primary" /> {t('yue.duration_label')}
                                        </label>
                                        <span className="text-xs font-mono font-bold text-primary">
                                            {durationSeconds}s ({Math.floor(durationSeconds/60)}m {durationSeconds%60 > 0 ? `${durationSeconds%60}s` : ''})
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="30"
                                        max="600"
                                        step="10"
                                        value={durationSeconds}
                                        onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                                        disabled={isGenerating}
                                        className="w-full accent-primary cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                                    />
                                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                        <span>30s</span>
                                        <span className="text-[10px] text-zinc-500">{t('yue.duration_hint')}</span>
                                        <span>600s (10m)</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                        {[
                                            { label: '30s', secs: 30 },
                                            { label: '1m', secs: 60 },
                                            { label: '2m', secs: 120 },
                                            { label: '3m', secs: 180 },
                                            { label: '5m', secs: 300 },
                                            { label: '7m', secs: 420 },
                                            { label: '8m', secs: 480 },
                                            { label: '10m', secs: 600 }
                                        ].map((preset) => (
                                            <button
                                                key={preset.secs}
                                                type="button"
                                                onClick={() => setDurationSeconds(preset.secs)}
                                                disabled={isGenerating}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                                                    durationSeconds === preset.secs
                                                        ? 'bg-primary text-black font-bold shadow-sm'
                                                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/5'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Modo de Geração YuE2 */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                                        {t('yue.mode_label')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 2, label: t('yue.mode_direct'), desc: t('yue.mode_direct_desc') },
                                            { id: 0, label: t('yue.mode_chords'), desc: t('yue.mode_chords_desc') },
                                            { id: 1, label: t('yue.mode_melody'), desc: t('yue.mode_melody_desc') }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setModelMode(m.id)}
                                                disabled={isGenerating}
                                                className={`p-2 rounded-xl border text-left transition-all ${
                                                    modelMode === m.id
                                                        ? 'bg-primary/20 border-primary/50 text-white'
                                                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/10'
                                                }`}
                                            >
                                                <div className="text-[11px] font-bold">{m.label}</div>
                                                <div className="text-[9px] text-zinc-500 truncate">{m.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Upload de Áudio para Cover / Transcrição Harmônica (SheetSage2) */}
                                {(modelMode === 0 || modelMode === 1) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Music2 className="w-4 h-4 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-200">
                                                    {t('yue.audio_guide_title')}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                                    SheetSage2 + MERT2
                                                </span>
                                            </div>
                                            {audioGuideData && (
                                                <button
                                                    type="button"
                                                    onClick={removeAudioGuide}
                                                    disabled={isGenerating}
                                                    className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <X className="w-3 h-3" /> {t('yue.btn_remove_audio')}
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                                            {modelMode === 0
                                                ? t('yue.guide_chords_desc')
                                                : t('yue.guide_melody_desc')}
                                        </p>

                                        {audioGuideData ? (
                                            <div className="p-2.5 bg-black/40 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                                        <FileAudio className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-white truncate">
                                                            {audioGuideData.original_name}
                                                        </div>
                                                        <div className="text-[10px] text-amber-400/90 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> {t('yue.audio_ready')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <audio controls src={audioGuideData.url} className="h-7 max-w-[200px] shrink-0" />
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => !isUploadingAudio && !isGenerating && audioGuideInputRef.current?.click()}
                                                className={`p-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                                                    isUploadingAudio
                                                        ? 'border-amber-500/50 bg-amber-500/10'
                                                        : 'border-white/10 hover:border-amber-500/40 bg-black/20 hover:bg-black/30'
                                                }`}
                                            >
                                                <input
                                                    ref={audioGuideInputRef}
                                                    type="file"
                                                    accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleAudioUpload(f);
                                                    }}
                                                    className="hidden"
                                                    disabled={isUploadingAudio || isGenerating}
                                                />
                                                <div className="flex items-center justify-center gap-2 text-zinc-300">
                                                    {isUploadingAudio ? (
                                                        <>
                                                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                                                            <span className="text-xs font-semibold">{t('yue.uploading_audio')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4 text-amber-400" />
                                                            <span className="text-xs font-semibold">
                                                                {t('yue.upload_audio_placeholder')}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-1">
                                                    {t('yue.upload_audio_hint')}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Anti-Detecção IA & Masterização Analógica */}
                                <div className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center justify-between gap-3 shadow-inner">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                                                {t('yue.humanizer_title')}
                                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">24-bit</span>
                                            </div>
                                            <div className="text-[10px] text-indigo-200/70 leading-tight">
                                                {t('yue.humanizer_desc')}
                                            </div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={autoHumanize}
                                            onChange={(e) => setAutoHumanize(e.target.checked)}
                                            disabled={isGenerating}
                                            className="sr-only peer"
                                        />
                                        <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                {/* Botão Opções Avançadas */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Sliders className="w-3 h-3 text-primary" />
                                        {showAdvanced ? t('yue.hide_advanced') : t('yue.show_advanced')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Configurações Avançadas */}
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-3"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                                            {t('yue.steps_label')}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="16"
                                                max="64"
                                                step="4"
                                                value={numSteps}
                                                onChange={(e) => setNumSteps(parseInt(e.target.value))}
                                                disabled={isGenerating}
                                                className="flex-1 accent-primary cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                                            />
                                            <span className="text-xs font-mono font-bold text-primary w-8">{numSteps}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500">{t('yue.steps_hint')}</span>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                                            <Hash className="w-3 h-3 text-primary" /> {t('yue.seed_label')}
                                        </label>
                                        <input
                                            type="text"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                                            disabled={isGenerating}
                                            placeholder={t('yue.seed_placeholder')}
                                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                                        {t('yue.abc_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={abcScore}
                                        onChange={(e) => setAbcScore(e.target.value)}
                                        disabled={isGenerating || modelMode === 2}
                                        placeholder={modelMode === 2 ? t('yue.abc_disabled') : "Ex: X:1\nT:Melody\nM:4/4\nK:C\n..."}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary font-mono disabled:opacity-40"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Progress Bar & Status (quando gerando) */}
                        {isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gradient-to-br from-zinc-900 to-black border border-primary/30 rounded-xl space-y-3 shadow-xl"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                                        <span className="font-bold text-white">
                                            {progressData?.phase || t('yue.generating_music')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-mono text-zinc-400">
                                            {formatTime(elapsedSeconds)}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-primary">
                                            {Math.round((progressData?.progress || 0) * 100)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30 transition-colors"
                                        >
                                            {t('yue.cancel')}
                                        </button>
                                    </div>
                                </div>

                                {/* Aviso de Alocação de Tensores / Espera por Hardware */}
                                {(progressData?.status === 'loading' || (progressData?.progress || 0) <= 0.08 || (progressData?.phase && progressData.phase.toLowerCase().includes('carregando'))) && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200">
                                        <div className="flex items-center gap-2 font-bold text-amber-300">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                                            <span>{t('yue.loading_tensors').replace('{hardware}', maestroStatus.gpu || 'Hardware')}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                                            {t('yue.hardware_loading_wait')}
                                        </p>
                                    </div>
                                )}

                                {/* Barra de progresso */}
                                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-primary via-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(5, (progressData?.progress || 0) * 100)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                    <span>{progressData?.message || t('yue.processing_tokens')}</span>
                                    <span>{t('yue.model_info')}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Player de Áudio Concluído */}
                        {currentAudioUrl && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3"
                            >
                                {humanizeSuccess && (
                                    <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                            <span>{humanizeSuccess}</span>
                                        </div>
                                        <button onClick={() => setHumanizeSuccess(null)} className="text-indigo-400 hover:text-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                                {currentAudioTitle}
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                                                    WAV 48kHz
                                                </span>
                                                {currentAudioUrl?.includes('_humanized') && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono flex items-center gap-1">
                                                        <ShieldCheck className="w-2.5 h-2.5" /> {t('yue.humanized_badge')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-zinc-400">
                                                {currentAudioUrl?.includes('_humanized')
                                                    ? t('yue.humanized_success_desc')
                                                    : t('yue.generated_success')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleHumanizeTrack()}
                                            disabled={isHumanizing}
                                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                            title="Remover marcas d'água de IA, metadados e aplicar saturação analógica"
                                        >
                                            {isHumanizing ? (
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                            ) : (
                                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                            )}
                                            {isHumanizing ? t('yue.humanizing') : t('yue.btn_humanize')}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => downloadAudioFileDirectly(currentAudioUrl, `${projectTitle || 'musica-yue2'}.wav`)}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                                        >
                                            <Download className="w-3.5 h-3.5" /> {t('yue.btn_download_wav')}
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Audio Controls */}
                                <audio
                                    ref={audioRef}
                                    src={currentAudioUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={() => setIsPlaying(false)}
                                />

                                <div className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={togglePlay}
                                            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                        </button>

                                        {/* Scrub bar */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={audioDuration || 100}
                                            step="0.1"
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="flex-1 accent-emerald-400 cursor-pointer h-1.5 rounded-lg"
                                        />

                                        <div className="text-[11px] font-mono text-zinc-400 shrink-0">
                                            {formatTime(currentTime)} / {formatTime(audioDuration)}
                                        </div>

                                        <button
                                            onClick={toggleMute}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Recent project tracks com Download Direto */}
                        {existingTracks.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>{t('yue.project_tracks')} ({existingTracks.length})</span>
                                </div>

                                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                    {existingTracks.map((tTrack) => (
                                        <div
                                            key={tTrack.id}
                                            className="flex items-center justify-between p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 rounded-lg transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <Music className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="text-zinc-200 font-medium truncate">{tTrack.name}</span>
                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                    {new Date(tTrack.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setCurrentAudioUrl(tTrack.audioUrl);
                                                        setCurrentAudioTitle(tTrack.name);
                                                        if (audioRef.current) {
                                                            audioRef.current.currentTime = 0;
                                                            audioRef.current.play().catch(() => {});
                                                            setIsPlaying(true);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                                                >
                                                    <Play className="w-3 h-3" /> {t('yue.btn_play')}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleHumanizeTrack(tTrack.name)}
                                                    disabled={isHumanizing}
                                                    className="p-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 transition-colors"
                                                    title="Remover digitais de IA e masterizar esta faixa"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => downloadAudioFileDirectly(tTrack.audioUrl, `${tTrack.name}.wav`)}
                                                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                    title="Baixar áudio WAV diretamente"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between">
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 text-primary" />
                            <span>{t('yue.server_label')} <code className="text-zinc-300 font-mono">{maestroStatus.endpoint}</code></span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                            >
                                {t('yue.btn_close')}
                            </button>

                            {areModelsMissing && !isDownloadingModel ? (
                                <button
                                    type="button"
                                    onClick={handleStartModelDownload}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                                >
                                    <CloudDownload className="w-4 h-4" />
                                    {t('yue.btn_download_models_short')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartGeneration}
                                    disabled={isGenerating || !maestroStatus.online || areModelsMissing || isDownloadingModel}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-white shadow-lg transition-all active:scale-95 ${
                                        isGenerating || !maestroStatus.online || areModelsMissing || isDownloadingModel
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                                            : 'bg-primary hover:bg-[#e05626] shadow-primary/30 border border-primary/40'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {isGenerating
                                        ? t('yue.producing')
                                        : isDownloadingModel
                                            ? t('yue.downloading_models_btn')
                                            : t('yue.btn_generate')}
                                </button>
                            )}
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};
