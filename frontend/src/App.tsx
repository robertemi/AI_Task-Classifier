import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthProvider'
import Login from './components/Login'
import Landing from './components/Landing'

function LoggedIn() {
  const { user, signOut } = useAuth()

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.email || 'user'}</h2>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  )
}

function Main() {
  const { session } = useAuth()

  // lightweight client-side view state: 'landing' | 'login'
  const [view, setView] = useState<'landing' | 'login'>('landing')

  if (session) return <LoggedIn />

  return (
    <div>
      {view === 'landing' ? (
        <Landing onStart={() => setView('login')} />
      ) : (
        <Login onBack={() => setView('landing')} />
      )}
    </div>
  )
}
