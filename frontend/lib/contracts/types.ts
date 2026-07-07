// Shapes returned by the Attestor contract, post-normalization: every u256 is
// a decimal string, every count a number — no BigInt past the wrapper.

export type JobStatus = "OPEN" | "SETTLED" | "CANCELLED";
export type Verdict = "VERIFIED" | "REJECTED";

export interface Job {
  job_id: string;
  client: string;
  title: string;
  brief: string;
  proof_criteria: string;
  worker: string;          // "" = open bounty
  bounty_wei: string;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  settled_to: string;
  created_seq: number;
  settled_seq: number;
}

export interface Proof {
  attempt: number;
  submitter: string;
  image_url: string;
  note: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  seq: number;
}

export interface ProtocolStats {
  min_bounty_wei: string;
  max_attempts: number;
  total_jobs: number;
  total_bounty_volume_wei: string;
  total_paid_wei: string;
  total_refunded_wei: string;
}

export type TransactionReceipt = Record<string, any>;
