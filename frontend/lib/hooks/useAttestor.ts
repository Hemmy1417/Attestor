"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Attestor from "../contracts/attestor";
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, explorerTxUrl } from "../config";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../toast";
import type { Job, Proof, ProtocolStats } from "../contracts/types";

export function useAttestorContract(): Attestor | null {
  const { address } = useWallet();
  return useMemo(() => {
    if (!CONTRACT_CONFIGURED) return null;
    return new Attestor(CONTRACT_ADDRESS, address || null);
  }, [address]);
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
  }>({
    run: (c, a) => c.postJob(a),
    successTitle: () => "Job posted",
    successDescription: () => "The bounty is locked and the job is open for proof.",
    errorTitle: "Could not post job",
  });
  return { postJob: m.mutate, isPosting: m.isPending };
}

export function useSubmitProof() {
  const m = useAttestorMutation<{ jobId: string; imageUrl: string; note: string }>({
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
    successTitle: () => "Job cancelled",
    successDescription: () => "The bounty has been returned to your wallet.",
    errorTitle: "Cancel failed",
  });
  return { cancelJob: m.mutate, isCancelling: m.isPending };
}
