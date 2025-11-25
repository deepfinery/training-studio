'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter } from 'next/navigation';
import { createProject as createProjectRequest, deleteProject as deleteProjectRequest, fetchProjects, ProjectRecord } from '../lib/api';

interface ProjectContextValue {
  projects: ProjectRecord[];
  activeProject?: ProjectRecord;
  isLoading: boolean;
  error?: string;
  selectProject: (projectId: string) => void;
  createProject: (name: string) => Promise<ProjectRecord>;
  refresh: () => Promise<ProjectRecord[] | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<ProjectRecord[]>('projects', fetchProjects, {
    refreshInterval: 60000
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('activeProjectId');
    if (stored) {
      setActiveId(stored);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.length === 0) {
      if (activeId !== null) {
        setActiveId(null);
      }
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('activeProjectId');
      }
      return;
    }
    if (!activeId || !data.some(project => project.id === activeId)) {
      const fallback = data[0]?.id ?? null;
      if (fallback) {
        setActiveId(fallback);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('activeProjectId', fallback);
        }
      }
    }
  }, [data, activeId]);

  useEffect(() => {
    if (!data || isLoading) return;
    if (data.length === 0 && pathname !== '/projects/new') {
      router.replace('/projects/new');
    }
  }, [data, isLoading, pathname, router]);

  const selectProject = useCallback((projectId: string) => {
    setActiveId(projectId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('activeProjectId', projectId);
    }
  }, []);

  const handleCreateProject = useCallback(
    async (name: string) => {
      const project = await createProjectRequest({ name });
      await mutate();
      if (project.id) {
        selectProject(project.id);
      }
      return project;
    },
    [mutate, selectProject]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectRequest(projectId);
      await mutate();
      if (activeId === projectId) {
        setActiveId(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('activeProjectId');
        }
      }
    },
    [activeId, mutate]
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  const projects = useMemo(() => data ?? [], [data]);
  const activeProject = projects.find(project => project.id === activeId);
  const errorMessage = useMemo(() => (error instanceof Error ? error.message : undefined), [error]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      activeProject,
      isLoading,
      error: errorMessage,
      selectProject,
      createProject: handleCreateProject,
      refresh,
      deleteProject: handleDeleteProject
    }),
    [projects, activeProject, isLoading, errorMessage, selectProject, handleCreateProject, refresh, handleDeleteProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
