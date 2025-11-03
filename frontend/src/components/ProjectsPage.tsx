import { Plus } from "lucide-react";
import { Navbar } from "./Navbar";
import { ProjectCard } from "./ProjectCard";

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
        <div className="min-h-screen bg-gradient-to-br from-[#fafbfc] via-[#f4f6f8] to-[#f0f2f5]">
            <Navbar searchPlaceholder="Search through projects" onLogoClick={() => {}} />

            <main className="p-12 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-[#1a1d21] text-[42px] font-bold tracking-tight">Projects</h1>
                    <button className="bg-gradient-to-br from-[#0a84ff] to-[#0066d6] text-white px-6 py-3 rounded-2xl hover:shadow-2xl hover:shadow-[#0a84ff]/30 transition-all duration-300 flex items-center justify-center hover:-translate-y-0.5 hover:from-[#0066d6] hover:to-[#0a84ff]">
                        <Plus className="w-5 h-5" />
                    </button>
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
