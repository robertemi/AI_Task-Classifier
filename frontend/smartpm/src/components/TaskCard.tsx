import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import TextType from "./TextType";

interface TaskCardProps {
    title: string;
    userDescription: string;
    priority: number;
    ai_description?: string;
    priorityTrend?: "up" | "down" | "stable";
}

export function TaskCard({ title, userDescription, priority, ai_description, priorityTrend = "stable" }: TaskCardProps) {
    
    const MAX_AI_DESC_LENGTH = 100;
    const truncatedAiDescription = ai_description 
        ? (ai_description.length > MAX_AI_DESC_LENGTH ? ai_description.substring(0, MAX_AI_DESC_LENGTH) + "..." : ai_description)
        : "";

    return (
        // TODO: Implement full view modal for AI description
        <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/10 shadow-md hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/0 group-hover:to-purple-500/5 transition-all duration-300" />
            <div className="relative">
                <h4 className="text-white mb-2 text-[16px] font-medium leading-snug">{title}</h4>
                
                <p className="text-gray-300 text-[14px] mb-3">{userDescription}</p>

                {ai_description && 
                    <TextType 
                        text={truncatedAiDescription}
                        typingSpeed={20}
                        loop={true}
                        className="text-indigo-200 text-sm mb-4 font-mono min-h-[40px]"
                    />
                }

                <div className="flex items-center justify-end">
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
