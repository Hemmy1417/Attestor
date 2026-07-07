/**
 * Attestor brand mark — an aperture/checkmark hybrid: a camera iris whose
 * blades resolve into a verifying tick. Lime on the dark tray.
 */
export function AttestorMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="13" stroke="var(--lime)" strokeWidth="2" opacity="0.4" />
      <circle cx="16" cy="16" r="7.5" stroke="var(--lime)" strokeWidth="1.5" opacity="0.55" />
      <path d="M11 16.5l3.2 3.2L21 12.5" stroke="var(--lime)" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AttestorWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 24 : size === "lg" ? 40 : 30;
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
