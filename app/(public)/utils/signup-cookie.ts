const KEY = 'digiport_signup_email'
const MAX_AGE_DAYS = 90

export function setSignupEmailCookie(email: string): void {
  if (typeof document === 'undefined') return
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${KEY}=${encodeURIComponent(email)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function getSignupEmailCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

export function clearSignupEmailCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${KEY}=; path=/; max-age=0`
}
