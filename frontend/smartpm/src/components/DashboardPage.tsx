import { useState, useEffect } from "react";
import { TaskCard } from "./TaskCard";
import Aurora from "./Aurora";
import { supabase } from "@/lib/supabaseClient";
import { CreateTaskModal } from "./CreateTaskModal";

interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    ai_description?: string;
    story_points?: number;
    status: "todo" | "inProgress" | "inReview" | "done" | "none";
}

interface DashboardPageProps {
    projectId: string;
    onBack: () => void;
}

interface ProjectDetails {
    id: string;
    name: string;
    description: string;
}

export function DashboardPage({ projectId, onBack }: DashboardPageProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [errorTasks, setErrorTasks] = useState<string | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [errorProject, setErrorProject] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const fetchProjectDetails = async () => {
        if (!projectId) return;
        setLoadingProject(true);
        setErrorProject(null);
        try {
            const { data, error } = await supabase.from("projects").select("id, name, description").eq("id", projectId).single();
            if (error) throw error;
            setProjectDetails(data);
        } catch (err: any) {
            console.error("Error fetching project details:", err);
            setErrorProject(err.message || "Failed to load project details");
        } finally {
            setLoadingProject(false);
        }
    };

    const fetchTasks = async () => {
        if (!projectId) return;
        setLoadingTasks(true);
        setErrorTasks(null);
        try {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, project_id, title, description, ai_description, story_points, status")
                .eq("project_id", projectId);

            if (error) throw error;
            setTasks(data || []);
        } catch (err: any) {
            console.error("Error fetching tasks:", err);
            setErrorTasks(err.message || "Failed to load tasks");
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
        fetchTasks();
    }, [projectId]);

    const tasksByStatus = {
        todo: tasks.filter((t) => t.status === "todo" || t.status === "none"),
        inProgress: tasks.filter((t) => t.status === "inProgress"),
        inReview: tasks.filter((t) => t.status === "inReview"),
        done: tasks.filter((t) => t.status === "done"),
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (newStatus: Task["status"]) => {
        if (draggedTask) {
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === draggedTask.id ? { ...draggedTask, status: newStatus } : task
                )
            );
            setDraggedTask(null);
        }
    };

    const handleTaskCreated = () => {
        fetchTasks();
        setIsTaskModalOpen(false);
    };

    const columnConfig = [
        { title: "To Do", status: "todo" as const, tasks: tasksByStatus.todo, accentColor: "from-slate-500/20 to-transparent", borderColor: "border-slate-400/40", onAddTaskClick: () => setIsTaskModalOpen(true) },
        { title: "In Progress", status: "inProgress" as const, tasks: tasksByStatus.inProgress, accentColor: "from-blue-500/20 to-transparent", borderColor: "border-blue-400/40", onAddTaskClick: undefined },
        { title: "In Review", status: "inReview" as const, tasks: tasksByStatus.inReview, accentColor: "from-amber-500/20 to-transparent", borderColor: "border-amber-400/40", onAddTaskClick: undefined },
        { title: "Done", status: "done" as const, tasks: tasksByStatus.done, accentColor: "from-emerald-500/20 to-transparent", borderColor: "border-emerald-400/40", onAddTaskClick: undefined },
    ];

    if (loadingProject || loadingTasks) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0"><Aurora colorStops={["#1e3a8a", "#3730a3", "#4c1d95"]} /></div>
                <p className="relative z-10 text-white text-xl">Loading dashboard...</p>
            </div>
        );
    }

    if (errorProject || errorTasks) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 z-0"><Aurora colorStops={["#1e3a8a", "#3730a3", "#4c1d95"]} /></div>
                <p className="relative z-10 text-red-400 text-xl">Error: {errorProject || errorTasks}</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative min-h-screen">
                <div className="absolute inset-0 z-0"><Aurora colorStops={["#1e3a8a", "#3730a3", "#4c1d95"]} /></div>
                <main className="relative z-10 p-12 max-w-[1600px] mx-auto">
                    <button onClick={onBack} className="text-purple-300 hover:text-white transition-colors text-[15px] font-medium mb-3 inline-block">← Back to Projects</button>
                    <h1 className="text-white text-[42px] font-bold tracking-tight mb-8">Project {projectDetails?.name || "Unknown Project"} Dashboard</h1>
                    <div className="grid grid-cols-4 gap-5">
                        {columnConfig.map((config) => (
                            <StatusColumn
                                key={config.title}
                                title={config.title}
                                status={config.status}
                                count={config.tasks.length}
                                tasks={config.tasks}
                                accentColor={config.accentColor}
                                borderColor={config.borderColor}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(config.status)}
                                onDragStart={handleDragStart}
                                onAddTaskClick={config.onAddTaskClick}
                            />
                        ))}
                    </div>
                </main>
            </div>
            <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onTaskCreated={handleTaskCreated} projectId={projectId} />
        </>
    );
}

interface StatusColumnProps {
    title: string;
    status: Task["status"];
    count: number;
    tasks: Task[];
    accentColor: string;
    borderColor: string;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    onDragStart: (task: Task) => void;
    onAddTaskClick?: () => void;
}

function StatusColumn({ title, count, tasks, accentColor, borderColor, onDragOver, onDrop, onDragStart, onAddTaskClick }: StatusColumnProps) {
    return (
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/10 shadow-lg min-h-[500px]" onDragOver={onDragOver} onDrop={onDrop}>
            <div className={`relative bg-black/30 backdrop-blur-xl rounded-2xl px-5 py-4 mb-4 flex items-center justify-between shadow-lg border ${borderColor} overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${accentColor}`} />
                <div className="relative flex items-center justify-between w-full">
                    <span className="text-white text-[17px] font-semibold">{title}</span>
                    <span className="text-gray-300 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[14px] font-medium border border-white/20 shadow-sm">{count}</span>
                </div>
            </div>
            <div className="space-y-3">
                {tasks.map((task) => (
                    <div key={task.id} draggable onDragStart={() => onDragStart(task)} className="cursor-grab active:cursor-grabbing">
                        <TaskCard
                            title={task.title}
                            userDescription={task.description || ""}
                            priority={task.story_points || 0}
                            ai_description={task.ai_description}
                        />
                    </div>
                ))}
                {onAddTaskClick && (
                    <button onClick={onAddTaskClick} className="w-full group relative bg-black/20 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-all duration-300 text-center opacity-60 hover:opacity-100">
                        <div className="relative">
                            <div className="text-gray-400 group-hover:text-white text-[15px] font-medium transition-colors">+ Add a Task</div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
