"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Loader2, Camera, Lock, XCircle, CheckCircle2, ScanLine, ExternalLink, Ban,
} from "lucide-react";
import {
  useJob, useProofs, useSubmitProof, useCancelJob, useSubmissionBond,
} from "@/lib/hooks/useAttestor";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen, shortAddr } from "@/lib/utils";
import { StatusChip, BountyChip, VerdictChip } from "@/components/Chips";
import { error as toastError } from "@/lib/toast";
import type { Job, Proof } from "@/lib/contracts/types";

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: job, isLoading } = useJob(id);
  const { data: proofs } = useProofs(id);
  const { address, isConnected } = useWallet();
  const { cancelJob, isCancelling } = useCancelJob();

  if (isLoading) {
    return (
      <div className="px-6 lg:px-10 py-24 max-w-3xl flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--lime)" }} />
      </div>
    );
  }
  if (!job) {
    return (
      <div className="px-6 lg:px-10 py-24 max-w-3xl text-center">
        <p className="text-soft">Job not found.</p>
        <Link href="/jobs" className="btn btn-ghost mt-4 inline-flex">Back to the board</Link>
      </div>
    );
  }

  const me = address?.toLowerCase();
  const isClient = !!me && me === job.client.toLowerCase();
  const isAssignedWorker = !!job.worker && !!me && me === job.worker.toLowerCase();
  const attemptsLeft = job.max_attempts - job.attempts;
  const canSubmit =
    isConnected && job.status === "OPEN" && !isClient && attemptsLeft > 0 &&
    (job.worker ? isAssignedWorker : true);
  const canCancel = isClient && job.status === "OPEN";

  return (
    <div className="px-6 lg:px-10 py-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className={job.status === "SETTLED" ? "card-lit p-7" : "card p-7"}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusChip status={job.status} />
            <BountyChip assigned={!!job.worker} />
          </div>
          <span className="mono text-xs text-muted">Job #{job.job_id}</span>
        </div>
        <h1 className="display text-3xl text-ink mb-2">{job.title}</h1>
        <p className="text-sm text-soft leading-relaxed whitespace-pre-wrap mb-5">{job.brief}</p>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-md p-4" style={{ background: "var(--void)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Bounty</div>
            <div className="display text-xl" style={{ color: "var(--lime)" }}>{formatGen(job.bounty_wei)} GEN</div>
          </div>
          <div className="rounded-md p-4" style={{ background: "var(--void)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Attempts</div>
            <div className="display text-xl text-ink">{job.attempts} / {job.max_attempts}</div>
          </div>
          <div className="rounded-md p-4" style={{ background: "var(--void)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>{job.worker ? "Worker" : "Client"}</div>
            <div className="mono text-sm text-ink pt-1">{shortAddr(job.worker || job.client)}</div>
          </div>
        </div>

        <div className="mt-5 rounded-md p-4" style={{ background: "var(--lime-soft)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="eyebrow mb-1">Acceptance criteria</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
            {job.proof_criteria}
          </p>
        </div>

        {job.evidence_mode === "PINNED" && (
          <div className="mt-3 rounded-md p-4" style={{ background: "var(--void)", border: "1px solid var(--line-hi)" }}>
            <div className="eyebrow mb-1" style={{ color: "var(--lime)" }}>Pinned evidence · frozen at posting</div>
            <a href={job.target_url} target="_blank" rel="noreferrer"
               className="mono text-xs break-all hover:underline" style={{ color: "var(--ink)" }}>
              {job.target_url} <ExternalLink className="w-3 h-3 inline" />
            </a>
            <p className="text-[11px] text-muted mt-1.5">
              At adjudication the contract screenshots this URL itself — the worker cannot alter or
              substitute what the panel sees. The evidence is the live state of this page.
            </p>
          </div>
        )}

        {job.status === "SETTLED" && (
          <div className="flex items-center gap-2 mt-5 text-sm" style={{ color: "var(--lime)" }}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="mono">Bounty released to {shortAddr(job.settled_to)}</span>
          </div>
        )}

        {canCancel && (
          <button
            className="btn btn-danger mt-6"
            disabled={isCancelling}
            onClick={() => cancelJob({ jobId: job.job_id })}
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            Cancel &amp; reclaim {formatGen(job.bounty_wei)} GEN
          </button>
        )}
      </div>

      {/* Proof log */}
      {(proofs ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="display text-xl text-ink">Proof log</h2>
          {(proofs ?? []).slice().reverse().map((p) => (
            <ProofCard key={p.seq} proof={p} />
          ))}
        </section>
      )}

      {/* Submit form */}
      {canSubmit && <ProofForm job={job} attemptsLeft={attemptsLeft} />}
      {isConnected && job.status === "OPEN" && isClient && (
        <p className="text-sm text-muted text-center mono">
          This is your job — you cannot submit proof on it.
        </p>
      )}
      {isConnected && job.status === "OPEN" && attemptsLeft <= 0 && (
        <p className="text-sm text-muted text-center mono">
          No attempts remain — the client can reclaim the bounty.
        </p>
      )}
    </div>
  );
}

function ProofCard({ proof }: { proof: Proof }) {
  return (
    <div className="card p-5" style={proof.verdict === "VERIFIED" ? { borderColor: "var(--lime-deep)" } : undefined}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <VerdictChip verdict={proof.verdict} />
        <span className="chip chip-cancelled">Attempt {proof.attempt}</span>
        <span className="chip chip-cancelled">{proof.evidence_mode === "PINNED" ? "Pinned target" : "Hosted image"}</span>
        <span className="mono text-xs text-muted ml-auto">
          conf {proof.confidence}/100 · {shortAddr(proof.submitter)}
        </span>
      </div>
      <a
        href={proof.image_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline mono mb-2"
        style={{ color: "var(--lime)" }}
      >
        <ExternalLink className="w-3 h-3" /> {proof.evidence_mode === "PINNED" ? "View adjudicated target" : "View submitted image"}
      </a>
      {proof.note && <p className="text-sm text-muted mb-2">“{proof.note}”</p>}
      <div className="rounded-md p-3" style={{ background: "var(--void)" }}>
        <div className="eyebrow mb-1" style={{ color: "var(--muted)" }}>Panel reasoning</div>
        <p className="text-sm text-soft leading-relaxed">{proof.reasoning}</p>
      </div>
    </div>
  );
}

function ProofForm({ job, attemptsLeft }: { job: Job; attemptsLeft: number }) {
  const { submitProof, isSubmitting } = useSubmitProof();
  const { data: bond } = useSubmissionBond(job.job_id);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const pinned = job.evidence_mode === "PINNED";
  const bondWei = bond ?? BigInt(0);

  const submit = () => {
    if (bondWei === BigInt(0))
      return toastError("Bond not loaded yet", { description: "One moment — fetching the attempt bond." });
    const u = url.trim();
    if (!pinned && !/^https?:\/\//i.test(u))
      return toastError("Image URL required", { description: "Paste a public http(s) link to your proof image." });
    submitProof({ jobId: job.job_id, imageUrl: pinned ? "" : u, note: note.trim(), bondWei });
  };

  return (
    <div className="card p-7">
      <h2 className="display text-xl text-ink mb-1">{pinned ? "Request adjudication" : "Submit proof"}</h2>
      <p className="text-sm text-muted mb-5">
        {pinned
          ? "The contract will screenshot the pinned target itself and judge its live state — nothing to upload."
          : "Paste a public link to an image that shows the acceptance criteria are met. The vision panel will screenshot and judge it."}{" "}
        You have{" "}
        <span style={{ color: "var(--lime)" }} className="mono">{attemptsLeft}</span> attempt
        {attemptsLeft === 1 ? "" : "s"} left. Each attempt is bonded at{" "}
        <span style={{ color: "var(--lime)" }} className="mono">{formatGen(bondWei.toString())} GEN</span> —
        returned if the proof verifies, forfeited into the escrow if it is rejected.
      </p>

      <div className="space-y-4">
        {!pinned && (
        <div>
          <label className="field-label">Proof image URL</label>
          <input
            className="input mono"
            placeholder="https://…/proof.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-muted mt-1.5">
            Use an HTML page that displays your image without a login — an image-host page, a Wikimedia
            Commons file page, or your own site. Raw CDN file links (upload.wikimedia.org and similar)
            often block automated fetchers: unreadable evidence is judged as missing proof and burns
            your bond. Test the link in a private browser window first.
          </p>
        </div>
        )}
        <div>
          <label className="field-label">Note (optional)</label>
          <textarea
            className="input"
            placeholder="Anything the panel should know about the image — context only, it cannot override what's visible."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={isSubmitting} onClick={submit}>
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> The panel is looking…</>
          ) : (
            <><Camera className="w-4 h-4" /> {pinned ? "Adjudicate the live target" : "Submit for adjudication"} · bond {formatGen(bondWei.toString())} GEN</>
          )}
        </button>
        {isSubmitting && (
          <p className="text-xs text-muted text-center mono">
            Validators are screenshotting and judging the image — this takes a minute or two. Leave the page open.
          </p>
        )}
      </div>
    </div>
  );
}
