import { ChevronDown, ChevronUp, Minus } from "lucide-react";

interface TaskCardProps {
    title: string;
    epic: string;
    priority: number;
    priorityTrend?: "up" | "down" | "stable";
}

export function TaskCard({ title, epic, priority, priorityTrend = "stable" }: TaskCardProps) {
    return (
        <div className="group relative bg-white/75 backdrop-blur-lg rounded-2xl p-5 border border-gray-200/60 shadow-md hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:bg-white/95 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0a84ff]/0 group-hover:to-[#0a84ff]/5 transition-all duration-300" />
            <div className="relative">
                <h4 className="text-[#1a1d21] mb-3 text-[16px] font-medium leading-snug">{title}</h4>

                <div className="flex items-center justify-between">
                    <span className="text-[#5f6c7b] text-[14px]">{epic}</span>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/50">
                        <span className="text-[#1a1d21] font-medium text-[14px]">{priority}</span>
                        {priorityTrend === "down" && <ChevronDown className="w-4 h-4 text-[#0a84ff]" />}
                        {priorityTrend === "up" && <ChevronUp className="w-4 h-4 text-[#ff375f]" />}
                        {priorityTrend === "stable" && <Minus className="w-4 h-4 text-[#5f6c7b]" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
