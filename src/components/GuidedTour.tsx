import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  setActiveTab?: (tab: 'controls' | 'lyrics' | 'output') => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Efeito para recalcular coordenadas do elemento focado
  useEffect(() => {
    if (!isOpen || !step) return;

    // Se o elemento estiver em abas escondidas no mobile, podemos forçar a mudança de aba
    if (setActiveTab) {
      if (step.target.includes('arsenal') || step.target.includes('lyric-engine') || step.target.includes('dna')) {
        if (activeTab !== 'controls') {
          setActiveTab('controls');
          // Pequeno delay para renderizar a aba antes de pegar a coordenada
          const timer = setTimeout(updateCoords, 150);
          return () => clearTimeout(timer);
        }
      } else if (step.target.includes('lyrics')) {
        if (activeTab !== 'lyrics') {
          setActiveTab('lyrics');
          const timer = setTimeout(updateCoords, 150);
          return () => clearTimeout(timer);
        }
      } else if (step.target.includes('structured-prompt')) {
        if (activeTab !== 'output') {
          setActiveTab('output');
          const timer = setTimeout(updateCoords, 150);
          return () => clearTimeout(timer);
        }
      }
    }

    updateCoords();

    function updateCoords() {
      if (step.position === 'center') {
        setCoords(null);
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        
        // Pequeno delay para esperar o scroll terminar
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 100);
      } else {
        setCoords(null);
      }
    }

    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [currentStep, isOpen, step?.target, activeTab]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('iaplay_tour_completed', 'true');
    onClose();
  };

  // Posicionamento inteligente do Popover baseado nas coordenadas do target
  const getPopoverStyle = () => {
    if (!coords) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const
      };
    }

    const { top, left, width, height } = coords;
    const offset = 12;

    switch (step.position) {
      case 'bottom':
        return {
          top: top + height + offset,
          left: left + width / 2 - (popoverRef.current?.offsetWidth || 320) / 2,
          position: 'absolute' as const
        };
      case 'top':
        return {
          top: top - (popoverRef.current?.offsetHeight || 200) - offset,
          left: left + width / 2 - (popoverRef.current?.offsetWidth || 320) / 2,
          position: 'absolute' as const
        };
      case 'left':
        return {
          top: top + height / 2 - (popoverRef.current?.offsetHeight || 200) / 2,
          left: left - (popoverRef.current?.offsetWidth || 320) - offset,
          position: 'absolute' as const
        };
      case 'right':
        return {
          top: top + height / 2 - (popoverRef.current?.offsetHeight || 200) / 2,
          left: left + width + offset,
          position: 'absolute' as const
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed' as const
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
      {/* Backdrop com máscara clip-path para focar o elemento ativo */}
      <div 
        className="absolute inset-0 bg-black/80 transition-all duration-300 pointer-events-auto"
        style={{
          clipPath: coords 
            ? `polygon(
                0% 0%, 0% 100%, 
                ${coords.left}px 100%, 
                ${coords.left}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top}px, 
                ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                ${coords.left}px ${coords.top + coords.height}px, 
                ${coords.left}px 100%, 
                100% 100%, 100% 0%
              )`
            : 'none'
        }}
        onClick={handleComplete}
      />

      {/* Destaque Visual ao redor do elemento */}
      {coords && (
        <div 
          className="absolute border-2 border-primary rounded-xl pointer-events-none shadow-[0_0_20px_rgba(255,107,61,0.5)] transition-all duration-300 animate-pulse"
          style={{
            top: coords.top - 4,
            left: coords.left - 4,
            width: coords.width + 8,
            height: coords.height + 8
          }}
        />
      )}

      {/* Popover explicativo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-[320px] max-w-[calc(100vw-2rem)] bg-[#09090b] border border-[#ff6b3d]/30 rounded-2xl p-5 shadow-2xl pointer-events-auto z-50 flex flex-col gap-4 text-white"
          style={getPopoverStyle()}
        >
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Tutorial IAPLAY ({currentStep + 1}/{steps.length})
            </span>
            <button 
              onClick={handleComplete} 
              className="text-zinc-500 hover:text-white transition-colors"
              title="Pular tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">{step.content}</p>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                currentStep === 0 
                  ? 'text-zinc-700 cursor-not-allowed' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-primary hover:bg-[#e05626] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-lg shadow-primary/20"
            >
              {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'} 
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
