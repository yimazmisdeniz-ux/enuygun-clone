// Inline SVG icons. Flag emojis (🇹🇷, 🇬🇧) render as plain letters ("TR",
// "GB") on Windows, so flags must be real SVGs.

export function FlagTR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#e30a17" />
      <circle cx="11" cy="10" r="5" fill="#ffffff" />
      <circle cx="12.25" cy="10" r="4" fill="#e30a17" />
      <path
        fill="#ffffff"
        d="M17.6 7.6l0.539 1.658h1.743l-1.41 1.025 0.539 1.659-1.411-1.025-1.411 1.025 0.54-1.659-1.411-1.025h1.743z"
      />
    </svg>
  );
}

export function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="2" />
      <path d="M15 0v20M0 10h30" stroke="#ffffff" strokeWidth="6.5" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="4" />
    </svg>
  );
}

export function FlagUS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#ffffff" />
      <g fill="#b22234">
        <rect y="0" width="30" height="1.538" />
        <rect y="3.077" width="30" height="1.539" />
        <rect y="6.154" width="30" height="1.538" />
        <rect y="9.231" width="30" height="1.539" />
        <rect y="12.308" width="30" height="1.538" />
        <rect y="15.385" width="30" height="1.538" />
        <rect y="18.462" width="30" height="1.538" />
      </g>
      <rect width="12" height="10.769" fill="#3c3b6e" />
      <g fill="#ffffff">
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 11 }, (_, c) => {
            const cx = 0.545 + c * 1.091;
            const cy = 0.545 + r * 1.212;
            if ((r + c) % 2 === 0) return null;
            return (
              <circle key={`${r}-${c}`} cx={cx} cy={cy} r="0.3" />
            );
          })
        )}
      </g>
    </svg>
  );
}

export function FlagDE({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="6.667" fill="#000000" />
      <rect y="6.667" width="30" height="6.666" fill="#dd0000" />
      <rect y="13.333" width="30" height="6.667" fill="#ffce00" />
    </svg>
  );
}

export function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
      <rect x="20" width="10" height="20" fill="#ed2939" />
    </svg>
  );
}
