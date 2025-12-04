'use client'

import React, { memo, useState } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  loading?: 'lazy' | 'eager'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

/**
 * Optimized image component that handles both base64 and regular URLs
 * Falls back to regular img tag for base64 images (Next.js Image doesn't support base64 well)
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
  priority = false,
  loading = 'lazy',
  objectFit = 'contain',
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if src is base64
  const isBase64 = src.startsWith('data:image') || src.startsWith('blob:')

  // For base64 images, use regular img tag with optimizations
  if (isBase64 || error) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
        style={{
          objectFit,
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    )
  }

  // For regular URLs, use Next.js Image component
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      loading={loading}
      style={{ objectFit }}
    />
  )
})

