import React from 'react'
import { AuthProvider, useAuth } from './context/AuthProvider'
import Login from './components/Login'

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

  return <div>{session ? <LoggedIn /> : <Login />}</div>
}
