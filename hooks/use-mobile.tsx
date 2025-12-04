import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Use matchMedia change event instead of window resize for better performance
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    // Check if browser supports addEventListener on MediaQueryList
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    } else {
      // Fallback for older browsers
      const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      window.addEventListener('resize', handler)
      return () => window.removeEventListener('resize', handler)
    }
  }, [])

  return !!isMobile
}
