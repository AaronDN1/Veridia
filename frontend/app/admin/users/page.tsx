"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/shared/button";
import { getAdminUsers, getSession, updateAdminUserOverride } from "@/lib/api";
import type { AdminUserSummary } from "@/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAccessStatus(user: AdminUserSummary) {
  if (user.effective_access_status === "unlimited") {
    return user.effective_access_source === "manual_override" ? "Unlimited (manual)" : "Unlimited (paid)";
  }
  return "Public Beta - 20 prompts/day";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const session = await getSession();
        if (!session.user) {
          router.replace("/signin");
          return;
        }
        const adminUsers = await getAdminUsers();
        setUsers(adminUsers);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load admin users.";
        if (message === "Admin access required.") {
          setAccessDenied(true);
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleToggle(user: AdminUserSummary) {
    setSavingUserId(user.id);
    setError("");
    try {
      const updatedUser = await updateAdminUserOverride(user.id, !user.manual_unlimited_override);
      setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user access.");
    } finally {
      setSavingUserId(null);
    }
  }

  const stats = useMemo(() => {
    const manualCount = users.filter((user) => user.manual_unlimited_override).length;
    const unlimitedCount = users.filter((user) => user.effective_access_status === "unlimited").length;
    return { manualCount, unlimitedCount };
  }, [users]);

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">
          Loading admin users...
        </div>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Private Admin Page</p>
          <h1 className="mt-4 text-3xl font-semibold text-ink dark:text-white">Admin access required</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            This page is restricted to the configured admin account.
          </p>
          <div className="mt-6">
            <Link
              href="/app"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200"
            >
              Return to workspace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Private Admin Page</p>
            <h1 className="mt-4 text-3xl font-semibold text-ink dark:text-white">User access overrides</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Toggle manual unlimited access without changing database rows by hand. Paid unlimited access is still honored separately.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200"
          >
            Back to workspace
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Users</p>
            <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{users.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Effective Unlimited</p>
            <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{stats.unlimitedCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Manual Overrides</p>
            <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{stats.manualCount}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-slate-950/70">
                <tr className="text-left text-xs uppercase tracking-[0.25em] text-slate-400">
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Access</th>
                  <th className="px-5 py-4 font-semibold">Manual Override</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {users.map((user) => {
                  const isSaving = savingUserId === user.id;
                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink dark:text-white">{user.full_name || "No name provided"}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink dark:text-white">{formatAccessStatus(user)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          Source: {user.effective_access_source.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            user.manual_unlimited_override
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {user.manual_unlimited_override ? "Enabled" : "Disabled"}
                        </span>
                        {user.paid_unlimited_access && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Paid unlimited is also active.</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant={user.manual_unlimited_override ? "secondary" : "primary"}
                          disabled={isSaving}
                          onClick={() => void handleToggle(user)}
                        >
                          {isSaving
                            ? "Saving..."
                            : user.manual_unlimited_override
                              ? "Revoke unlimited"
                              : "Grant unlimited"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
