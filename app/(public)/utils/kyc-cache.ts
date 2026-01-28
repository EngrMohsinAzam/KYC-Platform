// KYC Cache Utility - IndexedDB for images, localStorage for text data
// Stores images and personal info in frontend only, no backend calls until blockchain submission

const DB_NAME = 'kyc_cache_db'
const DB_VERSION = 1
const STORE_NAME = 'kyc_documents'
const CACHE_KEY_PREFIX = 'kyc_cache_'

interface CachedDocuments {
  documentImageFront?: string
  documentImageBack?: string
  selfieImage?: string
  timestamp: number
  email?: string
  userId?: string
}

// Check if IndexedDB is available (works on mobile too)
function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !!window.indexedDB
  } catch {
    return false
  }
}

// Initialize IndexedDB with better mobile support
async function openDB(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available in this browser')
  }

  return new Promise((resolve, reject) => {
    // Add timeout for mobile browsers that might be slow
    const timeout = setTimeout(() => {
      reject(new Error('IndexedDB open timeout - browser may be slow'))
    }, 10000) // 10 second timeout

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      clearTimeout(timeout)
      console.error('❌ IndexedDB error:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      clearTimeout(timeout)
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('email', 'email', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        console.log('✅ IndexedDB store created')
      }
    }

    request.onblocked = () => {
      console.warn('⚠️ IndexedDB upgrade blocked - another tab may be using it')
      // Don't reject, let it continue
    }
  })
}

// Get cache key from email or generate session ID
function getCacheKey(email?: string, userId?: string): string {
  if (email) {
    return `${CACHE_KEY_PREFIX}${email}`
  }
  if (userId) {
    return `${CACHE_KEY_PREFIX}${userId}`
  }
  // Fallback to session storage for anonymous users
  let sessionId = sessionStorage.getItem('kyc_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('kyc_session_id', sessionId)
  }
  return `${CACHE_KEY_PREFIX}${sessionId}`
}

// Save documents to IndexedDB
export async function saveKYCDocuments(
  documents: {
    documentImageFront?: string
    documentImageBack?: string
    selfieImage?: string
  },
  email?: string,
  userId?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await openDB()
    const cacheKey = getCacheKey(email, userId)
    
    const data: CachedDocuments = {
      ...documents,
      timestamp: Date.now(),
      email,
      userId,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      // Get existing data first
      const getRequest = store.get(cacheKey)
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result
        const mergedData: CachedDocuments = {
          ...existing,
          ...data,
          timestamp: Date.now(),
        }

        const putRequest = store.put({ id: cacheKey, ...mergedData })
        
        putRequest.onsuccess = () => {
          console.log('✅ KYC documents saved to IndexedDB:', {
            hasFront: !!documents.documentImageFront,
            hasBack: !!documents.documentImageBack,
            hasSelfie: !!documents.selfieImage,
            cacheKey,
          })
          resolve()
        }
        
        putRequest.onerror = () => {
          console.error('❌ Error saving to IndexedDB:', putRequest.error)
          reject(putRequest.error)
        }
      }
      
      getRequest.onerror = () => {
        // If no existing data, create new
        const putRequest = store.put({ id: cacheKey, ...data })
        
        putRequest.onsuccess = () => {
          console.log('✅ KYC documents saved to IndexedDB (new entry)')
          resolve()
        }
        
        putRequest.onerror = () => {
          console.error('❌ Error saving to IndexedDB:', putRequest.error)
          reject(putRequest.error)
        }
      }
    })
  } catch (error) {
    console.error('❌ Failed to save KYC documents to IndexedDB:', error)
    // Fallback to sessionStorage (smaller capacity but works on mobile)
    try {
      const cacheKey = getCacheKey(email, userId)
      const data = {
        ...documents,
        timestamp: Date.now(),
        email,
        userId,
      }
      // Try localStorage first (persists across refreshes), then sessionStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data))
        console.log('✅ Fallback: Saved to localStorage (mobile-friendly)')
      } catch (localStorageError) {
        // If localStorage fails (quota exceeded), try sessionStorage
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        console.log('✅ Fallback: Saved to sessionStorage (mobile-friendly)')
      }
    } catch (fallbackError) {
      console.error('❌ All fallback storage methods failed:', fallbackError)
      // Don't throw - allow the app to continue even if caching fails
    }
  }
}

// Load documents from IndexedDB
export async function loadKYCDocuments(
  email?: string,
  userId?: string
): Promise<CachedDocuments | null> {
  if (typeof window === 'undefined') return null

  try {
    const db = await openDB()
    const cacheKey = getCacheKey(email, userId)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(cacheKey)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Remove the 'id' field before returning
          const { id, ...documents } = result
          console.log('✅ KYC documents loaded from IndexedDB:', {
            hasFront: !!documents.documentImageFront,
            hasBack: !!documents.documentImageBack,
            hasSelfie: !!documents.selfieImage,
            age: Date.now() - documents.timestamp,
          })
          resolve(documents as CachedDocuments)
        } else {
          // Try fallback to localStorage, then sessionStorage
          try {
            // Try localStorage first (persists across refreshes)
            const localStorageData = localStorage.getItem(cacheKey)
            if (localStorageData) {
              const parsed = JSON.parse(localStorageData)
              console.log('✅ KYC documents loaded from localStorage (fallback)')
              resolve(parsed)
              return
            }
            
            // Try sessionStorage as second fallback
            const sessionStorageData = sessionStorage.getItem(cacheKey)
            if (sessionStorageData) {
              const parsed = JSON.parse(sessionStorageData)
              console.log('✅ KYC documents loaded from sessionStorage (fallback)')
              resolve(parsed)
              return
            }
            
            console.log('ℹ️ No cached KYC documents found')
            resolve(null)
          } catch (parseError) {
            console.error('❌ Error parsing fallback cache:', parseError)
            resolve(null)
          }
        }
      }

      request.onerror = () => {
        console.error('❌ Error loading from IndexedDB:', request.error)
        // Try fallback
        try {
          const fallbackData = sessionStorage.getItem(cacheKey)
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData)
            console.log('✅ KYC documents loaded from sessionStorage (fallback)')
            resolve(parsed)
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      }
    })
  } catch (error) {
    console.error('❌ Failed to load KYC documents from IndexedDB:', error)
    // Try fallback
    try {
      const cacheKey = getCacheKey(email, userId)
      const fallbackData = sessionStorage.getItem(cacheKey)
      if (fallbackData) {
        const parsed = JSON.parse(fallbackData)
        console.log('✅ KYC documents loaded from sessionStorage (fallback)')
        return parsed
      }
    } catch {
      // Ignore fallback errors
    }
    return null
  }
}

// Clear all KYC caches (when starting new submission)
export async function clearAllKYCCaches(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('✅ All KYC caches cleared from IndexedDB')
        // Also clear sessionStorage and localStorage
        try {
          sessionStorage.clear()
          // Clear all localStorage items that start with cache key prefix
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(CACHE_KEY_PREFIX)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
        } catch {
          // Ignore storage errors
        }
        resolve()
      }

      request.onerror = () => {
        console.error('❌ Error clearing all IndexedDB caches:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('❌ Failed to clear all KYC caches:', error)
    // Try to clear localStorage anyway
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      sessionStorage.clear()
    } catch {
      // Ignore
    }
  }
}

// Clear cached documents (after successful submission)
export async function clearKYCCache(email?: string, userId?: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await openDB()
    const cacheKey = getCacheKey(email, userId)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(cacheKey)

      request.onsuccess = () => {
        console.log('✅ KYC cache cleared from IndexedDB')
        // Also clear from sessionStorage and localStorage
        try {
          sessionStorage.removeItem(cacheKey)
          sessionStorage.removeItem('kyc_session_id')
          // Also clear localStorage fallback cache
          localStorage.removeItem(cacheKey)
        } catch {
          // Ignore storage errors
        }
        resolve()
      }

      request.onerror = () => {
        console.error('❌ Error clearing IndexedDB cache:', request.error)
        // Still try to clear sessionStorage and localStorage
        try {
          sessionStorage.removeItem(cacheKey)
          sessionStorage.removeItem('kyc_session_id')
          localStorage.removeItem(cacheKey)
        } catch {
          // Ignore
        }
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('❌ Failed to clear KYC cache:', error)
    // Try to clear sessionStorage and localStorage anyway
    try {
      const cacheKey = getCacheKey(email, userId)
      sessionStorage.removeItem(cacheKey)
      sessionStorage.removeItem('kyc_session_id')
      localStorage.removeItem(cacheKey)
    } catch {
      // Ignore
    }
  }
}

// Clear all expired caches (older than 48 hours)
export async function clearExpiredCaches(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const db = await openDB()
    const expirationTime = 48 * 60 * 60 * 1000 // 48 hours
    const cutoffTime = Date.now() - expirationTime

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          console.log('✅ Expired caches cleared')
          resolve()
        }
      }

      request.onerror = () => {
        console.error('❌ Error clearing expired caches:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('❌ Failed to clear expired caches:', error)
  }
}

// Check if cache exists
export async function hasKYCCache(email?: string, userId?: string): Promise<boolean> {
  const cache = await loadKYCDocuments(email, userId)
  return cache !== null && (!!cache.documentImageFront || !!cache.selfieImage)
}

