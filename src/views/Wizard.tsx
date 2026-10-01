
import React, { useState } from 'react';
import { Project, Sentiment, INITIAL_PROJECT } from '../types';
import { ArrowRight, ArrowLeft, Check, Smile, Frown, Flame, Heart, Cloud, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSystemSettings } from '../services/settingsService';
import { useLanguage } from '../contexts/LanguageContext';
import { generateUUID } from '../utils/uuid';

interface WizardProps {
  onComplete: (project: Project) => void;
}

export const Wizard: React.FC<WizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const settings = getSystemSettings();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<Project>>({
    title: t('common.new_idea'),
    sentiment: Sentiment.HAPPY
  });

  // Default hardcoded mappings for classic sentiments
  const sentimentMappings: Record<string, { icon: any, color: string, bg: string }> = {
    [Sentiment.HAPPY]: { icon: Smile, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    [Sentiment.SAD]: { icon: Frown, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    [Sentiment.AGGRESSIVE]: { icon: Flame, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
    [Sentiment.ROMANTIC]: { icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/20" },
    [Sentiment.CALM]: { icon: Cloud, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
    [Sentiment.INTENSE]: { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  };

  // Helper to get visual properties (with fallback for custom admin sentiments)
  const getSentimentVisuals = (name: string) => {
    // Try to match exact key first, then fallback
    return sentimentMappings[name] || { 
        icon: Sparkles, 
        color: "text-zinc-300", 
        bg: "bg-zinc-800/50 border-white/10" 
    };
  };

  const handleFinish = () => {
    const newProject: Project = {
        ...INITIAL_PROJECT,
        ...data,
        id: generateUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
    };
    onComplete(newProject);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="mb-8 flex items-center justify-between">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-zinc-800'}`} />
                ))}
            </div>
            <div className="w-6" /> 
        </div>

        {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-bold text-white text-center mb-2">{t('wizard.step1_title')}</h1>
                <p className="text-zinc-400 text-center mb-10">{t('wizard.step1_desc')}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
                    {(settings.listSentiments || Object.values(Sentiment)).map((sName) => {
                        const { icon: Icon, color, bg } = getSentimentVisuals(sName);
                        const isSelected = data.sentiment === sName;
                        
                        // SAFE TRANSLATION LOGIC
                        const translationKey = `sentiments.${sName}`;
                        const translated = t(translationKey);
                        const label = translated === translationKey ? sName : translated;

                        return (
                            <button 
                                key={sName}
                                onClick={() => setData({...data, sentiment: sName})}
                                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-4 group ${
                                    isSelected 
                                    ? `border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,107,61,0.3)]` 
                                    : `border-white/5 bg-surface hover:border-white/20`
                                }`}
                            >
                                <div className={`p-4 rounded-full ${bg} ${isSelected ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                                    <Icon className={`w-8 h-8 ${color}`} />
                                </div>
                                <span className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h1 className="text-4xl font-bold text-white text-center mb-2">{t('wizard.step2_title')}</h1>
                 <p className="text-zinc-400 text-center mb-10">{t('wizard.step2_desc')}</p>
                 
                 <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-lg mx-auto">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">{t('wizard.input_title')}</label>
                    <input 
                        value={data.title}
                        onChange={(e) => setData({...data, title: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-zinc-700"
                        placeholder="Ex: Neon Heartbreak..."
                        autoFocus
                    />
                 </div>
            </div>
        )}

        {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h1 className="text-4xl font-bold text-white text-center mb-2">{t('wizard.step3_title')}</h1>
                 <p className="text-zinc-400 text-center mb-10">{t('wizard.step3_desc')}</p>
                 
                 <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-lg mx-auto">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">{t('wizard.input_artist')}</label>
                    <input 
                        value={data.artistInspiration || ''}
                        onChange={(e) => setData({...data, artistInspiration: e.target.value})}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-zinc-700"
                        placeholder="Ex: Drake, Beethoven..."
                        autoFocus
                    />
                 </div>
            </div>
        )}

        <div className="mt-12 flex justify-center">
            <button 
                onClick={() => {
                    if (step < 3) setStep(step + 1);
                    else handleFinish();
                }}
                className="group relative px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 overflow-hidden"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center gap-2 relative z-10">
                    {step === 3 ? t('wizard.create') : t('wizard.next')}
                    <ArrowRight className="w-5 h-5" />
                </span>
            </button>
        </div>

      </div>
    </div>
  );
};
