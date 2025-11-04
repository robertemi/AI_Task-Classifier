interface ProjectCardProps {
    title: string;
    description: string;
    onClick?: () => void;
}

export function ProjectCard({ title, description, onClick }: ProjectCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white/20 backdrop-blur-xl rounded-2xl p-7 cursor-pointer hover:bg-white/30 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 border border-white/20 hover:border-purple-400/40 shadow-md hover:-translate-y-1 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-blue-500/0 group-hover:from-purple-600/10 group-hover:to-blue-500/0 transition-all duration-300 rounded-2xl" />
            <div className="relative">
                <h3 className="text-white mb-2 text-[18px] font-semibold group-hover:text-purple-300 transition-colors">{title}</h3>
                <p className="text-gray-300 text-[15px] leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
