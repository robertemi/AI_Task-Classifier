import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthProvider"
import { DashboardPage } from "@/components/DashboardPage"

export default function Dashboard() {
    const router = useRouter()
    const { id } = router.query
    const { session } = useAuth()

    useEffect(() => {
        if (!session) router.push("/")
    }, [session, router])

    if (!session || !id) return null

    return (
        <>
            <DashboardPage projectId={Number(id)} onBack={() => router.push("/projects")} />
        </>
    )
}
