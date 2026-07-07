"use client";

/**
 * The "qintara" live backdrop — pure black with violet→magenta glows, a
 * halftone dot matrix, rotating verification rings, and floating voxel
 * motes. Kept GPU-cheap: the large colour glows are STATIC (moving blur is
 * expensive); only lightweight transforms and opacity animate. Motion-safe.
 */
export function Backdrop() {
  const motes = [
    { l: "12%", t: "22%", d: "0s",   s: 5 },
    { l: "22%", t: "68%", d: "1.2s", s: 4 },
    { l: "80%", t: "26%", d: "0.6s", s: 6 },
    { l: "88%", t: "62%", d: "2.1s", s: 4 },
    { l: "48%", t: "13%", d: "1.6s", s: 5 },
    { l: "62%", t: "80%", d: "0.9s", s: 4 },
    { l: "34%", t: "42%", d: "2.6s", s: 3 },
    { l: "72%", t: "50%", d: "1.9s", s: 3 },
  ];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--canvas)" }} />

      {/* static colour glows (no moving blur → cheap) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 520, height: 520, top: "-12%", left: "4%",
          background: "radial-gradient(circle, rgba(139,92,246,0.20), transparent 66%)",
          filter: "blur(46px)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 480, height: 480, bottom: "-14%", right: "2%",
          background: "radial-gradient(circle, rgba(192,38,211,0.16), transparent 66%)",
          filter: "blur(50px)",
        }}
      />

      {/* halftone dot matrix, faded to the middle */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1.4px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(1000px 600px at 50% 40%, black, transparent 74%)",
          WebkitMaskImage: "radial-gradient(1000px 600px at 50% 40%, black, transparent 74%)",
          opacity: 0.45,
        }}
      />

      {/* central core glow — opacity-only pulse (no scale/repaint of blur) */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 motion-reduce:!animate-none"
        style={{
          width: 620, height: 620,
          background: "radial-gradient(circle, rgba(139,92,246,0.22), rgba(192,38,211,0.07) 46%, transparent 68%)",
          filter: "blur(24px)",
          animation: "glow-fade 6s ease-in-out infinite",
        }}
      />

      {/* rotating rings — pure transforms, GPU-cheap */}
      <div
        className="absolute left-1/2 top-[38%] rounded-full motion-reduce:!animate-none"
        style={{
          width: 300, height: 300, marginLeft: -150, marginTop: -150,
          border: "1px solid rgba(139,92,246,0.16)", willChange: "transform",
          animation: "spin-slow 44s linear infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-[38%] rounded-full motion-reduce:!animate-none"
        style={{
          width: 180, height: 180, marginLeft: -90, marginTop: -90,
          border: "1px solid rgba(192,38,211,0.18)", willChange: "transform",
          animation: "spin-slow 28s linear infinite reverse",
        }}
      />

      {/* floating voxel motes — tiny, cheap */}
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-[3px] motion-reduce:!animate-none"
          style={{
            left: m.l, top: m.t, width: m.s, height: m.s,
            background: i % 2 ? "rgba(192,38,211,0.7)" : "rgba(139,92,246,0.75)",
            boxShadow: i % 2 ? "0 0 8px rgba(192,38,211,0.6)" : "0 0 8px rgba(139,92,246,0.6)",
            willChange: "transform",
            animation: `float-y ${5 + (i % 4)}s ease-in-out ${m.d} infinite`,
          }}
        />
      ))}

      {/* top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(180deg, rgba(6,6,8,0.9), transparent)" }}
      />
    </div>
  );
}
