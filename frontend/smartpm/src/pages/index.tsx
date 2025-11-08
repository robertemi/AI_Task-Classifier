import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthProvider"
import Landing from "@/components/Landing"
import Login from "@/components/Login"

export default function HomePage() {
    const { session } = useAuth()
    const router = useRouter()
    const [view, setView] = useState<"landing" | "login">("landing")

    useEffect(() => {
        if (session) {
            router.push("/projects")
        }
    }, [session, router])

    if (session) return null

    return (
        <div>
            {view === "landing" ? (
                <Landing onStart={() => setView("login")} />
            ) : (
                <Login onBack={() => setView("landing")} />
            )}
        </div>
    )
}