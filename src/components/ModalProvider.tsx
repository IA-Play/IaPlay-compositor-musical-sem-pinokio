
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, Info, X, Check } from 'lucide-react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    defaultValue?: string;
}

interface ModalContextType {
    showAlert: (message: string, options?: ModalOptions) => Promise<void>;
    showConfirm: (message: string, options?: ModalOptions) => Promise<boolean>;
    showPrompt: (message: string, options?: ModalOptions) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ModalType>('alert');
    const [options, setOptions] = useState<ModalOptions>({});
    const [inputValue, setInputValue] = useState('');
    const [resolver, setResolver] = useState<{ resolve: (val: any) => void } | null>(null);

    const show = (msg: string, t: ModalType, opt: ModalOptions = {}) => {
        setMessage(msg);
        setType(t);
        setOptions(opt);
        setInputValue(opt.defaultValue || '');
        setIsOpen(true);
        return new Promise<any>((resolve) => {
            setResolver({ resolve });
        });
    };

    const showAlert = (msg: string, opt?: ModalOptions) => show(msg, 'alert', opt);
    const showConfirm = (msg: string, opt?: ModalOptions) => show(msg, 'confirm', opt);
    const showPrompt = (msg: string, opt?: ModalOptions) => show(msg, 'prompt', opt);

    const handleConfirm = () => {
        if (!resolver) return;
        setIsOpen(false);
        if (type === 'alert') resolver.resolve(undefined);
        if (type === 'confirm') resolver.resolve(true);
        if (type === 'prompt') resolver.resolve(inputValue);
        setResolver(null);
    };

    const handleCancel = () => {
        if (!resolver) return;
        setIsOpen(false);
        if (type === 'confirm') resolver.resolve(false);
        if (type === 'prompt') resolver.resolve(null);
        setResolver(null);
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-zinc-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === 'alert' ? 'bg-blue-500/20 text-blue-400' :
                                        type === 'confirm' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-purple-500/20 text-purple-400'
                                    }`}>
                                    {type === 'alert' && <Info className="w-6 h-6" />}
                                    {type === 'confirm' && <HelpCircle className="w-6 h-6" />}
                                    {type === 'prompt' && <AlertCircle className="w-6 h-6" />}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                                        {options.title || (type === 'alert' ? 'Aviso' : type === 'confirm' ? 'Confirmação' : 'Entrada')}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                {type === 'prompt' && (
                                    <input
                                        autoFocus
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none"
                                        placeholder="Digite aqui..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                    />
                                )}

                                <div className="flex gap-2 w-full pt-2">
                                    {(type === 'confirm' || type === 'prompt') && (
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors"
                                        >
                                            {options.cancelLabel || 'Cancelar'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 px-4 py-2.5 bg-primary hover:bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all border border-white/10"
                                    >
                                        {options.confirmLabel || (type === 'alert' ? 'Entendido' : 'Confirmar')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ModalContext.Provider>
    );
};
