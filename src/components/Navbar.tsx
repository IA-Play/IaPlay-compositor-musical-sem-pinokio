import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Music, Crown, Menu, X, Shield, Settings as SettingsIcon, Globe, Sparkles, BookOpen, LayoutDashboard, Sliders } from 'lucide-react';
import { AppLanguage } from '../types';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-panel sticky top-0 z-50 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-500">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white tracking-widest text-2xl group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">IAPLAY</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-zinc-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4 text-primary" /> Meus Projetos
          </Link>

          <Link to="/admin" className="text-zinc-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-violet-400" /> Prompts Mestres (IA)
          </Link>

          <Link to="/settings" className="text-zinc-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
            <SettingsIcon className="w-4 h-4 text-emerald-400" /> Chaves de IA & Ollama
          </Link>

          <Link to="/tutorial" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Tutorial
          </Link>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold uppercase transition-colors py-1 px-2 rounded-lg border border-white/5 bg-zinc-900/50">
              <Globe className="w-3.5 h-3.5" />
              {language}
            </button>
            <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {Object.values(AppLanguage).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`w-full text-left px-4 py-1.5 text-xs font-bold uppercase hover:bg-white/10 transition-colors ${language === lang ? 'text-primary' : 'text-zinc-400'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={() => setLanguage(language === AppLanguage.PT ? AppLanguage.EN : AppLanguage.PT)} className="text-xs font-bold uppercase text-zinc-500 border border-zinc-800 px-2 py-1 rounded">
            {language}
          </button>
          <button
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950 px-6 py-6 space-y-6 shadow-xl animate-in slide-in-from-top-4 absolute w-full">
          <div className="flex flex-col gap-5">
            <Link to="/dashboard" className="text-white font-bold text-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <LayoutDashboard className="w-5 h-5 text-primary" /> Meus Projetos
            </Link>
            <Link to="/admin" className="text-white font-bold text-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <Sliders className="w-5 h-5 text-violet-400" /> Prompts Mestres (IA)
            </Link>
            <Link to="/settings" className="text-white font-bold text-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <SettingsIcon className="w-5 h-5 text-emerald-400" /> Chaves de IA & Ollama
            </Link>
            <Link to="/tutorial" className="text-zinc-400 hover:text-white font-medium text-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <BookOpen className="w-5 h-5" /> Tutorial
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
