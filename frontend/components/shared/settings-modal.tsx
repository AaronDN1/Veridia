"use client";

import { LogOut, Moon, SunMedium, X } from "lucide-react";

import { Button } from "@/components/shared/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/shared/theme-provider";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => Promise<void> | void;
};

export function SettingsModal({ open, onClose, onLogout }: Props) {
  const { resolvedTheme, toggleTheme } = useTheme();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Settings</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-white">Workspace preferences</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-ink dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/45">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-ink dark:text-white">Theme</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Switch between light and dark mode.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={resolvedTheme === "dark"}
              onClick={toggleTheme}
              className={cn(
                "relative inline-flex h-8 w-16 items-center rounded-full border px-1 transition",
                resolvedTheme === "dark" ? "border-brand-500 bg-ink" : "border-slate-200 bg-slate-100 dark:bg-slate-800"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink shadow transition",
                  resolvedTheme === "dark" ? "translate-x-8" : "translate-x-0"
                )}
              >
                {resolvedTheme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
              </span>
            </button>
          </div>
        </div>

        {onLogout ? (
          <Button variant="secondary" className="mt-6 w-full justify-center gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        ) : null}
      </div>
    </div>
  );
}
