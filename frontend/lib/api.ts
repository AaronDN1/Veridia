import type {
  AdminUserSummary,
  DashboardData,
  FeedbackSubmission,
  PromptConversationSummary,
  PromptConversationThread,
  PromptToolResponse,
  SessionResponse,
  UploadedFile,
  UsageStatus
} from "@/types";
import { getAnalyticsHeaders, trackClientApiFailure } from "@/lib/analytics";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit, analyticsFeature?: "ai_prompt" | "lab_helper" | "graphing"): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAnalyticsHeaders(analyticsFeature),
        ...(init?.headers ?? {})
      }
    });
  } catch (error) {
    trackClientApiFailure({
      feature_name: analyticsFeature ?? null,
      path,
      method: init?.method ?? "GET",
      error_type: error instanceof Error ? error.name : "network_error",
    });
    throw error;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Request failed");
  }

  return response.json();
}

export function getSession(): Promise<SessionResponse> {
  return request("/api/auth/session", { method: "GET", cache: "no-store" });
}

export function signInWithGoogle(credential: string): Promise<SessionResponse> {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential })
  });
}

export function logout() {
  return request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function deleteAccount() {
  return request<{ success: boolean }>("/api/auth/account", {
    method: "DELETE"
  });
}

export function getUsageStatus(): Promise<UsageStatus> {
  return request("/api/usage/status", { method: "GET", cache: "no-store" });
}

export function getDashboard(): Promise<DashboardData> {
  return request("/api/workspace/dashboard", { method: "GET", cache: "no-store" });
}

export function createCheckoutSession() {
  return request<{ checkout_url: string }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function uploadFile(file: File, purpose: "ai_prompt" | "lab_helper"): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/workspace/upload`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...getAnalyticsHeaders(purpose),
      },
      body: formData
    });
  } catch (error) {
    trackClientApiFailure({
      feature_name: purpose,
      path: "/api/workspace/upload",
      method: "POST",
      error_type: error instanceof Error ? error.name : "network_error",
    });
    throw error;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Upload failed");
  }

  return response.json();
}

export function runPromptTool(payload: { subject: string; prompt: string; file_ids: string[]; thread_id?: string }) {
  return request<PromptToolResponse>("/api/workspace/prompt", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "ai_prompt");
}

export function createPromptThread(payload: { subject: string; prompt: string; file_ids: string[] }) {
  return request<PromptToolResponse>("/api/workspace/prompt/threads", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "ai_prompt");
}

export function continuePromptThread(threadId: string, payload: { prompt: string; file_ids: string[] }) {
  return request<PromptToolResponse>(`/api/workspace/prompt/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, "ai_prompt");
}

export function getPromptThread(threadId: string) {
  return request<PromptConversationThread>(`/api/workspace/prompt/threads/${threadId}`, {
    method: "GET",
    cache: "no-store"
  }, "ai_prompt");
}

export function deletePromptThread(threadId: string) {
  return request<{ success: boolean }>(`/api/workspace/prompt/threads/${threadId}`, {
    method: "DELETE"
  }, "ai_prompt");
}

export function getRecentPromptThreads() {
  return request<PromptConversationSummary[]>("/api/workspace/prompt/threads/recent", {
    method: "GET",
    cache: "no-store"
  }, "ai_prompt");
}

export function getPromptThreadHistory() {
  return request<PromptConversationSummary[]>("/api/workspace/prompt/threads/history", {
    method: "GET",
    cache: "no-store"
  }, "ai_prompt");
}

export function getAdminUsers() {
  return request<AdminUserSummary[]>("/api/admin/users", {
    method: "GET",
    cache: "no-store"
  });
}

export function updateAdminUser(userId: string, payload: { manual_unlimited_override?: boolean; account_status?: "active" | "suspended" | "terminated" }) {
  return request<AdminUserSummary>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function createFeedback(payload: { subject: string; body: string }) {
  return request<FeedbackSubmission>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminFeedback() {
  return request<FeedbackSubmission[]>("/api/admin/feedback", {
    method: "GET",
    cache: "no-store"
  });
}

export function runLabHelper(payload: {
  subject: string;
  lab_title: string;
  description: string;
  observations: string;
  methods: string;
  results: string;
  notes: string;
  file_ids: string[];
}) {
  return request<{ content: string; usage_remaining: number | null }>("/api/workspace/lab-helper", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "lab_helper");
}

export function generateGraph(payload: {
  title: string;
  x_label: string;
  y_label: string;
  graph_type: string;
  equation?: string;
  x_min: number;
  x_max: number;
  sample_count: number;
  series: Array<{ x: number[]; y: number[]; label?: string }>;
}) {
  return request<{ image_url: string; download_url: string; usage_remaining: number | null }>(
    "/api/graphing/generate",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    "graphing"
  );
}
