import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/shared/button";
import { SectionHeading } from "@/components/shared/section-heading";

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow="Public Beta"
          title="Sigma Solve is currently open for public testing."
          description="We are validating the product with real student workflows before formal launch. During beta, every signed-in user gets full access to AI Prompt, Lab Helper, and Graphing."
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-ink p-8 text-white shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-gold" />
              Beta access
            </div>
            <h3 className="mt-6 font-serif text-4xl leading-tight">All core tools are unlocked while we test in public.</h3>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Sign in, use the product normally, and help us validate the experience before billing goes live.
            </p>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-slate-400">Public Beta - 20 prompts per day</p>
          </div>

          <article className="rounded-[2rem] border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">What beta includes</p>
            <h3 className="mt-4 text-4xl font-semibold text-ink">Full product access</h3>
            <p className="mt-3 text-slate-600">Public Beta - 20 prompts per day. No checkout flow is shown while testing is active.</p>
            <ul className="mt-8 space-y-4 text-sm text-slate-700">
              {[
                "AI Prompt access",
                "Lab Helper access",
                "Graphing access",
                "Image and PDF uploads",
                "Google sign-in and saved workspace history",
                "Stripe billing kept inactive until launch"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 border-b border-slate-200/60 pb-4">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/app" className="mt-8 block">
              <Button className="w-full">Enter the beta</Button>
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
