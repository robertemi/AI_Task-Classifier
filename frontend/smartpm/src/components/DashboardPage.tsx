import { useState, useEffect } from "react";
import { TaskCard } from "./TaskCard";
import Aurora from "./Aurora";
import { supabase } from "@/lib/supabaseClient";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskContextMenu } from "./TaskContextMenu";
import { EditTaskModal } from "./EditTaskModal";
import { useAuth } from "@/context/AuthProvider";
import { Book } from "lucide-react";

interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    ai_description?: string;
    story_points?: number;
    status: "todo" | "in_progress" | "in_review" | "done";
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
    const { session } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [errorTasks, setErrorTasks] = useState<string | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [errorProject, setErrorProject] = useState<string | null>(null);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false); // State for EditTaskModal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedStatusForNewTask, setSelectedStatusForNewTask] = useState<Task['status']>('todo');
    const [createModalKey, setCreateModalKey] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const [taskContextMenu, setTaskContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        task: Task | null;
    }>({ isOpen: false, position: { x: 0, y: 0 }, task: null });


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

    const handleDownloadHandbook = async () => {
        if (!session || !projectDetails) return;
        setIsDownloading(true);
        try {
            const response = await fetch('https://ai-task-classifier.onrender.com/index/project/handbook/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    projectId: projectDetails.id,
                    selected_model: 1,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to download project handbook');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectDetails.name}_handbook.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error(error);
        } finally {
            setIsDownloading(false);
        }
    };

    const tasksByStatus = {
        todo: tasks.filter((t) => t.status === "todo"),
        in_progress: tasks.filter((t) => t.status === "in_progress"),
        in_review: tasks.filter((t) => t.status === "in_review"),
        done: tasks.filter((t) => t.status === "done"),
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (newStatus: Task["status"]) => {
        console.log("handleDrop called with newStatus:", newStatus);
        if (draggedTask) {
            console.log("Dragged task:", draggedTask);
            const originalStatus = draggedTask.status;

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === draggedTask.id ? { ...draggedTask, status: newStatus } : task
                )
            );
            
            try {
                const { error } = await supabase
                    .from("tasks")
                    .update({ status: newStatus })
                    .eq("id", draggedTask.id);

                if (error) throw error;
                
                console.log("Task status updated successfully via Supabase.");
            } catch (err: any) {
                console.error("Error updating task status:", err);
                setErrorTasks(err.message);
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.id === draggedTask.id ? { ...draggedTask, status: originalStatus } : task
                    )
                );
            } finally {
                setDraggedTask(null);
                console.log("Dragged task reset.");
            }
        } else {
            console.log("No task was dragged.");
        }
    };

    const handleTaskCreated = () => {
        fetchTasks();
        setIsCreateTaskModalOpen(false);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsTaskDetailsModalOpen(true);
    };

    const handleAddTaskClick = (status: Task['status']) => {
        setSelectedStatusForNewTask(status);
        setCreateModalKey(prevKey => prevKey + 1);
        setIsCreateTaskModalOpen(true);
    };

    const handleTaskContextMenu = (event: React.MouseEvent<HTMLDivElement>, task: Task) => {
        event.preventDefault();
        setTaskContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            task: task,
        });
    };

    const closeTaskContextMenu = () => {
        setTaskContextMenu({ ...taskContextMenu, isOpen: false });
    };

    const handleDeleteTask = async () => {
        if (!taskContextMenu.task) return;

        try {
            const response = await fetch('https://ai-task-classifier.onrender.com/index/delete/task', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taskId: taskContextMenu.task.id,
                  projectId: taskContextMenu.task.project_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete task');
            }

            fetchTasks();
        } catch (err: any) {
            console.error("Error deleting task:", err);
            setErrorTasks(err.message); // Set error for tasks
        } finally {
            closeTaskContextMenu();
        }
    };

    const handleEditTask = (taskToEdit: Task) => {
        setSelectedTask(taskToEdit);
        setIsEditTaskModalOpen(true);
        setIsTaskDetailsModalOpen(false);
    };

    const handleTaskEdited = () => {
        fetchTasks();
        setIsEditTaskModalOpen(false);
    };


    const columnConfig = [
        { title: "To Do", status: "todo" as const, tasks: tasksByStatus.todo, accentColor: "from-slate-500/20 to-transparent", borderColor: "border-slate-400/40", onAddTaskClick: () => handleAddTaskClick("todo") },
        { title: "In Progress", status: "in_progress" as const, tasks: tasksByStatus.in_progress, accentColor: "from-blue-500/20 to-transparent", borderColor: "border-blue-400/40", onAddTaskClick: () => handleAddTaskClick("in_progress") },
        { title: "In Review", status: "in_review" as const, tasks: tasksByStatus.in_review, accentColor: "from-amber-500/20 to-transparent", borderColor: "border-amber-400/40", onAddTaskClick: () => handleAddTaskClick("in_review") },
        { title: "Done", status: "done" as const, tasks: tasksByStatus.done, accentColor: "from-emerald-500/20 to-transparent", borderColor: "border-emerald-400/40", onAddTaskClick: () => handleAddTaskClick("done") },
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
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-white text-[42px] font-bold tracking-tight">Project {projectDetails?.name || "Unknown Project"} Dashboard</h1>
                        <button 
                            onClick={handleDownloadHandbook}
                            disabled={isDownloading}
                            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors text-[15px] font-medium disabled:opacity-50"
                        >
                            <Book size={20} />
                            {isDownloading ? 'Downloading...' : 'Download Project Handbook'}
                        </button>
                    </div>
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
                                onTaskClick={handleTaskClick}
                                onTaskContextMenu={handleTaskContextMenu} // Pass the context menu handler
                            />
                        ))}
                    </div>
                </main>
            </div>
            <CreateTaskModal 
                key={createModalKey}
                isOpen={isCreateTaskModalOpen} 
                onClose={() => setIsCreateTaskModalOpen(false)} 
                onTaskCreated={handleTaskCreated} 
                projectId={projectId} 
                status={selectedStatusForNewTask} 
            />
            <TaskDetailsModal 
                isOpen={isTaskDetailsModalOpen} 
                onClose={() => setIsTaskDetailsModalOpen(false)} 
                onTaskDeleted={fetchTasks} 
                onEdit={handleEditTask}
                task={selectedTask} 
            />

            <TaskContextMenu
                isOpen={taskContextMenu.isOpen}
                position={taskContextMenu.position}
                onClose={closeTaskContextMenu}
                onDelete={handleDeleteTask}
                onEdit={() => handleEditTask(taskContextMenu.task!)}
            />

            <EditTaskModal
                isOpen={isEditTaskModalOpen}
                onClose={() => setIsEditTaskModalOpen(false)}
                onTaskEdited={handleTaskEdited}
                task={selectedTask}
            />
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
    onTaskClick: (task: Task) => void;
    onTaskContextMenu: (event: React.MouseEvent<HTMLDivElement>, task: Task) => void;
}

function StatusColumn({ title, count, tasks, accentColor, borderColor, onDragOver, onDrop, onDragStart, onAddTaskClick, onTaskClick, onTaskContextMenu }: StatusColumnProps) {
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
                            priority={task.story_points || 0}
                            onClick={() => onTaskClick(task)}
                            onContextMenu={(e) => onTaskContextMenu(e, task)}
                        />
                    </div>
                ))}
                {onAddTaskClick && (
                    <button onClick={onAddTaskClick} className="w-full group relative bg-black/20 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-all duration-300 text-center opacity-60 hover:opacity-100">
                        <div className="relative">
                            <div className="text-gray-400 group-hover:text-white text-[15px] font-medium transition-colors">+ Add a task</div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
