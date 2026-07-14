"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Attestor from "../contracts/attestor";
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, explorerTxUrl } from "../config";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../toast";
import type { Job, Proof, ProtocolStats } from "../contracts/types";

export function useAttestorContract(): Attestor | null {
  // The wallet context owns the ONE provider-backed client (created with the
  // connected EIP-1193 provider). Injecting it here is what makes writes
  // signed by the user's wallet — the wrapper never builds its own signer.
  const { client } = useWallet();
  return useMemo(() => {
    if (!CONTRACT_CONFIGURED) return null;
    return new Attestor(CONTRACT_ADDRESS, client);
  }, [client]);
}

// ── READ HOOKS ──────────────────────────────────────────────────────────────

// Studionet rate-limits the RPC at 500 requests/hour. Long stale time, no
// focus refetch, single retry — mutations invalidate what matters anyway.
const READ_DEFAULTS = {
  refetchOnWindowFocus: false,
  staleTime: 60_000,
  retry: 1,
} as const;

export function useProtocolStats() {
  const contract = useAttestorContract();
  return useQuery<ProtocolStats | null, Error>({
    queryKey: ["protocolStats"],
    queryFn: () => (contract ? contract.getProtocolStats() : Promise.resolve(null)),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

export function useJobs(limit = 50) {
  const contract = useAttestorContract();
  return useQuery<Job[], Error>({
    queryKey: ["jobs", limit],
    queryFn: () => (contract ? contract.getJobs(limit) : Promise.resolve([])),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

export function useJob(id: string | null) {
  const contract = useAttestorContract();
  return useQuery<Job | null, Error>({
    queryKey: ["job", id],
    queryFn: () => (contract && id ? contract.getJob(id) : Promise.resolve(null)),
    ...READ_DEFAULTS,
    enabled: !!contract && !!id,
  });
}

export function useProofs(jobId: string | null) {
  const contract = useAttestorContract();
  return useQuery<Proof[], Error>({
    queryKey: ["proofs", jobId],
    queryFn: () => (contract && jobId ? contract.getProofs(jobId) : Promise.resolve([])),
    ...READ_DEFAULTS,
    enabled: !!contract && !!jobId,
  });
}

export function useMyClientJobs() {
  const contract = useAttestorContract();
  const { address } = useWallet();
  return useQuery<Job[], Error>({
    queryKey: ["clientJobs", address],
    queryFn: () =>
      contract && address ? contract.getJobsByClient(address) : Promise.resolve([]),
    ...READ_DEFAULTS,
    enabled: !!contract && !!address,
  });
}

// The bond a proof attempt on this job requires (1% of escrow, min 0.01 GEN).
export function useSubmissionBond(jobId: string | null) {
  const contract = useAttestorContract();
  return useQuery<bigint, Error>({
    queryKey: ["submissionBond", jobId],
    queryFn: () => (contract && jobId ? contract.getSubmissionBond(jobId) : Promise.resolve(BigInt(0))),
    ...READ_DEFAULTS,
    enabled: !!contract && !!jobId,
  });
}

export function useMyWorkerJobs() {
  const contract = useAttestorContract();
  const { address } = useWallet();
  return useQuery<Job[], Error>({
    queryKey: ["workerJobs", address],
    queryFn: () =>
      contract && address ? contract.getJobsByWorker(address) : Promise.resolve([]),
    ...READ_DEFAULTS,
    enabled: !!contract && !!address,
  });
}

// ── WRITE HOOKS ─────────────────────────────────────────────────────────────

function useAttestorMutation<TArgs>(opts: {
  run: (contract: Attestor, args: TArgs) => Promise<{ receipt: any; txHash: string }>;
  successTitle: (args: TArgs, data: any) => string;
  successDescription?: (args: TArgs, data: any) => string;
  errorTitle: string;
}) {
  const contract = useAttestorContract();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const mutation = useMutation({
    mutationFn: async (args: TArgs) => {
      if (!contract) throw new Error("Contract not configured");
      setIsPending(true);
      const out = await opts.run(contract, args);
      return { ...out, args };
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries();
      setIsPending(false);
      success(opts.successTitle(data.args, data), {
        description: opts.successDescription?.(data.args, data),
        explorerUrl: explorerTxUrl(data?.txHash),
      });
    },
    onError: (err: any) => {
      setIsPending(false);
      error(opts.errorTitle, { description: err?.message || "Please try again." });
    },
  });

  return { mutate: mutation.mutate, isPending };
}

export function usePostJob() {
  const m = useAttestorMutation<{
    title: string; brief: string; proofCriteria: string;
    workerAddress: string; maxAttempts: number; bountyWei: bigint;
    targetUrl?: string;
  }>({
    run: (c, a) => c.postJob(a),
    successTitle: () => "Job posted",
    successDescription: (a) =>
      a.targetUrl
        ? "The bounty is locked and the target URL is pinned forever."
        : "The bounty is locked and the job is open for proof.",
    errorTitle: "Could not post job",
  });
  return { postJob: m.mutate, isPosting: m.isPending };
}

export function useSubmitProof() {
  const m = useAttestorMutation<{ jobId: string; imageUrl: string; note: string; bondWei: bigint }>({
    run: (c, a) => c.submitProof(a),
    successTitle: (_a, d) => (d?.args ? "Proof adjudicated" : "Proof adjudicated"),
    successDescription: () =>
      "The vision panel has ruled — check the job for the verdict.",
    errorTitle: "Proof submission failed",
  });
  return { submitProof: m.mutate, isSubmitting: m.isPending };
}

export function useCancelJob() {
  const m = useAttestorMutation<{ jobId: string }>({
    run: (c, a) => c.cancelJob(a.jobId),
    successTitle: () => "Cancellation armed",
    successDescription: () =>
      "The cancel is now a public on-chain state. The worker can still submit proof during the window; finalize after it to reclaim the escrow.",
    errorTitle: "Cancel failed",
  });
  return { cancelJob: m.mutate, isCancelling: m.isPending };
}

export function useWithdrawCancel() {
  const m = useAttestorMutation<{ jobId: string }>({
    run: (c, a) => c.withdrawCancel(a.jobId),
    successTitle: () => "Cancellation withdrawn",
    successDescription: () => "The job is open again.",
    errorTitle: "Withdraw failed",
  });
  return { withdrawCancel: m.mutate, isWithdrawing: m.isPending };
}

export function useFinalizeCancel() {
  const m = useAttestorMutation<{ jobId: string }>({
    run: (c, a) => c.finalizeCancel(a.jobId),
    successTitle: () => "Job cancelled",
    successDescription: () =>
      "The escrow (including any forfeited bonds) has been returned to your wallet.",
    errorTitle: "Finalize failed",
  });
  return { finalizeCancel: m.mutate, isFinalizing: m.isPending };
}
