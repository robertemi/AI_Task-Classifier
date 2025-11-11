import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthProvider"
import { DashboardPage } from "@/components/DashboardPage"

export default function Dashboard() {
    const router = useRouter()
    const { id } = router.query
    const { session, loading } = useAuth()

    useEffect(() => {
        if (!loading && !session) router.push("/")
    }, [session, loading, router])

    if (loading || !session || !id) return null

    return (
        <>
            <DashboardPage projectId={id as string} onBack={() => router.push("/projects")} />
        </>
    )
}
