import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthProvider"; // import corect din contextul tău

interface HeaderProps {
    searchPlaceholder: string;
    onLogoClick?: () => void;
}

export function Navbar({ searchPlaceholder, onLogoClick }: HeaderProps) {
    const { signOut, user } = useAuth();

    return (
        <header className="bg-black/30 backdrop-blur-2xl border-b border-white/10 px-6 py-3 flex items-center gap-6 sticky top-0 z-50 shadow-lg">
            <button
                onClick={onLogoClick}
                className="group text-white tracking-tight text-[20px] font-semibold relative transition-transform duration-200 hover:-translate-y-[2px]"
            >
                SmartPM
                <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 group-hover:w-full transition-all duration-300 ease-out rounded-full"></span>
            </button>

            <div className="flex-1">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-[14px] text-white border border-white/20 placeholder:text-gray-400/80"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-white text-[15px] font-medium">{user?.email || "Guest"}</span>
                <button
                    onClick={signOut}
                    className="group flex items-center gap-1 text-sm text-gray-300 hover:text-red-400 transition-colors duration-300"
                >
                    <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_#ef4444]" />
                </button>
            </div>
        </header>
    );
}
