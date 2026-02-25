/**
 * Apothecare Logomark
 *
 * SVG-based logo combining a mortar/pestle bowl silhouette with a leaf motif,
 * representing the intersection of traditional apothecary and modern botanical
 * medicine. The name "Apothecare" derives from the Latin/Greek for storehouse
 * of remedies.
 *
 * Available in three size presets: sm (28px), md (32px), lg (56px).
 * Colors adapt to light/dark mode via CSS custom properties.
 */

interface LogomarkProps {
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Whether to include the text wordmark */
  withText?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const SIZES = {
  xs: 20,
  sm: 28,
  md: 32,
  lg: 56,
  xl: 64,
} as const;

const TEXT_SIZES = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

export function Logomark({ size = "md", withText = false, className = "" }: LogomarkProps) {
  const px = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Apothecare logo"
        className="logo-breathe flex-shrink-0"
      >
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r="32"
          className="fill-[var(--color-brand-600)]"
        />

        {/* Letter "A" */}
        <text
          x="32"
          y="44"
          textAnchor="middle"
          className="fill-white"
          fontSize="36"
          fontWeight="700"
          fontFamily="var(--font-body), system-ui, sans-serif"
        >
          A
        </text>
      </svg>

      {withText && (
        <span
          className={`font-semibold tracking-tight text-[var(--color-text-primary)] ${TEXT_SIZES[size]}`}
        >
          Apothecare
        </span>
      )}
    </span>
  );
}

/**
 * Compact avatar-sized logomark for use in chat message bubbles and
 * small UI contexts. Renders just the icon in a rounded container.
 */
interface LogoAvatarProps {
  /** Pixel size of the avatar circle */
  size?: number;
  className?: string;
}

export function LogoAvatar({ size = 32, className = "" }: LogoAvatarProps) {
  return (
    <div
      className={`rounded-full bg-[var(--color-brand-600)] flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Apothecare"
      >
        {/* Letter "A" */}
        <text
          x="32"
          y="48"
          textAnchor="middle"
          fill="white"
          fontSize="44"
          fontWeight="700"
          fontFamily="var(--font-body), system-ui, sans-serif"
        >
          A
        </text>
      </svg>
    </div>
  );
}
