interface LogoProps {
  className?: string
  size?: number
}

export function StudyBuddiesLogo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size * 3.2}
      height={size}
      viewBox="0 0 256 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {/* Left page */}
        <path
          d="M20 16C20 14.8954 20.8954 14 22 14H34C36.2091 14 38 15.7909 38 18V58C38 60.2091 36.2091 62 34 62H22C20.8954 62 20 61.1046 20 60V16Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right page */}
        <path
          d="M30 14C30 12.8954 30.8954 12 32 12H44C46.2091 12 48 13.7909 48 16V60C48 62.2091 46.2091 64 44 64H32C30.8954 64 30 63.1046 30 62V14Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Graduation cap accent */}
        <path
          d="M44 12L48 8L52 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.5"
        />
        <line x1="35" y1="22" x2="45" y2="22" stroke="currentColor" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" />
        <line x1="35" y1="27" x2="43" y2="27" stroke="currentColor" strokeWidth="1.2" opacity="0.15" strokeLinecap="round" />
        <line x1="35" y1="32" x2="45" y2="32" stroke="currentColor" strokeWidth="1.2" opacity="0.15" strokeLinecap="round" />
      </g>
      <text
        x="62"
        y="36"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="26"
        fontWeight="600"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        Study Buddies
      </text>
      <text
        x="62"
        y="54"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="11"
        fontWeight="400"
        fill="currentColor"
        opacity="0.4"
        letterSpacing="2"
      >
        LEARN TOGETHER
      </text>
    </svg>
  )
}

export function StudyBuddiesIcon({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left book page */}
      <path
        d="M12 10C12 9.44772 12.4477 9 13 9H19C20.1046 9 21 9.89543 21 11V37C21 38.1046 20.1046 39 19 39H13C12.4477 39 12 38.5523 12 38V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right book page */}
      <path
        d="M18 9C18 8.44772 18.4477 8 19 8H25C26.1046 8 27 8.89543 27 10V38C27 39.1046 26.1046 40 25 40H19C18.4477 40 18 39.5523 18 39V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Graduation cap accent */}
      <path
        d="M25 8L28 5L31 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.45"
      />
      <circle cx="31" cy="8" r="1" fill="currentColor" opacity="0.35" />
    </svg>
  )
}
