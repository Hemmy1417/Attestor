"use client";

import { useState } from "react";
import { ChevronDown, ScanLine } from "lucide-react";

/**
 * Collapsible procedure card — a lab "operating note" (AT-xx). Collapsed by
 * default so the page leads with live content.
 */
export function HowTo({
  id,
  reference,
  title,
  clauseLabel = "Step",
  items,
}: {
  id: string;
  reference: string;
  title: string;
  clauseLabel?: string;
  items: { label: string; body: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card overflow-hidden" aria-labelledby={`howto-${id}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "var(--lime-soft)", color: "var(--lime)" }}
        >
          <ScanLine className="w-4 h-4" />
        </span>
        <span className="flex-1">
          <span className="eyebrow block">{reference} · Operating note</span>
          <span id={`howto-${id}`} className="display text-base text-ink">{title}</span>
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform text-muted"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="hairline mb-4" />
          <ol className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="mono text-[10px] font-bold shrink-0 mt-0.5 px-2 py-0.5 rounded"
                  style={{ background: "var(--tray-hi)", color: "var(--muted)" }}
                >
                  {clauseLabel} {i + 1}
                </span>
                <p className="text-sm text-soft leading-relaxed">
                  <span className="font-semibold text-ink">{it.label}.</span>{" "}
                  {it.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
