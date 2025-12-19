'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function SupportPage() {
  const router = useRouter()
  const { state } = useAppContext()

  const initialEmail = useMemo(() => state.personalInfo?.email || '', [state.personalInfo?.email])
  const initialName = useMemo(() => {
    if (state.personalInfo?.firstName || state.personalInfo?.lastName) {
      return ` `.trim()
    }
    return ''
  }, [state.personalInfo?.firstName, state.personalInfo?.lastName])

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email.')
      return
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe your issue (at least 10 characters).')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          email: email.trim(), 
          description: description.trim() 
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to submit issue (HTTP ${response.status})`)
      }

      setSuccess('Your support request has been submitted. Our team will contact you soon.')
      setDescription('')
    } catch (e: any) {
      setError(e?.message || 'Failed to submit support request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showBack title="Support" />

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h1 className="text-xl font-bold text-gray-900">Contact support</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tell us what happened and we’ll help you as soon as possible.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Issue Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={6}
                placeholder="Describe your issue..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
              <p className="mt-1 text-xs text-gray-500">{description.trim().length}/500</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="w-1/2"
              >
                Cancel
              </Button>
              <Button type="button" onClick={submit} disabled={loading} className="w-1/2">
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


