import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, saveProject, deleteProject } from './projectService';
import { useProjectStore } from './projectStore';
import { Project } from '../types';

import { getLocalProjects } from './projectService';

export const useProjects = (userId?: string) => {
    const setProjects = useProjectStore(s => s.setProjects);

    return useQuery({
        queryKey: ['projects', userId || 'local-creator'],
        queryFn: async () => {
            const targetId = userId || 'local-creator';
            const data = await fetchProjects(targetId);
            setProjects(data);
            return data;
        },
        initialData: () => getLocalProjects(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useSaveProjectMutation = () => {
    const queryClient = useQueryClient();
    const updateLocally = useProjectStore(s => s.updateProjectLocally);

    return useMutation({
        mutationFn: async (project: Project) => {
            return await saveProject(project);
        },
        onMutate: async (newProject) => {
            if (!newProject || !newProject.id) return;
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['projects'] });

            // Optimistically update React Query Cache for all project queries
            queryClient.setQueriesData<Project[]>({ queryKey: ['projects'] }, (old) => {
                if (!Array.isArray(old)) return [newProject];
                const cleanOld = old.filter((p): p is Project => Boolean(p && typeof p === 'object' && p.id));
                const exists = cleanOld.some(p => p.id === newProject.id);
                return exists ? cleanOld.map(p => p.id === newProject.id ? newProject : p) : [newProject, ...cleanOld];
            });

            // Optimistic update Zustand
            updateLocally(newProject);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};

export const useDeleteProjectMutation = () => {
    const queryClient = useQueryClient();
    const removeLocally = useProjectStore(s => s.removeProjectLocally);

    return useMutation({
        mutationFn: async (id: string) => {
            return await deleteProject(id);
        },
        onMutate: async (id) => {
            if (!id) return;
            // Optimistic update Zustand
            removeLocally(id);

            // Optimistic update React Query Cache
            queryClient.setQueriesData<Project[]>({ queryKey: ['projects'] }, (old) => {
                if (!Array.isArray(old)) return [];
                return old.filter(p => p && p.id !== id);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });
};
