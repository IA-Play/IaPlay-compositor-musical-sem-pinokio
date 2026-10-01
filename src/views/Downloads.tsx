import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { 
    Download, FileText, FileArchive, Music, Video, 
    Image as ImageIcon, Lock, AlertCircle, ArrowLeft, 
    File, ExternalLink, Loader2
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { PremiumFile } from '../types';
import { useModal } from '../components/ModalProvider';

export const Downloads: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert } = useModal();

    const [files, setFiles] = useState<PremiumFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // 1. Extrair query params (Ex: ?fileId=XYZ)
    const queryParams = new URLSearchParams(location.search);
    const fileId = queryParams.get('fileId') || queryParams.get('id');

    // 2. Helper de validação de acesso: Todos os usuários logados têm acesso total no modo beta
    const hasPremiumAccess = () => {
        return !!user;
    };

    // 3. Efeito Principal de Proteção de Rota e Redirecionamento Direto (YouTube Link)
    useEffect(() => {
        if (authLoading) return;

        // Se NÃO estiver logado: Redireciona para o login salvando a URL atual no estado
        if (!user) {
            navigate('/login', { 
                replace: true, 
                state: { from: location } 
            });
            return;
        }

        // Se estiver logado, mas NÃO for assinante ativo: Redireciona para o Upgrade com mensagem
        if (!hasPremiumAccess()) {
            navigate('/pricing', {
                replace: true,
                state: { 
                    message: "Este arquivo é exclusivo para assinantes Mensais ou Anuais do iaplay. Assine agora para liberar o acesso." 
                }
            });
            return;
        }

        // Se for assinante ativo e clicou em um link direto (YouTube): Iniciar download imediatamente
        if (fileId) {
            handleDownload(fileId);
        }

        // Carregar arquivos da galeria
        loadPremiumFiles();
    }, [user, authLoading, fileId]);

    // 4. Carregar arquivos da galeria de downloads
    const loadPremiumFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await apiClient.get<any>('/api/download.php?action=list');
            if (res.error) {
                console.error("Erro ao carregar arquivos premium:", res.error);
            } else if (Array.isArray(res.data)) {
                setFiles(res.data);
            }
        } catch (err) {
            console.error("Falha na chamada da API de listagem:", err);
        } finally {
            setLoadingFiles(false);
        }
    };

    // 5. Tratar download seguro através da rota do backend
    const handleDownload = (id: string) => {
        setDownloadingId(id);
        
        // Em vez de chamar via fetch, forçamos o redirecionamento do navegador
        // para o download.php?id=... que servirá o arquivo com cabeçalhos de anexo.
        // O navegador gerenciará os cookies de sessão de forma transparente.
        const downloadUrl = `/api/download.php?id=${id}`;
        
        // Timeout pequeno apenas para feedback visual (spinner do botão)
        setTimeout(() => {
            window.location.href = downloadUrl;
            setDownloadingId(null);
        }, 800);
    };

    // 6. Helper para renderizar o ícone de arquivo correspondente
    const getFileIcon = (fileName: string) => {
        const ext = (fileName || '').split('.').pop()?.toLowerCase();
        if (!ext) return <File className="w-8 h-8 text-purple-400" />;

        if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
            return <FileArchive className="w-8 h-8 text-yellow-400" />;
        }
        if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
            return <Music className="w-8 h-8 text-emerald-400" />;
        }
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
            return <Video className="w-8 h-8 text-pink-400" />;
        }
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return <ImageIcon className="w-8 h-8 text-cyan-400" />;
        }
        if (['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
            return <FileText className="w-8 h-8 text-blue-400" />;
        }
        return <File className="w-8 h-8 text-purple-400" />;
    };

    // Render de loading global enquanto valida a autenticação
    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse">Verificando credenciais...</p>
            </div>
        );
    }

    // Se o usuário não tem acesso, o useEffect irá redirecionar, então renderizamos um placeholder seguro
    if (!user || !hasPremiumAccess()) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
                <Lock className="w-12 h-12 text-red-500 animate-bounce" />
                <p className="text-zinc-400 font-medium">Acesso restrito a assinantes...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
                
                {/* Header da Galeria */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-left-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-purple-500/20">
                                Premium
                            </span>
                            <span className="text-zinc-500 text-sm">Atualizado frequentemente</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            Área de Downloads <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">VIP</span>
                        </h1>
                        <p className="text-zinc-400 mt-2 max-w-xl">
                            Aproveite o acesso exclusivo a pacotes de samples, acapellas, efeitos sonoros de alta fidelidade e recursos criados pelos produtores da comunidade.
                        </p>
                    </div>
                </div>

                {/* Banner de Status do Link Direto (Se estiver baixando via link do YouTube) */}
                {fileId && (
                    <div className="mb-10 p-5 rounded-2xl bg-zinc-900 border border-purple-500/30 flex items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <Download className="w-6 h-6 text-purple-400 shrink-0" />
                            <div>
                                <h3 className="font-bold text-white text-sm">Download do YouTube Iniciado</h3>
                                <p className="text-xs text-zinc-400">Verificamos seu plano e iniciamos o download seguro. Se o arquivo não iniciar, clique na listagem abaixo.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/downloads', { replace: true })}
                            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-all"
                        >
                            Limpar Filtro <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Listagem dos Arquivos */}
                {loadingFiles ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                        <p className="text-sm font-medium animate-pulse">Buscando biblioteca de arquivos premium...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl bg-zinc-900/50 border border-white/5 max-w-lg mx-auto p-8">
                        <File className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-300">Nenhum arquivo disponível</h3>
                        <p className="text-sm text-zinc-500 mt-2">
                            Ainda não cadastramos arquivos para download neste servidor. Volte em breve!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6">
                        {files.map((file) => (
                            <div 
                                key={file.id} 
                                className="group relative rounded-3xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 backdrop-blur-xl"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-purple-400" />
                                </div>

                                <div className="flex gap-4 items-start mb-6">
                                    <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-purple-950/40 transition-colors shrink-0">
                                        {getFileIcon(file.url_arquivo)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-white text-lg leading-tight group-hover:text-purple-300 transition-colors">
                                            {file.titulo}
                                        </h3>
                                        <span className="text-xs text-zinc-500">
                                            Adicionado em: {new Date(file.criado_em).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-zinc-400 text-sm line-clamp-3 mb-6 flex-1 text-left">
                                    {file.descricao || "Sem descrição disponível."}
                                </p>

                                <button
                                    onClick={() => handleDownload(file.id)}
                                    disabled={downloadingId !== null}
                                    className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg disabled:opacity-50"
                                >
                                    {downloadingId === file.id ? (
                                        <>
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            <span>Baixando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors group-hover:animate-bounce" />
                                            <span>Baixar Arquivo</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
export default Downloads;
