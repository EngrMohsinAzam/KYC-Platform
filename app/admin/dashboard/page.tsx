'use client'

// This page uses client-side only features (wagmi)
// Note: dynamic export is only for server components, so we don't use it here

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getAdminToken, removeAdminToken, getDashboardStats, getUsers, User, getAdminCapabilities, AdminCapabilities } from '@/lib/api/admin-api'
import Link from 'next/link'
import { LoadingPage, LoadingDots } from '@/components/ui/LoadingDots'

// Wagmi hooks are available via WagmiProvider in layout
// Import them normally - they're already code-split
import { useAccount, useConnect, useDisconnect } from 'wagmi'

// Lazy load blockchain functions
let blockchainFunctions: any = null
const loadBlockchainFunctions = async () => {
  if (!blockchainFunctions) {
    blockchainFunctions = await import('@/lib/wallet/web3')
  }
  return blockchainFunctions
}

// Lazy load recharts components individually - only load when charts render
const LazyLineChart = nextDynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const LazyLine = nextDynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const LazyXAxis = nextDynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const LazyYAxis = nextDynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const LazyCartesianGrid = nextDynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const LazyTooltip = nextDynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const LazyLegend = nextDynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
const LazyResponsiveContainer = nextDynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const LazyPieChart = nextDynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const LazyPie = nextDynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false })
const LazyCell = nextDynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })
const LazyBarChart = nextDynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const LazyBar = nextDynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })

// Helper function to calculate trends data from users
function calculateTrendsData(users: User[]): any[] {
  console.log('📊 Calculating trends data from', users.length, 'users')
  
  // Get last 7 months
  const months: string[] = []
  const monthData: { [key: string]: { approved: number; pending: number; cancelled: number } } = {}
  const monthDates: { [key: string]: { year: number; month: number } } = {}
  
  // Initialize last 7 months
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
    months.push(monthKey)
    monthData[monthKey] = { approved: 0, pending: 0, cancelled: 0 }
    monthDates[monthKey] = { year: date.getFullYear(), month: date.getMonth() }
  }

  console.log('📅 Months to track:', months)
  console.log('📅 Month dates:', monthDates)

  // Process users and group by month
  let processedCount = 0
  let skippedCount = 0
  
  users.forEach((user) => {
    if (!user.submittedAt) {
      skippedCount++
      return
    }

    try {
      const submittedDate = new Date(user.submittedAt)
      
      // Check if date is valid
      if (isNaN(submittedDate.getTime())) {
        console.warn('⚠️ Invalid date for user:', user.email, user.submittedAt)
        skippedCount++
        return
      }

      const submittedYear = submittedDate.getFullYear()
      const submittedMonth = submittedDate.getMonth()
      
      // Find the matching month in our tracking range by comparing year and month
      let matchedMonthKey: string | null = null
      for (const [monthKey, monthInfo] of Object.entries(monthDates)) {
        if (monthInfo.year === submittedYear && monthInfo.month === submittedMonth) {
          matchedMonthKey = monthKey
          break
        }
      }
      
      // If we found a match, count the user
      if (matchedMonthKey && monthData[matchedMonthKey]) {
        const status = user.kycStatus?.toLowerCase() || ''
        
        if (status === 'approved') {
          monthData[matchedMonthKey].approved++
          processedCount++
        } else if (status === 'pending' || status === 'submitted' || status === 'under_review') {
          monthData[matchedMonthKey].pending++
          processedCount++
        } else if (status === 'cancelled' || status === 'rejected') {
          monthData[matchedMonthKey].cancelled++
          processedCount++
        } else {
          // Count other statuses as pending
          monthData[matchedMonthKey].pending++
          processedCount++
        }
      } else {
        skippedCount++
      }
    } catch (error) {
      console.warn('⚠️ Error processing user date:', user.email, user.submittedAt, error)
      skippedCount++
    }
  })

  console.log('✅ Processed', processedCount, 'users, skipped', skippedCount)
  console.log('📊 Month data:', monthData)

  // Convert to array format
  const result = months.map((month) => ({
    month,
    approved: monthData[month].approved,
    pending: monthData[month].pending,
    cancelled: monthData[month].cancelled,
  }))

  console.log('📈 Final trends data:', result)
  return result
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking, true = authenticated, false = not authenticated
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [capabilities, setCapabilities] = useState<AdminCapabilities | null>(null)
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [contractBalance, setContractBalance] = useState<string | null>(null)
  const [totalCollectedFees, setTotalCollectedFees] = useState<string | null>(null)
  const [totalWithdrawals, setTotalWithdrawals] = useState<string | null>(null)
  const [loadingContractData, setLoadingContractData] = useState(false)
  const [kycFee, setKycFee] = useState<string | null>(null)
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  
  // Set up global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = error?.message || error?.toString() || String(error)
      
      // Suppress MetaMask connection errors - they're expected if user rejects
      if (errorMessage.includes('Failed to connect') || 
          errorMessage.includes('MetaMask') || 
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User denied')) {
        event.preventDefault() // Prevent the error from showing in console
        console.log('Wallet connection was rejected or failed - this is expected behavior')
        return
      }
      
      // Log other unhandled rejections for debugging
      console.warn('Unhandled promise rejection:', error)
    }
    
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || String(event.error)
      
      // Suppress MetaMask connection errors
      if (errorMessage.includes('Failed to connect') || 
          errorMessage.includes('MetaMask') ||
          errorMessage.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
        event.preventDefault() // Prevent the error from showing
        console.log('MetaMask connection error handled - user can retry or use WalletConnect')
        return
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])
  
  const openWallet = async () => {
    try {
      // Try MetaMask first if available
      const metaMaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask' || connector.id === 'injected'
      )
      
      if (metaMaskConnector) {
        try {
          await connect({ connector: metaMaskConnector })
          return
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || ''
          if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
            console.log('User rejected MetaMask connection')
            return
          }
          console.log('MetaMask connection failed, trying WalletConnect')
        }
      }
      
      // Fall back to WalletConnect
      const walletConnectConnector = connectors.find(
        (connector) => connector.id === 'walletConnect'
      )
      
      if (walletConnectConnector) {
        try {
          await connect({ connector: walletConnectConnector })
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || ''
          if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
            console.log('User rejected wallet connection')
            return
          }
          console.warn('Wallet connection error:', errorMessage)
        }
      } else {
        // If no connectors available, try the first one
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] })
        } else {
          throw new Error('No wallet connectors available')
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
        console.warn('Wallet connection error:', errorMessage)
      }
    }
  }

  // Check authentication immediately on mount - CRITICAL: This must run first
  useEffect(() => {
    const checkAuth = () => {
      const token = getAdminToken()
      if (!token) {
        // No token - redirect to login immediately (no API call needed)
        console.log('❌ No admin token found, redirecting to login...')
        setIsAuthenticated(false)
        setLoading(false)
        router.replace('/admin')
        return
      }
      
      // Token exists - set authenticated
      // We'll verify it's valid when we make the first API call
      // This prevents unnecessary 401 errors on page load
      console.log('✅ Admin token found, setting authenticated state')
      setIsAuthenticated(true)
    }
    
    checkAuth()
  }, [router])

  // Load contract data (balance and withdrawals) - lazy load blockchain functions
  const loadContractData = useCallback(async (preserveOnRateLimit: boolean = false): Promise<void> => {
    try {
      setLoadingContractData(true)
      // Lazy load blockchain functions only when needed
      const blockchain = await loadBlockchainFunctions()
      const { getTotalCollectedFees, getTotalWithdrawals, getContractBalance } = blockchain
      
      const [totalCollected, withdrawals] = await Promise.all([
        getTotalCollectedFees().catch((err: any) => {
          console.error('Error fetching total collected fees:', err)
          // Keep last known value if available
          if (preserveOnRateLimit && totalCollectedFees) {
            return totalCollectedFees // Return current value so we can check and preserve it
          }
          return totalCollectedFees || '0'
        }),
        getTotalWithdrawals().catch((err: any) => {
          console.error('Error fetching total withdrawals:', err)
          // If rate limited, keep the last known value instead of showing 0
          const errorMessage = err?.message || String(err)
          if (errorMessage.includes('rate limit') || 
              errorMessage.includes('rate_limit') || 
              errorMessage.includes('Rate limited') ||
              err?.code === -32005) {
            console.warn('⚠️ Rate limited - keeping last known withdrawal value:', totalWithdrawals)
            // Always return current value if we have one, even if preserveOnRateLimit is false
            // This prevents showing 0 when we know there are withdrawals
            if (totalWithdrawals && totalWithdrawals !== '0') {
              return totalWithdrawals // Return current value to preserve it
            }
            // If we don't have a value yet, return null to skip update (don't set to 0)
            return null
          }
          // For other errors, return current value if we have one
          if (totalWithdrawals && totalWithdrawals !== '0') {
            console.warn('⚠️ Error fetching withdrawals, keeping last known value:', totalWithdrawals)
            return totalWithdrawals
          }
          // Only return '0' if we truly have no data and it's not a rate limit
          console.warn('⚠️ No previous withdrawal value, returning 0')
          return '0'
        })
      ])
      
      // Only update if we got valid data (not null from error handlers when preserveOnRateLimit is true)
      if (totalCollected !== null && totalCollected !== undefined) {
        const collectedNum = parseFloat(totalCollected)
        // If preserveOnRateLimit is true and we got '0' or invalid value, keep the current value
        if (preserveOnRateLimit && (isNaN(collectedNum) || collectedNum === 0) && totalCollectedFees) {
          // Rate limited or got 0 - preserve the instant update value
          console.log('✅ Preserving total collected fees value due to rate limit or invalid data:', totalCollectedFees)
          // Don't update - keep the current value
        } else if (!isNaN(collectedNum) && collectedNum >= 0) {
          // Only update if we got a valid positive number
          setTotalCollectedFees(totalCollected)
        } else if (!totalCollectedFees) {
          // If we don't have a value and got invalid data, set to 0
          setTotalCollectedFees('0')
        }
      } else if (preserveOnRateLimit && totalCollectedFees) {
        // If we got null/undefined and preserveOnRateLimit is true, keep current value
        console.log('✅ Preserving total collected fees value (got null/undefined):', totalCollectedFees)
      }
      
      // Also fetch current contract balance for withdraw modal
      try {
        const currentBalance = await getContractBalance()
        const balanceNum = parseFloat(currentBalance)
        if (!isNaN(balanceNum) && balanceNum >= 0) {
          setContractBalance(currentBalance)
        }
      } catch (err: any) {
        console.warn('Could not fetch current contract balance for withdraw modal:', err)
      }
      
      if (withdrawals !== null && withdrawals !== undefined) {
        // Check if withdrawals is actually a valid number
        const withdrawalsNum = parseFloat(withdrawals)
        const currentWithdrawalsNum = totalWithdrawals ? parseFloat(totalWithdrawals) : 0
        
        // If we got null (rate limited), preserve current value
        if (withdrawals === null) {
          console.log('✅ Preserving total withdrawals value (rate limited):', totalWithdrawals)
          // Don't update - keep the current value
        }
        // If preserveOnRateLimit is true and the returned value is less than current, preserve current
        else if (preserveOnRateLimit && totalWithdrawals && !isNaN(withdrawalsNum) && !isNaN(currentWithdrawalsNum)) {
          if (withdrawalsNum < currentWithdrawalsNum) {
            // Got a lower value (likely due to rate limit returning 0) - preserve the higher instant update value
            console.log(`✅ Preserving total withdrawals: got ${withdrawalsNum} but keeping ${currentWithdrawalsNum} (instant update value)`)
            // Don't update - keep the current value
          } else if (withdrawalsNum > currentWithdrawalsNum) {
            // Got a higher value from blockchain - update it
            setTotalWithdrawals(withdrawals)
            console.log(`✅ Updated total withdrawals: ${currentWithdrawalsNum} → ${withdrawalsNum}`)
          } else {
            // Values are equal - update to sync
            setTotalWithdrawals(withdrawals)
          }
        } else if (preserveOnRateLimit && (isNaN(withdrawalsNum) || withdrawalsNum === 0) && totalWithdrawals && totalWithdrawals !== '0') {
          // Rate limited or got 0 - preserve the instant update value
          console.log('✅ Preserving total withdrawals value due to rate limit or invalid data:', totalWithdrawals)
          // Don't update - keep the current value
        } else if (!isNaN(withdrawalsNum) && withdrawalsNum >= 0) {
          // Only update if we got a valid positive number
          // But don't update if it's 0 and we already have a non-zero value
          if (withdrawalsNum === 0 && totalWithdrawals && parseFloat(totalWithdrawals) > 0) {
            console.warn('⚠️ Got 0 withdrawals but we have a previous value - preserving:', totalWithdrawals)
            // Don't update - likely a rate limit issue
          } else {
            setTotalWithdrawals(withdrawals)
            console.log(`✅ Updated total withdrawals to: ${withdrawals}`)
          }
        } else if (!totalWithdrawals || totalWithdrawals === '0') {
          // If we don't have a value and got invalid data, set to 0
          setTotalWithdrawals('0')
        }
      } else {
        // If we got null/undefined, preserve current value if we have one
        if (totalWithdrawals && totalWithdrawals !== '0') {
          console.log('✅ Preserving total withdrawals value (got null/undefined):', totalWithdrawals)
        } else if (!totalWithdrawals) {
          // Only set to 0 if we truly have no data
          setTotalWithdrawals('0')
        }
      }
    } catch (error) {
      console.error('Error loading contract data:', error)
      // Don't overwrite existing values on error when preserveOnRateLimit is true
      if (!preserveOnRateLimit) {
        if (!totalCollectedFees) setTotalCollectedFees('0')
        if (!totalWithdrawals) setTotalWithdrawals('0')
        if (!contractBalance) setContractBalance('0')
      }
    } finally {
      setLoadingContractData(false)
    }
  }, [totalCollectedFees, totalWithdrawals, contractBalance])

  // Load dashboard data only when authenticated - defer contract data
  useEffect(() => {
    // CRITICAL: Only load data if authenticated is explicitly true
    // Don't load if null (checking) or false (not authenticated)
    if (isAuthenticated === true) {
      console.log('✅ Authentication confirmed, loading dashboard data...')
      ;(async () => {
        try {
          const caps = await getAdminCapabilities()
          if (caps.success && caps.data) setCapabilities(caps.data)
        } catch {
          // If capabilities endpoint fails, we keep null and fall back to showing everything
        }
      })()
      loadDashboardData()
      // Defer contract data loading - load after initial render to improve FCP
      const timer = setTimeout(() => {
        loadContractData()
      }, 500) // Delay to improve initial load
      return () => clearTimeout(timer)
    } else if (isAuthenticated === false) {
      // Not authenticated - ensure we don't try to load data
      console.log('❌ Not authenticated, skipping data load')
      setLoading(false)
    }
    // If isAuthenticated is null, we're still checking - don't load data yet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentPage, statusFilter, searchTerm])

  const perms = useMemo(() => {
    const p = capabilities?.permissions || {}
    const fallback = false
    return {
      canViewAllUsers: p.canViewAllUsers ?? fallback,
      canViewFinancialGraph: p.canViewFinancialGraph ?? fallback,
      canViewWallets: false, // Admin should never see wallets (Super Admin only)
      canApproveRejectKYC: p.canApproveRejectKYC ?? fallback,
      canViewSupportIssues: p.canViewSupportIssues ?? fallback,
      canSendEmails: p.canSendEmails ?? fallback,
      role: capabilities?.role || 'admin',
    }
  }, [capabilities])

  useEffect(() => {
    // Try to connect wallet automatically after login (only once)
    // But don't force it - let user choose their wallet
    const connectWalletOnLogin = async () => {
      const token = getAdminToken()
      if (token && !isConnected) {
        try {
          // Small delay to ensure modal is ready
          setTimeout(async () => {
            // Only auto-open if user hasn't connected before
            // This gives user a chance to choose their preferred wallet
            await openWallet()
          }, 1500)
        } catch (error) {
          // Silently fail - user can manually connect when needed
          console.log('Auto-connect skipped - user can connect manually')
        }
      }
    }
    
    connectWalletOnLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Helper function to normalize status to pending, approved, rejected, or cancelled
  const normalizeStatus = (status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
    if (status === 'approved') return 'approved'
    if (status === 'rejected') return 'rejected'
    if (status === 'cancelled') return 'cancelled'
    // Everything else becomes pending
    return 'pending'
  }

  const loadDashboardData = useCallback(async () => {
    // Don't load data if not authenticated
    if (isAuthenticated !== true) {
      return
    }

    // Double check token before making API calls
    const token = getAdminToken()
    if (!token) {
      setIsAuthenticated(false)
      router.replace('/admin')
      return
    }

    try {
      setLoading(true)

      // Load stats
      console.log('📊 Loading dashboard stats...')
      const statsResult = await getDashboardStats()
      
      console.log('📊 Stats API Response:', {
        success: statsResult.success,
        hasData: !!statsResult.data,
        message: statsResult.message,
        stats: statsResult.data
      })
      
      // Check if response indicates authentication error
      if (!statsResult.success && (
        statsResult.message?.includes('No token') || 
        statsResult.message?.includes('Access denied') || 
        statsResult.message?.includes('Not authenticated') ||
        statsResult.message?.includes('Unauthorized') ||
        statsResult.message?.includes('Invalid or inactive')
      )) {
        console.error('❌ Authentication error in stats API:', statsResult.message)
        setIsAuthenticated(false)
        removeAdminToken()
        setLoading(false)
        router.replace('/admin')
        return
      }
      
      if (statsResult.success && statsResult.data) {
        console.log('✅ Stats loaded successfully:', {
          total: statsResult.data.users?.total,
          submitted: statsResult.data.users?.submitted,
          pending: statsResult.data.users?.pending,
          approved: statsResult.data.users?.approved,
          cancelled: statsResult.data.users?.cancelled
        })
        
        // Ensure submitted field exists and is a number
        // If submitted is missing or 0, check if we should use total instead
        const statsData = { ...statsResult.data }
        if (statsData.users) {
          // If submitted is undefined, null, or 0, but total exists, use total as submitted
          if ((statsData.users.submitted === undefined || statsData.users.submitted === null || statsData.users.submitted === 0) && statsData.users.total) {
            console.log('⚠️ Submitted is 0/undefined, but total exists. Using total as submitted count.')
            statsData.users.submitted = statsData.users.total
          }
          // Ensure submitted is a number
          if (typeof statsData.users.submitted !== 'number') {
            statsData.users.submitted = Number(statsData.users.submitted) || statsData.users.total || 0
          }
        }
        
        console.log('✅ Final stats to set:', {
          total: statsData.users?.total,
          submitted: statsData.users?.submitted,
          pending: statsData.users?.pending,
          approved: statsData.users?.approved,
          cancelled: statsData.users?.cancelled
        })
        
        setStats(statsData)
      } else {
        console.error('❌ Failed to load stats:', statsResult.message)
        // Don't reset stats to 0 if we already have stats - keep the last known values
        // Only set default stats if we don't have any stats yet
        if (!stats) {
          console.warn('⚠️ No previous stats found, setting defaults')
          setStats({
            users: {
              total: 0,
              pending: 0,
              approved: 0,
              cancelled: 0,
              submitted: 0,
              underReview: 0
            },
            financial: {
              totalCollected: 0,
              totalTransactions: 0,
              averageFee: '0'
            },
            recent: {
              last7Days: 0
            }
          })
        } else {
          console.log('✅ Keeping previous stats values to avoid showing 0')
        }
      }

      // Load users
      // Normalize status filter: allow pending, approved, rejected, cancelled
      let normalizedStatus = statusFilter
      if (statusFilter !== 'all' && !['pending', 'approved', 'rejected', 'cancelled'].includes(statusFilter)) {
        normalizedStatus = 'pending' // Show as pending if unknown status
      }

      const usersResult = await getUsers({
        page: currentPage,
        limit: 20,
        status: normalizedStatus !== 'all' ? normalizedStatus : undefined,
        search: searchTerm || undefined,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
      })

      // Check if response indicates authentication error
      if (!usersResult.success && (
        usersResult.message?.includes('No token') || 
        usersResult.message?.includes('Access denied') || 
        usersResult.message?.includes('Not authenticated') ||
        usersResult.message?.includes('Unauthorized') ||
        usersResult.message?.includes('Invalid or inactive')
      )) {
        console.error('❌ Authentication error in users API:', usersResult.message)
        setIsAuthenticated(false)
        removeAdminToken()
        setLoading(false)
        router.replace('/admin')
        return
      }

      if (usersResult.success && usersResult.data) {
        // Normalize user statuses: map any non-standard statuses appropriately
        const normalizedUsers = usersResult.data.users.map((user: User) => {
          const normalizedStatus = normalizeStatus(user.kycStatus)
          return {
            ...user,
            kycStatus: normalizedStatus as User['kycStatus']
          }
        })
        setUsers(normalizedUsers)
      }

      // Load trends data - fetch all users for trends calculation
      console.log('📈 Loading trends data...')
      const trendsResult = await getUsers({
        page: 1,
        limit: 50, // Fetch a large number to get all users for trends
        sortBy: 'submittedAt',
        sortOrder: 'desc',
      })

      if (trendsResult.success && trendsResult.data) {
        const allUsers = trendsResult.data.users || []
        console.log('📊 Fetched', allUsers.length, 'users for trends')
        console.log('📊 Sample user data:', allUsers.slice(0, 3).map((u: User) => ({
          email: u.email,
          submittedAt: u.submittedAt,
          kycStatus: u.kycStatus
        })))
        const trends = calculateTrendsData(allUsers)
        setTrendsData(trends)
        console.log('✅ Trends data loaded and set:', trends)
      } else {
        console.error('❌ Failed to load trends data:', trendsResult.message)
        setTrendsData([])
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      // If error is due to authentication, redirect to login
      if (error?.message?.includes('No token') || error?.message?.includes('Access denied') || error?.message?.includes('Unauthorized')) {
        setIsAuthenticated(false)
        removeAdminToken()
        router.replace('/admin')
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, currentPage, statusFilter, searchTerm, router])

  const handleLogout = () => {
    removeAdminToken()
    router.push('/admin')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadDashboardData()
  }

  // Show loading or redirect if not authenticated
  if (isAuthenticated === null) {
    // Still checking authentication
    return <LoadingPage message="Checking authentication..." />
  }

  if (isAuthenticated === false) {
    // Not authenticated - redirecting (or show redirecting message)
    return <LoadingPage message="Redirecting to login..." />
  }

  if (loading && !stats) {
    return <LoadingPage message="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">KYC Admin Dashboard</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">Manage user verifications and analytics</p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0 ml-2">
              {perms.canViewSupportIssues && (
                <Link
                  href="/admin/support"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden sm:inline">Support</span>
                </Link>
              )}
              {perms.canViewWallets && (
                <button
                  onClick={async () => {
                    // Connect wallet if not connected, then show modal
                    if (!isConnected) {
                      try {
                        await openWallet()
                      } catch (error) {
                        // Error already handled in openWallet
                        console.log('Wallet connection attempt completed')
                      }
                    }
                    // Show modal even if connection failed - user can retry
                    setShowWithdrawModal(true)
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Withdraw</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex p-1.5 sm:px-2 sm:py-2 border border-black text-black rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm items-center justify-center"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline ml-1.5">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* First Row - Verification Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <SummaryCard
            title="Total Submissions"
            value={
              (stats?.users?.submitted !== undefined && stats?.users?.submitted !== null) 
                ? stats.users.submitted 
                : (stats?.users?.total !== undefined && stats?.users?.total !== null)
                  ? stats.users.total
                  : 0
            }
            icon="user"
            color="blue"
          />
          <SummaryCard
            title="Approved"
            value={stats?.users?.approved || 0}
            icon="check"
            color="green"
            onClick={() => {
              setStatusFilter('approved')
              setCurrentPage(1)
            }}
            clickable
          />
          <SummaryCard
            title="Pending"
            value={stats?.users?.pending || 0}
            icon="clock"
            color="yellow"
            onClick={() => {
              setStatusFilter('pending')
              setCurrentPage(1)
            }}
            clickable
          />
          <SummaryCard
            title="Cancelled"
            value={stats?.users?.cancelled || 0}
            icon="x"
            color="red"
            onClick={() => {
              setStatusFilter('cancelled')
              setCurrentPage(1)
            }}
            clickable
          />
        </div>

        {/* Financial Graph Section (permission gated) - Only show graphs, no cards */}
        {!perms.canViewFinancialGraph && (
          <div className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
            Financial graphs are hidden for your account (missing `canViewFinancialGraph`).
          </div>
        )}

        {/* Charts Row (financial permission gated for now) */}
        {perms.canViewFinancialGraph && (
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            {/* KYC Verification Trends - 65% width */}
            <div className="w-full lg:w-[65%]">
              <ChartCard title="KYC Verification Trends">
                <TrendsChart stats={stats} trendsData={trendsData} />
              </ChartCard>
            </div>

            {/* Status Distribution - 35% width */}
            <div className="w-full lg:w-[35%]">
              <ChartCard title="Status Distribution">
                <StatusPieChart stats={stats} />
              </ChartCard>
            </div>
          </div>
        )}

        {/* Financial Overview */}
        {perms.canViewFinancialGraph && (
          <div className="mb-4 sm:mb-6">
            <ChartCard title="Financial Overview">
              <FinancialChart 
                stats={stats} 
                totalCollectedFees={totalCollectedFees}
                totalWithdrawals={totalWithdrawals}
                contractBalance={contractBalance}
                users={users}
                loading={loadingContractData}
              />
            </ChartCard>
          </div>
        )}

        {/* User Management Table (permission gated) */}
        {perms.canViewAllUsers ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">User Management</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                  <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]">
                      <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm"
                      />
                    </div>
                    <div className="relative hidden sm:block">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </form>
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg hover:bg-black-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>
            </div>

            <UserTable users={users} />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            User management is hidden for your account (missing `canViewAllUsers`).
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && perms.canViewWallets && (
        <WithdrawModal 
          onClose={() => {
            setShowWithdrawModal(false)
          }}
          onWithdrawSuccess={async (withdrawnAmount: string) => {
            // Instantly update UI with the withdrawal amount
            console.log('💰 Instantly updating UI with withdrawal:', withdrawnAmount, 'BNB')
            
            const withdrawalAmountNum = parseFloat(withdrawnAmount)
            if (isNaN(withdrawalAmountNum) || withdrawalAmountNum <= 0) {
              console.warn('⚠️ Invalid withdrawal amount, skipping instant update')
              return
            }
            
            // Update total withdrawals: add the withdrawn amount
            if (totalWithdrawals && totalWithdrawals !== '0') {
              const currentTotal = parseFloat(totalWithdrawals)
              const newTotal = currentTotal + withdrawalAmountNum
              setTotalWithdrawals(newTotal.toString())
              console.log(`✅ Updated total withdrawals: ${currentTotal} + ${withdrawalAmountNum} = ${newTotal}`)
            } else {
              // If no previous value, set to the withdrawal amount
              setTotalWithdrawals(withdrawnAmount)
              console.log(`✅ Set total withdrawals to: ${withdrawnAmount}`)
            }
            
            // Update contract balance: subtract the withdrawn amount
            if (contractBalance && contractBalance !== '0') {
              const currentBalance = parseFloat(contractBalance)
              const newBalance = Math.max(0, currentBalance - withdrawalAmountNum)
              setContractBalance(newBalance.toString())
              console.log(`✅ Updated contract balance: ${currentBalance} - ${withdrawalAmountNum} = ${newBalance}`)
            } else {
              // If we don't have balance, try to fetch it first, then subtract
              try {
                const blockchain = await loadBlockchainFunctions()
                const balance = await blockchain.getContractBalance()
                const currentBalance = parseFloat(balance)
                const newBalance = Math.max(0, currentBalance - withdrawalAmountNum)
                setContractBalance(newBalance.toString())
                console.log(`✅ Fetched and updated contract balance: ${currentBalance} - ${withdrawalAmountNum} = ${newBalance}`)
              } catch (err: any) {
                // If fetch fails, just subtract from 0 or set a placeholder
                console.warn('⚠️ Could not fetch balance, will refresh later', err)
              }
            }
            
            // After 20 seconds, refresh from contract to get real values
            // Use preserveOnRateLimit flag to keep instant update values if rate limited
            setTimeout(() => {
              console.log('🔄 Refreshing contract data after 20 seconds to sync with blockchain...')
              loadContractData(true) // true = preserve values if rate limited
            }, 20000) // 20 seconds
          }}
        />
      )}
    </div>
  )
}

// Summary Card Component
function SummaryCard({ title, value, icon, color, subtitle, onClick, clickable }: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  const iconComponents = {
    user: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
      </svg>
    ),
    clock: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    x: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    wallet: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  }

  return (
    <div
      className={`bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-2 border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <div className="scale-75 sm:scale-90 md:scale-100">
            {iconComponents[icon as keyof typeof iconComponents] || <span>{icon}</span>}
          </div>
        </div>
      </div>
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2 break-words leading-tight">{value}</p>
      {subtitle && (
        <div className="flex items-center gap-1">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

// Financial Card Component
function FinancialCard({ title, value, change, changeType, icon, color }: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  }

  const iconComponent = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-2 border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <div className="scale-75 sm:scale-90 md:scale-100">
            {iconComponent}
          </div>
        </div>
      </div>
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2 break-words leading-tight">{value}</p>
      <div className="flex items-center gap-1">
        {changeType === 'positive' && (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
        <p className={`text-[10px] sm:text-xs font-medium ${changeType === 'positive' ? 'text-green-600' : 'text-gray-600'}`}>
          {change}
        </p>
      </div>
    </div>
  )
}

// Chart Card Wrapper
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 lg:mb-6">{title}</h3>
      <div className="w-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Trends Chart Component - uses lazy-loaded recharts
function TrendsChart({ stats, trendsData }: { stats: any; trendsData: any[] }) {
  const data = useMemo(() => {
    return trendsData && trendsData.length > 0 ? trendsData : [
      { month: 'Jan', approved: 0, pending: 0, cancelled: 0 },
      { month: 'Feb', approved: 0, pending: 0, cancelled: 0 },
      { month: 'Mar', approved: 0, pending: 0, cancelled: 0 },
      { month: 'Apr', approved: 0, pending: 0, cancelled: 0 },
      { month: 'May', approved: 0, pending: 0, cancelled: 0 },
      { month: 'Jun', approved: 0, pending: 0, cancelled: 0 },
      { month: 'Jul', approved: 0, pending: 0, cancelled: 0 },
    ]
  }, [trendsData])

  const yAxisMax = useMemo(() => {
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.approved, d.pending, d.cancelled)),
      10
    )
    return Math.ceil(maxValue * 1.2)
  }, [data])

  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingDots /></div>}>
      <LazyResponsiveContainer width="100%" height={250}>
        <LazyLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <LazyXAxis dataKey="month" stroke="#6b7280" />
          <LazyYAxis domain={[0, yAxisMax]} stroke="#6b7280" />
          <LazyTooltip />
          <LazyLegend wrapperStyle={{ paddingTop: '20px' }} />
          <LazyLine type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="approved" />
          <LazyLine type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="pending" />
          <LazyLine type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="cancelled" />
        </LazyLineChart>
      </LazyResponsiveContainer>
    </Suspense>
  )
}

// Status Pie Chart Component
function StatusPieChart({ stats }: { stats: any }) {

  const total = stats?.users?.total || 0
  const approved = stats?.users?.approved || 0
  const pending = stats?.users?.pending || 0
  const cancelled = stats?.users?.cancelled || 0

  // Calculate values - use actual stats or fallback to sample data
  const approvedValue = total > 0 ? approved : 84
  const pendingValue = total > 0 ? pending : 11
  const cancelledValue = total > 0 ? cancelled : 5
  const totalValue = approvedValue + pendingValue + cancelledValue

  const data = [
    {
      name: 'Approved',
      value: approvedValue,
      percentage: totalValue > 0 ? Math.round((approvedValue / totalValue) * 100) : 84
    },
    {
      name: 'Pending',
      value: pendingValue,
      percentage: totalValue > 0 ? Math.round((pendingValue / totalValue) * 100) : 11
    },
    {
      name: 'Cancelled',
      value: cancelledValue,
      percentage: totalValue > 0 ? Math.round((cancelledValue / totalValue) * 100) : 5
    },
  ].filter(item => item.value > 0) // Only show slices with data

  // Color mapping: Approved = Green, Pending = Orange, Cancelled = Red
  const statusColors: { [key: string]: string } = {
    'Approved': '#10b981',   // Green
    'Pending': '#f59e0b',    // Orange
    'Cancelled': '#ef4444',  // Red
  }

  // Add color to each data item
  const dataWithColors = data.map(item => ({
    ...item,
    fill: statusColors[item.name] || '#8884d8'
  }))

  if (data.length === 0) {
    // Fallback if no data
    return (
      <div className="h-300 flex items-center justify-center text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingDots /></div>}>
      <div className="w-full overflow-hidden">
        <LazyResponsiveContainer width="100%" height={250}>
          <LazyPieChart>
            <LazyPie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              innerRadius={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {dataWithColors.map((entry, index) => (
                <LazyCell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </LazyPie>
            <LazyTooltip />
            <LazyLegend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => {
                const item = dataWithColors.find(d => d.name === value)
                return `${value} ${item?.percentage || 0}%`
              }}
              iconType="circle"
            />
          </LazyPieChart>
        </LazyResponsiveContainer>
      </div>
    </Suspense>
  )
}

// Financial Chart Component
function FinancialChart({ 
  stats, 
  totalCollectedFees, 
  totalWithdrawals, 
  contractBalance,
  users,
  loading 
}: { 
  stats: any
  totalCollectedFees: string | null
  totalWithdrawals: string | null
  contractBalance: string | null
  users: User[]
  loading: boolean
}) {
  // Calculate monthly data from user submissions
  const calculateMonthlyData = () => {
    const now = new Date()
    const months: string[] = []
    const monthData: { [key: string]: { revenue: number; withdrawals: number } } = {}
    
    // Get last 7 months
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      months.push(monthKey)
      monthData[monthKey] = { revenue: 0, withdrawals: 0 }
    }
    
    // Calculate revenue from user submissions (each approved submission = KYC fee)
    // Use actual KYC fee from contract if available, otherwise estimate
    // KYC fee is typically $2 USD, which is approximately 0.0033 BNB (at ~$600/BNB)
    const kycFeeBNB = 0.0033 // Default estimate - can be updated with actual contract fee
    
    users.forEach((user) => {
      if (user.submittedAt && user.kycStatus?.toLowerCase() === 'approved') {
        try {
          const submittedDate = new Date(user.submittedAt)
          if (isNaN(submittedDate.getTime())) return
          
          const submittedYear = submittedDate.getFullYear()
          const submittedMonth = submittedDate.getMonth()
          
          // Find matching month
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            if (date.getFullYear() === submittedYear && date.getMonth() === submittedMonth) {
              const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
              if (monthData[monthKey]) {
                monthData[monthKey].revenue += kycFeeBNB
              }
              break
            }
          }
        } catch (error) {
          console.warn('Error processing user submission date:', error)
        }
      }
    })
    
    // For withdrawals, we can't calculate historical data from contract
    // So we'll distribute total withdrawals proportionally based on revenue
    const totalRevenue = Object.values(monthData).reduce((sum, m) => sum + m.revenue, 0)
    const totalWithdrawalsNum = totalWithdrawals ? parseFloat(totalWithdrawals) : 0
    
    if (totalRevenue > 0 && totalWithdrawalsNum > 0) {
      // Distribute withdrawals proportionally to revenue
      Object.keys(monthData).forEach((monthKey) => {
        const revenue = monthData[monthKey].revenue
        if (revenue > 0) {
          monthData[monthKey].withdrawals = (revenue / totalRevenue) * totalWithdrawalsNum
        }
      })
    }
    
    // If we have contract data, use it to scale the last month
    const totalCollectedNum = totalCollectedFees ? parseFloat(totalCollectedFees) : 0
    if (totalCollectedNum > 0 && totalRevenue > 0) {
      // Scale all months proportionally to match total collected
      const scaleFactor = totalCollectedNum / totalRevenue
      Object.keys(monthData).forEach((monthKey) => {
        monthData[monthKey].revenue *= scaleFactor
        monthData[monthKey].withdrawals *= scaleFactor
      })
    }
    
    return months.map((month) => ({
      month,
      revenue: parseFloat(monthData[month].revenue.toFixed(8)),
      withdrawals: parseFloat(monthData[month].withdrawals.toFixed(8)),
    }))
  }

  const data = calculateMonthlyData()
  
  // Calculate max value for Y-axis
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.revenue, d.withdrawals)),
    totalCollectedFees ? parseFloat(totalCollectedFees) : 0,
    totalWithdrawals ? parseFloat(totalWithdrawals) : 0
  )
  const yAxisMax = maxValue > 0 ? maxValue * 1.2 : 100 // Add 20% padding

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingDots />
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><LoadingDots /></div>}>
      <LazyResponsiveContainer width="100%" height={250}>
        <LazyBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <LazyXAxis dataKey="month" stroke="#6b7280" />
          <LazyYAxis domain={[0, yAxisMax]} stroke="#6b7280" />
          <LazyTooltip 
            formatter={(value: any, name: any) => {
              if (value === null || value === undefined) return ''
              const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
              return [`${numValue.toFixed(8)} BNB`, name]
            }}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <LazyLegend wrapperStyle={{ paddingTop: '20px' }} />
          <LazyBar dataKey="revenue" fill="#3b82f6" name="Revenue (BNB)" radius={[4, 4, 0, 0]} />
          <LazyBar dataKey="withdrawals" fill="#f59e0b" name="Withdrawals (BNB)" radius={[4, 4, 0, 0]} />
        </LazyBarChart>
      </LazyResponsiveContainer>
    </Suspense>
  )
}

// User Table Component
function UserTable({ users }: { users: User[] }) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    // Normalize status: show pending, approved, rejected, cancelled
    const normalizedStatus = ['pending', 'approved', 'rejected', 'cancelled'].includes(status)
      ? status
      : 'pending'

    const statusClasses = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    const statusLabels = {
      approved: 'Approved',
      pending: 'Pending',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    }
    return (
      <span className={`px-3 py-1 rounded-md text-xs font-medium ${statusClasses[normalizedStatus as keyof typeof statusClasses] || 'bg-yellow-100 text-yellow-800'}`}>
        {statusLabels[normalizedStatus as keyof typeof statusLabels] || 'Pending'}
      </span>
    )
  }

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return 'N/A'
    // Format phone number if needed
    return phone
  }

  const formatDocumentType = (idType: string | undefined) => {
    if (!idType) return 'N/A'
    const typeMap: { [key: string]: string } = {
      'CNIC': 'CNIC',
      'Passport': 'Passport',
      'License': 'Driver License',
      'Driver License': 'Driver License',
      'Identity Card': 'CNIC',
    }
    return typeMap[idType] || idType
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">Document</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="pl-2 sm:pl-4 pr-6 sm:pr-8 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.userId} className="hover:bg-gray-50 bg-white">
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                  <div className="text-xs text-gray-500 md:hidden mt-1">{user.email}</div>
                </td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px]">{user.email}</div>
                </td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                  <div className="text-xs sm:text-sm text-gray-600">{formatPhone(user.phone)}</div>
                </td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                  <div className="text-xs sm:text-sm text-gray-600">{formatDocumentType(user.idType)}</div>
                </td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="text-xs sm:text-sm text-gray-600">{formatDate(user.submittedAt)}</div>
                </td>
                <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(user.kycStatus)}
                </td>
                <td className="px-2 sm:px-4 pr-3 sm:pr-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => router.push(`/admin/users/${user.email}`)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-black text-white rounded-md hover:bg-black/80 transition-colors text-xs font-medium min-w-[32px] sm:min-w-0"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline">View</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Withdraw Modal Component
function WithdrawModal({ onClose, onWithdrawSuccess }: { onClose: () => void; onWithdrawSuccess?: (amount: string) => void }) {
  const [amount, setAmount] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [contractBalance, setContractBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)
  const [verifyingOwner, setVerifyingOwner] = useState(false)
  const [error, setError] = useState<string>('')

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Check if MetaMask is available
  const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
  
  // Find MetaMask connector
  const metaMaskConnector = connectors.find((connector) => 
    connector.id === 'metaMask' || connector.id === 'injected' || connector.name.toLowerCase().includes('metamask')
  )
  
  const connectToMetaMask = async () => {
    if (metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error'
        if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
          console.error('MetaMask connection error:', errorMessage)
        }
        throw error
      }
    } else {
      throw new Error('MetaMask not found')
    }
  }
  
  const openWallet = async () => {
    // Try to connect to MetaMask first if available
    if (isMetaMaskAvailable && metaMaskConnector) {
      try {
        await connectToMetaMask()
        return // Successfully connected to MetaMask
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || ''
        // If user rejected MetaMask, don't fall back
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected MetaMask connection')
          return
        }
        // If MetaMask connection failed for other reasons, fall back to WalletConnect
        console.log('MetaMask connection failed, trying WalletConnect')
      }
    }
    
    // Fall back to WalletConnect if MetaMask is not available or connection failed
    const walletConnectConnector = connectors.find(
      (connector) => connector.id === 'walletConnect'
    )
    
    if (walletConnectConnector) {
      try {
        await connect({ connector: walletConnectConnector })
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error'
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected wallet connection')
          return
        }
        console.warn('Wallet connection error:', errorMessage)
      }
    } else {
      // If no connectors available, try the first one
      if (connectors.length > 0) {
        try {
          await connect({ connector: connectors[0] })
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
            console.warn('Wallet connection error:', errorMessage)
          }
        }
      } else {
        console.error('No wallet connectors available')
      }
    }
  }

  // Fetch contract balance immediately when modal opens (works without wallet)
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true)
        // Lazy load blockchain functions
        const blockchain = await loadBlockchainFunctions()
        const balance = await blockchain.getContractBalance()
        setContractBalance(parseFloat(balance))
        console.log('✅ Contract balance fetched:', balance, 'USD')
      } catch (error: any) {
        console.error('Error fetching contract balance:', error)
        // Don't set error here - just log it, balance will show as unavailable
        setContractBalance(null)
      } finally {
        setLoadingBalance(false)
      }
    }

    // Fetch balance immediately when modal opens
    fetchBalance()
  }, []) // Empty dependency array - only run once when modal opens

  // Verify owner when wallet is connected
  useEffect(() => {
    const checkOwner = async () => {
      if (isConnected && address) {
        try {
          setError('')
          setVerifyingOwner(true)
          
          // Lazy load blockchain functions
          const blockchain = await loadBlockchainFunctions()
          const { verifyOwner, getContractBalance } = blockchain
          
          // Verify if the connected wallet is the owner
          const ownerStatus = await verifyOwner(address)
          setIsOwner(ownerStatus)
          
          // If owner, refresh contract balance to ensure it's up to date
          const balance = await getContractBalance()
          setContractBalance(parseFloat(balance))
        } catch (error: any) {
          console.error('Error verifying owner:', error)
          setError(error.message || 'Failed to verify ownership')
          setIsOwner(false)
        } finally {
          setVerifyingOwner(false)
        }
      } else {
        setIsOwner(null)
        setError('')
      }
    }

    checkOwner()
  }, [isConnected, address])

  const handleConnectWallet = async () => {
    try {
      setConnecting(true)
      setError('')
      await openWallet()
      // Verification and balance will be fetched automatically by useEffect when address becomes available
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      // Errors are already handled in openWallet - don't show duplicate alerts
      // Only show alert for unexpected errors
      const errorMessage = error?.message || error?.toString() || ''
      if (!errorMessage.includes('User rejected') && !errorMessage.includes('Failed to connect')) {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected || !amount || !isOwner) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (contractBalance !== null && amountNum > contractBalance) {
      setError(`Insufficient contract balance. Available: ${contractBalance.toFixed(8)} BNB`)
      return
    }

    try {
      setWithdrawing(true)
      setError('')
      
      // Lazy load blockchain functions
      const blockchain = await loadBlockchainFunctions()
      const txHash = await blockchain.withdrawContractFunds(amount)
      
      // Show success message
      alert(`Withdrawal successful! Transaction hash: ${txHash}`)
      
      // Update local balance immediately (optimistic update)
      if (contractBalance !== null) {
        const withdrawalAmount = parseFloat(amount)
        const newBalance = Math.max(0, contractBalance - withdrawalAmount)
        setContractBalance(newBalance)
        console.log(`✅ Updated contract balance: ${contractBalance} - ${withdrawalAmount} = ${newBalance}`)
      }
      
      // Instantly update parent component with the withdrawal amount
      if (onWithdrawSuccess) {
        onWithdrawSuccess(amount)
      }
      
      // Reset form and close modal
      setAmount('')
      onClose()
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      setError(error.message || 'Withdrawal failed. Please try again.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">Withdraw funds from the contract. Only authorized owners can withdraw.</p>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* {!isConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please connect your wallet to verify ownership and view contract balance.
              </p>
            </div>
          )} */}

          {isConnected && address && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-blue-800">
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      disconnect()
                      setIsOwner(null)
                      setError('')
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {verifyingOwner && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Verifying ownership...</p>
                </div>
              )}

              {!verifyingOwner && isOwner === false && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ Access Denied: Only authorized owners can withdraw funds. Please connect with an authorized owner wallet.
                  </p>
                </div>
              )}

             
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Balance
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {loadingBalance ? (
                <span className="text-gray-400">Loading...</span>
              ) : contractBalance !== null ? (
                `${contractBalance.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BNB`
              ) : (
                <span className="text-gray-400">
                  Unable to fetch balance
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount (BNB)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => {
                  const inputValue = e.target.value
                  // Prevent negative values
                  if (inputValue === '' || inputValue === '-') {
                    setAmount('')
                    setError('')
                    return
                  }
                  const numValue = parseFloat(inputValue)
                  // Only allow positive numbers or zero
                  if (!isNaN(numValue) && numValue >= 0) {
                    setAmount(inputValue)
                    setError('')
                  } else {
                    // If negative, don't update the value
                    setError('Amount must be greater than or equal to 0')
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent typing minus sign
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault()
                  }
                }}
                placeholder="0.00000000"
                disabled={!isConnected || !isOwner}
                className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => {
                  if (contractBalance !== null && contractBalance > 0) {
                    setAmount(contractBalance.toFixed(8))
                    setError('')
                  }
                }}
                disabled={!isConnected || !isOwner || contractBalance === null || contractBalance <= 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-600 disabled:hover:bg-blue-50"
              >
                Max
              </button>
            </div>
            {contractBalance !== null && amount && parseFloat(amount) > contractBalance && (
              <p className="mt-1 text-sm text-red-600">
                Amount exceeds contract balance
              </p>
            )}
          </div>

          {!isConnected && (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : isMetaMaskAvailable ? 'Connect Wallet (MetaMask)' : 'Connect Wallet'}
            </button>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={
                !isConnected || 
                !amount || 
                !isOwner || 
                withdrawing || 
                contractBalance === null ||
                verifyingOwner ||
                (amount ? parseFloat(amount) <= 0 : true) ||
                (amount && contractBalance !== null ? parseFloat(amount) > contractBalance : false)
              }
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? 'Processing...' : 'Withdraw Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

