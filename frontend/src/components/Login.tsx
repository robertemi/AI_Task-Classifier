import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
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
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginTop: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginTop: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Working…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setIsSignUp((s) => !s)}>
          {isSignUp ? 'Have an account? Sign in' : 'No account? Create one'}
        </button>
      </div>
    </div>
  )
}
