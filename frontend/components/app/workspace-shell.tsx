"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  ChartSpline,
  Check,
  ChevronDown,
  Clock3,
  FlaskConical,
  Home,
  MessageSquarePlus,
  MessageSquareText,
  Settings2,
  Sparkles,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ResponseRenderer } from "@/components/app/response-renderer";
import { UploadPanel } from "@/components/app/upload-panel";
import { SettingsModal } from "@/components/shared/settings-modal";
import { Button } from "@/components/shared/button";
import {
  openFeature,
  trackAiPromptSubmitted,
  trackAiResponseReceived,
  trackGraphGenerated,
  trackGraphingStarted,
  trackLabHelperCompleted,
  trackLabHelperStarted,
  trackMessageAppended,
  trackThreadCreated,
  trackThreadLoaded,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  continuePromptThread,
  createPromptThread,
  deleteAccount,
  deletePromptThread,
  generateGraph,
  getPromptThread,
  getPromptThreadHistory,
  getRecentPromptThreads,
  logout,
  runLabHelper,
  uploadFile
} from "@/lib/api";
import type {
  DashboardData,
  PromptConversationSummary,
  PromptConversationThread,
  UploadedFile,
  UsageStatus,
  User
} from "@/types";
import type { ComponentType, SelectHTMLAttributes } from "react";

type WorkspaceTab = "ai_prompt" | "lab_helper" | "graphing";

type Props = {
  user: User;
  usage: UsageStatus;
  dashboard: DashboardData;
};

const subjectOptions = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Computer Science",
  "Statistics",
  "General STEM"
];

const BETA_FREE_MODE = process.env.NEXT_PUBLIC_BETA_FREE_MODE === "true";
const fieldClassName =
  "premium-input rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900/80";
const textareaClassName = "premium-input rounded-[1.5rem] px-4 py-4 text-sm";
const selectClassName =
  "premium-input w-full appearance-none rounded-2xl px-4 py-3 pr-12 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900/80";

function formatThreadTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function WorkspaceShell({ user, usage, dashboard }: Props) {
  const router = useRouter();
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("ai_prompt");
  const [response, setResponse] = useState<string>("");
  const [graphUrl, setGraphUrl] = useState<string>("");
  const [promptFiles, setPromptFiles] = useState<UploadedFile[]>([]);
  const [labFiles, setLabFiles] = useState<UploadedFile[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string>("");
  const [usageState, setUsageState] = useState<UsageStatus>(usage);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [activeThread, setActiveThread] = useState<PromptConversationThread | null>(null);
  const [recentThreads, setRecentThreads] = useState<PromptConversationSummary[]>([]);
  const [historyThreads, setHistoryThreads] = useState<PromptConversationSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const [promptForm, setPromptForm] = useState({ subject: "Math", prompt: "" });
  const [labForm, setLabForm] = useState({
    subject: "Chemistry",
    lab_title: "",
    description: "",
    observations: "",
    methods: "",
    results: "",
    notes: ""
  });
  const [graphForm, setGraphForm] = useState({
    title: "Position vs Time",
    x_label: "Time (s)",
    y_label: "Position (m)",
    graph_type: "line",
    equation: "sin(x)",
    x_min: -10,
    x_max: 10,
    sample_count: 200,
    rawX: "0,1,2,3,4",
    rawY: "0,1.4,2.9,4.1,5.2",
    label: "Measured data"
  });

  const usageLabel = useMemo(() => {
    if (usageState.remaining_today === null) return "Unlimited access";
    const limit = usageState.daily_limit ?? usageState.total_used_today;
    return `${usageState.remaining_today} of ${limit} prompts left today`;
  }, [usageState]);

  const conversationMessages = activeThread?.messages ?? [];

  useEffect(() => {
    void refreshPromptLists();
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    setPromptForm((current) => ({ ...current, subject: activeThread.subject }));
  }, [activeThread]);

  useEffect(() => {
    previousMessageCountRef.current = conversationMessages.length;
  }, [activeThread?.id]);

  useEffect(() => {
    if (activeTab !== "ai_prompt" || !conversationScrollRef.current) return;
    const container = conversationScrollRef.current;
    const behavior =
      conversationMessages.length > previousMessageCountRef.current && previousMessageCountRef.current > 0
        ? "smooth"
        : "auto";

    container.scrollTo({ top: container.scrollHeight, behavior });
    previousMessageCountRef.current = conversationMessages.length;
  }, [activeTab, conversationMessages.length, activeThread?.id]);

  useEffect(() => {
    openFeature(activeTab);
  }, [activeTab]);

  function updateUsage(remaining: number | null) {
    if (remaining === null) return;
    setUsageState((current) => ({
      ...current,
      remaining_today: remaining,
      total_used_today:
        current.daily_limit === null ? current.total_used_today : Math.max((current.daily_limit ?? 0) - remaining, 0)
      }));
  }

  async function refreshPromptLists() {
    try {
      const [recent, history] = await Promise.all([getRecentPromptThreads(), getPromptThreadHistory()]);
      setRecentThreads(recent);
      setHistoryThreads(history);
    } catch {
      // Keep AI Prompt usable even if the thread list refresh fails.
    }
  }

  async function handleUpload(file: File, purpose: "ai_prompt" | "lab_helper") {
    setLoadingUpload(true);
    setError("");
    try {
      const uploaded = await uploadFile(file, purpose);
      if (purpose === "ai_prompt") {
        setPromptFiles((current) => [uploaded, ...current]);
      } else {
        setLabFiles((current) => [uploaded, ...current]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoadingUpload(false);
    }
  }

  function removeFile(fileId: string, purpose: "ai_prompt" | "lab_helper") {
    if (purpose === "ai_prompt") {
      setPromptFiles((current) => current.filter((file) => file.id !== fileId));
    } else {
      setLabFiles((current) => current.filter((file) => file.id !== fileId));
    }
  }

  async function loadThread(threadId: string) {
    setLoadingThread(true);
    setError("");
    try {
      const thread = await getPromptThread(threadId);
      setActiveTab("ai_prompt");
      setGraphUrl("");
      setResponse("");
      setActiveThread(thread);
      setPromptForm((current) => ({ ...current, subject: thread.subject, prompt: "" }));
      setHistoryOpen(false);
      trackThreadLoaded({
        thread_id: thread.id,
        subject: thread.subject,
        message_count: thread.messages.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversation.");
    } finally {
      setLoadingThread(false);
    }
  }

  function startNewConversation() {
    setActiveTab("ai_prompt");
    setResponse("");
    setGraphUrl("");
    setActiveThread(null);
    setPromptFiles([]);
    setPromptForm((current) => ({ ...current, prompt: "" }));
    setHistoryOpen(false);
  }

  async function handleDeleteThread(thread: PromptConversationSummary) {
    const confirmed = window.confirm(`Delete "${thread.title}"? This conversation will be removed from your history.`);
    if (!confirmed) return;

    setDeletingThreadId(thread.id);
    setError("");
    try {
      await deletePromptThread(thread.id);
      setRecentThreads((current) => current.filter((entry) => entry.id !== thread.id));
      setHistoryThreads((current) => current.filter((entry) => entry.id !== thread.id));
      if (activeThread?.id === thread.id) {
        startNewConversation();
      }
      await refreshPromptLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete conversation.");
    } finally {
      setDeletingThreadId(null);
    }
  }

  async function handlePromptSubmit() {
    if (!promptForm.prompt.trim()) {
      setError("Please enter a prompt before generating a response.");
      return;
    }

    setLoadingAction(true);
    setError("");
    const startedAt = performance.now();
    const isNewThread = !activeThread;
    trackAiPromptSubmitted({
      feature_name: "ai_prompt",
      thread_id: activeThread?.id ?? null,
      subject: activeThread?.subject ?? promptForm.subject,
      file_count: promptFiles.length,
      is_new_thread: isNewThread,
    });
    try {
      const result = activeThread
        ? await continuePromptThread(activeThread.id, {
            prompt: promptForm.prompt.trim(),
            file_ids: promptFiles.map((file) => file.id)
          })
        : await createPromptThread({
            subject: promptForm.subject,
            prompt: promptForm.prompt.trim(),
            file_ids: promptFiles.map((file) => file.id)
          });
      setGraphUrl("");
      setResponse("");
      setActiveThread(result.thread);
      setPromptForm((current) => ({ ...current, prompt: "", subject: result.thread.subject }));
      setPromptFiles([]);
      updateUsage(result.usage_remaining);
      await refreshPromptLists();
      if (isNewThread) {
        trackThreadCreated({
          thread_id: result.thread.id,
          subject: result.thread.subject,
        });
      }
      trackMessageAppended({
        thread_id: result.thread.id,
        subject: result.thread.subject,
        message_count: result.thread.messages.length,
        messages_added: 2,
      });
      trackAiResponseReceived({
        feature_name: "ai_prompt",
        thread_id: result.thread.id,
        subject: result.thread.subject,
        response_time_ms: Math.round(performance.now() - startedAt),
        message_count: result.thread.messages.length,
        is_new_thread: isNewThread,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate explanation.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleLabSubmit() {
    setLoadingAction(true);
    setError("");
    const startedAt = performance.now();
    trackLabHelperStarted({
      feature_name: "lab_helper",
      subject: labForm.subject,
      file_count: labFiles.length,
    });
    try {
      const result = await runLabHelper({ ...labForm, file_ids: labFiles.map((file) => file.id) });
      setActiveThread(null);
      setGraphUrl("");
      setResponse(result.content);
      updateUsage(result.usage_remaining);
      trackLabHelperCompleted({
        feature_name: "lab_helper",
        subject: labForm.subject,
        response_time_ms: Math.round(performance.now() - startedAt),
        file_count: labFiles.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to draft lab report.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleGraphSubmit() {
    setLoadingAction(true);
    setError("");
    const startedAt = performance.now();
    trackGraphingStarted({
      feature_name: "graphing",
      graph_type: graphForm.graph_type,
      has_equation: Boolean(graphForm.equation),
      series_count: graphForm.rawX.trim() && graphForm.rawY.trim() ? 1 : 0,
    });
    try {
      const x = graphForm.rawX.split(",").map((value) => Number(value.trim())).filter((value) => !Number.isNaN(value));
      const y = graphForm.rawY.split(",").map((value) => Number(value.trim())).filter((value) => !Number.isNaN(value));
      const result = await generateGraph({
        title: graphForm.title,
        x_label: graphForm.x_label,
        y_label: graphForm.y_label,
        graph_type: graphForm.graph_type,
        equation: graphForm.equation || undefined,
        x_min: Number(graphForm.x_min),
        x_max: Number(graphForm.x_max),
        sample_count: Number(graphForm.sample_count),
        series: x.length && y.length ? [{ x, y, label: graphForm.label }] : []
      });
      setActiveThread(null);
      setResponse("");
      setGraphUrl(result.image_url);
      updateUsage(result.usage_remaining);
      trackGraphGenerated({
        feature_name: "graphing",
        graph_type: graphForm.graph_type,
        response_time_ms: Math.round(performance.now() - startedAt),
        has_equation: Boolean(graphForm.equation),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate graph.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;

    setSettingsOpen(false);
    setError("");
    try {
      await deleteAccount();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete account.");
    }
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-6 pt-2 md:px-6 md:pb-8 md:pt-4">
      <div className="mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="glass-panel self-start rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            {user.avatar_url && !avatarFailed ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                width={54}
                height={54}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_16px_34px_rgba(31,143,85,0.24)]">
                {user.full_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Workspace account</p>
              <p className="truncate text-lg font-semibold text-ink dark:text-white">{user.full_name}</p>
            </div>
          </div>

          <div className="premium-card mt-6 rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Access</p>
                <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{BETA_FREE_MODE ? "Public Beta" : "Workspace Access"}</p>
              </div>
              <Sparkles className="h-5 w-5 text-brand-500 dark:text-brand-200" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{usageLabel}</p>
          </div>

          <div className="mt-6 space-y-2">
            <SidebarButton active={activeTab === "ai_prompt"} icon={BrainCircuit} label="AI Prompt" onClick={() => setActiveTab("ai_prompt")} />
            <SidebarButton active={activeTab === "lab_helper"} icon={FlaskConical} label="Lab Helper" onClick={() => setActiveTab("lab_helper")} />
            <SidebarButton active={activeTab === "graphing"} icon={ChartSpline} label="Graphing" onClick={() => setActiveTab("graphing")} />
          </div>

          {activeTab === "ai_prompt" && (
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                    Recent Conversations
                  </p>
                  <span className="text-xs text-slate-400">Last 3</span>
                </div>
                <div className="mt-3 space-y-2">
                  {recentThreads.length > 0 ? (
                    recentThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className={cn(
                          "relative rounded-[1.1rem] border px-3 py-2.5 transition",
                          activeThread?.id === thread.id
                            ? "premium-accent"
                            : "premium-card hover:border-[var(--border-strong)]"
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`Delete ${thread.title}`}
                          disabled={deletingThreadId === thread.id}
                          onClick={() => void handleDeleteThread(thread)}
                          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="pr-8">
                          <button
                            type="button"
                            onClick={() => void loadThread(thread.id)}
                            className="min-w-0 w-full text-left"
                          >
                            <p className="truncate text-[13px] font-semibold leading-5 text-ink dark:text-white">{thread.title}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              <p className="min-w-0 truncate">{thread.subject}</p>
                              <span className="whitespace-nowrap normal-case tracking-normal">{formatThreadTime(thread.updated_at)}</span>
                            </div>
                            <p className="mt-1.5 text-[13px] leading-5 text-slate-500 dark:text-slate-300">{thread.latest_message_preview}</p>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="premium-subtle rounded-2xl border-dashed px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                      Your recent AI threads will appear here.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen((current) => !current)}
                  className="premium-card flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    History (14 days)
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition", historyOpen && "rotate-180")} />
                </button>
                {historyOpen && (
                  <div className="premium-scroll mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {historyThreads.length > 0 ? (
                      historyThreads.map((thread) => (
                        <div
                          key={thread.id}
                          className={cn(
                            "relative rounded-[1.1rem] border px-3 py-2.5 transition",
                            activeThread?.id === thread.id
                              ? "premium-accent"
                              : "premium-card hover:border-[var(--border-strong)]"
                          )}
                        >
                          <button
                            type="button"
                            aria-label={`Delete ${thread.title}`}
                            disabled={deletingThreadId === thread.id}
                            onClick={() => void handleDeleteThread(thread)}
                            className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="pr-8">
                            <button
                              type="button"
                              onClick={() => void loadThread(thread.id)}
                              className="min-w-0 w-full text-left"
                            >
                              <p className="truncate text-[13px] font-semibold leading-5 text-ink dark:text-white">{thread.title}</p>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                <p className="min-w-0 truncate">{thread.subject}</p>
                                <span className="whitespace-nowrap normal-case tracking-normal">{formatThreadTime(thread.updated_at)}</span>
                              </div>
                              <p className="mt-1.5 text-[13px] leading-5 text-slate-500 dark:text-slate-300">{thread.latest_message_preview}</p>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="premium-subtle rounded-2xl border-dashed px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                        No conversations from the last 14 days yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        <section className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Workspace</p>
                <h1 className="mt-3 font-serif text-4xl text-ink dark:text-white">Solve longer prompts with a cleaner, calmer workflow.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                  Input comes first, output follows below, and the experience stays readable whether you are asking one question or continuing a full conversation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="premium-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link href="/feedback" className="premium-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white">
                  <MessageSquareText className="h-4 w-4" />
                  Feedback
                </Link>
                <button type="button" onClick={() => setSettingsOpen(true)} className="premium-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </button>
                <div className="premium-accent rounded-full px-4 py-2 text-sm font-semibold text-brand-700 dark:text-brand-100">
                  Public Beta - features currently free
                </div>
              </div>
            </div>
            {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            {activeTab === "ai_prompt" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">AI Prompt</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Start a new tutoring thread or keep an existing one going. Veridia will use recent thread context so follow-up questions feel continuous.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={startNewConversation}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    New conversation
                  </Button>
                  {activeThread && (
                    <div className="premium-subtle rounded-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                      {activeThread.subject} - {activeThread.title}
                    </div>
                  )}
                </div>
                <PromptSubjectSelect
                  label="Subject"
                  options={subjectOptions}
                  value={promptForm.subject}
                  disabled={Boolean(activeThread)}
                  onChange={(value) => setPromptForm((current) => ({ ...current, subject: value }))}
                />
                <textarea
                  className={`${textareaClassName} min-h-56`}
                  placeholder={
                    activeThread
                      ? "Ask a follow-up question, refine the prior explanation, or continue the same problem."
                      : "Ask a homework question, paste your work, or describe what you need help understanding."
                  }
                  value={promptForm.prompt}
                  onChange={(event) => setPromptForm((current) => ({ ...current, prompt: event.target.value }))}
                />
                <UploadPanel purpose="ai_prompt" files={promptFiles} loading={loadingUpload} onUpload={handleUpload} onRemove={(fileId) => removeFile(fileId, "ai_prompt")} />
                <Button className="w-full md:w-auto" onClick={handlePromptSubmit} disabled={loadingAction || loadingThread}>
                  {loadingAction ? "Generating response..." : activeThread ? "Send follow-up" : "Start conversation"}
                </Button>
              </div>
            )}

            {activeTab === "lab_helper" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Lab Helper</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Turn rough notes into a stronger draft while keeping the structure familiar and submission-ready.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input className={fieldClassName} placeholder="Lab title" value={labForm.lab_title} onChange={(event) => setLabForm((current) => ({ ...current, lab_title: event.target.value }))} />
                  <FieldSelect value={labForm.subject} onChange={(event) => setLabForm((current) => ({ ...current, subject: event.target.value }))}>
                    {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </FieldSelect>
                </div>
                <textarea className={`${textareaClassName} min-h-28`} placeholder="Describe the lab and its objective." value={labForm.description} onChange={(event) => setLabForm((current) => ({ ...current, description: event.target.value }))} />
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Methods / procedure" value={labForm.methods} onChange={(event) => setLabForm((current) => ({ ...current, methods: event.target.value }))} />
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Observations" value={labForm.observations} onChange={(event) => setLabForm((current) => ({ ...current, observations: event.target.value }))} />
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Results / data summary" value={labForm.results} onChange={(event) => setLabForm((current) => ({ ...current, results: event.target.value }))} />
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Additional notes or sources of error" value={labForm.notes} onChange={(event) => setLabForm((current) => ({ ...current, notes: event.target.value }))} />
                <UploadPanel purpose="lab_helper" files={labFiles} loading={loadingUpload} onUpload={handleUpload} onRemove={(fileId) => removeFile(fileId, "lab_helper")} />
                <Button className="w-full md:w-auto" onClick={handleLabSubmit} disabled={loadingAction}>{loadingAction ? "Drafting report..." : "Generate lab report"}</Button>
              </div>
            )}

            {activeTab === "graphing" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Graphing</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Generate equations or chart measured data without leaving the workspace.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input className={fieldClassName} placeholder="Graph title" value={graphForm.title} onChange={(event) => setGraphForm((current) => ({ ...current, title: event.target.value }))} />
                  <FieldSelect value={graphForm.graph_type} onChange={(event) => setGraphForm((current) => ({ ...current, graph_type: event.target.value }))}>
                    <option value="line">Line graph</option><option value="scatter">Scatter plot</option>
                  </FieldSelect>
                </div>
                <input className={fieldClassName} placeholder="Equation, e.g. sin(x) or x^2 + 3*x" value={graphForm.equation} onChange={(event) => setGraphForm((current) => ({ ...current, equation: event.target.value }))} />
                <div className="grid gap-4 md:grid-cols-3">
                  <input className={fieldClassName} placeholder="X label" value={graphForm.x_label} onChange={(event) => setGraphForm((current) => ({ ...current, x_label: event.target.value }))} />
                  <input className={fieldClassName} placeholder="Y label" value={graphForm.y_label} onChange={(event) => setGraphForm((current) => ({ ...current, y_label: event.target.value }))} />
                  <input className={fieldClassName} placeholder="Series label" value={graphForm.label} onChange={(event) => setGraphForm((current) => ({ ...current, label: event.target.value }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <input type="number" className={fieldClassName} placeholder="x min" value={graphForm.x_min} onChange={(event) => setGraphForm((current) => ({ ...current, x_min: Number(event.target.value) }))} />
                  <input type="number" className={fieldClassName} placeholder="x max" value={graphForm.x_max} onChange={(event) => setGraphForm((current) => ({ ...current, x_max: Number(event.target.value) }))} />
                  <input type="number" className={fieldClassName} placeholder="samples" value={graphForm.sample_count} onChange={(event) => setGraphForm((current) => ({ ...current, sample_count: Number(event.target.value) }))} />
                </div>
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Optional X data, comma separated" value={graphForm.rawX} onChange={(event) => setGraphForm((current) => ({ ...current, rawX: event.target.value }))} />
                <textarea className={`${textareaClassName} min-h-24`} placeholder="Optional Y data, comma separated" value={graphForm.rawY} onChange={(event) => setGraphForm((current) => ({ ...current, rawY: event.target.value }))} />
                <Button className="w-full md:w-auto" onClick={handleGraphSubmit} disabled={loadingAction}>{loadingAction ? "Rendering graph..." : "Generate graph"}</Button>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">{activeTab === "ai_prompt" ? "Conversation" : "Output"}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {activeTab === "ai_prompt"
                    ? "Messages stay in order here so you can resume the same tutoring thread naturally."
                    : "Clean explanations, rendered math, and downloadable results appear here."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-300">
                {activeTab === "ai_prompt" && <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Drag lower edge to resize</span>}
                <span>{usageLabel}</span>
              </div>
            </div>
            <div className={cn("mt-5", activeTab === "ai_prompt" || response || graphUrl ? "min-h-0" : "min-h-[28rem]")}>
              {activeTab === "ai_prompt" ? (
                <div
                  ref={conversationScrollRef}
                  className="premium-scroll premium-card h-[28rem] min-h-[20rem] max-h-[75vh] resize-y overflow-y-auto rounded-[1.5rem] p-4 pr-3"
                >
                  {conversationMessages.length > 0 ? (
                    <div className="space-y-4">
                      {conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "rounded-[1.5rem] border px-4 py-4",
                            message.role === "assistant"
                              ? "premium-card"
                              : "premium-accent"
                          )}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                              {message.role === "assistant" ? "Veridia" : "You"}
                            </p>
                            <p className="text-xs text-slate-400">{formatThreadTime(message.created_at)}</p>
                          </div>
                          {message.role === "assistant" ? (
                            <ResponseRenderer content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-7 text-ink dark:text-white">{message.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-transparent px-6 text-center text-slate-500 dark:text-slate-400">
                      {loadingThread
                        ? "Loading conversation..."
                        : "Start a new AI conversation or open one from the sidebar to continue where you left off."}
                    </div>
                  )}
                </div>
              ) : response ? (
                <div className="premium-card rounded-[1.5rem] p-5">
                  <ResponseRenderer content={response} />
                </div>
              ) : graphUrl ? (
                <div className="premium-card space-y-4 rounded-[1.5rem] p-5">
                  <img src={graphUrl} alt="Generated graph" className="w-full rounded-3xl border border-slate-100 shadow-soft dark:border-white/10" />
                  <a href={graphUrl} download className="inline-flex rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(31,143,85,0.24)]">
                    Download graph
                  </a>
                </div>
              ) : (
                <div className="premium-card flex h-full min-h-[24rem] items-center justify-center rounded-[1.5rem] px-6 text-center text-slate-500 dark:text-slate-400">
                  Generated explanations, lab reports, and graphs will appear here after you submit a request.
                </div>
              )}
            </div>

            {dashboard.uploaded_files.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recent uploads</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {dashboard.uploaded_files.map((file) => (
                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="premium-card rounded-full px-4 py-2 text-sm text-slate-600 transition hover:-translate-y-0.5 dark:text-slate-200">
                      {file.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />
    </main>
  );
}

function SidebarButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: typeof BrainCircuit;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition",
        active
          ? "border border-brand-500/20 bg-brand-500 text-white shadow-[0_18px_36px_rgba(31,143,85,0.24)] dark:text-slate-950"
          : "premium-card text-slate-700 hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function PromptSubjectSelect({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <div ref={rootRef} className="space-y-2">
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p> : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "premium-input flex min-h-[3.5rem] w-full items-center justify-between rounded-[1.15rem] px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900/80",
            open && "border-[var(--accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_16%,transparent),0_14px_36px_rgba(16,32,22,0.1)]"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-3">
            <span className="icon-chip h-9 w-9 rounded-xl">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">AI Prompt Subject</span>
              <span className="mt-1 block text-base font-medium text-ink dark:text-white">{value}</span>
            </span>
          </span>
          <span className={cn("text-slate-400 transition", open && "rotate-180 text-brand-500 dark:text-brand-200")}>
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>

        {open ? (
          <div className="premium-card absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-[1.25rem] p-2 shadow-[0_22px_46px_rgba(16,32,22,0.16)]">
            <div className="premium-scroll max-h-72 space-y-1 overflow-y-auto pr-1">
              {options.map((option) => {
                const selected = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left transition",
                      selected
                        ? "premium-accent text-brand-700 dark:text-brand-100"
                        : "text-slate-700 hover:bg-slate-50 hover:text-ink dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
                    )}
                  >
                    <span className="block text-sm font-semibold">{option}</span>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", selected ? "bg-white/70 dark:bg-white/10" : "text-transparent")}>
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FieldSelect({
  children,
  className,
  icon: Icon,
  label,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: ComponentType<{ className?: string }>;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p> : null}
      <div className="group relative">
        {Icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-brand-500 dark:text-brand-200">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <select
          className={cn(
            selectClassName,
            Icon ? "pl-11" : "",
            "group-hover:border-[var(--border-strong)]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 transition group-hover:text-brand-500 dark:group-hover:text-brand-200">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
