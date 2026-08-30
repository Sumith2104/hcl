export interface StudyBuddiesIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Study Buddies icon — two overlapping book shapes suggesting collaboration.
 * Uses `currentColor` so it inherits the parent text color.
 * Works cleanly at 16px through 256px+.
 */
export function StudyBuddiesIcon({
  className,
  size = 24,
}: StudyBuddiesIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Back book — reduced opacity creates depth and shows two distinct items */}
      <rect x="3" y="3.5" width="11" height="14" rx="1.5" opacity="0.3" />
      {/* Front book — solid, overlapping the back */}
      <rect x="10" y="6.5" width="11" height="14" rx="1.5" />
    </svg>
  );
}

export default StudyBuddiesIcon;
