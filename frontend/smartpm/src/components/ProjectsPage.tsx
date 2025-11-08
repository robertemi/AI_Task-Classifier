import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import Aurora from "./Aurora";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./CreateProjectModal";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

interface Project {
    id: string; // Changed to string as Supabase IDs are UUIDs
    name: string; // Changed from title to name to match backend
    description: string;
}

interface ProjectsPageProps {
    onProjectClick: (projectId: string) => void; // Changed projectId type to string
}

export function ProjectsPage({ onProjectClick }: ProjectsPageProps) {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name, description")
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
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const handleProjectCreated = () => {
        fetchProjects();
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Aurora
                      colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]}
                      blend={0.5}
                      amplitude={1.0}
                      speed={0.5}
                    />
                </div>
                <p className="relative z-10 text-white text-xl">Loading projects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Aurora
                      colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]}
                      blend={0.5}
                      amplitude={1.0}
                      speed={0.5}
                    />
                </div>
                <p className="relative z-10 text-red-400 text-xl">Error: {error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-screen">
                <div className="absolute inset-0 z-0">
                    <Aurora
                      colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]}
                      blend={0.5}
                      amplitude={1.0}
                      speed={0.5}
                    />
                </div>

                <main className="relative z-10 p-12 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <h1 className="text-white text-[42px] font-bold tracking-tight">Projects</h1>
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white px-6 py-3 rounded-2xl hover:shadow-2xl hover:shadow-purple-700/40 transition-all duration-300 hover:-translate-y-0.5 transform hover:scale-105 hover:from-indigo-600 hover:to-purple-700"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.length === 0 ? (
                            <p className="text-white text-lg col-span-full text-center">No projects found. Create one!</p>
                        ) : (
                            projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    title={project.name}
                                    description={project.description}
                                    onClick={() => onProjectClick(project.id)}
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>

            <CreateProjectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onProjectCreated={handleProjectCreated} 
            />
        </>
    );
}
