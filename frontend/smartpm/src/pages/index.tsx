import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthProvider"
import Landing from "@/components/Landing"

export default function HomePage() {
    const { session } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (session) {
            // If the URL contains an auth/reset token (Supabase often includes
            // tokens in the fragment or query when redirecting), don't auto-redirect
            // away — allow pages like /reset-password or token-based flows to handle it.
            if (typeof window !== 'undefined') {
                const hash = window.location.hash || ''
                const search = window.location.search || ''
                const hasTokenInHash = hash.includes('access_token=') || hash.includes('type=recovery')
                const hasTokenInQuery = search.includes('access_token=') || search.includes('type=recovery')
                if (hasTokenInHash || hasTokenInQuery) return
            }

            router.push('/projects')
        }
    }, [session, router])

    if (session) return null

    return (
        <div>
            <Landing onStart={() => router.push('/login')} />
        </div>
    )
}