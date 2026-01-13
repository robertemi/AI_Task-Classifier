import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthProvider';

export interface Project {
    id: string;
    name: string;
    description: string;
    user_id: string;
}

interface ProjectContextType {
    projects: Project[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    fetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    const projectsRef = useRef(projects);
    
    useEffect(() => {
        projectsRef.current = projects;
    }, [projects]);

    const fetchProjects = useCallback(async () => {
        if (!user) return;

        // Only set loading to true if we don't have projects yet
        if (projectsRef.current.length === 0) {
            setLoading(true);
        }
        
        setError(null);
        try {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name, description, user_id")
                .eq("user_id", user.id);

            if (error) {
                throw error;
            }
            setProjects(data || []);
        } catch (err: any) {
            console.error("Error fetching projects:", err);
            setError(err.message || "Failed to load projects");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchProjects();
        } else {
            setProjects([]);
        }
    }, [user, fetchProjects]);

    return (
        <ProjectContext.Provider value={{ projects, loading, error, searchQuery, setSearchQuery, fetchProjects }}>
            {children}
        </ProjectContext.Provider>
    );
};

export function useProject() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
    return ctx;
}
