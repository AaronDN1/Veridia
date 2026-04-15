"use client";

import posthog from "posthog-js";

type AnalyticsEventProperties = Record<string, string | number | boolean | null | undefined>;
type FeatureName = "ai_prompt" | "lab_helper" | "graphing";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const ANALYTICS_ENABLED = Boolean(POSTHOG_KEY && POSTHOG_HOST);

type SessionState = {
  sessionId: string;
  startedAt: number;
  promptCount: number;
  activeFeature: FeatureName | null;
  activeFeatureStartedAt: number | null;
};

let currentUserId: string | null = null;
let sessionState: SessionState | null = null;
let listenersInstalled = false;
let initialized = false;

function postAnalyticsEvent(event: string, properties: AnalyticsEventProperties = {}, useBeacon = false) {
  if (!ANALYTICS_ENABLED || typeof window === "undefined" || !initialized) return;

  posthog.capture(event, {
    session_id: sessionState?.sessionId ?? null,
    user_id: currentUserId,
    transport: useBeacon ? "sendBeacon" : undefined,
    ...properties,
  });
}

export function initAnalytics() {
  if (!ANALYTICS_ENABLED || typeof window === "undefined" || initialized || !POSTHOG_KEY || !POSTHOG_HOST) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2025-05-24",
    autocapture: false,
    capture_pageview: "history_change",
    capture_pageleave: false,
    persistence: "localStorage",
  });
  initialized = true;
}

function closeActiveFeature(reason: "tab_switch" | "session_end" | "page_hidden") {
  if (!sessionState?.activeFeature || !sessionState.activeFeatureStartedAt) return;

  postAnalyticsEvent("feature_closed", {
    feature_name: sessionState.activeFeature,
    duration_ms: Date.now() - sessionState.activeFeatureStartedAt,
    reason,
  });

  sessionState = {
    ...sessionState,
    activeFeature: null,
    activeFeatureStartedAt: null,
  };
}

export function installAnalyticsListeners() {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  window.addEventListener("error", (event) => {
    postAnalyticsEvent("frontend_error", {
      error_type: "window_error",
      message: event.message,
      source_file: event.filename ?? null,
      line_number: event.lineno ?? null,
      column_number: event.colno ?? null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    postAnalyticsEvent("frontend_error", {
      error_type: "unhandled_promise_rejection",
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    });
  });

  window.addEventListener("beforeunload", () => {
    if (!sessionState) return;
    closeActiveFeature("session_end");
    postAnalyticsEvent(
      "session_ended",
      {
        duration_ms: Date.now() - sessionState.startedAt,
        prompts_in_session: sessionState.promptCount,
        reason: "beforeunload",
      },
      true,
    );
    sessionState = null;
  });
}

export function setAnalyticsUser(userId: string | null) {
  currentUserId = userId;
  if (!ANALYTICS_ENABLED || !initialized) return;

  if (userId) {
    posthog.identify(userId, { user_id: userId });
  } else {
    posthog.reset();
  }
}

export function startAnalyticsSession(userId: string) {
  currentUserId = userId;
  if (sessionState) return sessionState.sessionId;

  sessionState = {
    sessionId: crypto.randomUUID(),
    startedAt: Date.now(),
    promptCount: 0,
    activeFeature: null,
    activeFeatureStartedAt: null,
  };

  postAnalyticsEvent("session_started", {
    session_id: sessionState.sessionId,
  });

  return sessionState.sessionId;
}

export function endAnalyticsSession(reason: "page_exit" | "app_unmount") {
  if (!sessionState) return;
  closeActiveFeature("session_end");
  postAnalyticsEvent("session_ended", {
    duration_ms: Date.now() - sessionState.startedAt,
    prompts_in_session: sessionState.promptCount,
    reason,
  });
  sessionState = null;
}

export function openFeature(featureName: FeatureName) {
  if (!sessionState) return;
  if (sessionState.activeFeature === featureName) return;

  closeActiveFeature("tab_switch");
  sessionState = {
    ...sessionState,
    activeFeature: featureName,
    activeFeatureStartedAt: Date.now(),
  };
  postAnalyticsEvent("feature_opened", { feature_name: featureName });
}

export function trackAiPromptSubmitted(properties: AnalyticsEventProperties) {
  if (sessionState) {
    sessionState = { ...sessionState, promptCount: sessionState.promptCount + 1 };
  }
  postAnalyticsEvent("ai_prompt_submitted", properties);
}

export function trackAiResponseReceived(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("ai_response_received", properties);
}

export function trackLabHelperStarted(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("lab_helper_started", properties);
}

export function trackLabHelperCompleted(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("lab_helper_completed", properties);
}

export function trackGraphingStarted(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("graphing_started", properties);
}

export function trackGraphGenerated(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("graph_generated", properties);
}

export function trackThreadLoaded(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("thread_resumed", properties);
}

export function trackThreadCreated(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("thread_created", properties);
}

export function trackMessageAppended(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("message_appended", properties);
}

export function trackClientApiFailure(properties: AnalyticsEventProperties) {
  postAnalyticsEvent("api_call_failed", {
    source: "frontend",
    ...properties,
  });
}

export function getAnalyticsHeaders(featureName?: FeatureName) {
  return {
    ...(sessionState?.sessionId ? { "x-sigma-session-id": sessionState.sessionId } : {}),
    ...(featureName ? { "x-sigma-feature-name": featureName } : {}),
  };
}
