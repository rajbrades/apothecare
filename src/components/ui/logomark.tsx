/**
 * Apotheca Logomark
 *
 * SVG-based logo combining a mortar/pestle bowl silhouette with a leaf motif,
 * representing the intersection of traditional apothecary and modern botanical
 * medicine. The name "Apotheca" derives from the Latin/Greek for storehouse
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
        aria-label="Apotheca logo"
        className="logo-breathe flex-shrink-0"
      >
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r="32"
          className="fill-[var(--color-brand-600)]"
        />

        {/* Mortar bowl silhouette — a wide curved vessel */}
        <path
          d="M18 34 C18 34, 19 44, 32 44 C45 44, 46 34, 46 34 L46 36 C46 36, 45 47, 32 47 C19 47, 18 36, 18 36 Z"
          className="fill-white"
          opacity="0.95"
        />

        {/* Bowl rim — thin line across the top */}
        <rect
          x="16"
          y="33"
          width="32"
          height="2.5"
          rx="1.25"
          className="fill-white"
          opacity="0.95"
        />

        {/* Leaf — growing from the mortar, the core botanical symbol */}
        <path
          d="M32 32 C32 22, 40 18, 44 17 C43 21, 40 27, 32 32 Z"
          className="fill-[var(--color-brand-200)]"
          opacity="0.9"
        />

        {/* Leaf vein / midrib */}
        <path
          d="M32 32 C35 26, 39 21, 43 18"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />

        {/* Second smaller leaf for balance */}
        <path
          d="M30 31 C27 23, 22 20, 19 19.5 C21 22.5, 24 27, 30 31 Z"
          className="fill-[var(--color-brand-300)]"
          opacity="0.7"
        />

        {/* Pestle — angled across the bowl */}
        <rect
          x="35"
          y="20"
          width="3"
          height="18"
          rx="1.5"
          className="fill-white"
          opacity="0.9"
          transform="rotate(25 36.5 29)"
        />

        {/* Pestle knob */}
        <circle
          cx="41"
          cy="19.5"
          r="2.5"
          className="fill-white"
          opacity="0.9"
        />
      </svg>

      {withText && (
        <span
          className={`font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] ${TEXT_SIZES[size]}`}
        >
          Apotheca
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
        aria-label="Apotheca"
      >
        {/* Simplified icon for small sizes — leaf + bowl */}
        {/* Bowl */}
        <path
          d="M10 36 C10 36, 12 52, 32 52 C52 52, 54 36, 54 36 L54 38 C54 38, 52 55, 32 55 C12 55, 10 38, 10 38 Z"
          fill="white"
          opacity="0.95"
        />
        <rect
          x="8"
          y="34"
          width="48"
          height="3.5"
          rx="1.75"
          fill="white"
          opacity="0.95"
        />

        {/* Central leaf */}
        <path
          d="M32 33 C32 18, 44 12, 50 10 C48 16, 42 26, 32 33 Z"
          fill="white"
          opacity="0.7"
        />

        {/* Small leaf */}
        <path
          d="M29 32 C25 20, 17 14, 13 13 C16 18, 21 26, 29 32 Z"
          fill="white"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
