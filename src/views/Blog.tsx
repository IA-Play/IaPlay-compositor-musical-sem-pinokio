
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getSystemSettings, initSettings } from '../services/settingsService';
import { SEO } from '../components/SEO';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Calendar, User, Tag, Youtube } from 'lucide-react';

export const Blog: React.FC = () => {
    const { slug } = useParams();
    const [settings, setSettings] = useState(getSystemSettings());
    const { t, language } = useLanguage();

    useEffect(() => {
        const load = async () => {
            const fresh = await initSettings();
            setSettings(fresh);
        };
        load();
    }, []);

    const posts = settings.blogPosts || [];

    // Helper para converter URL do YouTube em Embed
    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        // Suporta youtu.be e youtube.com
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    // --- BLOG LIST VIEW ---
    if (!slug) {
        return (
            <div className="min-h-screen bg-background text-white">
                <SEO
                    title={t('blog.title')}
                    description={t('blog.subtitle')}
                />
                <Navbar />
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('blog.title')}</h1>
                    <p className="text-zinc-400 text-lg mb-12 max-w-2xl">
                        {t('blog.subtitle')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {posts.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-zinc-500">
                                Nenhum artigo publicado ainda.
                            </div>
                        ) : posts.map(post => {
                            const localized = {
                                title: post.translations?.[language]?.title || post.translations?.['pt']?.title || post.title || '',
                                excerpt: post.translations?.[language]?.excerpt || post.translations?.['pt']?.excerpt || post.excerpt || '',
                                content: post.translations?.[language]?.content || post.translations?.['pt']?.content || post.content || '',
                                keywords: post.translations?.[language]?.keywords || post.translations?.['pt']?.keywords || post.keywords || ''
                            };
                            return (
                                <Link to={`/blog/${post.slug}`} key={post.id} className="group block bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all">
                                    {post.coverImage && (
                                        <div className="h-48 overflow-hidden">
                                            <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={localized.title} />
                                        </div>
                                    )}
                                    <div className="p-8">
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                            {localized.title}
                                        </h2>
                                        <p className="text-zinc-400 mb-6 line-clamp-3">
                                            {localized.excerpt}
                                        </p>
                                        <span className="text-sm font-bold text-white group-hover:underline">{t('blog.read_more')} &rarr;</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // --- BLOG DETAIL VIEW ---
    const post = posts.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-zinc-400">Artigo não encontrado.</p>
                    <Link to="/blog" className="text-primary hover:underline mt-4 block">Voltar ao Blog</Link>
                </div>
            </div>
        );
    }

    const localized = {
        title: post.translations?.[language]?.title || post.translations?.['pt']?.title || post.title || '',
        excerpt: post.translations?.[language]?.excerpt || post.translations?.['pt']?.excerpt || post.excerpt || '',
        content: post.translations?.[language]?.content || post.translations?.['pt']?.content || post.content || '',
        keywords: post.translations?.[language]?.keywords || post.translations?.['pt']?.keywords || post.keywords || '',
        videoUrl: post.translations?.[language]?.videoUrl || post.translations?.['pt']?.videoUrl || post.videoUrl || ''
    };
    const embedUrl = localized.videoUrl ? getEmbedUrl(localized.videoUrl) : null;

    return (
        <div className="min-h-screen bg-background text-white">
            <SEO
                title={localized.title}
                description={localized.excerpt}
                keywords={localized.keywords}
            />
            <Navbar />

            {/* Cover Image (Hero) */}
            {post.coverImage && (
                <div className="w-full h-[40vh] relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
                    <img src={post.coverImage} className="w-full h-full object-cover opacity-60" alt={localized.title} />
                </div>
            )}

            <article className={`max-w-3xl mx-auto px-6 py-12 relative z-20 ${post.coverImage ? '-mt-32' : ''}`}>
                <Link to="/blog" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-sm border border-white/10">
                    <ArrowLeft className="w-4 h-4" /> {t('blog.back')}
                </Link>

                <header className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight drop-shadow-lg">{localized.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 border-b border-white/10 pb-8">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4" /> Equipe IAPLAY
                        </span>
                        {localized.keywords && (
                            <span className="flex items-center gap-2">
                                <Tag className="w-4 h-4" /> {localized.keywords.split(',')[0]}
                            </span>
                        )}
                    </div>
                </header>

                {/* Video Player */}
                {embedUrl && (
                    <div className="mb-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <div className="aspect-video bg-black">
                            <iframe
                                src={embedUrl}
                                title="YouTube video player"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="bg-zinc-900 p-3 flex items-center gap-2 text-xs text-zinc-400">
                            <Youtube className="w-4 h-4 text-red-500" />
                            Vídeo Tutorial Oficial
                        </div>
                    </div>
                )}

                <div
                    className="prose prose-invert prose-lg prose-purple max-w-none prose-img:rounded-xl prose-headings:text-white prose-p:text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: localized.content || '' }}
                />

                <div className="mt-16 p-8 bg-zinc-900 rounded-2xl border border-primary/20 text-center">
                    <h3 className="text-2xl font-bold mb-2">Gostou da dica?</h3>
                    <p className="text-zinc-400 mb-6">Teste agora mesmo criar essa música usando nossa IA.</p>
                    <Link to="/register" className="inline-block px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                        Criar Música Agora
                    </Link>
                </div>
            </article>
        </div>
    );
};
