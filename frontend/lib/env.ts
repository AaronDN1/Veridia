const LOCAL_API_URL = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_API_URL;
  }

  throw new Error("NEXT_PUBLIC_API_URL must be set in production.");
}
