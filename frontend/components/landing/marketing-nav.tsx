"use client";

import { Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SettingsModal } from "@/components/shared/settings-modal";
import { Button } from "@/components/shared/button";

export function MarketingNav() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const featuresHref = pathname === "/" ? "#features" : "/#features";
  const howItWorksHref = pathname === "/" ? "#how-it-works" : "/#how-it-works";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/65 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white">SS</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-200">Sigma Solve</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Public beta for serious STEM workflows</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 dark:text-slate-300 md:flex">
            <Link href={featuresHref}>Features</Link>
            <Link href={howItWorksHref}>How it works</Link>
            <Link href="/about">About Me</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-brand-100 md:block">
              Public Beta — features currently free
            </div>
            <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-brand-100 hover:text-ink dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:text-white" aria-label="Open settings">
              <Settings2 className="h-4 w-4" />
            </button>
            <Link href="/signin">
              <Button variant="ghost" className="text-slate-600 dark:text-slate-200 dark:hover:text-white">Sign in</Button>
            </Link>
            <Link href="/app">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
