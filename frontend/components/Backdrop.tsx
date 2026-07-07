"use client";

/**
 * The darkroom backdrop — a faint measurement grid with a slow lime scan
 * line sweeping down, like a scanner passing over the tray. Static under
 * reduced motion.
 */
export function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--void)" }} />

      {/* measurement grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(182,243,106,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(182,243,106,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(1000px 700px at 50% 0%, black, transparent 75%)",
        }}
      />

      {/* scan line */}
      <div
        className="absolute inset-x-0 h-[40vh] motion-reduce:hidden"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(182,243,106,0.06), transparent)",
          animation: "scan 9s linear infinite",
        }}
      />

      {/* top glow */}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{ background: "radial-gradient(600px 200px at 50% 0%, rgba(182,243,106,0.06), transparent)" }}
      />
    </div>
  );
}
