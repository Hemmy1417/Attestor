"use client";

/**
 * The "qintara" backdrop — pure black with a central violet→magenta core
 * glow and a halftone dot-matrix texture masked toward the middle, echoing
 * the reference's pixelated reaching hands. Glow softly pulses; static
 * under reduced motion.
 */
export function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--canvas)" }} />

      {/* halftone dot matrix, faded to the sides */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1.4px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(900px 520px at 50% 42%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(900px 520px at 50% 42%, black, transparent 72%)",
          opacity: 0.5,
        }}
      />

      {/* violet core glow */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 motion-reduce:!opacity-70"
        style={{
          width: 620, height: 620,
          background: "radial-gradient(circle, rgba(139,92,246,0.28), rgba(192,38,211,0.10) 45%, transparent 68%)",
          filter: "blur(20px)",
          animation: "glow-pulse 6s ease-in-out infinite",
        }}
      />

      {/* top vignette so the nav sits clean */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(180deg, rgba(6,6,8,0.9), transparent)" }}
      />
    </div>
  );
}
