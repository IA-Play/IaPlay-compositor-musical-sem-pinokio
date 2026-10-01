
import React from 'react';
import { Navbar } from '../components/Navbar';
import { getSystemSettings } from '../services/settingsService';
import { useLanguage } from '../contexts/LanguageContext';
import { PlayCircle, Youtube } from 'lucide-react';

export const Tutorial: React.FC = () => {
  const settings = getSystemSettings();
  const { t } = useLanguage();

  // Helper para converter URL do YouTube em Embed (suporta vídeo e playlists)
  const getEmbedUrl = (url: string) => {
      if(!url) return null;
      
      // Playlist Link
      if (url.includes('list=')) {
          const listId = url.split('list=')[1].split('&')[0];
          return `https://www.youtube.com/embed/videoseries?list=${listId}`;
      }

      // Single Video Link
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const rawUrl = (settings.tutorialVideoUrl && !settings.tutorialVideoUrl.includes('dQw4w9WgXcQ'))
    ? settings.tutorialVideoUrl 
    : "https://www.youtube.com/watch?v=60ygy76sKNQ";

  const videoUrl = getEmbedUrl(rawUrl);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-bold uppercase mb-4 border border-red-500/20">
                <Youtube className="w-4 h-4" />
                <span>Central de Aprendizado</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Como usar o IAPLAY</h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Domine a criação musical com IA. Assista ao guia completo abaixo para aprender a criar letras, usar o arsenal e estruturar seus prompts.
            </p>
        </div>

        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                {videoUrl ? (
                    <iframe 
                        src={videoUrl} 
                        title="IAPLAY Tutorial" 
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                        <p>Nenhum vídeo configurado no painel administrativo.</p>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="p-6 bg-surface border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">1. Crie ou Importe</h3>
                <p className="text-sm text-zinc-400">Comece do zero ou use o Assistente Mágico para estruturar sua ideia inicial.</p>
            </div>
            <div className="p-6 bg-surface border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">2. Defina o Arsenal</h3>
                <p className="text-sm text-zinc-400">Escolha instrumentos, ritmo e efeitos específicos no painel "Arsenal Sonoro".</p>
            </div>
            <div className="p-6 bg-surface border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">3. Gere o Prompt</h3>
                <p className="text-sm text-zinc-400">Use o botão "Gerar Prompt Final" e leve o código pronto para o Suno ou Udio.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
