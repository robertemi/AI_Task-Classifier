import { ChevronDown, ChevronUp, Minus } from "lucide-react";

interface TaskCardProps {
    title: string;
    priority: number;
    priorityTrend?: "up" | "down" | "stable";
    onClick: () => void;
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function TaskCard({ title, priority, priorityTrend = "stable", onClick, onContextMenu }: TaskCardProps) {

    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10 shadow-md hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 overflow-hidden cursor-pointer"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/0 group-hover:to-purple-500/5 transition-all duration-300" />
            <div className="relative flex justify-between items-center">
                <h4 className="text-white text-[16px] font-medium leading-snug max-w-[80%]">{title}</h4>

                <div className="flex-shrink-0 flex items-center gap-2 bg-white/5 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-white font-medium text-[14px]">{priority}</span>
                    {priorityTrend === "down" && <ChevronDown className="w-4 h-4 text-blue-400" />}
                    {priorityTrend === "up" && <ChevronUp className="w-4 h-4 text-red-400" />}
                    {priorityTrend === "stable" && <Minus className="w-4 h-4 text-gray-400" />}
                </div>
            </div>
        </div>
    );
}
