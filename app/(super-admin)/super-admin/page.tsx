'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { getSuperAdminToken, superAdminLogin } from '@/lib/api/super-admin-api'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (token) router.push('/super-admin/dashboard')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await superAdminLogin({ username, password })
      if (result.success && result.data?.token) {
        router.push('/super-admin/dashboard')
      } else {
        setError(result.message || 'Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">SA</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">Super Admin Portal</h1>
        <p className="text-sm md:text-base text-gray-600 text-center mb-8">Sign in to manage admins and platform settings</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-lg font-medium text-black mb-2">
              Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  const input = document.getElementById('password') as HTMLInputElement
                  if (input) input.type = input.type === 'password' ? 'text' : 'password'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-black/80 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingDots size="sm" color="#ffffff" />
                <span>Signing in</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}


