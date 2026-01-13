import { useState } from "react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import Aurora from "./Aurora";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./CreateProjectModal";
import { ProjectContextMenu } from "./ProjectContextMenu";
import { EditProjectModal } from "./EditProjectModal";
import { useProject, Project } from "@/context/ProjectContext";

interface ProjectsPageProps {
    onProjectClick: (projectId: string) => void;
}

export function ProjectsPage({ onProjectClick }: ProjectsPageProps) {
    const { projects, loading, error, searchQuery, fetchProjects } = useProject();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        project: Project | null;
    }>({ isOpen: false, position: { x: 0, y: 0 }, project: null });

    const handleProjectCreated = () => {
        fetchProjects();
        setIsCreateModalOpen(false);
    };

    const handleProjectEdited = () => {
        fetchProjects();
        setIsEditModalOpen(false);
    };

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, project: Project) => {
        event.preventDefault();
        setContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            project: project,
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ ...contextMenu, isOpen: false });
    };

    const handleDeleteProject = async () => {
        if (!contextMenu.project) return;

        try {
            const response = await fetch('http://localhost:8000/index/delete/project', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  projectId: contextMenu.project.id,
                  userId: contextMenu.project.user_id,
                }),
            });

            fetchProjects(); 

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status !== 404 || !errorData.detail.includes("not found")) {
                    throw new Error(errorData.detail || 'Failed to delete project');
                }
            }

        } catch (err: any) {
            console.error("Error deleting project:", err);
            // We might want to handle this error locally or via a toast, 
            // but for now we'll just log it as the global error state is managed by context
        } finally {
            closeContextMenu();
        }
    };

    const handleEditProject = () => {
        setIsEditModalOpen(true);
    };

    const truncateDescription = (text: string, maxLength: number) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    };

    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && projects.length === 0) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Aurora colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]} />
                </div>
                <p className="relative z-10 text-white text-xl">Loading projects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Aurora colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]} />
                </div>
                <p className="relative z-10 text-red-400 text-xl">Error: {error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-screen">
                <div className="absolute inset-0 z-0">
                    <Aurora colorStops={["#4c1d95", "#3730a3", "#1e3a8a"]} />
                </div>

                <main className="relative z-10 p-12 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <h1 className="text-white text-[42px] font-bold tracking-tight">Projects</h1>
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white px-6 py-3 rounded-2xl hover:shadow-2xl hover:shadow-purple-700/40 transition-all duration-300 hover:-translate-y-0.5 transform hover:scale-105 hover:from-indigo-600 hover:to-purple-700"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.length === 0 ? (
                            <p className="text-white text-lg col-span-full text-center">
                                {searchQuery ? "No projects match your search." : "No projects found. Create one!"}
                            </p>
                        ) : (
                            filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    title={project.name}
                                    description={truncateDescription(project.description, 100)}
                                    onClick={() => onProjectClick(project.id)}
                                    onContextMenu={(e) => handleContextMenu(e, project)}
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>

            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onProjectCreated={handleProjectCreated} 
            />

            <ProjectContextMenu
                isOpen={contextMenu.isOpen}
                position={contextMenu.position}
                onClose={closeContextMenu}
                onDelete={handleDeleteProject}
                onEdit={handleEditProject} 
            />

            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onProjectEdited={handleProjectEdited}
                project={contextMenu.project} 
            />
        </>
    );
}
