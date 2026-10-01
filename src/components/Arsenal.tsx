import React, { useState, useEffect } from 'react';
import { X, Music, Radio, Activity, Cloud, Zap, ShieldAlert, CheckCircle2, Info, Sparkles, Plus, Trash2, BookmarkCheck, Mic } from 'lucide-react';
import { ArsenalSettings, AudioQuality } from '../types';
import { getSystemSettings } from '../services/settingsService';
import { useLanguage } from '../contexts/LanguageContext';

interface ArsenalOption {
  value: string;
  labelKey?: string;
  label?: string;
  desc?: string;
}

export const ARSENAL_OPTIONS = {
  voicesFormation: [
    { value: 'Voz Feminina', label: 'Voz Feminina', desc: 'Vocal principal feminino solo' },
    { value: 'Voz Masculina', label: 'Voz Masculina', desc: 'Vocal principal masculino solo' },
    { value: 'Dupla Sertaneja Masculina', label: 'Dupla Sertaneja Masculina', desc: 'Dupla tradicional com 1ª e 2ª voz em harmonia' },
    { value: 'Dupla Sertaneja Feminina', label: 'Dupla Sertaneja Feminina', desc: 'Dupla sertaneja feminina com vozes harmonizadas' },
    { value: 'Dueto Misto (Masc + Fem)', label: 'Dueto Misto (Masc + Fem)', desc: 'Interação e harmonia entre voz masculina e feminina' },
    { value: 'Coral / Backing Vocals', label: 'Coral / Backing Vocals', desc: 'Coro polifônico em camadas e respostas vocais' },
    { value: 'Vocal Infantil', label: 'Vocal Infantil', desc: 'Voz jovem, doce e delicada' },
    { value: 'Gang Vocals (Coro de Estádio)', label: 'Gang Vocals (Coro de Estádio)', desc: 'Vozes em uníssono de multidão estilo arena' }
  ] as ArsenalOption[],
  voicesTexture: [
    { value: 'Voz Rasgada e Rouca', label: 'Voz Rasgada e Rouca', desc: 'Drive natural com aspereza e rouquidão expressiva' },
    { value: 'Voz Aveludada', label: 'Voz Aveludada', desc: 'Timbre macio, doce e encorpado' },
    { value: 'Voz Potente / Belting', label: 'Voz Potente / Belting', desc: 'Projeção forte de peito em notas altas e sustentadas' },
    { value: 'Voz Suave e Intimista', label: 'Voz Suave e Intimista', desc: 'Canto sussurrado próximo ao microfone com muito ar' },
    { value: 'Voz Sussurrada', label: 'Voz Sussurrada', desc: 'Interpretação sussurrada cheia de intimidade' },
    { value: 'Voz Aguda e Cristalina', label: 'Voz Aguda e Cristalina', desc: 'Frequências agudas limpas, transparentes e afinadas' },
    { value: 'Voz Grave e Encorpada', label: 'Voz Grave e Encorpada', desc: 'Graves profundos e presença marcante de barítono/baixo' },
    { value: 'Voz com Drive / Distorção', label: 'Voz com Drive / Distorção', desc: 'Distorção vocal estilo rock ou sertanejo rasgado' },
    { value: 'Falsete Emotivo', label: 'Falsete Emotivo', desc: 'Transições suaves para voz de cabeça / falsete' },
    { value: 'Vocal Melismático / R&B Gospel', label: 'Vocal Melismático / R&B Gospel', desc: 'Riffs e floreios vocais rápidos e expressivos' },
    { value: 'Flow Rápido / Rítmico', label: 'Flow Rápido / Rítmico', desc: 'Cadência rítmica rápida e precisa sincronizada com o beat' },
    { value: 'Vocal Melancólico e Emocional', label: 'Vocal Melancólico e Emocional', desc: 'Interpretação emotiva e vulnerável com lágrimas na voz' }
  ] as ArsenalOption[],
  mastering: [
    { value: 'Radio Ready', labelKey: 'radio_ready' },
    { value: 'Raw / Demo', labelKey: 'raw' },
    { value: 'Lo-Fi', labelKey: 'lo_fi' },
    { value: 'Cassette Tape', labelKey: 'cassette' },
    { value: 'Vinyl', labelKey: 'vinyl' },
    { value: 'Wide Stereo', labelKey: 'wide_stereo' },
    { value: 'Clean Mix', labelKey: 'clean_mix' },
    { value: 'Warm (Analog)', labelKey: 'warm' }
  ] as ArsenalOption[],
  rhythm: [
    { value: 'Syncopated', labelKey: 'syncopated' },
    { value: 'Four-on-the-Floor', labelKey: 'four_floor' },
    { value: 'Half-Time', labelKey: 'half_time' },
    { value: 'Double-Time', labelKey: 'double_time' },
    { value: 'Swing / Shuffle', labelKey: 'swing' },
    { value: 'Aggressive Drums', labelKey: 'aggressive_drums' },
    { value: 'Stomp & Clap', labelKey: 'stomp' }
  ] as ArsenalOption[],
  atmosphere: [
    { value: 'Cinematic', labelKey: 'cinematic' },
    { value: 'Ethereal', labelKey: 'ethereal' },
    { value: 'Cathedral Reverb', labelKey: 'huge_reverb' },
    { value: 'Live Performance', labelKey: 'live' },
    { value: 'Intimate / Dry', labelKey: 'intimate' },
    { value: 'Dark', labelKey: 'dark' },
    { value: 'Dreamy', labelKey: 'dreamy' }
  ] as ArsenalOption[],
  effects: [
    { value: 'Autotune', labelKey: 'autotune' },
    { value: 'Distortion', labelKey: 'distortion' },
    { value: 'Delay', labelKey: 'delay' },
    { value: 'Bitcrusher', labelKey: 'bitcrusher' },
    { value: 'Chorus', labelKey: 'chorus' },
    { value: 'Sidechain', labelKey: 'sidechain' }
  ] as ArsenalOption[]
};

const DEFAULT_PRESET_TEMPLATES = [
  {
    name: "🔥 Hit Trap & 808",
    description: "808 pesado, autotune, hi-hats rápidos e ambiência escura",
    arsenal: {
      quality: AudioQuality.MASTERED,
      mastering: ["Radio Ready", "Wide Stereo"],
      rhythm: ["Syncopated", "Aggressive Drums"],
      atmosphere: ["Dark"],
      effects: ["Autotune", "Distortion"],
      instruments: ["808 Bass", "Trap Hi-Hats", "Snare Roll", "Dark Synth"],
      voiceTypes: ["Voz Masculina", "Flow Rápido / Rítmico"],
      forceInstruments: false,
      reverbLevel: 25,
      isReverbActive: true
    }
  },
  {
    name: "📻 Pop Radio Ready",
    description: "Mix polida e brilhante, bateria 4x4, sidechain e vocais destacados",
    arsenal: {
      quality: AudioQuality.MASTERED,
      mastering: ["Radio Ready", "Wide Stereo", "Clean Mix"],
      rhythm: ["Four-on-the-Floor"],
      atmosphere: ["Dreamy"],
      effects: ["Chorus", "Sidechain"],
      instruments: ["Acoustic Drums", "Synth Bass", "Electric Piano", "Claps"],
      voiceTypes: ["Voz Feminina", "Voz Potente / Belting", "Voz Aveludada"],
      forceInstruments: false,
      reverbLevel: 35,
      isReverbActive: true
    }
  },
  {
    name: "🎸 Acústico Intimista",
    description: "Sonoridade quente e orgânica com violão e percussão suave",
    arsenal: {
      quality: AudioQuality.STUDIO,
      mastering: ["Warm (Analog)", "Clean Mix"],
      rhythm: ["Swing / Shuffle"],
      atmosphere: ["Intimate / Dry"],
      effects: [],
      instruments: ["Violão de Aço", "Cajón", "Piano Acústico"],
      voiceTypes: ["Voz Suave e Intimista", "Voz Aveludada"],
      forceInstruments: false,
      reverbLevel: 15,
      isReverbActive: false
    }
  },
  {
    name: "🎬 Épico Cinematográfico",
    description: "Grandeza orquestral, reverbs de catedral e percussão épica",
    arsenal: {
      quality: AudioQuality.MASTERED,
      mastering: ["Wide Stereo"],
      rhythm: ["Double-Time", "Aggressive Drums"],
      atmosphere: ["Cinematic", "Cathedral Reverb"],
      effects: ["Delay"],
      instruments: ["Orquestra Completa", "Tímpanos", "Cordas Épicas", "Metais"],
      voiceTypes: ["Coral / Backing Vocals", "Gang Vocals (Coro de Estádio)"],
      forceInstruments: false,
      reverbLevel: 75,
      isReverbActive: true
    }
  }
];

interface ArsenalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ArsenalSettings;
  onChange: (newSettings: ArsenalSettings) => void;
}

export const ArsenalModal: React.FC<ArsenalProps> = ({ isOpen, onClose, settings, onChange }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'voices' | 'inst' | 'master' | 'rhythm' | 'atmos' | 'fx' | 'presets'>('voices');
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [instrumentInput, setInstrumentInput] = useState("");
  const [voiceInput, setVoiceInput] = useState("");
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<{ name: string; arsenal: any }[]>([]);
  const PRESETS_KEY = 'iaplay_arsenal_presets';

  const loadPresets = () => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setPresets(parsed);
      return parsed;
    } catch (e) { return []; }
  };

  useEffect(() => {
    if (isOpen) {
      loadPresets();
    }
  }, [isOpen]);

  const savePreset = () => {
    const name = presetName.trim() || ('Preset ' + new Date().toLocaleTimeString());
    const current = loadPresets();
    const idx = current.findIndex(p => p.name === name);
    const newPreset = { name, arsenal: { ...safeSettings } };
    if (idx >= 0) current[idx] = newPreset;
    else current.push(newPreset);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(current));
    setPresets(current);
    setPresetName('');
  };

  const applyPreset = (presetArsenal: any) => {
    if (presetArsenal) {
      onChange({ ...safeSettings, ...presetArsenal });
    }
  };

  const deletePreset = (name: string) => {
    const current = presets.filter(p => p.name !== name);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(current));
    setPresets(current);
  };

  const systemSettings = getSystemSettings();
  const instrumentsList = systemSettings.listInstruments || [];

  if (!isOpen) return null;

  const safeSettings: ArsenalSettings = {
    quality: settings?.quality || AudioQuality.STUDIO,
    mastering: settings?.mastering || [],
    rhythm: settings?.rhythm || [],
    atmosphere: settings?.atmosphere || [],
    effects: settings?.effects || [],
    instruments: settings?.instruments || [],
    voiceTypes: settings?.voiceTypes || [],
    forceInstruments: settings?.forceInstruments || false,
    reverbLevel: settings?.reverbLevel !== undefined ? settings.reverbLevel : 50,
    isReverbActive: settings?.isReverbActive || false,
  };

  const toggleSetting = (category: keyof ArsenalSettings, value: string) => {
    const currentList = (safeSettings[category] as string[]) || [];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];
    
    onChange({ ...safeSettings, [category]: newList });
  };

  const addInstrument = () => {
    const val = instrumentInput.trim();
    if(val && !safeSettings.instruments.includes(val)) {
        onChange({ ...safeSettings, instruments: [...safeSettings.instruments, val] });
        setInstrumentInput("");
    }
  };

  const removeInstrument = (val: string) => {
      onChange({ ...safeSettings, instruments: safeSettings.instruments.filter(i => i !== val) });
  };

  const addVoiceType = (val?: string) => {
    const text = (val !== undefined ? val : voiceInput).trim();
    if (text && !safeSettings.voiceTypes.includes(text)) {
      onChange({ ...safeSettings, voiceTypes: [...safeSettings.voiceTypes, text] });
      if (val === undefined) setVoiceInput("");
    }
  };

  const removeVoiceType = (val: string) => {
    onChange({ ...safeSettings, voiceTypes: safeSettings.voiceTypes.filter(v => v !== val) });
  };

  const toggleVoiceType = (val: string) => {
    if (safeSettings.voiceTypes.includes(val)) {
      removeVoiceType(val);
    } else {
      addVoiceType(val);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        activeTab === id 
          ? 'border-primary text-primary' 
          : 'border-transparent text-zinc-400 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#09090b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('arsenal.title')}</h2>
              <p className="text-xs text-zinc-400">{t('arsenal.subtitle')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white transition-colors bg-zinc-900 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Selector (Always Visible) */}
        <div className="p-3 bg-zinc-950 border-b border-white/5 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
            {Object.values(AudioQuality).map(q => (
                <button
                    key={q}
                    type="button"
                    onClick={() => onChange({ ...safeSettings, quality: q })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                        safeSettings.quality === q 
                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                        : 'bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                    }`}
                >
                    <CheckCircle2 className={`w-3 h-3 ${safeSettings.quality === q ? 'opacity-100' : 'opacity-0'}`} />
                    {q}
                </button>
            ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-zinc-900 px-2 overflow-x-auto shrink-0 custom-scrollbar">
            <TabButton id="voices" icon={Mic} label="Vocais & Voz" />
            <TabButton id="inst" icon={Music} label={t('arsenal.instruments')} />
            <TabButton id="master" icon={Radio} label={t('arsenal.mastering')} />
            <TabButton id="rhythm" icon={Activity} label={t('arsenal.rhythm')} />
            <TabButton id="atmos" icon={Cloud} label={t('arsenal.atmosphere')} />
            <TabButton id="fx" icon={Zap} label={t('arsenal.effects')} />
            <TabButton id="presets" icon={Sparkles} label="Presets Salvos" />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar bg-[#050505] flex-1">
          
          {activeTab === 'voices' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-6">
                    {/* Header Controls & Custom Voice Input */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  <Mic className="w-5 h-5" />
                              </div>
                              <div>
                                  <label className="text-sm text-zinc-200 font-bold block">Perfil e Estilo de Voz</label>
                                  <p className="text-xs text-zinc-400">Defina gênero, formação e timbres para inclusão no prompt final</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-2 w-full md:w-auto">
                            <input 
                                value={voiceInput}
                                onChange={(e) => setVoiceInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addVoiceType()}
                                placeholder="Adicionar voz personalizada (ex: Voz Lírica)..."
                                className="flex-1 md:w-64 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                            />
                            <button type="button" onClick={() => addVoiceType()} className="p-2 bg-primary text-white rounded-lg hover:bg-[#e05626]">
                                <Plus className="w-5 h-5" />
                            </button>
                         </div>
                    </div>

                    {/* Selected Badges */}
                    {safeSettings.voiceTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-zinc-900/20 border border-white/5 rounded-xl">
                            {safeSettings.voiceTypes.map(voice => (
                                <span key={voice} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                                    <Mic className="w-3.5 h-3.5" />
                                    {voice}
                                    <button type="button" onClick={() => removeVoiceType(voice)} className="hover:text-white ml-0.5"><X className="w-3.5 h-3.5" /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Formação Vocal */}
                    <div>
                         <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-3 flex items-center gap-2">
                             <span>Formação Vocal & Cantores</span>
                             <span className="text-[10px] text-zinc-500 font-normal lowercase">(solo, dupla sertaneja, dueto, coral)</span>
                         </span>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {ARSENAL_OPTIONS.voicesFormation.map((opt) => (
                                 <ToggleBadge
                                     key={opt.value}
                                     label={opt.label || opt.value}
                                     desc={opt.desc || ''}
                                     active={safeSettings.voiceTypes.includes(opt.value)}
                                     onClick={() => toggleVoiceType(opt.value)}
                                     onHover={setHoveredDesc}
                                     onLeave={() => setHoveredDesc(null)}
                                 />
                             ))}
                         </div>
                    </div>

                    {/* Textura, Timbre e Expressão */}
                    <div>
                         <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-3 flex items-center gap-2">
                             <span>Textura, Timbre & Expressão Vocal</span>
                             <span className="text-[10px] text-zinc-500 font-normal lowercase">(voz rasgada, rouca, aveludada, potente, belting, intimista)</span>
                         </span>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {ARSENAL_OPTIONS.voicesTexture.map((opt) => (
                                 <ToggleBadge
                                     key={opt.value}
                                     label={opt.label || opt.value}
                                     desc={opt.desc || ''}
                                     active={safeSettings.voiceTypes.includes(opt.value)}
                                     onClick={() => toggleVoiceType(opt.value)}
                                     onHover={setHoveredDesc}
                                     onLeave={() => setHoveredDesc(null)}
                                 />
                             ))}
                         </div>
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'inst' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-6">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3">
                              <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${safeSettings.forceInstruments ? 'bg-primary' : 'bg-zinc-700'}`} onClick={() => onChange({ ...safeSettings, forceInstruments: !safeSettings.forceInstruments })}>
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${safeSettings.forceInstruments ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                              <label className="text-sm text-zinc-200 font-bold">{t('arsenal.force_instruments')}</label>
                         </div>
                         <div className="flex items-center gap-2 w-full md:w-auto">
                            <input 
                                value={instrumentInput}
                                onChange={(e) => setInstrumentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addInstrument()}
                                placeholder={t('arsenal.input_placeholder')}
                                className="flex-1 md:w-64 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                            />
                            <button type="button" onClick={addInstrument} className="p-2 bg-primary text-white rounded-lg hover:bg-violet-600">
                                <Plus className="w-5 h-5" />
                            </button>
                         </div>
                    </div>

                    {/* Selected Badges */}
                    {safeSettings.instruments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-zinc-900/20 border border-white/5 rounded-xl">
                            {safeSettings.instruments.map(inst => (
                                <span key={inst} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                                    {inst}
                                    <button type="button" onClick={() => removeInstrument(inst)} className="hover:text-white"><X className="w-3.5 h-3.5" /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Presets/List */}
                    <div>
                         <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-3">{t('arsenal.popular_instruments')}</span>
                         <div className="flex flex-wrap gap-2">
                             {instrumentsList.map((inst: string) => {
                                 const isSelected = safeSettings.instruments.includes(inst);
                                 return (
                                     <button
                                         key={inst}
                                         type="button"
                                         onClick={() => isSelected ? removeInstrument(inst) : onChange({ ...safeSettings, instruments: [...safeSettings.instruments, inst] })}
                                         className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                             isSelected
                                                 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                 : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                                         }`}
                                     >
                                         {inst}
                                     </button>
                                 );
                             })}
                         </div>
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'master' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 pl-1 border-l-2 border-primary">{t('arsenal.headers.mastering')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARSENAL_OPTIONS.mastering.map(opt => (
                    <ToggleBadge 
                        key={opt.value} 
                        label={t(`arsenal.options.${opt.labelKey}.label`)}
                        desc={t(`arsenal.options.${opt.labelKey}.desc`)}
                        active={safeSettings.mastering.includes(opt.value)}
                        onClick={() => toggleSetting('mastering', opt.value)}
                        onHover={setHoveredDesc}
                        onLeave={() => setHoveredDesc(null)}
                    />
                ))}
                </div>
            </section>
          )}

          {activeTab === 'rhythm' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 pl-1 border-l-2 border-primary">{t('arsenal.headers.rhythm')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARSENAL_OPTIONS.rhythm.map(opt => (
                    <ToggleBadge 
                        key={opt.value} 
                        label={t(`arsenal.options.${opt.labelKey}.label`)}
                        desc={t(`arsenal.options.${opt.labelKey}.desc`)}
                        active={safeSettings.rhythm.includes(opt.value)}
                        onClick={() => toggleSetting('rhythm', opt.value)}
                        onHover={setHoveredDesc}
                        onLeave={() => setHoveredDesc(null)}
                    />
                ))}
                </div>
            </section>
          )}

          {activeTab === 'atmos' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                {/* REVERB CONTROLLER */}
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${safeSettings.isReverbActive ? 'bg-primary' : 'bg-zinc-700'}`} onClick={() => onChange({ ...safeSettings, isReverbActive: !safeSettings.isReverbActive })}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${safeSettings.isReverbActive ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <label className="text-sm text-zinc-200 font-bold">{t('arsenal.reverb_active')}</label>
                        </div>
                        <span className="text-sm font-mono text-primary">{safeSettings.reverbLevel}%</span>
                    </div>
                    {safeSettings.isReverbActive && (
                         <div className="flex items-center gap-4">
                             <span className="text-xs text-zinc-500">Dry</span>
                             <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={safeSettings.reverbLevel}
                                 onChange={(e) => onChange({ ...safeSettings, reverbLevel: Number(e.target.value) })}
                                 className="flex-1 accent-primary bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                             />
                             <span className="text-xs text-zinc-500">Wet</span>
                         </div>
                    )}
                </div>

                <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 pl-1 border-l-2 border-primary">{t('arsenal.headers.atmosphere')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ARSENAL_OPTIONS.atmosphere.map(opt => (
                        <ToggleBadge 
                            key={opt.value} 
                            label={t(`arsenal.options.${opt.labelKey}.label`)}
                            desc={t(`arsenal.options.${opt.labelKey}.desc`)}
                            active={safeSettings.atmosphere.includes(opt.value)}
                            onClick={() => toggleSetting('atmosphere', opt.value)}
                            onHover={setHoveredDesc}
                            onLeave={() => setHoveredDesc(null)}
                        />
                    ))}
                    </div>
                </div>

                {safeSettings.atmosphere.includes('Live Performance') && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3 animate-in fade-in">
                        <ShieldAlert className="w-5 h-5 text-yellow-500" />
                        <p className="text-xs text-yellow-200">{t('arsenal.live_warning')}</p>
                    </div>
                )}
            </section>
          )}

          {activeTab === 'fx' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 pl-1 border-l-2 border-primary">{t('arsenal.headers.post')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARSENAL_OPTIONS.effects.map(opt => (
                    <ToggleBadge 
                        key={opt.value} 
                        label={t(`arsenal.options.${opt.labelKey}.label`)}
                        desc={t(`arsenal.options.${opt.labelKey}.desc`)}
                        active={safeSettings.effects.includes(opt.value)}
                        onClick={() => toggleSetting('effects', opt.value)}
                        onHover={setHoveredDesc}
                        onLeave={() => setHoveredDesc(null)}
                    />
                ))}
                </div>
            </section>
          )}

          {activeTab === 'presets' && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                {/* Salvar Preset Atual */}
                <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Salvar Configurações Atuais como Preset</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Nome do seu preset (ex: Meu Trap Épico, Voz Quente...)"
                            className="flex-1 bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary"
                        />
                        <button
                            type="button"
                            onClick={savePreset}
                            className="px-4 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#e05626] transition-colors flex items-center gap-1.5 shadow-lg shadow-primary/20"
                        >
                            <BookmarkCheck className="w-4 h-4" /> Salvar
                        </button>
                    </div>
                </div>

                {/* Meus Presets */}
                {presets.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meus Presets Customizados</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {presets.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-zinc-900/80 border border-white/5 rounded-xl p-3 hover:border-white/20 transition-all">
                                    <div className="truncate pr-2">
                                        <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                                        <span className="text-[10px] text-zinc-500">{(p.arsenal?.instruments || []).length} inst • {(p.arsenal?.mastering || []).join(', ') || 'Padrão'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => applyPreset(p.arsenal)}
                                            className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                                        >
                                            Aplicar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deletePreset(p.name)}
                                            className="p-1.5 bg-zinc-800 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                                            title="Excluir preset"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Templates de Estúdio Recomendados */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Templates de Estúdio Prontos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DEFAULT_PRESET_TEMPLATES.map((tmpl, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-primary/40 transition-all group">
                                <div>
                                    <span className="text-xs font-bold text-white block group-hover:text-primary transition-colors">{tmpl.name}</span>
                                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{tmpl.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => applyPreset(tmpl.arsenal)}
                                    className="w-full py-2 bg-zinc-800 hover:bg-primary text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-center"
                                >
                                    Carregar Template
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
          )}

        </div>

        {/* Info Panel & Footer (Fixed) */}
        <div className="border-t border-white/10 bg-[#09090b] shrink-0 flex flex-col relative z-20">
            
            {/* Dynamic Description Box - Fixed Height to prevent jumping */}
            <div className="h-[70px] px-6 py-2.5 flex items-center justify-center border-b border-white/5 bg-zinc-900/80 backdrop-blur-sm">
                {hoveredDesc ? (
                    <div className="w-full flex gap-4 items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 bg-primary/20 rounded-full shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed font-medium">{hoveredDesc}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-zinc-600 text-xs italic opacity-50">
                        <Sparkles className="w-3 h-3" />
                        {t('arsenal.suggestions')}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-4 bg-[#09090b]">
                <button 
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 bg-primary hover:bg-[#e05626] text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(255,107,61,0.25)] active:scale-[0.99] flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    {t('arsenal.confirm')}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

interface ToggleBadgeProps {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

const ToggleBadge: React.FC<ToggleBadgeProps> = ({ 
  label,
  desc,
  active, 
  onClick,
  onHover,
  onLeave
}) => {
  return (
    <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => onHover(desc)}
        onMouseLeave={onLeave}
        className={`
            relative overflow-hidden px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 border flex flex-col items-center justify-center text-center gap-1 h-full min-h-[70px] w-full
            ${active
                ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(255,107,61,0.2)]'
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/5 hover:text-zinc-200'
            }
        `}
    >
        {active && <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-bl-md shadow-[0_0_5px_#ff6b3d]" />}
        {label}
    </button>
  );
};
