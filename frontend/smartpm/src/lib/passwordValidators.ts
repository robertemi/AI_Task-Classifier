export function passwordRules(password: string) {
    return {
        minLength: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    }
}

export function passwordValid(password: string) {
    const r = passwordRules(password)
    return r.minLength && r.upper && r.lower && r.number && r.special
}

export default passwordValid
