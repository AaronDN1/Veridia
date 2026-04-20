import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { getApiBaseUrl } from "@/lib/env";
import type { AdminUserSummary, FeedbackSubmission } from "@/types";

async function fetchAdminRoute<T>(path: string): Promise<T> {
  const apiUrl = getApiBaseUrl();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    redirect("/signin");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (response.status === 401) {
    redirect("/signin");
  }

  if (response.status === 403) {
    redirect("/");
  }

  if (!response.ok) {
    throw new Error(`Failed to load admin route: ${path}`);
  }

  return response.json();
}

export default async function AdminUsersPage() {
  const [users, feedbackItems] = await Promise.all([
    fetchAdminRoute<AdminUserSummary[]>("/api/admin/users"),
    fetchAdminRoute<FeedbackSubmission[]>("/api/admin/feedback"),
  ]);

  return <AdminUsersClient initialUsers={users} initialFeedbackItems={feedbackItems} />;
}
