/**
 * Image compression and optimization utilities for mobile performance
 */

/**
 * Compress a base64 image to reduce memory usage
 * @param base64String - Base64 encoded image string
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed base64 string
 */
export async function compressBase64Image(
  base64String: string,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to JPEG for better compression (or keep original format)
        const mimeType = base64String.includes('data:image/png') ? 'image/png' : 'image/jpeg'
        const outputFormat = mimeType === 'image/png' ? 'image/png' : 'image/jpeg'
        
        const compressedBase64 = canvas.toDataURL(outputFormat, quality)
        resolve(compressedBase64)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = base64String
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get image dimensions from base64 string
 */
export function getImageDimensions(base64String: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = base64String
  })
}

/**
 * Convert base64 to blob URL for better memory management
 * Use this when displaying images to avoid keeping large base64 strings in memory
 */
export function base64ToBlobUrl(base64String: string): string {
  const byteCharacters = atob(base64String.split(',')[1] || base64String)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  const mimeType = base64String.includes('data:image/png') ? 'image/png' : 'image/jpeg'
  const blob = new Blob([byteArray], { type: mimeType })
  
  return URL.createObjectURL(blob)
}

/**
 * Revoke blob URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

