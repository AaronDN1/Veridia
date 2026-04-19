"use client";

import { AlertTriangle, LogOut, Moon, SunMedium, X } from "lucide-react";

import { Button } from "@/components/shared/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/shared/theme-provider";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<void> | void;
};

export function SettingsModal({ open, onClose, onLogout, onDeleteAccount }: Props) {
  const { resolvedTheme, toggleTheme } = useTheme();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Settings</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-white">Workspace preferences</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="premium-card rounded-full p-2 text-slate-500 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-300 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="premium-card mt-6 rounded-[1.5rem] p-4">
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
                resolvedTheme === "dark"
                  ? "border-brand-400/30 bg-brand-500/20"
                  : "border-slate-200 bg-slate-100"
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

        {onLogout || onDeleteAccount ? (
          <div className="mt-6 space-y-3">
            {onLogout ? (
              <Button variant="secondary" className="w-full justify-center gap-2" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            ) : null}
            {onDeleteAccount ? (
              <Button
                variant="ghost"
                className="w-full justify-center gap-2 border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50/85 hover:text-rose-700 dark:border-rose-500/20 dark:text-rose-200 dark:hover:border-rose-400/28 dark:hover:bg-rose-500/10 dark:hover:text-rose-100"
                onClick={onDeleteAccount}
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
