import React from 'react'
import { Check, X } from 'lucide-react'

export default function PasswordChecklist({
    password,
    confirm,
    className,
}: {
    password: string
    confirm?: string
    className?: string
}) {
    const rules = {
        minLength: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    }

    const match = typeof confirm !== 'undefined' ? password === confirm && password.length > 0 : null

    const item = (ok: boolean | null, text: React.ReactNode) => {
        const okBool = ok === null ? false : ok
        return (
            <div className={`flex items-center gap-2 text-sm ${okBool ? 'text-green-400' : 'text-white/80'}`}>
                <span className="w-5 h-5 inline-flex items-center justify-center">
                    {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </span>
                <span>{text}</span>
            </div>
        )
    }

    return (
        <div className={`space-y-1 ${className || ''}`} aria-live="polite">
            {item(rules.minLength, 'At least 8 characters')}
            {item(rules.upper, 'At least one uppercase letter (A-Z)')}
            {item(rules.lower, 'At least one lowercase letter (a-z)')}
            {item(rules.number, 'At least one number (0-9)')}
            {item(rules.special, 'At least one special character (!@#$...)')}
            {typeof match !== 'undefined' && (
                item(match, 'Passwords match')
            )}
        </div>
    )
}
