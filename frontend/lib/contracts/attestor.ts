import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Job, Proof, ProtocolStats, TransactionReceipt } from "./types";
import { CONTRACT_ADDRESS } from "../config";

export type GenLayerClient = ReturnType<typeof createClient>;

/**
 * Typed wrapper around the deployed Attestor contract. Sibling conventions:
 * - Every u256 is coerced to Number / decimal string HERE.
 * - waitAndVerify rejects UNDETERMINED/CANCELED and surfaces UserError.
 * - Reads are defensive (null/[] on failure).
 * - Writes return { receipt, txHash } so toasts can link the explorer.
 * - Writes sign through the wallet: the provider-backed client created by
 *   the wallet context (WalletProvider) is injected here and is the ONLY
 *   client writes go through — no bare client, no window.ethereum fallback.
 *   Reads fall back to a wallet-less RPC client so the app renders before
 *   a wallet is connected.
 */
class Attestor {
  private client: GenLayerClient;          // reads: wallet client when connected, bare RPC otherwise
  private signer: GenLayerClient | null;   // writes: only the provider-backed wallet client
  private address: `0x${string}`;

  constructor(contractAddress: string = CONTRACT_ADDRESS, walletClient?: GenLayerClient | null) {
    this.address = contractAddress as `0x${string}`;
    this.signer = walletClient ?? null;
    this.client = walletClient ?? createClient({ chain: studionet });
  }

  private toObj(raw: any): Record<string, any> {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw.entries());
    if (typeof raw === "object") return raw;
    return {};
  }

  private async waitAndVerify(txHash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = (await this.client.waitForTransactionReceipt({
      hash: txHash as any,
      status: "ACCEPTED" as any,
      retries: 80,
      interval: 5000,
    })) as any;
    const status = String(receipt?.status ?? "").toUpperCase();
    const lr = receipt?.consensus_data?.leader_receipt;
    const r = Array.isArray(lr) ? lr[0] : lr;
    if (status.includes("UNDETERMINED") || status.includes("CANCELED")) {
      throw new Error("Validators could not reach consensus — try again");
    }
    if (r?.execution_result === "ERROR") {
      const stderr: string = r?.genvm_result?.stderr ?? "";
      const userErr = stderr.match(/UserError: (.+)/)?.[1];
      if (userErr) throw new Error(userErr);
      const lines = stderr.trim().split("\n").filter((l) => l.trim() && !l.startsWith("  "));
      const last = lines[lines.length - 1] || "";
      console.error("[Attestor] contract execution error:", stderr);
      throw new Error(last.replace(/^.*?Error: /, "").slice(0, 200) || "Contract execution error");
    }
    return receipt as TransactionReceipt;
  }

  private async safeRead(functionName: string, args: any[] = []): Promise<any> {
    try {
      return await this.client.readContract({ address: this.address, functionName, args });
    } catch (err) {
      console.warn(`[Attestor] safeRead "${functionName}" failed:`, err);
      return null;
    }
  }

  private async write(
    functionName: string,
    args: any[],
    value: bigint = BigInt(0),
  ): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    // Signed writes MUST go through the wallet's provider-backed client —
    // fail loudly rather than fall back to an unsigned bare client.
    if (!this.signer) {
      throw new Error("Connect a wallet to sign this transaction");
    }
    const txHash = await this.signer.writeContract({ address: this.address, functionName, args, value });
    const receipt = await this.waitAndVerify(txHash);
    return { receipt, txHash: String(txHash) };
  }

  private normJob(raw: any): Job {
    const j = this.toObj(raw);
    return {
      ...j,
      job_id:         String(j.job_id ?? ""),
      client:         String(j.client ?? ""),
      worker:         String(j.worker ?? ""),
      bounty_wei:     String(j.bounty_wei ?? "0"),
      attempts:       Number(j.attempts ?? 0),
      max_attempts:   Number(j.max_attempts ?? 0),
      evidence_mode:  (String(j.evidence_mode ?? "HOSTED") as Job["evidence_mode"]),
      target_url:     String(j.target_url ?? ""),
      settled_to:     String(j.settled_to ?? ""),
      created_seq:    Number(j.created_seq ?? 0),
      settled_seq:    Number(j.settled_seq ?? 0),
    } as Job;
  }

  private normProof(raw: any): Proof {
    const p = this.toObj(typeof raw === "string" ? JSON.parse(raw) : raw);
    return {
      attempt:    Number(p.attempt ?? 0),
      submitter:  String(p.submitter ?? ""),
      image_url:  String(p.image_url ?? ""),
      evidence_mode: (String(p.evidence_mode ?? "HOSTED") as Proof["evidence_mode"]),
      bond_wei:   String(p.bond_wei ?? "0"),
      note:       String(p.note ?? ""),
      verdict:    (String(p.verdict ?? "REJECTED") as Proof["verdict"]),
      confidence: Number(p.confidence ?? 0),
      reasoning:  String(p.reasoning ?? ""),
      seq:        Number(p.seq ?? 0),
    };
  }

  // ── reads ──────────────────────────────────────────────────────────────

  async getProtocolStats(): Promise<ProtocolStats | null> {
    const raw = await this.safeRead("get_protocol_stats");
    if (!raw) return null;
    const s = this.toObj(raw);
    return {
      min_bounty_wei:          String(s.min_bounty_wei ?? "0"),
      max_attempts:            Number(s.max_attempts ?? 5),
      min_verified_confidence: Number(s.min_verified_confidence ?? 60),
      total_jobs:              Number(s.total_jobs ?? 0),
      total_bounty_volume_wei: String(s.total_bounty_volume_wei ?? "0"),
      total_paid_wei:          String(s.total_paid_wei ?? "0"),
      total_refunded_wei:      String(s.total_refunded_wei ?? "0"),
      escrowed_wei:            String(s.escrowed_wei ?? "0"),
    };
  }

  async getJob(id: string): Promise<Job | null> {
    const raw = await this.safeRead("get_job", [id]);
    return raw ? this.normJob(raw) : null;
  }

  async getJobs(limit = 50): Promise<Job[]> {
    const raw = await this.safeRead("get_jobs", [limit]);
    return Array.isArray(raw) ? raw.map((j) => this.normJob(j)) : [];
  }

  async getJobsByClient(client: string): Promise<Job[]> {
    const raw = await this.safeRead("get_jobs_by_client", [client]);
    return Array.isArray(raw) ? raw.map((j) => this.normJob(j)) : [];
  }

  async getJobsByWorker(worker: string): Promise<Job[]> {
    const raw = await this.safeRead("get_jobs_by_worker", [worker]);
    return Array.isArray(raw) ? raw.map((j) => this.normJob(j)) : [];
  }

  async getProofs(jobId: string): Promise<Proof[]> {
    const raw = await this.safeRead("get_proofs", [jobId]);
    return Array.isArray(raw) ? raw.map((p) => this.normProof(p)) : [];
  }

  /** The bond (wei) a proof attempt on this job currently requires. */
  async getSubmissionBond(jobId: string): Promise<bigint> {
    const raw = await this.safeRead("get_submission_bond", [jobId]);
    const o = this.toObj(raw);
    return BigInt(String(o.bond_wei ?? "0"));
  }

  // ── writes ─────────────────────────────────────────────────────────────

  async postJob(args: {
    title: string; brief: string; proofCriteria: string;
    workerAddress: string; maxAttempts: number; bountyWei: bigint;
    targetUrl?: string;
  }) {
    return this.write(
      "post_job",
      [args.title, args.brief, args.proofCriteria, args.workerAddress, args.maxAttempts, args.targetUrl ?? ""],
      args.bountyWei,
    );
  }

  /** Payable: bondWei must cover getSubmissionBond's quote. */
  async submitProof(args: { jobId: string; imageUrl: string; note: string; bondWei: bigint }) {
    return this.write("submit_proof", [args.jobId, args.imageUrl, args.note], args.bondWei);
  }

  async cancelJob(jobId: string) {
    return this.write("cancel_job", [jobId]);
  }
}

export default Attestor;
