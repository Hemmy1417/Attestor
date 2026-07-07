"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AttestorWordmark } from "./Logo";
import { ConnectButton } from "./ConnectButton";

const links = [
  { href: "/",       label: "Home" },
  { href: "/jobs",   label: "Jobs" },
  { href: "/post",   label: "Post a job" },
  { href: "/work",   label: "My work" },
];

export function Nav() {
  const path = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [path]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = drawerOpen ? "hidden" : previous || "";
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path?.startsWith(href);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: "rgba(255,255,255,0.88)", borderBottom: "1px solid var(--line)" }}
      >
        <nav className="mx-auto max-w-6xl px-5 h-[62px] flex items-center gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
            <AttestorWordmark size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-1 ml-auto">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-semibold px-3.5 py-2 rounded-md transition-colors mono"
                  style={{
                    color: active ? "var(--lime)" : "var(--ink-soft)",
                    background: active ? "var(--lime-soft)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 md:ml-0 ml-auto">
            <ConnectButton />
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-md transition-colors"
              style={{ background: "var(--tray-hi)", border: "1px solid var(--line-hi)", color: "var(--ink)" }}
              aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="md:hidden fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <aside
            className="md:hidden fixed right-3 top-[70px] z-40 w-[74%] max-w-[280px] animate-slide-in card p-2"
          >
            <ul className="flex flex-col">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block px-4 py-3 rounded-md text-sm font-semibold transition-colors mono"
                      style={{
                        color: active ? "var(--lime)" : "var(--ink-soft)",
                        background: active ? "var(--lime-soft)" : "transparent",
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="hairline my-1" />
            <div className="px-4 py-2 text-[10px] text-muted mono">
              Adjudicated on GenLayer · Studionet
            </div>
          </aside>
        </>
      )}
    </>
  );
}
