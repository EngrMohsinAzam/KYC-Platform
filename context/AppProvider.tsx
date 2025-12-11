'use client'

import { useReducer, ReactNode, useEffect, useRef } from 'react'
import { AppContext, initialState, AppState, Action } from './AppContext'
import { saveKYCDocuments, loadKYCDocuments, clearExpiredCaches } from '@/lib/kyc-cache'

const STORAGE_KEY = 'kyc_app_state'

// Load state from localStorage
function loadState(): Partial<AppState> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only restore non-sensitive, non-image data
      return {
        selectedCountry: parsed.selectedCountry,
        selectedCity: parsed.selectedCity,
        selectedIssuingCountry: parsed.selectedIssuingCountry,
        selectedIdType: parsed.selectedIdType,
        isResidentUSA: parsed.isResidentUSA,
        connectedWallet: parsed.connectedWallet,
        idNumber: parsed.idNumber,
        estimatedGasFee: parsed.estimatedGasFee,
        blockchain: parsed.blockchain,
        personalInfo: parsed.personalInfo,
        // Don't restore images (too large for localStorage)
        // Don't restore user (security)
      }
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error)
  }
  return {}
}

// Save state to localStorage (only specific fields)
function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  
  try {
    const stateToSave = {
      selectedCountry: state.selectedCountry,
      selectedCity: state.selectedCity,
      selectedIssuingCountry: state.selectedIssuingCountry,
      selectedIdType: state.selectedIdType,
      isResidentUSA: state.isResidentUSA,
      connectedWallet: state.connectedWallet,
      idNumber: state.idNumber,
      estimatedGasFee: state.estimatedGasFee,
      blockchain: state.blockchain,
      personalInfo: state.personalInfo,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error)
  }
}

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState
  
  switch (action.type) {
    case 'SET_USER':
      newState = { ...state, user: action.payload }
      break
    case 'TOGGLE_SIDEBAR':
      newState = { ...state, isSidebarOpen: !state.isSidebarOpen }
      break
    case 'SET_THEME':
      newState = { ...state, theme: action.payload }
      break
    case 'SET_VERIFICATION_STEP':
      newState = { ...state, verificationStep: action.payload }
      break
    case 'SET_COUNTRY':
      newState = { ...state, selectedCountry: action.payload, selectedCity: undefined } // Reset city when country changes
      break
    case 'SET_CITY':
      newState = { ...state, selectedCity: action.payload }
      break
    case 'SET_ISSUING_COUNTRY':
      newState = { ...state, selectedIssuingCountry: action.payload }
      break
    case 'SET_ID_TYPE':
      newState = { ...state, selectedIdType: action.payload }
      break
    case 'SET_RESIDENT_USA':
      newState = { ...state, isResidentUSA: action.payload }
      break
    case 'SET_WALLET':
      newState = { ...state, connectedWallet: action.payload }
      break
    case 'SET_ID_DETAILS':
      newState = {
        ...state,
        idNumber: action.payload.idNumber,
        estimatedGasFee: action.payload.gasFee,
        blockchain: action.payload.blockchain,
      }
      break
    case 'SET_DOCUMENT_IMAGE':
      newState = { ...state, documentImage: action.payload }
      break
    case 'SET_DOCUMENT_IMAGE_FRONT':
      newState = { ...state, documentImageFront: action.payload }
      break
    case 'SET_DOCUMENT_IMAGE_BACK':
      newState = { ...state, documentImageBack: action.payload }
      break
    case 'SET_SELFIE_IMAGE':
      newState = { ...state, selfieImage: action.payload }
      break
    case 'SET_PERSONAL_INFO':
      newState = { ...state, personalInfo: action.payload }
      break
    default:
      newState = state
  }
  
  // Save to localStorage after state changes (only for specific actions)
  const actionsToPersist = [
    'SET_COUNTRY',
    'SET_CITY',
    'SET_ISSUING_COUNTRY',
    'SET_ID_TYPE',
    'SET_RESIDENT_USA',
    'SET_WALLET',
    'SET_ID_DETAILS',
    'SET_PERSONAL_INFO',
  ]
  
  if (actionsToPersist.includes(action.type)) {
    saveState(newState)
  }
  
  return newState
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state with data from localStorage
  const [state, dispatch] = useReducer(appReducer, { ...initialState, ...loadState() })
  const isRestoringRef = useRef(false)
  const hasRestoredRef = useRef(false)

  // Auto-save images to IndexedDB when they change
  useEffect(() => {
    // Skip if we're currently restoring (to avoid saving during restore)
    if (isRestoringRef.current) return
    
    // Only save if we have at least one image
    if (state.documentImageFront || state.documentImageBack || state.selfieImage) {
      const email = state.personalInfo?.email
      const userId = state.user?.id || state.user?.anonymousId
      
      saveKYCDocuments(
        {
          documentImageFront: state.documentImageFront,
          documentImageBack: state.documentImageBack,
          selfieImage: state.selfieImage,
        },
        email,
        userId
      ).catch((error) => {
        console.error('Failed to auto-save images to cache:', error)
      })
    }
  }, [state.documentImageFront, state.documentImageBack, state.selfieImage, state.personalInfo?.email, state.user?.id, state.user?.anonymousId])

  // Load state and restore images from cache on mount
  useEffect(() => {
    if (hasRestoredRef.current) return // Only restore once
    
    const restoreFromCache = async () => {
      isRestoringRef.current = true
      hasRestoredRef.current = true
      
      try {
        // First, load text data from localStorage
        const savedState = loadState()
        if (savedState.selectedCountry) {
          dispatch({ type: 'SET_COUNTRY', payload: savedState.selectedCountry })
        }
        if (savedState.selectedCity) {
          dispatch({ type: 'SET_CITY', payload: savedState.selectedCity })
        }
        if (savedState.selectedIssuingCountry) {
          dispatch({ type: 'SET_ISSUING_COUNTRY', payload: savedState.selectedIssuingCountry })
        }
        if (savedState.selectedIdType) {
          dispatch({ type: 'SET_ID_TYPE', payload: savedState.selectedIdType })
        }
        if (savedState.isResidentUSA !== undefined) {
          dispatch({ type: 'SET_RESIDENT_USA', payload: savedState.isResidentUSA })
        }
        if (savedState.connectedWallet) {
          dispatch({ type: 'SET_WALLET', payload: savedState.connectedWallet })
        }
        if (savedState.personalInfo) {
          dispatch({ type: 'SET_PERSONAL_INFO', payload: savedState.personalInfo })
        }

        // Then, restore images from IndexedDB (works on mobile too)
        const email = savedState.personalInfo?.email
        const userId = savedState.personalInfo?.email || savedState.user?.id || savedState.user?.anonymousId
        
        try {
          const cachedDocs = await loadKYCDocuments(email, userId)
          
          if (cachedDocs) {
            console.log('🔄 Restoring KYC documents from cache...')
            console.log('  - Email:', email)
            console.log('  - UserId:', userId)
            console.log('  - Has front:', !!cachedDocs.documentImageFront)
            console.log('  - Has back:', !!cachedDocs.documentImageBack)
            console.log('  - Has selfie:', !!cachedDocs.selfieImage)
            
            // Restore all cached images (during initial restore, state won't have images yet)
            if (cachedDocs.documentImageFront) {
              dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: cachedDocs.documentImageFront })
              dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: cachedDocs.documentImageFront })
            }
            
            if (cachedDocs.documentImageBack) {
              dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: cachedDocs.documentImageBack })
            }
            
            if (cachedDocs.selfieImage) {
              dispatch({ type: 'SET_SELFIE_IMAGE', payload: cachedDocs.selfieImage })
            }
            
            console.log('✅ KYC documents restored from cache')
          } else {
            console.log('ℹ️ No cached documents found to restore')
          }
        } catch (cacheError) {
          console.error('❌ Error loading cached documents:', cacheError)
          // Continue even if cache load fails
        }

        // Clear expired caches in background (don't wait)
        clearExpiredCaches().catch(() => {
          // Ignore errors for cleanup
        })
      } catch (error) {
        console.error('Failed to restore from cache:', error)
      } finally {
        isRestoringRef.current = false
      }
    }

    restoreFromCache()
  }, []) // Only run once on mount

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

