import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TiltedCard from '../components/TiltedCard'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Eye, EyeOff } from 'lucide-react'
import { passwordValid } from '@/lib/passwordValidators'
import PasswordChecklist from '@/components/ui/PasswordChecklist'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [userReady, setUserReady] = useState(false)

    const router = useRouter()

    useEffect(() => {
        let mounted = true

        async function tryInitSessionFromUrl() {
            try {
                const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
                const search = typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : ''
                const params = new URLSearchParams(hash || search)
                const access_token = params.get('access_token')
                const refresh_token = params.get('refresh_token')

                if (access_token && refresh_token) {
                    // supabase.auth.setSession accepts an object with access_token and refresh_token
                    // @ts-ignore - some SDKs may have slightly different names
                    await supabase.auth.setSession({ access_token, refresh_token })
                }

                const { data } = await supabase.auth.getSession()
                if (!mounted) return
                setUserReady(!!data.session?.user)
            } catch (err) {
                // ignore errors and mark not ready
                if (!mounted) return
                setUserReady(false)
            }
        }

        tryInitSessionFromUrl()

        return () => { mounted = false }
    }, [])

    // Developer helper removed: page now auto-parses fragment/query tokens if present.

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setMessage(null)

        if (!passwordValid(password)) {
            setError('Password must satisfy all complexity requirements')
            return
        }
        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase.auth.updateUser({ password })
            if (error) throw error

            setMessage('Password updated successfully — you will be redirected to sign in.')

            await supabase.auth.signOut()

            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const keysToRemove: string[] = []
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i)
                        if (!key) continue
                        if (key.includes('supabase') || key.includes('sb:') || key.includes('supabase.auth')) {
                            keysToRemove.push(key)
                        }
                    }
                    keysToRemove.forEach((k) => localStorage.removeItem(k))
                }
            } catch (e) {
                // ignore storage cleanup errors
            }

            // Small delay to ensure storage is cleared client-side then redirect to login
            setTimeout(() => router.push('/login'), 500)
        } catch (err: any) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
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
                                    <h2 className="text-2xl font-bold tracking-tight text-white">Set a new password</h2>
                                    <p className="mt-2 text-sm text-white/80">Enter and confirm your new password. After updating you'll be redirected to sign in.</p>
                                </div>

                                {!userReady && (
                                    <div className="text-sm text-yellow-300 p-3 bg-yellow-900/10 rounded">We couldn't detect an active reset session. Please open the password reset link from the email you received so the reset token can be validated.</div>
                                )}

                                {/* Developer helper removed — the page will auto-parse tokens from the URL fragment or query when present. */}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="space-y-2">
                                        <Label htmlFor="password" className="text-white">New password</Label>
                                        <div className="relative">
                                            <Input
                                                className="text-white pr-10"
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="New password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowPassword((s) => !s)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-white"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            </div>
                                        <div>
                                            <PasswordChecklist password={password} confirm={confirm} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm" className="text-white">Confirm new password</Label>
                                        <div className="relative">
                                            <Input
                                                className="text-white pr-10"
                                                id="confirm"
                                                type={showConfirm ? 'text' : 'password'}
                                                placeholder="Confirm password"
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowConfirm((s) => !s)}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-white"
                                                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                                    )}

                                    {message && (
                                        <div className="rounded-md bg-slate-700/60 p-3 text-sm text-white">{message}</div>
                                    )}

                                    <Button type="submit" disabled={loading || !userReady || !passwordValid(password) || password !== confirm} className="w-full text-white">
                                        {loading ? 'Updating…' : 'Update password'}
                                    </Button>
                                </form>

                                <div className="text-center mt-4">
                                    <Link href="/login" className="text-sm text-white/80 hover:underline">← Back to sign in</Link>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    )
}
