"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceShell } from "@/components/app/workspace-shell";
import { endAnalyticsSession, setAnalyticsUser, startAnalyticsSession } from "@/lib/analytics";
import { getDashboard, getSession, getUsageStatus } from "@/lib/api";
import type { DashboardData, UsageStatus, User } from "@/types";

export default function WorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [session, usageData, dashboardData] = await Promise.all([getSession(), getUsageStatus(), getDashboard()]);
        if (!session.user) {
          router.replace("/signin");
          return;
        }
        setAnalyticsUser(session.user.id);
        startAnalyticsSession(session.user.id);
        setUser(session.user);
        setUsage(usageData);
        setDashboard(dashboardData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to open the workspace.";
        if (message.includes("suspended") || message.includes("terminated")) {
          setAccessError(message);
          return;
        }
        router.replace("/signin");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    return () => {
      endAnalyticsSession("app_unmount");
    };
  }, []);

  if (loading || !user || !usage || !dashboard) {
    if (accessError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="glass-panel max-w-xl rounded-[2rem] px-8 py-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Account Access</p>
            <h1 className="mt-4 text-3xl font-semibold text-ink dark:text-white">Workspace access unavailable</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{accessError}</p>
          </div>
        </main>
      );
    }
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-8 py-6 text-sm font-medium text-slate-600">Loading Veridia...</div>
      </main>
    );
  }

  return <WorkspaceShell user={user} usage={usage} dashboard={dashboard} />;
}
