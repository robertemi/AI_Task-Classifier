import { ChevronDown, ChevronUp, Minus } from "lucide-react";

interface TaskCardProps {
    title: string;
    epic: string;
    priority: number;
    priorityTrend?: "up" | "down" | "stable";
}

export function TaskCard({ title, epic, priority, priorityTrend = "stable" }: TaskCardProps) {
    return (
        <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10 shadow-md hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/0 group-hover:to-purple-500/5 transition-all duration-300" />
            <div className="relative">
                <h4 className="text-white mb-3 text-[16px] font-medium leading-snug">{title}</h4>

                <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-[14px]">{epic}</span>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                        <span className="text-white font-medium text-[14px]">{priority}</span>
                        {priorityTrend === "down" && <ChevronDown className="w-4 h-4 text-blue-400" />}
                        {priorityTrend === "up" && <ChevronUp className="w-4 h-4 text-red-400" />}
                        {priorityTrend === "stable" && <Minus className="w-4 h-4 text-gray-400" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
