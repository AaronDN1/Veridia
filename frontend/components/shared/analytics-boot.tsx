"use client";

import { useEffect } from "react";

import { initAnalytics, installAnalyticsListeners } from "@/lib/analytics";

export function AnalyticsBoot() {
  useEffect(() => {
    initAnalytics();
    installAnalyticsListeners();
  }, []);

  return null;
}
