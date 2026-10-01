
import { Project } from "../types";
import { apiClient } from "./apiClient";

const LOCAL_STORAGE_KEY = 'iaplay_local_projects';

export const getLocalProjects = (): Project[] => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.filter((p): p is Project => Boolean(p && typeof p === 'object' && p.id));
            }
        }
    } catch (e) {
        console.error("Error reading local projects", e);
    }
    return [];
};

export const setLocalProjects = (projects: Project[]) => {
    try {
        const validProjects = Array.isArray(projects)
            ? projects.filter((p): p is Project => Boolean(p && typeof p === 'object' && p.id))
            : [];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validProjects));
    } catch (e) {
        console.error("Error saving local projects", e);
    }
};

export const fetchProjects = async (userId: string): Promise<Project[]> => {
    const local = getLocalProjects();

    // Tenta sincronizar silenciosamente com backend caso disponível
    try {
        const response = await apiClient.get<Project[]>('/api/projects.php', { user_id: userId, t: Date.now().toString() });
        if (response.data && Array.isArray(response.data)) {
            const cleanRemote = response.data.filter((p): p is Project => Boolean(p && typeof p === 'object' && p.id));
            // Merge projects sem duplicatas
            const merged = [...cleanRemote];
            for (const p of local) {
                if (p && p.id && !merged.some(m => m && m.id === p.id)) {
                    merged.push(p);
                }
            }
            setLocalProjects(merged);
            return merged;
        }
    } catch (e) {
        // Backend offline / modo local Pinokio
    }

    return local;
};

export const saveProject = async (project: Project): Promise<{ success: boolean }> => {
    if (!project || !project.id) {
        return { success: false };
    }

    // 1. Salva imediatamente no armazenamento local
    try {
        const current = getLocalProjects();
        const index = current.findIndex(p => p && p.id === project.id);
        const updatedProject: Project = {
            ...project,
            updatedAt: new Date()
        };

        if (index >= 0) {
            current[index] = updatedProject;
        } else {
            current.unshift(updatedProject);
        }
        setLocalProjects(current);

        // 2. Tenta sincronizar com API em segundo plano (silenciosamente)
        apiClient.post<{ success: boolean }>('/api/projects.php?action=save', updatedProject).catch(() => {});
    } catch (e) {
        console.error("Local save error:", e);
    }

    return { success: true };
};

export const deleteProject = async (id: string): Promise<{ success: boolean }> => {
    if (!id) return { success: false };

    // 1. Remove imediatamente do armazenamento local
    try {
        const current = getLocalProjects();
        const filtered = current.filter(p => p && p.id !== id);
        setLocalProjects(filtered);

        // 2. Tenta sincronizar com API em segundo plano
        apiClient.post<{ success: boolean }>('/api/projects.php?action=delete', { id }).catch(() => {});
    } catch (e) {
        console.error("Local delete error:", e);
    }

    return { success: true };
};

