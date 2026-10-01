import React, { useRef } from 'react';
import { Project, Sentiment } from '../types';
import { Plus, Music2, Calendar, Trash2, Copy, Crown, Lock, Download, Upload, Loader2, Clock, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { useProjects, useDeleteProjectMutation, useSaveProjectMutation } from '../services/projectHooks';
import { generateUUID } from '../utils/uuid';

interface DashboardProps {
    createNewProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ createNewProject }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: projects = [], isLoading } = useProjects(user?.id);
    const deleteMutation = useDeleteProjectMutation();
    const saveMutation = useSaveProjectMutation();

    const handleCreate = () => {
        createNewProject();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`${t('common.delete')}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleDuplicate = async (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        const newProject = {
            ...project,
            id: generateUUID(),
            title: `${project.title} (${t('common.copy')})`,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        saveMutation.mutate(newProject);
    };

    // --- EXPORT LOGIC ---
    const handleExport = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();

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

    // --- IMPORT LOGIC ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!event.target?.result || typeof event.target.result !== 'string') return;

                const rawData = JSON.parse(event.target.result);

                if (!rawData.title || !rawData.arsenal) {
                    alert(t('dashboard.invalid_file'));
                    return;
                }

                const newProject: Project = {
                    ...rawData,
                    id: generateUUID(),
                    userId: user?.id || 'local-creator',
                    title: `${rawData.title} (Imported)`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                saveMutation.mutate(newProject);
                alert(t('dashboard.import_success'));

            } catch (err) {
                console.error(err);
                alert(t('dashboard.import_error'));
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const getSentimentColor = (s: Sentiment | string) => {
        switch (s) {
            case Sentiment.HAPPY: return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
            case Sentiment.SAD: return "bg-blue-500/20 text-blue-500 border-blue-500/30";
            case Sentiment.AGGRESSIVE: return "bg-red-500/20 text-red-500 border-red-500/30";
            case Sentiment.ROMANTIC: return "bg-pink-500/20 text-pink-500 border-pink-500/30";
            default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background"
        >
            <Navbar />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t('dashboard.title')}</h1>
                        <p className="text-sm md:text-base text-zinc-400">
                            {projects.length} {t('dashboard.used')}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                        className="flex gap-3 overflow-x-auto pb-2 md:pb-0"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                        <button onClick={handleImportClick} className="px-4 py-2.5 bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 border border-white/10 rounded-xl text-white font-medium flex items-center gap-2 whitespace-nowrap transition-all">
                            <Upload className="w-4 h-4" /> {t('dashboard.btn_import')}
                        </button>

                        <Link to="/wizard" className="px-5 py-2.5 md:px-6 md:py-3 bg-surface/80 backdrop-blur-md border border-white/10 rounded-xl text-white font-medium hover:border-primary transition-all flex items-center gap-2 whitespace-nowrap">
                            <span className="text-secondary">✦</span> {t('dashboard.magic_mode')}
                        </Link>
                        <button
                            onClick={handleCreate}
                            className="px-5 py-2.5 md:px-6 md:py-3 bg-primary hover:bg-[#e05626] rounded-xl text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            {t('dashboard.new_project')}
                        </button>
                    </motion.div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading && projects.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-zinc-500">{t('common.loading')}...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-3xl bg-surface/30 backdrop-blur-sm"
                        >
                            <Music2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-zinc-300">{t('dashboard.empty_title')}</h3>
                            <p className="text-zinc-500 mt-2 mb-6">{t('dashboard.empty_desc')}</p>
                            <button onClick={handleCreate} className="text-primary hover:underline">{t('dashboard.create_now')}</button>
                        </motion.div>
                    ) : (
                        projects.map(project => {
                            const rawSentiment = project.sentiment || Sentiment.NEUTRAL;
                            const translationKey = `sentiments.${rawSentiment}`;
                            const translated = t(translationKey);
                            const sentimentLabel = translated === translationKey ? rawSentiment : translated;

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Link
                                        to={`/editor/${project.id}`}
                                        className="group relative bg-surface/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,107,61,0.15)] transition-all duration-300 flex flex-col h-64"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getSentimentColor(project.sentiment)}`}>
                                                {sentimentLabel}
                                            </div>
                                            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleExport(e, project)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white" title={t('common.export_json')}>
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => handleDuplicate(e, project)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white" title={t('common.duplicate')}>
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => handleDelete(e, project.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400" title={t('common.delete')}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors truncate">
                                            {project.title}
                                        </h3>

                                        <p className="text-zinc-500 text-sm line-clamp-3 mb-auto">
                                            {project.lyrics || t('dashboard.no_lyrics')}
                                        </p>

                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(project.updatedAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-1">
                                                {project.musicType === "Instrumental" && <Music2 className="w-3 h-3 text-secondary" />}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })
                    )}
                </main>
            </div>
        </motion.div>
    );
};
