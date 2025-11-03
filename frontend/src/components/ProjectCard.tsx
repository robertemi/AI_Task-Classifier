interface ProjectCardProps {
    title: string;
    description: string;
    onClick?: () => void;
}

export function ProjectCard({ title, description, onClick }: ProjectCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-7 cursor-pointer hover:bg-white/90 hover:shadow-2xl hover:shadow-blue-500/8 transition-all duration-300 border border-gray-200/60 hover:border-[#0a84ff]/30 shadow-md hover:-translate-y-1 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a84ff]/0 to-[#0a84ff]/0 group-hover:from-[#0a84ff]/5 group-hover:to-transparent transition-all duration-300 rounded-2xl" />
            <div className="relative">
                <h3 className="text-[#1a1d21] mb-2 text-[18px] font-semibold group-hover:text-[#0a84ff] transition-colors">{title}</h3>
                <p className="text-[#5f6c7b] text-[15px] leading-relaxed">{description}</p>
            </div>
        </div>
    );
}