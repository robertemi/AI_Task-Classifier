import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    const hideNavbarRoutes = ["/"];
    const shouldHideNavbar = hideNavbarRoutes.includes(router.pathname);

    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col">
                {!shouldHideNavbar && (
                    <Navbar
                        searchPlaceholder="Search..."
                        userName="Guest"
                        onLogoClick={() => router.push("/")}
                    />
                )}
                <main className="flex-grow">
                    <Component {...pageProps} />
                </main>
            </div>
        </AuthProvider>
    );
}
