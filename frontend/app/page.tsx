"use client";

import Link from "next/link";
import {
  ScanLine, Lock, Camera, CheckCircle2, ArrowRight, Eye, Hammer, Wrench,
  Palette, LayoutDashboard, PackageCheck, ShieldCheck, Fingerprint, Layers,
  Wallet, XCircle, Zap,
} from "lucide-react";
import { useProtocolStats, useJobs } from "@/lib/hooks/useAttestor";
import { formatGen } from "@/lib/utils";
import { StatusChip, BountyChip } from "@/components/Chips";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-5 py-4">
      <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="display text-2xl text-ink">{value}</div>
    </div>
  );
}

/* A small looping "vision panel" visual for the hero — a lens scanning an
   image and resolving to VERIFIED. Pure CSS/SVG, motion-safe. */
function ProofScope() {
  return (
    <div
      className="card relative overflow-hidden aspect-[4/3] w-full flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, #0e0b1a, #0a0a0f)" }}
    >
      {/* scanning grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* concentric lens */}
      <div
        className="absolute rounded-full motion-reduce:!animate-none"
        style={{ width: 220, height: 220, border: "1px solid rgba(139,92,246,0.25)", animation: "spin-slow 30s linear infinite" }}
      />
      <div
        className="absolute rounded-full motion-reduce:!animate-none"
        style={{ width: 140, height: 140, border: "1px dashed rgba(192,38,211,0.35)", animation: "spin-slow 18s linear infinite reverse" }}
      />
      {/* ping rings */}
      <div className="absolute rounded-full motion-reduce:hidden"
           style={{ width: 90, height: 90, border: "2px solid rgba(139,92,246,0.5)", animation: "ping-ring 3s ease-out infinite" }} />
      {/* core */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)", boxShadow: "0 0 40px -6px rgba(139,92,246,0.8)" }}
        >
          <Eye className="w-8 h-8 text-white" />
        </div>
        <span className="chip chip-verified"><CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED</span>
      </div>
      {/* corner readouts */}
      <div className="absolute top-3 left-4 mono text-[10px]" style={{ color: "var(--muted)" }}>scanning · consensus</div>
      <div className="absolute bottom-3 right-4 mono text-[10px]" style={{ color: "#b9a3ff" }}>conf 96/100</div>
    </div>
  );
}

export default function HomePage() {
  const { data: stats } = useProtocolStats();
  const { data: jobs } = useJobs(6);
  const open = (jobs ?? []).filter((j) => j.status === "OPEN");

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl space-y-16">
      {/* Hero */}
      <section className="grid lg:grid-cols-2 gap-10 items-center pt-2">
        <div className="reveal">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 text-xs font-medium mono"
            style={{ background: "var(--lime-soft)", color: "#b9a3ff", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <Eye className="w-3.5 h-3.5" />
            VISION-JUDGED · GENLAYER STUDIONET
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-[1.06] text-ink">
            Proof of completion you can <span style={{ color: "var(--lime)" }}>see</span>
          </h1>
          <p className="text-base text-soft mt-4 leading-relaxed max-w-lg">
            Escrow that pays on evidence, not trust. Lock GEN against acceptance
            criteria, a worker submits a photo, and a GenLayer vision panel
            <span className="text-ink font-medium"> looks at the image</span> —
            releasing the bounty the moment the proof holds up.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link href="/jobs" className="btn btn-primary">
              Browse jobs <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/post" className="btn btn-ghost">Post a job</Link>
          </div>
          <div className="flex items-center gap-5 mt-6 text-xs text-muted mono">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--lime)" }} /> On-chain escrow</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: "var(--lime)" }} /> Instant release</span>
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" style={{ color: "var(--lime)" }} /> No middleman</span>
          </div>
        </div>
        <div className="reveal" style={{ animationDelay: "0.12s" }}>
          <ProofScope />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Jobs posted" value={String(stats?.total_jobs ?? 0)} />
        <Stat label="Escrow locked" value={`${formatGen(stats?.escrowed_wei ?? "0")} GEN`} />
        <Stat label="Paid to workers" value={`${formatGen(stats?.total_paid_wei ?? "0")} GEN`} />
        <Stat label="Refunded" value={`${formatGen(stats?.total_refunded_wei ?? "0")} GEN`} />
      </section>

      {/* Open jobs */}
      {open.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl text-ink">Open for proof</h2>
            <Link href="/jobs" className="text-sm font-semibold mono" style={{ color: "var(--lime)" }}>
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {open.slice(0, 3).map((j) => (
              <Link key={j.job_id} href={`/jobs/${j.job_id}`} className="card card-hover p-5 block">
                <div className="flex items-center justify-between mb-3">
                  <StatusChip status={j.status} />
                  <BountyChip assigned={!!j.worker} />
                </div>
                <div className="display text-lg text-ink mb-1">{j.title}</div>
                <p className="text-sm text-muted line-clamp-2 mb-4">{j.brief}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted mono">{j.attempts}/{j.max_attempts} attempts used</span>
                  <span className="display text-lg" style={{ color: "var(--lime)" }}>
                    {formatGen(j.bounty_wei)} GEN
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="space-y-5">
        <div>
          <div className="eyebrow mb-1.5">The pipeline</div>
          <h2 className="display text-2xl text-ink">Four steps, one transaction</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Lock, n: "01", title: "Lock", body: "The client posts acceptance criteria and locks the full bounty in GEN. Nothing is owed until the proof passes." },
            { icon: Camera, n: "02", title: "Submit", body: "The worker submits a hosted image — a photo or screenshot — as proof the criteria are met." },
            { icon: ScanLine, n: "03", title: "See", body: "The panel screenshots the image, describes it objectively, and rules VERIFIED or REJECTED against the criteria." },
            { icon: CheckCircle2, n: "04", title: "Release", body: "VERIFIED releases the bounty to the worker on the same transaction. REJECTED costs one capped attempt." },
          ].map(({ icon: Icon, n, title, body }) => (
            <div key={title} className="card p-5 relative overflow-hidden">
              <span className="absolute top-3 right-4 mono text-xs" style={{ color: "var(--line-hi)" }}>{n}</span>
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--lime-soft)", color: "var(--lime)" }}
              >
                <Icon className="w-5 h-5" />
              </span>
              <div className="display text-lg text-ink mb-2">{title}</div>
              <p className="text-sm text-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you can prove */}
      <section className="space-y-5">
        <div>
          <div className="eyebrow mb-1.5">Use it for</div>
          <h2 className="display text-2xl text-ink">Anything a photo can prove</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Wrench, title: "Physical work", body: "Installations, repairs, deliveries, cleanups — pay when a photo shows the job done to spec." },
            { icon: Palette, title: "Creative deliverables", body: "Logos, mockups, artwork. Escrow a design brief and release when the rendered result matches." },
            { icon: LayoutDashboard, title: "Screenshot milestones", body: "A shipped feature, a passing dashboard, a metric hit — prove it with a screenshot of the real thing." },
            { icon: PackageCheck, title: "Bounties & tasks", body: "Open a bounty; the first worker whose photo satisfies the criteria wins the pot automatically." },
            { icon: Hammer, title: "Field verification", body: "Confirm on-site conditions — signage up, equipment placed, a space set — without a trusted inspector." },
            { icon: Fingerprint, title: "Condition grading", body: "Grade the state of an item from a photo: intact, damaged, complete, or missing elements." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card card-hover p-5">
              <Icon className="w-5 h-5 mb-3" style={{ color: "var(--lime)" }} />
              <div className="display text-base text-ink mb-1.5">{title}</div>
              <p className="text-sm text-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision explainer — the two-stage panel */}
      <section className="card p-8 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none motion-reduce:!animate-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 68%)", filter: "blur(30px)", animation: "glow-pulse 7s ease-in-out infinite" }}
        />
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
          <div>
            <div className="eyebrow mb-2">Under the hood</div>
            <h2 className="display text-2xl text-ink mb-3">How the panel actually looks</h2>
            <p className="text-sm text-soft leading-relaxed mb-4">
              GenLayer runs a multimodal model under optimistic consensus.
              Validators independently screenshot your image, and the ruling is
              only canonical once they agree — so no single server decides where
              the money goes.
            </p>
            <ol className="space-y-3">
              {[
                { t: "Objective analyst", d: "First pass describes exactly what is visible — subjects, condition, defects — with no judgement." },
                { t: "Notary judge", d: "Second pass rules the description against your acceptance criteria: VERIFIED or REJECTED, with reasoning." },
                { t: "Guarded", d: "The image and any note are treated as material under review — never as instructions that could steer the ruling." },
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mono text-xs shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "var(--lime-soft)", color: "var(--lime)" }}>{i + 1}</span>
                  <p className="text-sm text-soft leading-relaxed">
                    <span className="text-ink font-semibold">{s.t}.</span> {s.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl p-5 font-mono text-xs leading-relaxed"
               style={{ background: "var(--void)", border: "1px solid var(--line)" }}>
            <div style={{ color: "var(--muted)" }}># submit_proof → consensus</div>
            <div className="mt-2" style={{ color: "var(--ink-soft)" }}>criteria: <span style={{ color: "var(--ink)" }}>"panel mounted, 4 bolts visible"</span></div>
            <div style={{ color: "var(--ink-soft)" }}>image: <span style={{ color: "#b9a3ff" }}>proof.jpg</span> → screenshot</div>
            <div className="mt-2" style={{ color: "var(--muted)" }}>analyst: "wall panel, four bolts,</div>
            <div style={{ color: "var(--muted)" }}>&nbsp;&nbsp;cover plate attached, flush"</div>
            <div className="mt-2 flex items-center gap-2">
              <span style={{ color: "var(--ink-soft)" }}>verdict:</span>
              <span className="chip chip-verified">VERIFIED</span>
            </div>
            <div className="mt-2" style={{ color: "var(--lime)" }}>→ 0.5 GEN released to worker ✓</div>
          </div>
        </div>
      </section>

      {/* Verifiability strip */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Wallet, title: "Escrow you can audit", body: "Every bounty is real GEN held by the contract — check the balance yourself on the explorer." },
          { icon: ShieldCheck, title: "Rulings are public", body: "Each verdict and its reasoning is an on-chain record anyone can read and replay." },
          { icon: XCircle, title: "No lock-in", body: "No proof verifies and attempts run out? The client reclaims the full bounty. Nothing is stranded." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon className="w-5 h-5 mb-3" style={{ color: "var(--lime)" }} />
            <div className="display text-base text-ink mb-1.5">{title}</div>
            <p className="text-sm text-soft leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="space-y-5">
        <div>
          <div className="eyebrow mb-1.5">Good to know</div>
          <h2 className="display text-2xl text-ink">Questions worth asking</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { q: "What stops a fake photo?", a: "The panel verifies depiction, not provenance — it confirms the image shows what the criteria describe. Write criteria specific enough that only genuine completion satisfies them, and keep bounties proportionate to that risk." },
            { q: "What if my photo is blurry or wrong?", a: "A rejected proof only spends one of the capped attempts (1–5, set by the client). You can fix the shot and resubmit until you pass or the budget runs out." },
            { q: "Where do I host the image?", a: "Anywhere public that loads without a login — a direct image link, a public Gist, or an IPFS gateway. The contract screenshots the URL, so JS-heavy or gated pages won't work." },
            { q: "When does the worker get paid?", a: "On the same transaction as the VERIFIED ruling. The bounty releases from escrow to the worker's wallet automatically — no separate claim, no manual sign-off." },
            { q: "Can anyone submit, or just one worker?", a: "Your choice. An open bounty accepts proof from any wallet (first valid proof wins); an assigned job pins the work to a single address." },
            { q: "What if nobody completes it?", a: "When attempts are exhausted, or any time before a proof verifies, the client cancels and reclaims the full escrow. The contract never keeps the funds." },
          ].map(({ q, a }) => (
            <div key={q} className="card p-5">
              <div className="display text-base text-ink mb-1.5">{q}</div>
              <p className="text-sm text-soft leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card-lit p-8 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: "radial-gradient(600px 200px at 50% 0%, rgba(139,92,246,0.18), transparent 70%)" }}
        />
        <div className="relative">
          <h2 className="display text-3xl text-ink mb-2">Escrow that sees the work</h2>
          <p className="text-sm text-soft max-w-md mx-auto mb-6">
            Post a job in a minute, or find an open bounty and get paid the moment your proof holds up.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/post" className="btn btn-primary">Post a job <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/jobs" className="btn btn-ghost">Find work</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
