import { LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useProject } from "@/context/ProjectContext";

interface HeaderProps {
    searchPlaceholder: string;
    onLogoClick?: () => void;
}

export function Navbar({ searchPlaceholder, onLogoClick }: HeaderProps) {
    const { signOut, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { searchQuery, setSearchQuery } = useProject();

    // Determine the current theme for rendering, defaulting to 'light' if not yet determined (server-side)
    const currentTheme = theme === null ? 'light' : theme;

    const baseHeaderClasses = "px-6 py-3 flex items-center gap-6 sticky top-0 z-50 shadow-lg transition-colors duration-300";
    const lightHeaderClasses = "bg-white border-b border-gray-200";
    const darkHeaderClasses = "bg-black/30 backdrop-blur-2xl border-b border-white/10";

    // Use currentTheme for class names
    const headerThemeClasses = currentTheme === 'light' ? lightHeaderClasses : darkHeaderClasses;
    const headerClassName = `${baseHeaderClasses} ${headerThemeClasses}`;

    // Use currentTheme for button classes and icon
    const buttonThemeClasses = currentTheme === 'light' ? 'text-black hover:bg-gray-200' : 'text-white hover:bg-white/20';
    const iconToRender = currentTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
    const logoTextColor = currentTheme === 'light' ? 'text-black' : 'text-white';
    const userNameColor = currentTheme === 'light' ? 'text-black' : 'text-white';
    const signOutButtonClasses = currentTheme === 'light' ? 'text-gray-600 hover:text-red-500' : 'text-gray-300 hover:text-red-400';
    const searchInputClasses = currentTheme === 'light'
        ? 'w-full bg-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-[14px] text-black border border-gray-300 placeholder:text-gray-500/80'
        : 'w-full bg-white/10 dark:backdrop-blur-md text-white border-white/20 placeholder:text-gray-400/80 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-[14px]';


    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
        }
    };

    return (
        <header className={headerClassName}>
            <button
                onClick={onLogoClick}
                className={`group tracking-tight text-[20px] font-semibold relative transition-transform duration-200 hover:-translate-y-[2px] ${logoTextColor}`}
            >
                SmartPM
                <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 group-hover:w-full transition-all duration-300 ease-out rounded-full"></span>
            </button>

            <div className="flex-1">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className={searchInputClasses}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-colors duration-300 ${buttonThemeClasses}`}
                >
                    {iconToRender}
                </button>
                <span className={`text-[15px] font-medium ${userNameColor}`}>{user?.email || "Guest"}</span>
                <button
                    onClick={signOut}
                    className={`group flex items-center gap-1 text-sm transition-colors duration-300 ${signOutButtonClasses}`}
                >
                    <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_#ef4444]" />
                </button>
            </div>
        </header>
    );
}
