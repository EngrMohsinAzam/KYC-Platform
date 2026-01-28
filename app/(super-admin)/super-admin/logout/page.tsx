'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { removeSuperAdminToken } from '@/app/api/super-admin-api'

export default function SuperAdminLogout() {
  const router = useRouter()

  useEffect(() => {
    removeSuperAdminToken()
    router.replace('/super-admin')
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-600">
      Logging out...
    </div>
  )
}


