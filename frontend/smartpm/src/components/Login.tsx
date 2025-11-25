import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { useForm, useWatch } from 'react-hook-form'
import { passwordValid } from '@/lib/passwordValidators'
import PasswordChecklist from '@/components/ui/PasswordChecklist'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthProvider'
import { Eye, EyeOff } from 'lucide-react'
import { Github, Globe } from 'lucide-react'
import Link from 'next/link'
import TiltedCard from './TiltedCard'

export default function Login({ onBack }: { onBack?: () => void }) {

    // form handled with react-hook-form so we can show robust validation messages
    const form = useForm({
        defaultValues: { email: '', password: '', confirmPassword: '' },
        mode: 'onTouched',
    })
    const {
        control,
        getValues,
        handleSubmit: rhfHandleSubmit,
        setError: setFieldError,
        formState: { errors },
    } = form

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [oauthLoading, setOauthLoading] = useState({ google: false, github: false })

    const router = useRouter()
    const { session } = useAuth()

    useEffect(() => {
        if (session) router.push('/projects')
    }, [session, router])

    // reactive watch for password/confirm for checklist
    const watchedPassword = useWatch({ control, name: 'password', defaultValue: '' })
    const watchedConfirm = useWatch({ control, name: 'confirmPassword', defaultValue: '' })

    async function onSubmit(values: { email: string; password: string; confirmPassword?: string }) {
        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                if (!passwordValid(values.password)) {
                    setFieldError('password', { message: 'Password must be at least 8 characters, include upper/lower case, a number and a special character' })
                    setLoading(false)
                    return
                }
                if (values.password !== values.confirmPassword) {
                    // Set field error on confirmPassword
                    setFieldError('confirmPassword', { message: 'Passwords do not match' })
                    setLoading(false)
                    return
                }
                const { error, data } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                })
                if (error) throw error
                // When signing up, Supabase may not autologin (autoconfirm disabled)
                // depending on Auth settings (autoconfirm). If a session exists we'll redirect.
                if (!error) {
                    if (!session) {
                        setMessage('Account created. Please check your email to verify your account. Redirecting to login...')
                        setTimeout(() => router.push('/login'), 5000)
                    } else {
                        // Already signed in, redirect to projects
                        router.push('/projects')
                    }
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                })
                if (error) throw error
                // On success, Supabase SDK should set session and trigger onAuthStateChange. We'll redirect as a fallback.
                router.push('/projects')
            }
        } catch (err: any) {
            setError(err.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleOAuthSignIn(provider: 'google' | 'github') {
        const auth_callback_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
        setOauthLoading((s) => ({ ...s, [provider]: true }))
        const redirectTo = process.env.NEXT_PUBLIC_OAUTH_REDIRECT || `${window.location.origin}/projects`
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
            },
        })
        console.log('OAuth sign-in data:', data)
        if (error) {
            setError(error.message || `Error during ${provider} sign-in`)
            setOauthLoading((s) => ({ ...s, [provider]: false }))
            return
        }
        // If Supabase returns an auth URL, navigate the browser to it; otherwise the SDK likely handled the redirect automatically.
        if (data && (data as any).url) {
            window.location.href = (data as any).url
        } else {
            setOauthLoading((s) => ({ ...s, [provider]: false }))
        }
    }
    const canSubmit = isSignUp
        ? watchedPassword.length > 0 && passwordValid(watchedPassword) && watchedConfirm === watchedPassword && watchedConfirm.length > 0
        : true

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900">
                {/* Animated overlay for liquid effect */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                    <div className = "absolute -bottom-8 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-6000"></div>
                </div>
            </div>

            {/* optional back button */}
            {onBack && (
                <div className="absolute z-20 top-6 left-6">
                    <Button variant="link" onClick={onBack} className="text-white">
                        ← Back
                    </Button>
                </div>
            )}

            {/* Login card with backdrop blur and tilt effect */}
            <div className="relative z-10 w-full max-w-[600px] fade-in">
                <TiltedCard
                    imageSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='700'%3E%3Crect width='600' height='700' fill='%23000000' fill-opacity='0'/%3E%3C/svg%3E"
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
                                    <h2 className="text-2xl font-bold tracking-tight text-white">
                                        {isSignUp ? 'Create your account' : 'Sign in to your account'}
                                    </h2>
                                    <p className="mt-2 text-sm text-white/80">
                                        {isSignUp ? 'Enter your details to get started' : 'Welcome back! Please sign in to continue'}
                                    </p>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-2">
                                        <FormField
                                            control={control}
                                            name="email"
                                            rules={{
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^\S+@\S+\.\S+$/,
                                                    message: 'Invalid email address',
                                                },
                                            }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Email address</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            className="text-white"
                                                            {...field}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                    {isSignUp && (
                                                        <div className="mt-2">
                                                            <PasswordChecklist password={watchedPassword} confirm={watchedConfirm} />
                                                        </div>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <FormField
                                            control={control}
                                            name="password"
                                            rules={{
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 8,
                                                    message: 'Password must be at least 8 characters',
                                                },
                                                pattern: {
                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                                                    message: 'Password must include upper/lower case, a number, and a special character',
                                                },
                                            }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                id="password"
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder="••••••••"
                                                                className="text-white pr-10"
                                                                {...field}
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
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-white/80">
                                                        Password should be at least 8 characters, include upper and lower case letters, a number and a special character.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {isSignUp && (
                                            <FormField
                                                control={control}
                                                name="confirmPassword"
                                                rules={{
                                                    required: 'Please confirm your password',
                                                    validate: (v) => v === getValues().password || 'Passwords do not match',
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Confirm password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    id="confirmPassword"
                                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                                    placeholder="••••••••"
                                                                    className="text-white pr-10"
                                                                    {...field}
                                                                    disabled={loading}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-white"
                                                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                                                >
                                                                    {showConfirmPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    <div className="text-center mt-2 text-white/70">or</div>
                                        <div className="flex items-center justify-center gap-3 mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOAuthSignIn('google')}
                                        disabled={oauthLoading.google}
                                        className="w-1/2 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                    >
                                        {oauthLoading.google ? (
                                            <span className="inline-block animate-spin rounded-full h-4 w-4 mr-2 border-2 border-white/70 border-t-transparent" />
                                        ) : (
                                            <img src="/google_logo.svg" alt="Google logo" className="mr-2 h-4 w-4" />
                                        )}
                                        Continue with Google
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => handleOAuthSignIn('github')}
                                        disabled={oauthLoading.github}
                                        className="w-1/2 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                    >
                                        {oauthLoading.github ? (
                                            <span className="inline-block animate-spin rounded-full h-4 w-4 mr-2 border-2 border-white/70 border-t-transparent" />
                                        ) : (
                                            <img src="/github_logo.svg" alt="GitHub logo" className="mr-2 h-4 w-4" />
                                        )}
                                        Continue with GitHub
                                    </Button>
                                </div>

                                    </div>

                                        {message && (
                                        <div className="rounded-md bg-slate-700/60 p-3 text-sm text-white">{message}</div>
                                    )}
                                    {error && (
                                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                            {error}
                                        </div>
                                    )}

                                        <Button type="submit" disabled={loading || (isSignUp && !canSubmit)} className="w-full text-white">
                                        {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
                                    </Button>
                                    </form>
                                </Form>

                                <div className="text-center mt-4">
                                    <Button
                                        variant="link"
                                        onClick={() => setIsSignUp((s) => !s)}
                                        className="text-sm"
                                    >
                                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                                    </Button>
                                    {!isSignUp && (
                                        <div className="mt-2">
                                            <Link href="/forgot-password" className="text-sm text-white/80 hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
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
