import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { ProjectsPage } from "@/components/ProjectsPage"

export default function Projects() {
    const { session } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!session) router.push("/")
    }, [session, router])

    if (!session) return null

    return (
        <>
            <ProjectsPage onProjectClick={(id) => router.push(`/dashboard/${id}`)} />
        </>
    )
}
