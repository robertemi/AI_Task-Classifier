import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TiltedCard from '../components/TiltedCard'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        try {
            // Try the modern v2 method; if not present fall back to api.resetPasswordForEmail
            // Provide redirectTo if you have a custom reset page (NEXT_PUBLIC_RESET_REDIRECT)
            // Build a redirect URL for the reset link. Prefer the NEXT_PUBLIC_RESET_REDIRECT env var (set in Vercel),
            // otherwise fall back to the current origin + /reset-password so links land on the app's reset form.
            // Prefer a dev-friendly redirect when running locally so you can test
            // password reset without touching Vercel. In production we prefer the
            // NEXT_PUBLIC_RESET_REDIRECT environment variable.
            const redirectEnv = process.env.NEXT_PUBLIC_RESET_REDIRECT
            const isDev = process.env.NODE_ENV === 'development'
            const redirectTo = isDev
                ? 'http://localhost:3000/reset-password'
                : (typeof window !== 'undefined' ? (redirectEnv ?? `${window.location.origin}/reset-password`) : redirectEnv)

            const options = redirectTo ? { redirectTo } : undefined

            // Call the appropriate supabase method once. Newer SDKs expose
            // supabase.auth.resetPasswordForEmail(email, { redirectTo })
            // @ts-ignore
            if (typeof supabase.auth.resetPasswordForEmail === 'function') {
                // some SDKs accept options as second param
                await supabase.auth.resetPasswordForEmail(email, options)
            } else if ((supabase.auth as any).api && typeof (supabase.auth as any).api.resetPasswordForEmail === 'function') {
                // older API doesn't accept redirectTo, so we call it with email only
                // @ts-ignore
                await (supabase.auth as any).api.resetPasswordForEmail(email)
            } else {
                throw new Error('No compatible supabase resetPasswordForEmail method found')
            }

            setMessage('If an account with that email exists, a password reset link has been sent.')
            // After success, route user back to login after a short delay
            // (user can also click the link below to go immediately)
            // We'll trigger a redirect via router in a useEffect below.
        } catch (err: any) {
            setError(err?.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    const router = useRouter()

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => {
                router.push('/login')
            }, 3000)
            return () => clearTimeout(t)
        }
    }, [message, router])

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Background like Login page */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                    <div className="absolute -bottom-8 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-6000"></div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-[600px] fade-in">
                <TiltedCard
                    imageSrc={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='700'%3E%3Crect width='600' height='700' fill='%23000000' fill-opacity='0'/%3E%3C/svg%3E"}
                    containerHeight="700px"
                    containerWidth="600px"
                    imageHeight="700px"
                    imageWidth="600px"
                    scaleOnHover={1.02}
                    rotateAmplitude={8}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent={true}
                    overlayContent={
                        <div className="w-[600px] h-[700px] flex items-center justify-center p-10">
                            <div className="w-full space-y-6 rounded-[15px] border border-white/20 bg-white/15 backdrop-blur-sm p-8 shadow-2xl">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold tracking-tight text-white">Reset your password</h2>
                                    <p className="mt-2 text-sm text-white/80">Enter the email associated with your account and we'll send a password reset link.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-white">Email address</Label>
                                        <Input className='text-white' id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                                    )}

                                    {message && (
                                        <div className="rounded-md bg-slate-700/60 p-3 text-sm text-white">{message}</div>
                                    )}

                                    <Button type="submit" disabled={loading} className="w-full text-white">
                                        {loading ? 'Sending…' : 'Send reset link'}
                                    </Button>
                                </form>

                                <div className="text-center mt-4 space-y-2">
                                    <Link href="/login" className="text-sm text-white/80 hover:underline">← Back to sign in</Link>
                                    {message && (
                                        <div className="text-sm text-white/70">Redirecting to sign in in a few seconds…</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    )
}
