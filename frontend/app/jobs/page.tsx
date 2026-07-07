"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, ClipboardList } from "lucide-react";
import { useJobs } from "@/lib/hooks/useAttestor";
import { formatGen, shortAddr } from "@/lib/utils";
import { StatusChip, BountyChip } from "@/components/Chips";
import { HowTo } from "@/components/HowTo";
import type { JobStatus } from "@/lib/contracts/types";

const FILTERS: { key: "all" | JobStatus; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "OPEN",      label: "Open" },
  { key: "SETTLED",   label: "Settled" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs(50);
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  const list = (jobs ?? []).filter((j) => filter === "all" || j.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Every job, public</div>
        <h1 className="display text-4xl text-ink">The job board</h1>
      </div>

      <HowTo
        id="jobs"
        reference="AT-01"
        title="Reading the board"
        items={[
          { label: "Open bounty vs assigned", body: "An open bounty accepts proof from any wallet — first valid proof wins. An assigned job pins one worker's address." },
          { label: "Attempts are capped", body: "Each job carries a fixed number of proof attempts. A rejected photo spends one; when they run out the client reclaims the bounty." },
          { label: "The panel has eyes", body: "Proof is a hosted image. The vision panel screenshots it, describes it objectively, and rules against the acceptance criteria." },
          { label: "Payment is atomic", body: "A VERIFIED ruling releases the bounty to the worker on the same transaction — no separate claim, no manual release." },
        ]}
      />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="chip transition-colors"
            style={
              filter === f.key
                ? { background: "var(--lime)", color: "#0a0c0b" }
                : { background: "var(--tray)", color: "var(--muted)", border: "1px solid var(--line-hi)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--lime)" }} />
        </div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-soft">No jobs match this filter.</p>
          <Link href="/post" className="btn btn-primary mt-4 inline-flex">Post the first job</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((j) => (
            <Link key={j.job_id} href={`/jobs/${j.job_id}`} className="card card-hover p-5 block">
              <div className="flex items-center justify-between mb-3">
                <StatusChip status={j.status} />
                <BountyChip assigned={!!j.worker} />
              </div>
              <div className="display text-xl text-ink mb-1">{j.title}</div>
              <p className="text-sm text-muted line-clamp-2 mb-4">{j.brief}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted mono">{j.attempts}/{j.max_attempts} attempts</span>
                <span className="display" style={{ color: "var(--lime)" }}>
                  {formatGen(j.bounty_wei)} GEN
                </span>
              </div>
              <div className="text-[11px] text-muted mt-2 mono">Client {shortAddr(j.client)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
