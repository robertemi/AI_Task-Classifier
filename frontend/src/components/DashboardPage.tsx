import { useState } from "react";
import { Navbar } from "./Navbar";
import { TaskCard } from "./TaskCard";

interface Task {
    id: number;
    title: string;
    epic: string;
    priority: number;
    priorityTrend?: "up" | "down" | "stable";
    status: "todo" | "inProgress" | "inReview" | "done";
}

interface DashboardPageProps {
    projectId: number;
    onBack: () => void;
}

const initialMockTasks: Task[] = [
    { id: 1, title: "Task 1", epic: "Epic 1", priority: 3, priorityTrend: "down", status: "todo" },
    { id: 2, title: "Task 2", epic: "Epic 1", priority: 5, priorityTrend: "stable", status: "todo" },
    { id: 3, title: "Task 3", epic: "Epic 1", priority: 3, priorityTrend: "up", status: "done" },
    { id: 4, title: "Task 4", epic: "Epic 2", priority: 4, priorityTrend: "stable", status: "inProgress" },
    { id: 5, title: "Task 5", epic: "Epic 2", priority: 2, priorityTrend: "down", status: "inReview" },
];

export function DashboardPage({ projectId, onBack }: DashboardPageProps) {
    const [tasks, setTasks] = useState<Task[]>(initialMockTasks);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const tasksByStatus = {
        todo: tasks.filter((t) => t.status === "todo"),
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
                    task.id === draggedTask.id ? { ...task, status: newStatus } : task
                )
            );
            setDraggedTask(null);
        }
    };

    const columnConfig = [
        {
            title: "To do",
            status: "todo" as const,
            tasks: tasksByStatus.todo,
            accentColor: "from-slate-500/10 to-transparent",
            borderColor: "border-slate-300/40"
        },
        {
            title: "In progress",
            status: "inProgress" as const,
            tasks: tasksByStatus.inProgress,
            accentColor: "from-blue-500/10 to-transparent",
            borderColor: "border-blue-300/40"
        },
        {
            title: "In review",
            status: "inReview" as const,
            tasks: tasksByStatus.inReview,
            accentColor: "from-amber-500/10 to-transparent",
            borderColor: "border-amber-300/40"
        },
        {
            title: "Done",
            status: "done" as const,
            tasks: tasksByStatus.done,
            accentColor: "from-emerald-500/10 to-transparent",
            borderColor: "border-emerald-300/40"
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fafbfc] via-[#f4f6f8] to-[#f0f2f5]">
            <Navbar searchPlaceholder="Search through tasks" onLogoClick={onBack} />

            <main className="p-12 max-w-[1600px] mx-auto">
                <button
                    onClick={onBack}
                    className="text-[#0a84ff] hover:text-[#0066d6] transition-colors text-[15px] font-medium mb-3 inline-block"
                >
                    ← Back to Projects
                </button>

                <h1 className="text-[#1a1d21] text-[42px] font-bold tracking-tight mb-8">Project {projectId} Dashboard</h1>

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
                        />
                    ))}
                </div>
            </main>
        </div>
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
}

function StatusColumn({
                          title,
                          count,
                          tasks,
                          accentColor,
                          borderColor,
                          onDragOver,
                          onDrop,
                          onDragStart
                      }: StatusColumnProps) {
    return (
        <div
            className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200/60 shadow-sm min-h-[500px]"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className={`relative bg-white/75 backdrop-blur-xl rounded-2xl px-5 py-4 mb-4 flex items-center justify-between shadow-lg border ${borderColor} overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${accentColor}`} />
                <div className="relative flex items-center justify-between w-full">
                    <span className="text-[#1a1d21] text-[17px] font-semibold">{title}</span>
                    <span className="text-[#5f6c7b] bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[14px] font-medium border border-gray-200/60 shadow-sm">{count}</span>
                </div>
            </div>

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={() => onDragStart(task)}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        <TaskCard
                            title={task.title}
                            epic={task.epic}
                            priority={task.priority}
                            priorityTrend={task.priorityTrend}
                        />
                    </div>
                ))}

                <button className="w-full group relative bg-white/30 backdrop-blur-sm rounded-2xl p-5 border-2 border-dashed border-gray-300/50 hover:border-[#0a84ff]/40 transition-all duration-300 text-center opacity-60 hover:opacity-100">
                    <div className="relative">
                        <div className="text-[#5f6c7b] group-hover:text-[#0a84ff] text-[15px] font-medium transition-colors">+ Add a Ticket</div>
                    </div>
                </button>
            </div>
        </div>
    );
}
