'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface AddressMapModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAddress: (address: string, lat: number, lng: number) => void
  initialAddress?: string
}


export default function AddressMapModal({ isOpen, onClose, onSelectAddress, initialAddress }: AddressMapModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Initialize map position (default to a central location, or use geolocation)
  useEffect(() => {
    if (isOpen && !selectedPosition) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setSelectedPosition([position.coords.latitude, position.coords.longitude])
          },
          () => {
            // Default to a central location if geolocation fails (e.g., London)
            setSelectedPosition([51.505, -0.09])
          }
        )
      } else {
        setSelectedPosition([51.505, -0.09]) // Default to London
      }
    }
    if (isOpen && initialAddress) {
      setSearchQuery(initialAddress)
    }
  }, [isOpen, selectedPosition, initialAddress])

  // Forward geocoding: search address and get coordinates
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=en`
      )
      const data = await response.json()
      
      if (data && Array.isArray(data) && data.length > 0) {
        setSearchResults(data)
        // Auto-select first result and update map
        const firstResult = data[0]
        const lat = parseFloat(firstResult.lat)
        const lon = parseFloat(firstResult.lon)
        setSelectedPosition([lat, lon])
        setAddress(firstResult.display_name)
        
        // Update map view
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 15)
        }
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching address:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAddress(searchQuery)
  }

  const handleSelectResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    setSelectedPosition([lat, lon])
    setAddress(result.display_name)
    setSearchQuery(result.display_name)
    setSearchResults([])
    
    // Update map view
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15)
    }
  }

  const handleConfirm = () => {
    if (selectedPosition && address) {
      onSelectAddress(address, selectedPosition[0], selectedPosition[1])
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedPosition(null)
    setAddress('')
    setSearchQuery('')
    setSearchResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-text-primary">Search and Select Address</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search Area */}
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for an address..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="text-sm text-text-primary font-medium">{result.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px]">
          {selectedPosition && (
            <MapContainer
              center={selectedPosition}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selectedPosition && (
                <Marker position={selectedPosition} />
              )}
            </MapContainer>
          )}
        </div>

        {/* Selected Address Display */}
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Selected Address:
            </label>
            {address ? (
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-text-primary">
                {address}
              </div>
            ) : (
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                Search for an address to select
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPosition || !address}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Address
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
