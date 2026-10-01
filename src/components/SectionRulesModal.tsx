import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, Copy, Sliders, Mic2, Sparkles, Layers,
    Plus, Trash2, ArrowUp, ArrowDown,
    Info, Music, Search, FileText, MessageSquare,
    Edit3, CornerDownLeft, Tag, ListOrdered,
    CheckSquare, Square, Type, Volume2, ShieldAlert
} from 'lucide-react';
import { MusicPlatform } from '../types';
import {
    SectionRuleEffect,
    VocalCategoryKey,
    VOCAL_CATEGORIES,
    VOCAL_EFFECTS_CATALOG
} from './vocalCatalog';

export interface ParsedSection {
    id: string;
    header: string; // Ex: "[Verse 1: Deep Chest Voice]"
    name: string;   // Ex: "Verse 1"
    descriptors: string; // Ex: "Deep Chest Voice, Trailing Raspy"
    lyrics: string; // Lyrics text inside this section
    customRule: string; // Extra rule note for this section
}

interface SectionRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptFinal: string;
    onSave: (newPromptFinal: string) => void;
    targetPlatform?: MusicPlatform;
}

export const SectionRulesModal: React.FC<SectionRulesModalProps> = ({
    isOpen,
    onClose,
    promptFinal,
    onSave,
    targetPlatform = MusicPlatform.SUNO
}) => {
    // Cabeçalhos gerais do prompt
    const [styleHeader, setStyleHeader] = useState('');
    const [lyricsHeader, setLyricsHeader] = useState('[LETRA ESTRUTURADA]');
    
    // Seções parseadas
    const [sections, setSections] = useState<ParsedSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    
    // Filtros e busca no catálogo
    const [selectedCategory, setSelectedCategory] = useState<VocalCategoryKey>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    // Modo de edição da letra: 'lines' (interativo por verso) ou 'raw' (texto livre)
    const [lyricsEditMode, setLyricsEditMode] = useState<'lines' | 'raw'>('lines');
    // Verso ativo selecionado para aplicar tags (índice da linha de letra)
    const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);

    // Modal / Popover para aplicar efeito em palavra específica
    const [wordTargetModal, setWordTargetModal] = useState<{
        isOpen: boolean;
        effect: SectionRuleEffect | null;
        lineIndex: number;
        lineText: string;
        customWord: string;
    }>({
        isOpen: false,
        effect: null,
        lineIndex: 0,
        lineText: '',
        customWord: ''
    });

    // Modal para inserir Ad-lib cantado personalizado
    const [adlibModal, setAdlibModal] = useState<{
        isOpen: boolean;
        lineIndex: number;
        adlibText: string;
        directiveTag: string;
    }>({
        isOpen: false,
        lineIndex: 0,
        adlibText: '',
        directiveTag: ''
    });

    // Seleção múltipla para combinar técnicas em um único colchete
    const [selectedEffectsForCombo, setSelectedEffectsForCombo] = useState<SectionRuleEffect[]>([]);

    // Aba ativa do modal: 'editor' (edição seção por seção) ou 'preview' (código completo)
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    // Feedback de cópia
    const [copyFeedback, setCopyFeedback] = useState<string>('');

    // --- PARSER INTELIGENTE DO PROMPT FINAL ---
    useEffect(() => {
        if (!isOpen) return;

        const raw = (promptFinal || '').trim();
        if (!raw) {
            setStyleHeader('');
            setSections([
                {
                    id: 's-1',
                    header: '[Verse 1]',
                    name: 'Verse 1',
                    descriptors: '',
                    lyrics: '',
                    customRule: ''
                }
            ]);
            setSelectedSectionId('s-1');
            return;
        }

        // 1. Detectar cabeçalho de estilo e cabeçalho de letra
        let detectedStyle = '';
        let detectedLyricsHeader = '[LETRA ESTRUTURADA]';
        let lyricsBody = raw;

        const lyricsHeaderMatch = raw.match(
            /(?:^|\n)((?:(?:\d+[\.\)]|#{1,4})\s*)?\[(?:LETRA\s+ESTRUTURADA(?:\s+YUE2)?|CUSTOM\s+LYRICS|LYRICS\s*(?:&|AND)\s*STRUCTURE|LETRA|LYRICS)\][^\n]*)/i
        );

        if (lyricsHeaderMatch && lyricsHeaderMatch.index !== undefined) {
            detectedLyricsHeader = lyricsHeaderMatch[1].trim();
            const splitIndex = lyricsHeaderMatch.index + lyricsHeaderMatch[0].length;
            detectedStyle = raw.substring(0, lyricsHeaderMatch.index).trim();
            lyricsBody = raw.substring(splitIndex).trim();
        } else {
            const metaTagMatch = raw.match(/(?:^|\n)\s*(\[(?:Intro|Verse|Verso|Chorus|Refr[aã]o|Ponte|Bridge|Drop|Outro|Pre-Chorus|Solo|Hook|Interlude|Instrumental)[^\]]*\])/i);
            if (metaTagMatch && metaTagMatch.index !== undefined) {
                detectedStyle = raw.substring(0, metaTagMatch.index).trim();
                lyricsBody = raw.substring(metaTagMatch.index).trim();
                detectedLyricsHeader = targetPlatform === MusicPlatform.UDIO 
                    ? '[CUSTOM LYRICS]' 
                    : targetPlatform === MusicPlatform.MAESTRO 
                        ? '[LETRA ESTRUTURADA YUE2]' 
                        : '[LETRA ESTRUTURADA]';
            }
        }

        setStyleHeader(detectedStyle);
        setLyricsHeader(detectedLyricsHeader);

        // 2. Extrair seções da letra linha por linha eliminando colchetes órfãos
        const lines = lyricsBody.split(/\r?\n/);
        const sectionHeaderRegex = /^\s*\[(Intro|Verse\s*\d*|Verso\s*\d*|Pre-Chorus|Pré-Refrão|Chorus|Refrão|Bridge|Ponte|Drop|Solo|Guitar\s*Solo|Outro|Final|End|Hook|Interlude|Build-up|Instrumental)([^\]]*)\]\s*$/i;

        interface TempSection {
            name: string;
            descriptors: string;
            lyricsLines: string[];
            customRule: string;
        }

        const tempSections: TempSection[] = [];
        let activeSection: TempSection | null = null;

        for (let line of lines) {
            const trimmed = line.trim();

            // Descarta completamente linhas que são apenas colchetes soltos e órfãos
            if (trimmed === ']' || trimmed === '[' || trimmed === '[]' || trimmed === ']]' || trimmed === '[[' || trimmed === '][') {
                continue;
            }

            // Remove colchetes de fechamento errantes no início da linha (ex: "] Teu fogo arde...")
            if (trimmed.startsWith(']') && !trimmed.includes('[')) {
                line = line.replace(/^\s*\]+\s*/, '');
            }

            // Verifica se a linha é um cabeçalho de seção (ex: [Verse 1] ou [Verse 1: Deep Voice])
            const secMatch = trimmed.match(sectionHeaderRegex);
            if (secMatch) {
                const sectionName = secMatch[1].trim();
                let extraModifiers = (secMatch[2] || '').trim();
                if (extraModifiers.startsWith(':')) {
                    extraModifiers = extraModifiers.substring(1).trim();
                }

                activeSection = {
                    name: sectionName,
                    descriptors: extraModifiers,
                    lyricsLines: [],
                    customRule: ''
                };
                tempSections.push(activeSection);
                continue;
            }

            // Verifica se a linha é uma instrução de produção / regra (ex: [Production Note: ...] ou [INSTRUCTION: ...])
            const noteMatch = trimmed.match(/^\s*\[(?:Production\s*Note|INSTRUCTION|Nota\s*de\s*Produção|Instrução):\s*([^\]]+)\]\s*$/i);
            if (noteMatch && activeSection) {
                activeSection.customRule = activeSection.customRule
                    ? `${activeSection.customRule}; ${noteMatch[1].trim()}`
                    : noteMatch[1].trim();
                continue;
            }

            // Se for linha de letra/conteúdo e temos uma seção ativa
            if (activeSection) {
                if (line.trim() === '') {
                    if (activeSection.lyricsLines.length > 0 && activeSection.lyricsLines[activeSection.lyricsLines.length - 1] !== '') {
                        activeSection.lyricsLines.push('');
                    }
                } else {
                    activeSection.lyricsLines.push(line);
                }
            } else if (trimmed) {
                activeSection = {
                    name: 'Verse 1',
                    descriptors: '',
                    lyricsLines: [line],
                    customRule: ''
                };
                tempSections.push(activeSection);
            }
        }

        if (tempSections.length === 0) {
            tempSections.push({
                name: 'Verse 1',
                descriptors: '',
                lyricsLines: [lyricsBody],
                customRule: ''
            });
        }

        const parsedSectionsList: ParsedSection[] = tempSections.map((sec, idx) => ({
            id: `sec-${idx + 1}-${Date.now()}`,
            header: `[${sec.name}${sec.descriptors ? `: ${sec.descriptors}` : ''}]`,
            name: sec.name,
            descriptors: sec.descriptors,
            lyrics: sec.lyricsLines
                .filter(l => {
                    const t = l.trim();
                    return t !== ']' && t !== '[' && t !== '[]' && t !== ']]';
                })
                .map(l => l.replace(/^\s*\]+\s*/, ''))
                .join('\n')
                .trim(),
            customRule: sec.customRule
        }));

        setSections(parsedSectionsList);
        if (parsedSectionsList.length > 0) {
            setSelectedSectionId(parsedSectionsList[0].id);
        }
    }, [isOpen, promptFinal, targetPlatform]);

    // Seção ativa
    const currentSection = useMemo(() => {
        return sections.find(s => s.id === selectedSectionId) || sections[0] || null;
    }, [sections, selectedSectionId]);

    // Lista de versos (linhas) da seção ativa
    const currentSectionLines = useMemo(() => {
        if (!currentSection || !currentSection.lyrics) return [];
        return currentSection.lyrics
            .split(/\r?\n/)
            .filter(l => {
                const t = l.trim();
                return t !== ']' && t !== '[' && t !== '[]' && t !== ']]';
            })
            .map(l => l.replace(/^\s*\]+\s*/, ''));
    }, [currentSection]);

    // Monta o prompt final atualizado em tempo real com garantia de ZERO colchetes errantes
    const assembledFinalPrompt = useMemo(() => {
        const parts: string[] = [];

        if (styleHeader && styleHeader.trim()) {
            parts.push(styleHeader.trim());
        }

        if (lyricsHeader && lyricsHeader.trim()) {
            parts.push(lyricsHeader.trim());
        }

        sections.forEach(sec => {
            const descPart = sec.descriptors && sec.descriptors.trim() ? `: ${sec.descriptors.trim()}` : '';
            const secTag = `[${sec.name.trim()}${descPart}]`;
            
            let secContent = secTag;
            if (sec.customRule && sec.customRule.trim()) {
                secContent += `\n[Production Note: ${sec.customRule.trim()}]`;
            }

            if (sec.lyrics && sec.lyrics.trim()) {
                const cleanLyrics = sec.lyrics
                    .split(/\r?\n/)
                    .filter(line => {
                        const t = line.trim();
                        return t !== ']' && t !== '[' && t !== '[]' && t !== ']]';
                    })
                    .map(line => line.replace(/^\s*\]+\s*/, ''))
                    .join('\n')
                    .trim();

                if (cleanLyrics) {
                    secContent += `\n${cleanLyrics}`;
                }
            }

            parts.push(secContent);
        });

        return parts.join('\n\n');
    }, [styleHeader, lyricsHeader, sections]);

    // Atualizar uma propriedade da seção ativa
    const updateCurrentSection = (fields: Partial<ParsedSection>) => {
        if (!currentSection) return;
        setSections(prev => prev.map(s => {
            if (s.id === currentSection.id) {
                return { ...s, ...fields };
            }
            return s;
        }));
    };

    // Adicionar um efeito ao cabeçalho da seção ativa (ex: [Verse 1: clean vocal, warm tone])
    const applyEffectToHeader = (effect: SectionRuleEffect | { tag: string }) => {
        if (!currentSection) return;

        const currentDesc = currentSection.descriptors ? currentSection.descriptors.trim() : '';
        if (currentDesc.toLowerCase().includes(effect.tag.toLowerCase())) {
            return;
        }

        const newDesc = currentDesc ? `${currentDesc}, ${effect.tag}` : effect.tag;
        updateCurrentSection({ descriptors: newDesc });
    };

    // Inserir tag ANTES de uma linha/verso específica (Regra 4 do estudo: [tag] controla a frase seguinte)
    const insertEffectBeforeLine = (lineIdx: number, tagString: string) => {
        if (!currentSection) return;
        const lines = [...currentSectionLines];
        const formattedTag = `[${tagString.trim().replace(/^\[|\]$/g, '')}]`;
        
        if (lines.length === 0) {
            lines.push(formattedTag);
        } else {
            const targetIdx = Math.max(0, Math.min(lineIdx, lines.length));
            lines.splice(targetIdx, 0, formattedTag);
        }

        updateCurrentSection({ lyrics: lines.join('\n') });
    };

    // Inserir tag NO FINAL de uma linha/verso (Regra 5 do estudo: modifica o final da frase)
    const insertEffectAfterLine = (lineIdx: number, tagString: string) => {
        if (!currentSection) return;
        const lines = [...currentSectionLines];
        if (lines.length === 0) {
            lines.push(`[${tagString.trim().replace(/^\[|\]$/g, '')}]`);
        } else {
            const targetIdx = Math.max(0, Math.min(lineIdx, lines.length - 1));
            const existingLine = lines[targetIdx];
            const cleanTag = tagString.trim().replace(/^\[|\]$/g, '');
            lines[targetIdx] = `${existingLine} [${cleanTag}]`;
        }

        updateCurrentSection({ lyrics: lines.join('\n') });
    };

    // Inserir efeito direcionado a uma PALAVRA específica (Regra 6 do estudo: [melisma on "palavra"])
    const handleConfirmWordTarget = () => {
        const { effect, lineIndex, customWord } = wordTargetModal;
        if (!effect || !customWord.trim() || !currentSection) return;

        const word = customWord.trim().replace(/["']/g, '');
        const targetedTag = `[${effect.tag} on "${word}"]`;

        const lines = [...currentSectionLines];
        if (lines.length === 0) {
            lines.push(targetedTag);
        } else {
            const targetIdx = Math.max(0, Math.min(lineIndex, lines.length - 1));
            lines[targetIdx] = `${lines[targetIdx]} ${targetedTag}`;
        }

        updateCurrentSection({ lyrics: lines.join('\n') });
        setWordTargetModal({ isOpen: false, effect: null, lineIndex: 0, lineText: '', customWord: '' });
    };

    // Inserir ad-lib cantado entre parênteses (Regra 3 do estudo: (palavras) DEVEM ser cantadas)
    const handleConfirmAdlib = () => {
        const { lineIndex, adlibText, directiveTag } = adlibModal;
        if (!adlibText.trim() || !currentSection) return;

        const cleanAdlib = adlibText.trim().replace(/^\(|\)$/g, '');
        let formattedEntry = `(${cleanAdlib})`;
        if (directiveTag && directiveTag.trim()) {
            const cleanDir = directiveTag.trim().replace(/^\[|\]$/g, '');
            formattedEntry = `[${cleanDir}]\n(${cleanAdlib})`;
        }

        const lines = [...currentSectionLines];
        const targetIdx = Math.max(0, Math.min(lineIndex + 1, lines.length));
        lines.splice(targetIdx, 0, formattedEntry);

        updateCurrentSection({ lyrics: lines.join('\n') });
        setAdlibModal({ isOpen: false, lineIndex: 0, adlibText: '', directiveTag: '' });
    };

    // Inserir combo de técnicas múltiplas combinadas no mesmo colchete (Regra 7 do estudo)
    const handleApplyCombo = (target: 'header' | 'before_line' | 'after_line') => {
        if (selectedEffectsForCombo.length === 0 || !currentSection) return;
        
        const combinedTag = selectedEffectsForCombo.map(e => e.tag).join(', ');
        
        if (target === 'header') {
            applyEffectToHeader({ tag: combinedTag });
        } else if (target === 'before_line') {
            insertEffectBeforeLine(selectedLineIndex, combinedTag);
        } else if (target === 'after_line') {
            insertEffectAfterLine(selectedLineIndex, combinedTag);
        }

        setSelectedEffectsForCombo([]);
    };

    // Toggle seleção para combo
    const toggleSelectForCombo = (effect: SectionRuleEffect) => {
        setSelectedEffectsForCombo(prev => {
            const exists = prev.some(e => e.id === effect.id);
            if (exists) {
                return prev.filter(e => e.id !== effect.id);
            }
            return [...prev, effect];
        });
    };

    // Remover descritor específico do cabeçalho
    const removeDescriptor = (tagToRemove: string) => {
        if (!currentSection) return;
        const tags = (currentSection.descriptors || '')
            .split(',')
            .map(t => t.trim())
            .filter(t => t && t.toLowerCase() !== tagToRemove.toLowerCase());
        updateCurrentSection({ descriptors: tags.join(', ') });
    };

    // Adicionar nova seção
    const handleAddSection = () => {
        const nextNum = sections.length + 1;
        const newSec: ParsedSection = {
            id: `sec-${Date.now()}`,
            header: `[Verse ${nextNum}]`,
            name: `Verse ${nextNum}`,
            descriptors: '',
            lyrics: '',
            customRule: ''
        };
        setSections(prev => [...prev, newSec]);
        setSelectedSectionId(newSec.id);
    };

    // Remover seção
    const handleDeleteSection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (sections.length <= 1) return;
        const filtered = sections.filter(s => s.id !== id);
        setSections(filtered);
        if (selectedSectionId === id) {
            setSelectedSectionId(filtered[0]?.id || '');
        }
    };

    // Mover seção para cima/baixo
    const handleMoveSection = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setSections(updated);
    };

    // Copiar prompt atualizado
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(assembledFinalPrompt);
        setCopyFeedback('Copiado!');
        setTimeout(() => setCopyFeedback(''), 2000);
    };

    // Salvar e aplicar
    const handleSaveAndApply = () => {
        onSave(assembledFinalPrompt);
        onClose();
    };

    // Filtragem dos efeitos do catálogo
    const filteredEffects = useMemo(() => {
        return VOCAL_EFFECTS_CATALOG.filter(eff => {
            const matchesCat = selectedCategory === 'all' || eff.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                eff.title.toLowerCase().includes(q) || 
                eff.description.toLowerCase().includes(q) || 
                eff.tag.toLowerCase().includes(q) ||
                eff.aiBehavior.toLowerCase().includes(q) ||
                eff.example.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-[1440px] h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans text-white"
                >
                    {/* TOPBAR / HEADER */}
                    <div className="px-5 py-3 border-b border-white/10 bg-zinc-900/90 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
                                <Sliders className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-white tracking-wide">
                                        Sistema de Direção Vocal & Performance
                                    </h2>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                        {targetPlatform.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 hidden md:inline">
                                        • {sections.length} seções • Regras de Performance Vocal Ativas
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                    Edite cada trecho com melismas, voz rasgada, dinâmicas, vibratos e ad-libs. As instruções em <code className="text-amber-300 font-mono">[colchetes]</code> orientam a performance e as em <code className="text-cyan-300 font-mono">(parênteses)</code> são cantadas pela IA.
                                </p>
                            </div>
                        </div>

                        {/* Top Controls */}
                        <div className="flex items-center gap-2">
                            {/* Toggle Tabs */}
                            <div className="bg-black/50 border border-white/10 p-0.5 rounded-lg flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('editor')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                        activeTab === 'editor' 
                                            ? 'bg-primary text-white shadow-sm' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    Edição Interativa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                        activeTab === 'preview' 
                                            ? 'bg-primary text-white shadow-sm' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Prompt Final Completo
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyPrompt}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 flex items-center gap-1.5 transition-colors"
                                title="Copiar Prompt Completo"
                            >
                                <Copy className="w-3.5 h-3.5 text-primary" />
                                {copyFeedback || 'Copiar'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveAndApply}
                                className="px-4 py-1.5 bg-primary hover:bg-[#e05626] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/25 transition-all active:scale-95"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Salvar & Aplicar
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors ml-1"
                                title="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* MAIN CONTENT BODY */}
                    {activeTab === 'editor' ? (
                        <div className="flex-1 grid grid-cols-12 overflow-hidden divide-x divide-white/10">
                            {/* COLUNA 1: LISTA DE SEÇÕES (2.5 colunas) */}
                            <div className="col-span-3 lg:col-span-2 flex flex-col bg-zinc-950 overflow-hidden">
                                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Music className="w-3.5 h-3.5 text-primary" />
                                        Estrutura
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleAddSection}
                                        className="px-2 py-0.5 bg-white/5 hover:bg-primary hover:text-white text-zinc-300 rounded text-[10px] font-medium flex items-center gap-1 transition-colors border border-white/5"
                                        title="Adicionar nova seção"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Nova
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                                    {sections.map((sec, idx) => {
                                        const isSelected = sec.id === selectedSectionId;
                                        const hasEffects = Boolean(sec.descriptors && sec.descriptors.trim().length > 0);
                                        const hasCustomRule = Boolean(sec.customRule && sec.customRule.trim().length > 0);

                                        return (
                                            <div
                                                key={sec.id}
                                                onClick={() => {
                                                    setSelectedSectionId(sec.id);
                                                    setSelectedLineIndex(0);
                                                }}
                                                className={`group p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                                                    isSelected
                                                        ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10'
                                                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 text-zinc-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                                        {sec.name}
                                                    </span>

                                                    {/* Move buttons & delete */}
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleMoveSection(idx, 'up', e)}
                                                            disabled={idx === 0}
                                                            className="p-0.5 hover:text-white text-zinc-500 disabled:opacity-30"
                                                            title="Mover para cima"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleMoveSection(idx, 'down', e)}
                                                            disabled={idx === sections.length - 1}
                                                            className="p-0.5 hover:text-white text-zinc-500 disabled:opacity-30"
                                                            title="Mover para baixo"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                        {sections.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteSection(sec.id, e)}
                                                                className="p-0.5 hover:text-red-400 text-zinc-500"
                                                                title="Excluir seção"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mini snippet or active effect badges */}
                                                <div className="space-y-1">
                                                    {hasEffects && (
                                                        <div className="text-[10px] text-primary truncate font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                            {sec.descriptors}
                                                        </div>
                                                    )}
                                                    {hasCustomRule && (
                                                        <div className="text-[9px] text-amber-400/90 truncate flex items-center gap-1">
                                                            <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                                                            {sec.customRule}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-zinc-500 line-clamp-1 italic">
                                                        {sec.lyrics ? sec.lyrics.replace(/\n/g, ' • ') : 'Nenhuma letra...'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bloco informativo inferior */}
                                <div className="p-2.5 border-t border-white/5 bg-zinc-900/30 text-[10px] text-zinc-500 leading-snug">
                                    💡 <strong>Regra de Ouro:</strong><br />
                                    <span className="text-zinc-400">• <code className="text-amber-300">[ ]</code> = comando vocal</span><br />
                                    <span className="text-zinc-400">• <code className="text-cyan-300">( )</code> = parte cantada</span>
                                </div>
                            </div>

                            {/* COLUNA 2: EDITOR DA SEÇÃO SELECIONADA (5.5 colunas) */}
                            <div className="col-span-5 lg:col-span-6 flex flex-col bg-zinc-950 overflow-hidden">
                                {currentSection ? (
                                    <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-3">
                                        {/* Header da Seção & Nome */}
                                        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Mic2 className="w-3.5 h-3.5 text-primary" />
                                                    Cabeçalho da Seção
                                                </span>
                                                <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                                    [{currentSection.name}{currentSection.descriptors ? `: ${currentSection.descriptors}` : ''}]
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1">
                                                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                                                        Nome da Seção
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentSection.name}
                                                        onChange={(e) => updateCurrentSection({ name: e.target.value })}
                                                        placeholder="Ex: Verse 1, Chorus"
                                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                                                        Tags Vocais Gerais da Seção
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentSection.descriptors}
                                                        onChange={(e) => updateCurrentSection({ descriptors: e.target.value })}
                                                        placeholder="Ex: deep chest voice, warm tone"
                                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-primary font-mono"
                                                    />
                                                </div>
                                            </div>

                                            {/* Badges de tags aplicadas com botão de remover */}
                                            {currentSection.descriptors && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {currentSection.descriptors.split(',').map((tagItem, tidx) => {
                                                        const cleanTag = tagItem.trim();
                                                        if (!cleanTag) return null;
                                                        return (
                                                            <span
                                                                key={tidx}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-[10px] text-primary font-medium"
                                                            >
                                                                {cleanTag}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDescriptor(cleanTag)}
                                                                    className="hover:text-white"
                                                                >
                                                                    <X className="w-2.5 h-2.5" />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Letra da Seção com Alternância de Modo (Interativo vs Texto Livre) */}
                                        <div className="flex-1 flex flex-col bg-zinc-900/80 border border-white/10 rounded-xl p-3 min-h-[300px]">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                                        Versos & Direções Vocais
                                                    </label>
                                                    <span className="text-[10px] text-zinc-500">
                                                        ({currentSectionLines.length} linhas)
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLyricsEditMode('lines')}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                                                            lyricsEditMode === 'lines'
                                                                ? 'bg-primary text-white'
                                                                : 'text-zinc-400 hover:text-white'
                                                        }`}
                                                        title="Editor visual linha a linha com botões de inserção direta"
                                                    >
                                                        <ListOrdered className="w-3 h-3" />
                                                        Linha por Linha
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLyricsEditMode('raw')}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                                                            lyricsEditMode === 'raw'
                                                                ? 'bg-primary text-white'
                                                                : 'text-zinc-400 hover:text-white'
                                                        }`}
                                                        title="Editor de texto livre"
                                                    >
                                                        <Type className="w-3 h-3" />
                                                        Texto Livre
                                                    </button>
                                                </div>
                                            </div>

                                            {lyricsEditMode === 'lines' ? (
                                                /* MODO VISUAL LINHA POR LINHA */
                                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                                    {currentSectionLines.length === 0 ? (
                                                        <div className="text-center py-10 text-zinc-500 text-xs">
                                                            Nenhum verso nesta seção. Mude para "Texto Livre" ou digite a letra.
                                                        </div>
                                                    ) : (
                                                        currentSectionLines.map((lineText, lIdx) => {
                                                            const isInstruction = lineText.trim().startsWith('[') && lineText.trim().endsWith(']');
                                                            const isAdlib = lineText.trim().startsWith('(') && lineText.trim().endsWith(')');
                                                            const isSelected = selectedLineIndex === lIdx;

                                                            return (
                                                                <div
                                                                    key={lIdx}
                                                                    onClick={() => setSelectedLineIndex(lIdx)}
                                                                    className={`p-2.5 rounded-xl border transition-all text-left ${
                                                                        isSelected
                                                                            ? 'border-primary/50 bg-primary/5 shadow-sm'
                                                                            : 'border-white/5 bg-black/40 hover:border-white/15'
                                                                    }`}
                                                                >
                                                                    {/* Linha de conteúdo */}
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex items-start gap-2 flex-1">
                                                                            <span className="text-[10px] font-mono text-zinc-500 select-none pt-0.5">
                                                                                {lIdx + 1}
                                                                            </span>

                                                                            <div className="flex-1">
                                                                                {isInstruction ? (
                                                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
                                                                                        <Sliders className="w-3 h-3 text-amber-400" />
                                                                                        <span>{lineText}</span>
                                                                                        <span className="text-[9px] text-amber-400/80 uppercase font-sans">
                                                                                            (Direção de Performance)
                                                                                        </span>
                                                                                    </div>
                                                                                ) : isAdlib ? (
                                                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold">
                                                                                        <Volume2 className="w-3 h-3 text-cyan-400" />
                                                                                        <span>{lineText}</span>
                                                                                        <span className="text-[9px] text-cyan-400/80 uppercase font-sans">
                                                                                            (Ad-lib Cantado)
                                                                                        </span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-xs text-zinc-100 font-medium font-sans leading-relaxed">
                                                                                        {lineText}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                                                                            isSelected ? 'bg-primary text-white' : 'text-zinc-600'
                                                                        }`}>
                                                                            {isSelected ? 'Linha Selecionada' : ''}
                                                                        </span>
                                                                    </div>

                                                                    {/* Ações rápidas neste verso */}
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-1 border-t border-white/5 text-[10px]">
                                                                        <span className="text-[9px] text-zinc-500 mr-1">
                                                                            Inserir aqui:
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedLineIndex(lIdx);
                                                                                // Abre modal de palavra se houver letra
                                                                                const words = lineText.replace(/[\[\]\(\)]/g, '').trim().split(/\s+/).filter(Boolean);
                                                                                setWordTargetModal({
                                                                                    isOpen: true,
                                                                                    effect: VOCAL_EFFECTS_CATALOG.find(e => e.id === 'extended_melisma') || null,
                                                                                    lineIndex: lIdx,
                                                                                    lineText: lineText,
                                                                                    customWord: words[words.length - 1] || ''
                                                                                });
                                                                            }}
                                                                            className="px-2 py-0.5 rounded bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 flex items-center gap-1 transition-colors"
                                                                            title="Aplicar melisma em uma palavra específica deste verso"
                                                                        >
                                                                            <Sparkles className="w-2.5 h-2.5" />
                                                                            Na Palavra...
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => insertEffectAfterLine(lIdx, 'raspy ending, vocal fry')}
                                                                            className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1 transition-colors"
                                                                            title="Adicionar voz rasgada no final deste verso"
                                                                        >
                                                                            <CornerDownLeft className="w-2.5 h-2.5" />
                                                                            Voz Rasgada no Fim
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedLineIndex(lIdx);
                                                                                setAdlibModal({
                                                                                    isOpen: true,
                                                                                    lineIndex: lIdx,
                                                                                    adlibText: 'volta pra mim...',
                                                                                    directiveTag: 'background vocal'
                                                                                });
                                                                            }}
                                                                            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 transition-colors"
                                                                            title="Inserir ad-lib cantado em parênteses logo após este verso"
                                                                        >
                                                                            <Volume2 className="w-2.5 h-2.5" />
                                                                            + Ad-lib Cantado ( )
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const lines = [...currentSectionLines];
                                                                                lines.splice(lIdx, 1);
                                                                                updateCurrentSection({ lyrics: lines.join('\n') });
                                                                            }}
                                                                            className="ml-auto p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                                                            title="Remover linha"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            ) : (
                                                /* MODO TEXTO LIVRE */
                                                <div className="flex-1 flex flex-col">
                                                    <textarea
                                                        value={currentSection.lyrics}
                                                        onChange={(e) => updateCurrentSection({ lyrics: e.target.value })}
                                                        placeholder="Digite ou cole os versos desta seção aqui... (Use [colchetes] para direções vocais e (parênteses) para ad-libs)"
                                                        className="w-full flex-1 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-mono leading-relaxed resize-none custom-scrollbar"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Diretriz ou Nota de Produção Específica para a IA */}
                                        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                                    Nota de Produção desta Seção (Production Note)
                                                </label>
                                            </div>
                                            <input
                                                type="text"
                                                value={currentSection.customRule}
                                                onChange={(e) => updateCurrentSection({ customRule: e.target.value })}
                                                placeholder="Ex: Começar suave e íntimo, construindo intensidade até explodir no refrão..."
                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-amber-300 placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                                            />
                                            <p className="text-[10px] text-zinc-500">
                                                Será gerada como <code className="text-amber-400 font-mono">[Production Note: ...]</code> imediatamente antes desta seção.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                                        <Music className="w-10 h-10 mb-2 opacity-30" />
                                        <p className="text-xs">Selecione uma seção ao lado para editar.</p>
                                    </div>
                                )}
                            </div>

                            {/* COLUNA 3: CATÁLOGO DE EFEITOS & EXPLICAÇÕES (4 colunas) */}
                            <div className="col-span-4 flex flex-col bg-zinc-950 overflow-hidden">
                                {/* Header do Catálogo */}
                                <div className="p-3 border-b border-white/10 bg-zinc-900/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            Catálogo Completo de Técnicas & Efeitos
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {filteredEffects.length} disponíveis
                                        </span>
                                    </div>

                                    {/* Campo de Busca */}
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar técnica (ex: rasgada, melisma, grave, belting, fry)..."
                                            className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    {/* Categorias - Pills com scroll */}
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
                                        {VOCAL_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors border ${
                                                    selectedCategory === cat.id
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white/5 text-zinc-400 hover:text-white border-white/5'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Barra de Combo / Seleção Múltipla se houver itens selecionados */}
                                {selectedEffectsForCombo.length > 0 && (
                                    <div className="p-2.5 bg-gradient-to-r from-primary/20 via-zinc-900 to-primary/20 border-b border-primary/30 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <CheckSquare className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold text-white">
                                                {selectedEffectsForCombo.length} técnicas selecionadas
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleApplyCombo('before_line')}
                                                className="px-2 py-1 bg-primary hover:bg-[#e05626] text-white rounded text-[10px] font-bold transition-all shadow-sm"
                                                title="Inserir comando combinado antes da linha selecionada"
                                            >
                                                Inserir Antes da Linha
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyCombo('header')}
                                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-medium border border-white/10"
                                                title="Adicionar ao cabeçalho da seção"
                                            >
                                                No Cabeçalho
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEffectsForCombo([])}
                                                className="p-1 text-zinc-500 hover:text-white"
                                                title="Limpar seleção"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Efeitos com Explicações Detalhadas do Estudo */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                                    {filteredEffects.map((eff) => {
                                        const isChecked = selectedEffectsForCombo.some(e => e.id === eff.id);

                                        return (
                                            <div
                                                key={eff.id}
                                                className={`rounded-xl p-3 border transition-all space-y-2 shadow-sm ${
                                                    isChecked
                                                        ? 'bg-primary/10 border-primary/40'
                                                        : 'bg-zinc-900/90 border-white/10 hover:border-primary/30'
                                                }`}
                                            >
                                                {/* Título, Badge e Checkbox de Combo */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border inline-block ${eff.badgeColor}`}>
                                                                {eff.badge}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded">
                                                                [{eff.tag}]
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                                                            {eff.title}
                                                        </h3>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSelectForCombo(eff)}
                                                        className={`p-1 rounded transition-colors ${
                                                            isChecked ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                                                        }`}
                                                        title={isChecked ? 'Remover do combo' : 'Selecionar para combinar com outras técnicas'}
                                                    >
                                                        {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {/* Explicação clara (Para que serve + Efeito na IA) */}
                                                <div className="bg-black/50 rounded-lg p-2 border border-white/5 space-y-1">
                                                    <p className="text-[11px] text-zinc-300 leading-snug">
                                                        <strong>O que faz:</strong> {eff.description}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 leading-tight">
                                                        <strong className="text-primary">Efeito na IA:</strong> {eff.aiBehavior}
                                                    </p>
                                                </div>

                                                {/* Exemplo de uso da regra */}
                                                <div className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-1.5 rounded border border-white/5 whitespace-pre-line">
                                                    <span className="text-zinc-500">💡 Exemplo:</span> {eff.example}
                                                </div>

                                                {/* Botões de Ação Direta */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5 text-[10px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => applyEffectToHeader(eff)}
                                                        className="px-2 py-1 bg-white/5 hover:bg-primary/20 text-zinc-300 hover:text-primary border border-white/10 rounded text-[10px] font-medium transition-all"
                                                        title={`Adicionar ao cabeçalho da seção [${currentSection?.name || ''}]`}
                                                    >
                                                        + No Cabeçalho
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => insertEffectBeforeLine(selectedLineIndex, eff.tag)}
                                                        className="px-2 py-1 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded text-[10px] font-bold transition-all"
                                                        title={`Inserir antes da linha ${selectedLineIndex + 1}`}
                                                    >
                                                        + Antes da Linha
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => insertEffectAfterLine(selectedLineIndex, eff.tag)}
                                                        className="px-2 py-1 bg-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 rounded text-[10px] font-medium transition-all"
                                                        title={`Inserir no final da linha ${selectedLineIndex + 1}`}
                                                    >
                                                        + No Fim da Linha
                                                    </button>

                                                    {eff.supportsWordTarget && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const lineText = currentSectionLines[selectedLineIndex] || '';
                                                                const words = lineText.replace(/[\[\]\(\)]/g, '').trim().split(/\s+/).filter(Boolean);
                                                                setWordTargetModal({
                                                                    isOpen: true,
                                                                    effect: eff,
                                                                    lineIndex: selectedLineIndex,
                                                                    lineText: lineText,
                                                                    customWord: words[words.length - 1] || ''
                                                                });
                                                            }}
                                                            className="px-2 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 rounded text-[10px] font-medium transition-all"
                                                            title="Aplicar este efeito em uma palavra específica"
                                                        >
                                                            Na Palavra...
                                                        </button>
                                                    )}

                                                    {eff.inlineTag && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const lines = [...currentSectionLines];
                                                                const targetIdx = Math.max(0, Math.min(selectedLineIndex + 1, lines.length));
                                                                lines.splice(targetIdx, 0, eff.inlineTag || '');
                                                                updateCurrentSection({ lyrics: lines.join('\n') });
                                                            }}
                                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded text-[10px] font-medium transition-all"
                                                            title="Inserir como ad-lib cantado"
                                                        >
                                                            + Ad-lib ( )
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filteredEffects.length === 0 && (
                                        <div className="text-center py-10 text-zinc-500 text-xs">
                                            Nenhuma técnica encontrada para a busca "{searchQuery}".
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ABA DE VISUALIZAÇÃO DO PROMPT FINAL COMPLETO */
                        <div className="flex-1 flex flex-col bg-zinc-950 p-5 overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Prompt Final Consolidado (Resultado para a IA)
                                    </h3>
                                    <p className="text-[11px] text-zinc-400">
                                        Este é o texto exato que será enviado ao {targetPlatform} com todas as suas regras, direções vocais e formatação rigorosa.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {assembledFinalPrompt.length} caracteres
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyPrompt}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-primary" />
                                        {copyFeedback || 'Copiar Tudo'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-black border border-white/10 rounded-xl p-4 relative group overflow-hidden">
                                <textarea
                                    readOnly
                                    value={assembledFinalPrompt}
                                    className="w-full h-full bg-transparent text-xs font-mono text-emerald-400/90 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* MODAL DE PALAVRA ESPECÍFICA */}
                    {wordTargetModal.isOpen && wordTargetModal.effect && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/15 rounded-xl p-4 w-full max-w-md space-y-3 shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <Tag className="w-4 h-4 text-primary" />
                                        Aplicar Efeito em Palavra Específica
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setWordTargetModal({ isOpen: false, effect: null, lineIndex: 0, lineText: '', customWord: '' })}
                                        className="text-zinc-500 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-[11px] text-zinc-300">
                                    A técnica <strong>[{wordTargetModal.effect.tag}]</strong> será aplicada estritamente na palavra escolhida (Regra 6 do estudo).
                                </p>

                                {/* Palavras rápidas do verso selecionado */}
                                {wordTargetModal.lineText && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                            Clique em uma palavra do verso:
                                        </span>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-black/40 rounded border border-white/5">
                                            {wordTargetModal.lineText
                                                .replace(/[\[\]\(\),.;!?]/g, ' ')
                                                .split(/\s+/)
                                                .filter(w => w.trim().length > 1)
                                                .map((word, widx) => (
                                                    <button
                                                        key={widx}
                                                        type="button"
                                                        onClick={() => setWordTargetModal(prev => ({ ...prev, customWord: word }))}
                                                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                                            wordTargetModal.customWord.toLowerCase() === word.toLowerCase()
                                                                ? 'bg-primary text-white font-bold'
                                                                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        "{word}"
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                                        Ou digite a palavra alvo:
                                    </label>
                                    <input
                                        type="text"
                                        value={wordTargetModal.customWord}
                                        onChange={(e) => setWordTargetModal(prev => ({ ...prev, customWord: e.target.value }))}
                                        placeholder="Ex: voltar, salvação, amor"
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                                    />
                                </div>

                                <div className="p-2 bg-black/60 rounded-lg border border-white/5 text-[10px] font-mono text-pink-400">
                                    Resultado: [{wordTargetModal.effect.tag} on "{wordTargetModal.customWord || 'palavra'}"]
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setWordTargetModal({ isOpen: false, effect: null, lineIndex: 0, lineText: '', customWord: '' })}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmWordTarget}
                                        disabled={!wordTargetModal.customWord.trim()}
                                        className="px-4 py-1.5 bg-primary hover:bg-[#e05626] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                    >
                                        Inserir na Palavra
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL DE AD-LIB CANTADO */}
                    {adlibModal.isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-white/15 rounded-xl p-4 w-full max-w-md space-y-3 shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <Volume2 className="w-4 h-4 text-cyan-400" />
                                        Inserir Ad-lib ou Resposta Cantada ( )
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setAdlibModal({ isOpen: false, lineIndex: 0, adlibText: '', directiveTag: '' })}
                                        className="text-zinc-500 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-[11px] text-zinc-300">
                                    De acordo com o estudo, palavras escritas em <code className="text-cyan-300 font-mono">(parênteses)</code> <strong>DEVEM SER CANTADAS</strong> pela IA como segunda voz, eco ou exclamação.
                                </p>

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                                        Texto a ser cantado entre parênteses:
                                    </label>
                                    <input
                                        type="text"
                                        value={adlibModal.adlibText}
                                        onChange={(e) => setAdlibModal(prev => ({ ...prev, adlibText: e.target.value }))}
                                        placeholder="Ex: volta pra mim..., yeah!, Ele vive!, oh-oh..."
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                                        Diretiva de Performance para o Ad-lib (Opcional):
                                    </label>
                                    <input
                                        type="text"
                                        value={adlibModal.directiveTag}
                                        onChange={(e) => setAdlibModal(prev => ({ ...prev, directiveTag: e.target.value }))}
                                        placeholder="Ex: soft falsetto ad-lib, powerful gospel ad-lib, background vocal"
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
                                    />
                                </div>

                                <div className="p-2 bg-black/60 rounded-lg border border-white/5 text-[10px] font-mono text-cyan-300">
                                    {adlibModal.directiveTag ? `[${adlibModal.directiveTag}]\n` : ''}
                                    ({adlibModal.adlibText.replace(/^\(|\)$/g, '') || 'ad-lib...'})
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdlibModal({ isOpen: false, lineIndex: 0, adlibText: '', directiveTag: '' })}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmAdlib}
                                        disabled={!adlibModal.adlibText.trim()}
                                        className="px-4 py-1.5 bg-primary hover:bg-[#e05626] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                    >
                                        Inserir Ad-lib
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="px-5 py-3 border-t border-white/10 bg-zinc-900/95 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <Info className="w-4 h-4 text-primary shrink-0" />
                            <span>
                                As regras e efeitos adicionados serão consolidados no <strong>Prompt Final</strong> garantindo que a IA aplique as nuances e técnicas desejadas.
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAndApply}
                                className="px-5 py-2 bg-primary hover:bg-[#e05626] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95"
                            >
                                <Check className="w-4 h-4" />
                                Salvar & Aplicar ao Prompt Final
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
