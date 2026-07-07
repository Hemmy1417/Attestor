import type { JobStatus, Verdict } from "@/lib/contracts/types";

export function StatusChip({ status }: { status: JobStatus }) {
  const cls =
    status === "OPEN" ? "chip-open" :
    status === "SETTLED" ? "chip-settled" : "chip-cancelled";
  const label =
    status === "OPEN" ? "Open" :
    status === "SETTLED" ? "Settled" : "Cancelled";
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`chip ${verdict === "VERIFIED" ? "chip-verified" : "chip-rejected"}`}>
      {verdict}
    </span>
  );
}

export function BountyChip({ assigned }: { assigned: boolean }) {
  return assigned
    ? <span className="chip chip-cancelled">Assigned</span>
    : <span className="chip chip-open-bounty">Open bounty</span>;
}
