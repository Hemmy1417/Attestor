"use client";

import Link from "next/link";
import { ScanLine, Lock, Camera, CheckCircle2, ArrowRight, Eye } from "lucide-react";
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

export default function HomePage() {
  const { data: stats } = useProtocolStats();
  const { data: jobs } = useJobs(6);
  const open = (jobs ?? []).filter((j) => j.status === "OPEN");

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl space-y-12">
      {/* Hero */}
      <section className="pt-4 pb-2">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 text-xs font-medium mono"
          style={{ background: "var(--lime-soft)", color: "#b9a3ff", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          <Eye className="w-3.5 h-3.5" />
          VISION-JUDGED · GENLAYER STUDIONET
        </div>
        <h1 className="display text-4xl sm:text-5xl leading-[1.06] text-ink max-w-2xl">
          Proof of completion you can <span style={{ color: "var(--lime)" }}>see</span>
        </h1>
        <p className="text-base text-soft max-w-xl mt-4 leading-relaxed">
          Lock GEN against acceptance criteria. A worker submits a photo as
          proof. A GenLayer vision panel looks at the image, confirms it meets
          the criteria, and releases payment — or spends an attempt.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link href="/jobs" className="btn btn-primary">
            Browse jobs <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/post" className="btn btn-ghost">Post a job</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Jobs posted" value={String(stats?.total_jobs ?? 0)} />
        <Stat label="Escrow locked" value={`${formatGen(stats?.total_bounty_volume_wei ?? "0")} GEN`} />
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
      <section className="grid md:grid-cols-4 gap-4">
        {[
          { icon: Lock, title: "Lock", body: "The client posts acceptance criteria and locks the full bounty in GEN. Nothing is owed until the proof passes." },
          { icon: Camera, title: "Submit", body: "The worker submits a hosted image — a photo or screenshot — as proof the criteria are met." },
          { icon: ScanLine, title: "See", body: "The vision panel screenshots the image, describes it objectively, and rules VERIFIED or REJECTED against the criteria." },
          { icon: CheckCircle2, title: "Release", body: "VERIFIED releases the bounty to the worker on the same transaction. REJECTED costs one capped attempt." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <span
              className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
              style={{ background: "var(--lime-soft)", color: "var(--lime)" }}
            >
              <Icon className="w-5 h-5" />
            </span>
            <div className="display text-lg text-ink mb-2">{title}</div>
            <p className="text-sm text-soft leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Honest boundaries */}
      <section className="card p-7" style={{ borderColor: "var(--line-hi)" }}>
        <div className="eyebrow mb-3">What the panel can — and cannot — confirm</div>
        <div className="grid md:grid-cols-3 gap-5 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          <p>
            <span className="font-bold text-ink">Depiction, not provenance.</span>{" "}
            The panel confirms the image shows what the criteria require. It
            cannot know the photo is recent, unstaged, or your own work.
          </p>
          <p>
            <span className="font-bold text-ink">A hosted URL.</span>{" "}
            Proof is an image link you control; the contract screenshots it.
            A dead link is judged as missing proof.
          </p>
          <p>
            <span className="font-bold text-ink">Final per attempt.</span>{" "}
            Each ruling is inline and final — the capped resubmit budget is
            the only second chance. No appeal.
          </p>
        </div>
      </section>
    </div>
  );
}
