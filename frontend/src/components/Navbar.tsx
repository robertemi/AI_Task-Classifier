import { Search } from "lucide-react";

interface HeaderProps {
    searchPlaceholder: string;
    userName?: string;
    onLogoClick?: () => void;
}

export function Navbar({ searchPlaceholder, userName = "Name", onLogoClick }: HeaderProps) {
    return (
        <header className="bg-white/75 backdrop-blur-2xl border-b border-gray-200/60 px-6 py-3 flex items-center gap-6 sticky top-0 z-50 shadow-sm">
            <button
                onClick={onLogoClick}
                className="group text-[#1a1d21] tracking-tight text-[20px] font-semibold bg-gradient-to-r from-[#1a1d21] to-[#3a4451] bg-clip-text text-transparent relative transition-transform duration-200 hover:-translate-y-[2px]"
            >
                SmartPM
                <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-gradient-to-r from-[#0a84ff] to-[#0066d6] group-hover:w-full transition-all duration-300 ease-out rounded-full"></span>
            </button>

            <div className="flex-1 max-w-3xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6c7b] w-[18px] h-[18px]" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full bg-white/70 backdrop-blur-md rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-[#0a84ff]/40 focus:bg-white/90 transition-all text-[14px] border border-gray-200/60 placeholder:text-[#5f6c7b]/60"
                    />
                </div>
            </div>

            <div className="text-[#1a1d21] ml-auto text-[15px] font-medium">{userName}</div>
        </header>
    );
}
