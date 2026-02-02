'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/company/register')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        <p className="text-sm text-gray-600">Redirecting to registration…</p>
      </div>
    </div>
  )
}
