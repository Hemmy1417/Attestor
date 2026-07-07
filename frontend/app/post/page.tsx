"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { usePostJob } from "@/lib/hooks/useAttestor";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen } from "@/lib/utils";
import { HowTo } from "@/components/HowTo";
import { error as toastError } from "@/lib/toast";

export default function PostJobPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { postJob, isPosting } = usePostJob();

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [criteria, setCriteria] = useState("");
  const [bounty, setBounty] = useState("0.5");
  const [attempts, setAttempts] = useState(3);
  const [openBounty, setOpenBounty] = useState(true);
  const [worker, setWorker] = useState("");

  const submit = () => {
    if (title.trim().length < 4)
      return toastError("Title too short", { description: "At least 4 characters." });
    if (brief.trim().length < 20)
      return toastError("Brief too short", { description: "Describe the work in at least 20 characters." });
    if (criteria.trim().length < 20)
      return toastError("Criteria too short", { description: "State exactly what a photo must show — at least 20 characters." });
    let wei: bigint;
    try { wei = parseGen(bounty || "0"); } catch { return toastError("Invalid bounty"); }
    if (wei < BigInt("100000000000000000"))
      return toastError("Bounty too small", { description: "Minimum bounty is 0.1 GEN." });
    const workerAddr = openBounty ? "" : worker.trim();
    if (!openBounty && !/^0x[0-9a-fA-F]{40}$/.test(workerAddr))
      return toastError("Invalid worker address", { description: "Enter a full 42-character address, or choose Open bounty." });

    postJob(
      {
        title: title.trim(),
        brief: brief.trim(),
        proofCriteria: criteria.trim(),
        workerAddress: workerAddr,
        maxAttempts: attempts,
        bountyWei: wei,
      },
      { onSuccess: () => router.push("/jobs") } as any,
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Lock the bounty, set the criteria</div>
        <h1 className="display text-4xl text-ink">Post a job</h1>
      </div>

      <HowTo
        id="post"
        reference="AT-02"
        title="Writing a job the panel can judge"
        items={[
          { label: "The deposit is the bounty", body: "The GEN you send with this transaction is the escrow — held by the contract until a proof verifies or you cancel." },
          { label: "Criteria must be visible", body: "Write acceptance criteria a photo can prove: what object, what state, what must be in frame. The panel judges the image against exactly these words." },
          { label: "Open or assigned", body: "An open bounty lets any wallet submit — first valid proof wins. Assign a worker to pin the job to one address." },
          { label: "Set the attempt budget", body: "Give the worker room for a bad angle or blurry shot. 1–5 attempts; a rejected proof spends one." },
        ]}
      />

      <div className="card p-7 space-y-5">
        <div>
          <label className="field-label">Job title</label>
          <input className="input" placeholder="Install the wall-mounted panel" value={title}
                 onChange={(e) => setTitle(e.target.value)} disabled={isPosting} />
        </div>

        <div>
          <label className="field-label">Brief — what is the work?</label>
          <textarea className="input" placeholder="Describe the task the worker is being paid to complete."
                    value={brief} onChange={(e) => setBrief(e.target.value)} disabled={isPosting} />
        </div>

        <div>
          <label className="field-label">Acceptance criteria — what must the photo show?</label>
          <textarea className="input"
                    placeholder="e.g. A photo showing the panel mounted flush on the wall with all four corner bolts visible and the cover plate attached."
                    value={criteria} onChange={(e) => setCriteria(e.target.value)} disabled={isPosting} />
          <p className="text-[11px] text-muted mt-1.5">The panel rules the image against these exact words. Be specific and visual.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Bounty (GEN — locked now)</label>
            <input className="input mono" type="number" min="0.1" step="0.1" value={bounty}
                   onChange={(e) => setBounty(e.target.value)} disabled={isPosting} />
          </div>
          <div>
            <label className="field-label">Proof attempts</label>
            <input className="input mono" type="number" min="1" max="5" value={attempts}
                   onChange={(e) => setAttempts(Math.max(1, Math.min(5, Number(e.target.value))))} disabled={isPosting} />
          </div>
        </div>

        <div>
          <label className="field-label">Who can submit proof?</label>
          <div className="flex gap-2">
            <button
              className="btn flex-1"
              style={openBounty
                ? { background: "var(--lime)", color: "#ffffff" }
                : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line-hi)" }}
              onClick={() => setOpenBounty(true)} disabled={isPosting}
            >
              Open bounty
            </button>
            <button
              className="btn flex-1"
              style={!openBounty
                ? { background: "var(--lime)", color: "#ffffff" }
                : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line-hi)" }}
              onClick={() => setOpenBounty(false)} disabled={isPosting}
            >
              Assign a worker
            </button>
          </div>
          {!openBounty && (
            <input className="input mono mt-3" placeholder="0x… worker address" value={worker}
                   onChange={(e) => setWorker(e.target.value)} disabled={isPosting} />
          )}
        </div>

        <button className="btn btn-primary w-full" disabled={!isConnected || isPosting} onClick={submit}>
          {isPosting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Locking the bounty…</>
          ) : (
            <><Lock className="w-4 h-4" /> Lock {bounty || "0"} GEN &amp; post</>
          )}
        </button>
        {!isConnected && <p className="text-xs text-muted text-center mono">Connect a wallet to post a job.</p>}
      </div>
    </div>
  );
}
