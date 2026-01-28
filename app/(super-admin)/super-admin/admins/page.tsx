'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminAdminsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/super-admin/companies')
  }, [router])
  return null
}
