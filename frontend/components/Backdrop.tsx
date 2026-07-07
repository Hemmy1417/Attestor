"use client";

/**
 * Upwork-style backdrop — clean white with one soft green wash at the top,
 * no grid, no motion. Lets the content and the green CTAs carry the page.
 */
export function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--canvas)" }} />
      <div
        className="absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(900px 380px at 50% -12%, rgba(20,168,0,0.07), transparent 70%)" }}
      />
    </div>
  );
}
