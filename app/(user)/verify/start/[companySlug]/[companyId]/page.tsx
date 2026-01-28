'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function StartVerificationCompanyRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.companySlug as string
  const id = params.companyId as string

  useEffect(() => {
    if (slug && id) {
      router.replace(`/verify/start?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`)
    } else {
      router.replace('/verify/start')
    }
  }, [router, slug, id])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
    </div>
  )
}
