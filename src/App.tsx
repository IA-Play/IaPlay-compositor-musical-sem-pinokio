
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HashRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './views/Dashboard';
import { Editor } from './views/Editor';
import { Wizard } from './views/Wizard';
import { Admin } from './views/Admin';
import { Settings } from './views/Settings';
import { Tutorial } from './views/Tutorial';
import { Landing } from './views/Landing';
import { Project, INITIAL_PROJECT } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './components/ModalProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { initSettings } from './services/settingsService';
import { useSaveProjectMutation, useProjects } from './services/projectHooks';
import { useProjectStore } from './services/projectStore';

import { generateUUID } from './utils/uuid';
import { getLocalProjects, saveProject } from './services/projectService';

// --- CONTROLE DE VERSÃO ---
const CURRENT_VERSION = '3.3.1';



const EditorWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Triggers the background fetch, but we read from Zustand for optimistic UI
  const { isLoading: queryLoading } = useProjects(user?.id);
  const projects = useProjectStore(s => s.projects);

  const saveMutation = useSaveProjectMutation();
  const updateLocally = useProjectStore(s => s.updateProjectLocally);

  const rawProject = projects.find(p => p && p.id === id) || getLocalProjects().find(p => p && p.id === id);

  // MERGE WITH INITIAL_PROJECT FOR BACKWARD COMPATIBILITY AND SAFETY
  const project = rawProject ? {
    ...INITIAL_PROJECT,
    ...rawProject,
    styles: rawProject.styles || [],
    extractedStyles: rawProject.extractedStyles || [],
    detailedInstructions: rawProject.detailedInstructions || [],
    arsenal: {
      ...INITIAL_PROJECT.arsenal,
      ...(rawProject.arsenal || {}),
      instruments: rawProject.arsenal?.instruments || [],
      mastering: rawProject.arsenal?.mastering || [],
      rhythm: rawProject.arsenal?.rhythm || [],
      atmosphere: rawProject.arsenal?.atmosphere || [],
      effects: rawProject.arsenal?.effects || [],
    }
  } : undefined;

  // DIRTY STATE TRACKING: Guarda snapshot do último estado salvo
  const lastSavedSnapshotRef = React.useRef<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  // Inicializa snapshot quando o projeto é carregado pela primeira vez
  useEffect(() => {
    if (project && lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = JSON.stringify(project);
    }
  }, [project]);

  // Detecta alterações comparando estado atual com último salvo
  useEffect(() => {
    if (!project || lastSavedSnapshotRef.current === null) return;
    const currentSnapshot = JSON.stringify(project);
    setIsDirty(currentSnapshot !== lastSavedSnapshotRef.current);
  }, [project]);

  useEffect(() => {
    // Only redirect if both query finishes loading and project still wasn't found in state
    if (!queryLoading && projects.length > 0 && !project) {
      navigate('/dashboard');
    }
  }, [project, projects, queryLoading, navigate]);

  if (!project) return <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-4"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p>Carregando Projeto...</p></div>;

  const updateLocalProject = (updatedOrFn: Project | ((prev: Project) => Project)) => {
    if (typeof updatedOrFn === 'function') {
      if (!project) return;
      const resolved = updatedOrFn(project);
      updateLocally(resolved);
    } else {
      updateLocally(updatedOrFn);
    }
  };

  const handleManualSave = async (overrideProject?: Project) => {
    const projToSave = overrideProject || project;
    if (!projToSave) return;
    try {
      await saveMutation.mutateAsync(projToSave);
      // Atualiza o snapshot após salvar com sucesso
      lastSavedSnapshotRef.current = JSON.stringify(projToSave);
      setIsDirty(false);
    } catch (e) {
      console.error("Failed to save project", e);
    }
  };

  // Determina saveStatus baseado em dirty state real
  const saveStatus = saveMutation.isPending
    ? 'saving'
    : saveMutation.isError
      ? 'error'
      : isDirty
        ? 'unsaved'
        : 'saved';

  return (
    <Editor
      project={project}
      setProject={updateLocalProject}
      onSave={handleManualSave}
      saveStatus={saveStatus}
    />
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const saveMutation = useSaveProjectMutation();

  // Removido useEffect do AdSense a pedido do usuário (migrando para rotatividade própria)

  // --- LÓGICA DE ATUALIZAÇÃO FORÇADA V3.0.0 ---
  useEffect(() => {
    const storedVersion = localStorage.getItem('iaplay_version');

    if (storedVersion !== CURRENT_VERSION) {
      console.log(`♻️ Atualizando App: ${storedVersion} -> ${CURRENT_VERSION}`);
      setIsUpdating(true);

      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      localStorage.setItem('iaplay_version', CURRENT_VERSION);
      sessionStorage.clear();

      setTimeout(() => {
        window.location.href = window.location.pathname + '?v=' + CURRENT_VERSION + '&t=' + Date.now();
      }, 1000);
      return;
    }
  }, []);

  useEffect(() => {
    if (isUpdating) return;
    initSettings().then(() => setSettingsLoaded(true));
  }, [isUpdating]);

  const createNewProject = async () => {
    const userId = user?.id || 'local-creator';
    const newId = generateUUID();
    const newProject: Project = {
      ...INITIAL_PROJECT,
      id: newId,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Garante que o projeto é registrado imediatamente
    useProjectStore.getState().updateProjectLocally(newProject);
    saveProject(newProject);

    try {
      await saveMutation.mutateAsync(newProject);
    } catch (e) {
      console.warn("Async sync notice (continuing locally):", e);
    }

    navigate(`/editor/${newProject.id}`);
  };

  const handleWizardComplete = async (projectData: Project) => {
    const userId = user?.id || 'local-creator';
    const fullProject: Project = {
      ...projectData,
      id: projectData.id || generateUUID(),
      userId: userId,
      createdAt: projectData.createdAt || new Date(),
      updatedAt: new Date()
    };

    useProjectStore.getState().updateProjectLocally(fullProject);
    saveProject(fullProject);

    try {
      await saveMutation.mutateAsync(fullProject);
    } catch (e) {
      console.warn("Wizard async sync notice:", e);
    }

    navigate(`/editor/${fullProject.id}`);
  };

  const location = useLocation();

  if (isUpdating) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-6 z-[9999] relative">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
            Atualizando Sistema...
          </h1>
          <p className="text-zinc-500">Instalando versão {CURRENT_VERSION}</p>
          <p className="text-xs text-zinc-600">Limpando cache e otimizando performance.</p>
        </div>
      </div>
    );
  }

  if (!settingsLoaded) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-zinc-500 space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* @ts-expect-error React Router v6/7 JSX allows key but types might conflict */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard createNewProject={createNewProject} />} />
        <Route path="/dashboard" element={<Dashboard createNewProject={createNewProject} />} />
        <Route path="/editor/:id" element={<EditorWrapper />} />
        <Route path="/wizard" element={<Wizard onComplete={handleWizardComplete} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/landing" element={<Landing />} />

        {/* Redirecionamentos de rotas antigas */}
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/register" element={<Navigate to="/dashboard" replace />} />
        <Route path="/pricing" element={<Navigate to="/dashboard" replace />} />
        <Route path="/checkout/:plan" element={<Navigate to="/dashboard" replace />} />
        <Route path="/payment/success" element={<Navigate to="/dashboard" replace />} />
        <Route path="/downloads" element={<Navigate to="/dashboard" replace />} />
        <Route path="/blog" element={<Navigate to="/dashboard" replace />} />
        <Route path="/blog/:slug" element={<Navigate to="/dashboard" replace />} />
        <Route path="/royalties" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <AuthProvider>
          <LanguageProvider>
            <HashRouter>
              <AppContent />
            </HashRouter>
          </LanguageProvider>
        </AuthProvider>
      </ModalProvider>
    </QueryClientProvider>
  );
};

export default App;
