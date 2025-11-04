import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import Aurora from "./Aurora";
import { Button } from "@/components/ui/button";

interface Project {
    id: number;
    title: string;
    description: string;
}

interface ProjectsPageProps {
    onProjectClick: (projectId: number) => void;
}

const mockProjects: Project[] = [
    { id: 1, title: "Project 1", description: "Short description" },
    { id: 2, title: "Project 2", description: "Short description" },
    { id: 3, title: "Project 3", description: "Short description" },
    { id: 4, title: "Project 4", description: "Short description" },
];

export function ProjectsPage({ onProjectClick }: ProjectsPageProps) {
    return (
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
                    <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-6 py-3 rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-0.5 transform hover:scale-105">
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            title={project.title}
                            description={project.description}
                            onClick={() => onProjectClick(project.id)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}
