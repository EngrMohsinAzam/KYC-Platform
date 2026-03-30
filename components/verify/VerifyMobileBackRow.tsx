'use client'

type VerifyMobileBackRowProps = {
  onBack: () => void
  /** Black chevron on white (default), gray on white (intro flows), or white on dark (camera). */
  variant?: 'dark' | 'light' | 'muted'
  /** Extra classes on the outer wrapper (e.g. `pt-2 pb-1`). */
  className?: string
  /**
   * Horizontal padding for the content column (must match the page main/heading).
   * Default `px-4`. Some pages use e.g. `pl-[25px] pr-4`.
   */
  padX?: string
  /**
   * Use when the back control sits inside a parent that already has `px-4`
   * (e.g. first row inside `<main className="... px-4">`) so we do not double the horizontal inset.
   */
  nested?: boolean
}

/**
 * Mobile-only back chevron aligned with heading/body text (`px-4` content column).
 * Icon sits at the same left edge as body copy — no extra button padding shifting it right.
 */
export function VerifyMobileBackRow({
  onBack,
  variant = 'dark',
  className = '',
  padX = 'px-4',
  nested = false,
}: VerifyMobileBackRowProps) {
  const color =
    variant === 'light'
      ? 'text-white'
      : variant === 'muted'
        ? 'text-[#828282] hover:text-[#000000]'
        : 'text-[#000000]'

  const button = (
    <button
      type="button"
      aria-label="Go back"
      onClick={onBack}
      className={`${color} inline-flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-start overflow-visible p-0 hover:opacity-80 transition-opacity`}
    >
      {/*
        Chevron path is inset in the 24×24 viewBox (~9px air on the left), so text below
        (flush to the content edge) looks further left than the arrow tip — pull SVG left
        so the stroke tip aligns with the heading/body start.
      */}
      <svg
        className="h-[26px] w-[26px] shrink-0 -translate-x-[9px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )

  if (nested) {
    return (
      <div className={`md:hidden w-full pt-2 pb-3 ${className}`.trim()}>{button}</div>
    )
  }

  return (
    <div className={`md:hidden flex-shrink-0 ${padX} pt-5 pb-1 ${className}`.trim()}>{button}</div>
  )
}
