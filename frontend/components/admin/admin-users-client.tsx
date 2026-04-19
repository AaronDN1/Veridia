"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/shared/button";
import { updateAdminUser } from "@/lib/api";
import type { AdminUserSummary, FeedbackSubmission } from "@/types";

type AdminTab = "users" | "feedback";

type Props = {
  initialUsers: AdminUserSummary[];
  initialFeedbackItems: FeedbackSubmission[];
};

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

function formatAccountStatus(status: AdminUserSummary["account_status"]) {
  if (status === "suspended") return "Suspended";
  if (status === "terminated") return "Terminated";
  return "Active";
}

function previewFeedbackBody(body: string) {
  return body.length > 110 ? `${body.slice(0, 110)}...` : body;
}

function isUnauthorizedError(message: string) {
  return message === "Admin access required." || message === "Authentication required." || message === "Invalid session.";
}

export function AdminUsersClient({ initialUsers, initialFeedbackItems }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUserSummary[]>(initialUsers);
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(initialFeedbackItems[0]?.id ?? null);
  const feedbackItems = initialFeedbackItems;

  function handleUnauthorized(err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized access.";
    if (isUnauthorizedError(message)) {
      router.replace("/");
      router.refresh();
      return true;
    }
    return false;
  }

  async function handleToggle(user: AdminUserSummary) {
    setSavingUserId(user.id);
    setError("");
    try {
      const updatedUser = await updateAdminUser(user.id, {
        manual_unlimited_override: !user.manual_unlimited_override,
      });
      setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : "Unable to update user access.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleAccountStatusUpdate(user: AdminUserSummary, accountStatus: AdminUserSummary["account_status"]) {
    if (accountStatus === "terminated") {
      const confirmed = window.confirm(
        `Terminate ${user.email}? This will block access immediately until an admin restores the account.`,
      );
      if (!confirmed) return;
    }

    setSavingUserId(user.id);
    setError("");
    try {
      const updatedUser = await updateAdminUser(user.id, { account_status: accountStatus });
      setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : "Unable to update account status.");
    } finally {
      setSavingUserId(null);
    }
  }

  const userStats = useMemo(() => {
    const manualCount = users.filter((user) => user.manual_unlimited_override).length;
    const unlimitedCount = users.filter((user) => user.effective_access_status === "unlimited").length;
    const blockedCount = users.filter((user) => user.account_status !== "active").length;
    return { manualCount, unlimitedCount, blockedCount };
  }, [users]);

  const feedbackStats = useMemo(() => {
    const linkedCount = feedbackItems.filter((item) => item.submitter_email).length;
    const latestCreatedAt = feedbackItems[0]?.created_at ?? null;
    return { linkedCount, latestCreatedAt };
  }, [feedbackItems]);

  const selectedFeedback =
    feedbackItems.find((item) => item.id === selectedFeedbackId) ?? feedbackItems[0] ?? null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Private Admin Page</p>
            <h1 className="mt-4 text-3xl font-semibold text-ink dark:text-white">Admin tools</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Manage user access overrides and review product feedback in one place.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/70">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  activeTab === "users"
                    ? "bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white"
                    : "text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white",
                ].join(" ")}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("feedback")}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  activeTab === "feedback"
                    ? "bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white"
                    : "text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white",
                ].join(" ")}
              >
                Feedback
              </button>
            </div>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200"
          >
            Back to workspace
          </Link>
        </div>

        {activeTab === "users" ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Users</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{users.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Effective Unlimited</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{userStats.unlimitedCount}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Manual Overrides</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{userStats.manualCount}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Blocked Accounts</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{userStats.blockedCount}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                  <thead className="bg-slate-50 dark:bg-slate-950/70">
                    <tr className="text-left text-xs uppercase tracking-[0.25em] text-slate-400">
                      <th className="px-5 py-4 font-semibold">User</th>
                      <th className="px-5 py-4 font-semibold">Access</th>
                      <th className="px-5 py-4 font-semibold">Account Status</th>
                      <th className="px-5 py-4 font-semibold">Manual Override</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 font-semibold text-right">Actions</th>
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
                                user.account_status === "active"
                                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                                  : user.account_status === "suspended"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
                              ].join(" ")}
                            >
                              {formatAccountStatus(user.account_status)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                user.manual_unlimited_override
                                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                              ].join(" ")}
                            >
                              {user.manual_unlimited_override ? "Enabled" : "Disabled"}
                            </span>
                            {user.paid_unlimited_access ? (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Paid unlimited is also active.</p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(user.created_at)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant={user.manual_unlimited_override ? "secondary" : "primary"}
                                className="px-4 py-2 text-xs"
                                disabled={isSaving}
                                onClick={() => void handleToggle(user)}
                              >
                                {isSaving
                                  ? "Saving..."
                                  : user.manual_unlimited_override
                                    ? "Revoke unlimited"
                                    : "Grant unlimited"}
                              </Button>
                              {user.account_status === "active" ? (
                                <Button
                                  variant="secondary"
                                  className="px-4 py-2 text-xs"
                                  disabled={isSaving}
                                  onClick={() => void handleAccountStatusUpdate(user, "suspended")}
                                >
                                  Suspend
                                </Button>
                              ) : user.account_status === "suspended" ? (
                                <Button
                                  variant="secondary"
                                  className="px-4 py-2 text-xs"
                                  disabled={isSaving}
                                  onClick={() => void handleAccountStatusUpdate(user, "active")}
                                >
                                  Unsuspend
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  className="px-4 py-2 text-xs"
                                  disabled={isSaving}
                                  onClick={() => void handleAccountStatusUpdate(user, "active")}
                                >
                                  Restore
                                </Button>
                              )}
                              {user.account_status !== "terminated" ? (
                                <Button
                                  variant="ghost"
                                  className="border-rose-200/80 px-4 py-2 text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-50/85 hover:text-rose-700 dark:border-rose-500/20 dark:text-rose-200 dark:hover:border-rose-400/28 dark:hover:bg-rose-500/10 dark:hover:text-rose-100"
                                  disabled={isSaving}
                                  onClick={() => void handleAccountStatusUpdate(user, "terminated")}
                                >
                                  Terminate
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Submissions</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{feedbackItems.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Linked Accounts</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{feedbackStats.linkedCount}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Latest Submission</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink dark:text-white">
                  {feedbackStats.latestCreatedAt ? formatDate(feedbackStats.latestCreatedAt) : "No feedback yet"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                  <thead className="bg-slate-50 dark:bg-slate-950/70">
                    <tr className="text-left text-xs uppercase tracking-[0.25em] text-slate-400">
                      <th className="px-5 py-4 font-semibold">Subject</th>
                      <th className="px-5 py-4 font-semibold">Submitted By</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 font-semibold">Preview</th>
                      <th className="px-5 py-4 font-semibold text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {feedbackItems.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink dark:text-white">{item.subject}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {item.submitter_email ?? "Anonymous"}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(item.created_at)}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{previewFeedbackBody(item.body)}</td>
                        <td className="px-5 py-4 text-right">
                          <Button variant="secondary" onClick={() => setSelectedFeedbackId(item.id)}>
                            View full feedback
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedFeedback ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Full Feedback</p>
                    <h2 className="mt-3 text-2xl font-semibold text-ink dark:text-white">{selectedFeedback.subject}</h2>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                      {selectedFeedback.submitter_email ?? "Anonymous"} Â· {formatDate(selectedFeedback.created_at)}
                    </p>
                  </div>
                </div>
                <div className="premium-subtle mt-6 rounded-[1.5rem] px-5 py-5 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {selectedFeedback.body}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No feedback submissions yet.
              </div>
            )}
          </>
        )}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}
