import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form } from '@/components/ui/form' //later for a more comlpex form validation
import TiltedCard from './TiltedCard'

export default function Login({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

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

              <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email address</Label>
            <Input className='text-white'
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input className='text-white'
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full text-white">
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Button 
            variant="link" 
            onClick={() => setIsSignUp((s) => !s)}
            className="text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
}
