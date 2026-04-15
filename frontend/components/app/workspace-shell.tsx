"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  ChartSpline,
  ChevronDown,
  Clock3,
  FlaskConical,
  Home,
  MessageSquarePlus,
  Settings2,
  Sparkles
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
    if (activeTab !== "ai_prompt" || !conversationScrollRef.current) return;
    const container = conversationScrollRef.current;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [activeTab, conversationMessages.length, loadingAction, activeThread?.id]);

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

  return (
    <main className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[300px_1fr]">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
                {user.full_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink dark:text-white">{user.full_name}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-ink p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Access</p>
                <p className="mt-3 text-2xl font-semibold">{BETA_FREE_MODE ? "Public Beta" : "Workspace Access"}</p>
              </div>
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-3 text-sm text-slate-300">{usageLabel}</p>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
              Public Beta - features currently free
            </p>
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
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => void loadThread(thread.id)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          activeThread?.id === thread.id
                            ? "border-brand-200 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-500/10"
                            : "border-slate-200 bg-white hover:border-brand-100 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/70"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink dark:text-white">{thread.title}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{thread.subject}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-slate-400">{formatThreadTime(thread.updated_at)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{thread.latest_message_preview}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Your recent AI threads will appear here.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen((current) => !current)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:text-ink dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:bg-slate-900/70 dark:hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    History (14 days)
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition", historyOpen && "rotate-180")} />
                </button>
                {historyOpen && (
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {historyThreads.length > 0 ? (
                      historyThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => void loadThread(thread.id)}
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition",
                            activeThread?.id === thread.id
                              ? "border-brand-200 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-500/10"
                              : "border-slate-200 bg-white hover:border-brand-100 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/70"
                          )}
                        >
                          <p className="truncate text-sm font-semibold text-ink dark:text-white">{thread.title}</p>
                          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <span className="truncate">{thread.subject}</span>
                            <span className="shrink-0 normal-case tracking-normal">{formatThreadTime(thread.updated_at)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{thread.latest_message_preview}</p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
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
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:text-ink dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-brand-100 dark:hover:text-white">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:text-ink dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-brand-100 dark:hover:text-white">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </button>
                <div className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-brand-100">
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
                    Start a new tutoring thread or keep an existing one going. SigmaSolve will use recent thread context so follow-up questions feel continuous.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={startNewConversation}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    New conversation
                  </Button>
                  {activeThread && (
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-300">
                      {activeThread.subject} - {activeThread.title}
                    </div>
                  )}
                </div>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:disabled:bg-slate-900/80"
                  value={promptForm.subject}
                  disabled={Boolean(activeThread)}
                  onChange={(event) => setPromptForm((current) => ({ ...current, subject: event.target.value }))}
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-56 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500"
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
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Lab title" value={labForm.lab_title} onChange={(event) => setLabForm((current) => ({ ...current, lab_title: event.target.value }))} />
                  <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white" value={labForm.subject} onChange={(event) => setLabForm((current) => ({ ...current, subject: event.target.value }))}>
                    {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </div>
                <textarea className="min-h-28 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Describe the lab and its objective." value={labForm.description} onChange={(event) => setLabForm((current) => ({ ...current, description: event.target.value }))} />
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Methods / procedure" value={labForm.methods} onChange={(event) => setLabForm((current) => ({ ...current, methods: event.target.value }))} />
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Observations" value={labForm.observations} onChange={(event) => setLabForm((current) => ({ ...current, observations: event.target.value }))} />
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Results / data summary" value={labForm.results} onChange={(event) => setLabForm((current) => ({ ...current, results: event.target.value }))} />
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Additional notes or sources of error" value={labForm.notes} onChange={(event) => setLabForm((current) => ({ ...current, notes: event.target.value }))} />
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
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Graph title" value={graphForm.title} onChange={(event) => setGraphForm((current) => ({ ...current, title: event.target.value }))} />
                  <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white" value={graphForm.graph_type} onChange={(event) => setGraphForm((current) => ({ ...current, graph_type: event.target.value }))}>
                    <option value="line">Line graph</option><option value="scatter">Scatter plot</option>
                  </select>
                </div>
                <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Equation, e.g. sin(x) or x^2 + 3*x" value={graphForm.equation} onChange={(event) => setGraphForm((current) => ({ ...current, equation: event.target.value }))} />
                <div className="grid gap-4 md:grid-cols-3">
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="X label" value={graphForm.x_label} onChange={(event) => setGraphForm((current) => ({ ...current, x_label: event.target.value }))} />
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Y label" value={graphForm.y_label} onChange={(event) => setGraphForm((current) => ({ ...current, y_label: event.target.value }))} />
                  <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Series label" value={graphForm.label} onChange={(event) => setGraphForm((current) => ({ ...current, label: event.target.value }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <input type="number" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white" placeholder="x min" value={graphForm.x_min} onChange={(event) => setGraphForm((current) => ({ ...current, x_min: Number(event.target.value) }))} />
                  <input type="number" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white" placeholder="x max" value={graphForm.x_max} onChange={(event) => setGraphForm((current) => ({ ...current, x_max: Number(event.target.value) }))} />
                  <input type="number" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white" placeholder="samples" value={graphForm.sample_count} onChange={(event) => setGraphForm((current) => ({ ...current, sample_count: Number(event.target.value) }))} />
                </div>
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Optional X data, comma separated" value={graphForm.rawX} onChange={(event) => setGraphForm((current) => ({ ...current, rawX: event.target.value }))} />
                <textarea className="min-h-24 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500" placeholder="Optional Y data, comma separated" value={graphForm.rawY} onChange={(event) => setGraphForm((current) => ({ ...current, rawY: event.target.value }))} />
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
            <div className={cn("mt-5 rounded-[1.5rem] bg-white p-5 dark:bg-slate-950/55", activeTab === "ai_prompt" || response || graphUrl ? "min-h-0" : "min-h-[28rem]")}>
              {activeTab === "ai_prompt" ? (
                <div
                  ref={conversationScrollRef}
                  className="h-[28rem] min-h-[20rem] max-h-[75vh] resize-y overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 pr-3 dark:border-white/10 dark:bg-slate-950/35"
                >
                  {conversationMessages.length > 0 ? (
                    <div className="space-y-4">
                      {conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "rounded-[1.5rem] border px-4 py-4",
                            message.role === "assistant"
                              ? "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/75"
                              : "border-brand-100 bg-brand-50 dark:border-brand-400/30 dark:bg-brand-500/10"
                          )}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                              {message.role === "assistant" ? "SigmaSolve" : "You"}
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
                    <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-6 text-center text-slate-500 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-400">
                      {loadingThread
                        ? "Loading conversation..."
                        : "Start a new AI conversation or open one from the sidebar to continue where you left off."}
                    </div>
                  )}
                </div>
              ) : response ? (
                <ResponseRenderer content={response} />
              ) : graphUrl ? (
                <div className="space-y-4">
                  <img src={graphUrl} alt="Generated graph" className="w-full rounded-3xl border border-slate-100 dark:border-white/10" />
                  <a href={graphUrl} download className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Download graph</a>
                </div>
              ) : (
                <div className="flex h-full min-h-[24rem] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-slate-500 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-400">
                  Generated explanations, lab reports, and graphs will appear here after you submit a request.
                </div>
              )}
            </div>

            {dashboard.uploaded_files.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recent uploads</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {dashboard.uploaded_files.map((file) => (
                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200">
                      {file.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
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
        active ? "bg-ink text-white shadow-soft" : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:bg-slate-900/80"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
