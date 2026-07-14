"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, PlusSquare, Briefcase, Menu, X } from "lucide-react";
import { AttestorWordmark, AttestorMark } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { useProtocolStats } from "@/lib/hooks/useAttestor";
import { formatGen } from "@/lib/utils";

const links = [
  { href: "/",     label: "Home",       icon: Home },
  { href: "/jobs", label: "Jobs board", icon: ClipboardList },
  { href: "/post", label: "Post a job", icon: PlusSquare },
  { href: "/work", label: "My work",    icon: Briefcase },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path?.startsWith(href));
  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = isActive(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              color: active ? "var(--ink)" : "var(--ink-soft)",
              background: active ? "var(--lime-soft)" : "transparent",
              border: active ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
            }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "var(--lime)" : "var(--muted)" }} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LiveStats() {
  const { data: stats } = useProtocolStats();
  return (
    <div className="rounded-xl p-3.5" style={{ background: "var(--void)", border: "1px solid var(--line)" }}>
      <div className="eyebrow mb-2.5">Protocol</div>
      <div className="space-y-2">
        <Row label="Jobs" value={String(stats?.total_jobs ?? 0)} />
        <Row label="Locked" value={`${formatGen(stats?.escrowed_wei ?? "0")}`} accent />
        <Row label="Paid" value={`${formatGen(stats?.total_paid_wei ?? "0")}`} />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="mono text-xs font-semibold" style={{ color: accent ? "var(--lime)" : "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col p-5 z-30"
        style={{ background: "rgba(13,13,17,0.6)", borderRight: "1px solid var(--line)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity mb-8 inline-block">
          <AttestorWordmark size="sm" />
        </Link>
        <NavList />
        <div className="mt-auto space-y-3">
          <LiveStats />
          <ConnectButton />
          <div className="text-[10px] text-muted mono px-1">GenLayer · Studionet</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-[60px]"
        style={{ background: "rgba(6,6,8,0.85)", borderBottom: "1px solid var(--line)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="shrink-0"><AttestorWordmark size="sm" /></Link>
        <div className="ml-auto flex items-center gap-2">
          <ConnectButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-lg"
            style={{ background: "var(--tray-hi)", border: "1px solid var(--line-hi)", color: "var(--ink)" }}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <aside
            className="md:hidden fixed left-0 top-0 bottom-0 w-[76%] max-w-[300px] z-40 p-5 flex flex-col animate-slide-in"
            style={{ background: "var(--canvas)", borderRight: "1px solid var(--line)" }}
          >
            <div className="flex items-center gap-2 mb-8">
              <AttestorMark size={26} />
              <span className="display text-lg">Attestor</span>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="mt-auto"><LiveStats /></div>
          </aside>
        </>
      )}
    </>
  );
}
