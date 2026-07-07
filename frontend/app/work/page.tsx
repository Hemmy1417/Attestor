"use client";

import Link from "next/link";
import { Loader2, Briefcase, Camera } from "lucide-react";
import { useMyClientJobs, useMyWorkerJobs } from "@/lib/hooks/useAttestor";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen } from "@/lib/utils";
import { StatusChip, BountyChip } from "@/components/Chips";

export default function WorkPage() {
  const { isConnected } = useWallet();
  const { data: clientJobs, isLoading: loadingClient } = useMyClientJobs();
  const { data: workerJobs, isLoading: loadingWorker } = useMyWorkerJobs();

  if (!isConnected) {
    return (
      <div className="px-6 lg:px-10 py-24 max-w-4xl text-center">
        <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
        <p className="text-soft">Connect a wallet to see your work.</p>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl space-y-10">
      <div>
        <div className="eyebrow mb-1">Jobs you posted and worked</div>
        <h1 className="display text-4xl text-ink">My work</h1>
      </div>

      <Section
        title="Jobs you posted"
        icon={Briefcase}
        loading={loadingClient}
        jobs={clientJobs ?? []}
        empty="You haven't posted a job."
        emptyCta={{ href: "/post", label: "Post one" }}
      />

      <Section
        title="Jobs you worked"
        icon={Camera}
        loading={loadingWorker}
        jobs={workerJobs ?? []}
        empty="No jobs you've submitted proof on yet."
        emptyCta={{ href: "/jobs", label: "Find work" }}
      />
    </div>
  );
}

function Section({
  title, icon: Icon, loading, jobs, empty, emptyCta,
}: {
  title: string; icon: any; loading: boolean; jobs: any[];
  empty: string; emptyCta: { href: string; label: string };
}) {
  return (
    <section className="space-y-4">
      <h2 className="display text-xl text-ink">{title}</h2>
      {loading ? (
        <div className="card p-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--lime)" }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon className="w-9 h-9 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-soft">{empty}</p>
          <Link href={emptyCta.href} className="btn btn-ghost mt-4 inline-flex">{emptyCta.label}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link key={j.job_id} href={`/jobs/${j.job_id}`} className="card card-hover p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="display text-base text-ink truncate">{j.title}</div>
                <div className="text-xs text-muted mt-0.5 mono">
                  {formatGen(j.bounty_wei)} GEN · {j.attempts}/{j.max_attempts} attempts
                  {j.status === "SETTLED" && j.settled_to && " · paid"}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BountyChip assigned={!!j.worker} />
                <StatusChip status={j.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
