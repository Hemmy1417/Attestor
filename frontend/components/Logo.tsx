/**
 * Attestor logo mark — a violet→magenta rounded tile holding a white lens
 * ring with a verifying checkmark: vision (the lens) + proof (the check).
 * Reads cleanly from favicon size up to the full wordmark.
 */
export function AttestorMark({ size = 28 }: { size?: number }) {
  const gid = `atg-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gid})`} />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.9" />
      <path d="M11.5 16.3l3.1 3.1 6-6.4" fill="none" stroke="#fff" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AttestorWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 26 : size === "lg" ? 40 : 30;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <AttestorMark size={px} />
      <span className={`display ${text} tracking-tight`} style={{ color: "var(--ink)" }}>
        Attestor
      </span>
    </span>
  );
}
