"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { signInWithGoogle } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
  }
}

export function GoogleSignIn() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !window.google) return;

    const container = document.getElementById("google-signin-button");
    if (!container) return;
    container.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      callback: async ({ credential }) => {
        setLoading(true);
        try {
          await signInWithGoogle(credential);
          router.push("/app");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Google sign-in failed.");
        } finally {
          setLoading(false);
        }
      }
    });

    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      text: "signin_with",
      shape: "pill",
      size: "large"
    });
  }, [ready, router]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div className="space-y-4">
        <div id="google-signin-button" />
        {loading && <p className="text-sm text-slate-500 dark:text-slate-300">Signing you in...</p>}
        {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      </div>
    </>
  );
}
