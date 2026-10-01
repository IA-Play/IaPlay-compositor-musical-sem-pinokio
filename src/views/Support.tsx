import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Send, MessageSquare, Mail } from 'lucide-react';
import { useModal } from '../components/ModalProvider';

export const Support: React.FC = () => {
    const { showAlert } = useModal();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        // Simulation of sending email
        setTimeout(async () => {
            await showAlert("Mensagem enviada! Entraremos em contato em até 24h.");
            setSubject('');
            setMessage('');
            setSent(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background text-white">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Central de Ajuda</h1>
                    <p className="text-zinc-400">
                        Encontrou um bug ou tem dúvidas sobre sua assinatura? <br />
                        Nossa equipe responde em até 24 horas úteis.
                    </p>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Assunto</label>
                            <select
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                            >
                                <option value="" disabled>Selecione um tópico...</option>
                                <option value="billing">Problemas de Pagamento / Assinatura</option>
                                <option value="bug">Reportar um Bug</option>
                                <option value="feature">Sugestão de Funcionalidade</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mensagem</label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva seu problema com detalhes..."
                                className="w-full h-40 bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none resize-none"
                            />
                        </div>

                        <button
                            disabled={sent}
                            className="w-full py-4 bg-primary hover:bg-violet-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            {sent ? 'Enviando...' : 'Enviar Solicitação'}
                            {!sent && <Send className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/10 text-center">
                        <p className="text-sm text-zinc-500 mb-2">Prefere enviar um email direto?</p>
                        <a href="mailto:suporte@iaplay.app" className="inline-flex items-center gap-2 text-white font-bold hover:underline">
                            <Mail className="w-4 h-4" /> suporte@iaplay.app
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};