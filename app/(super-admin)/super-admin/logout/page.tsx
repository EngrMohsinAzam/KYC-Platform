'use client'

import { useEffect } from 'react'
import { removeSuperAdminToken } from '@/app/api/super-admin-api'

export default function SuperAdminLogout() {
  useEffect(() => {
    removeSuperAdminToken()
    window.location.href = '/super-admin'
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-600">
      Logging out...
    </div>
  )
}


