import React from 'react'
import { useRouter } from 'next/router'
import Login from '@/components/Login'

export default function LoginPage() {
    const router = useRouter()

    return (
        <div>
            <Login onBack={() => router.push('/')} />
        </div>
    )
}
