import React, { memo } from 'react'

export const Footer = memo(function Footer() {
  return (
    <footer className="text-center py-4" aria-label="Footer">
      <p className="text-text-light text-sm">Powered by Mira</p>
    </footer>
  )
}, () => true) // Never re-render footer

