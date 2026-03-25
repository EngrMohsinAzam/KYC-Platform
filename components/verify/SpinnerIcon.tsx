interface SpinnerIconProps {
  size?: number;
  color?: string;
}

export function SpinnerIcon({ size = 25, color = "currentColor" }: SpinnerIconProps) {
  const segments = 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin"
      style={{ animationDuration: "0.8s", display: "block", margin: "0 auto" }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <rect
          key={i}
          x="11"
          y="2.5"
          width="2"
          height="5.5"
          rx="1"
          fill={color}
          opacity={(i + 1) / segments}
          transform={`rotate(${(i / segments) * 360} 12 12)`}
        />
      ))}
    </svg>
  );
}
