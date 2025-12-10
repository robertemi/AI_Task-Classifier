import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
    // Initialize theme to null to indicate it's not yet determined (server-side)
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

    const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        // This effect runs only on the client side after initial render
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        let initialTheme: 'light' | 'dark';
        if (savedTheme === 'light' || savedTheme === 'dark') {
            initialTheme = savedTheme;
        } else if (systemPrefersDark) {
            initialTheme = 'dark';
        } else {
            initialTheme = 'light';
        }
        applyTheme(initialTheme);

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'theme') {
                const newTheme = event.newValue;
                if (newTheme === 'light' || newTheme === 'dark') {
                    applyTheme(newTheme);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const htmlClasses = document.documentElement.classList;
                    if (htmlClasses.contains('dark') && theme !== 'dark') {
                        setTheme('dark');
                    } else if (!htmlClasses.contains('dark') && theme !== 'light') {
                        setTheme('light');
                    }
                }
            });
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            observer.disconnect();
        };
    }, [applyTheme, theme]); // theme in dependency array is still a bit tricky here for the observer sync, but less critical for initial hydration

    const toggleTheme = useCallback(() => {
        // Only toggle if theme is already determined
        if (theme) {
            applyTheme(theme === 'light' ? 'dark' : 'light');
        }
    }, [theme, applyTheme]);

    // Return theme as null initially, then 'light' or 'dark'
    return { theme, toggleTheme };
}
