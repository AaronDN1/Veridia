export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan_type: "free" | "unlimited";
  active_subscription: boolean;
  daily_usage_count: number;
  daily_usage_limit: number | null;
  created_at: string;
};

export type SessionResponse = {
  user: User | null;
};

export type UploadedFile = {
  id: string;
  original_name: string;
  mime_type: string;
  url: string;
};

export type DashboardData = {
  recent_outputs: {
    id: string;
    title: string;
    output_type: string;
    created_at: string;
  }[];
  uploaded_files: UploadedFile[];
};

export type UsageStatus = {
  plan_type: "free" | "unlimited";
  total_used_today: number;
  daily_limit: number | null;
  remaining_today: number | null;
};

export type PromptConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type PromptConversationThread = {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  messages: PromptConversationMessage[];
};

export type PromptConversationSummary = {
  id: string;
  title: string;
  subject: string;
  updated_at: string;
  latest_message_preview: string;
};

export type PromptToolResponse = {
  content: string;
  usage_remaining: number | null;
  thread: PromptConversationThread;
};
