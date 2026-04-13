import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/shared/button";
import { SectionHeading } from "@/components/shared/section-heading";

const BETA_FREE_MODE = process.env.NEXT_PUBLIC_BETA_FREE_MODE === "true";

const comparisonRows = [
  { label: "AI Prompt access", free: true, unlimited: true },
  { label: "Lab Helper access", free: true, unlimited: true },
  { label: "Graphing access", free: true, unlimited: true },
  { label: "Image and PDF uploads", free: true, unlimited: true },
  { label: "Daily generation cap", free: "3 total uses", unlimited: "Unlimited" },
  { label: "Monthly price", free: "$0", unlimited: "$5" }
];

export function Pricing() {
  if (BETA_FREE_MODE) {
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
              <p className="mt-5 text-sm uppercase tracking-[0.3em] text-slate-400">Public beta access</p>
            </div>

            <article className="rounded-[2rem] border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-8 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">What beta includes</p>
              <h3 className="mt-4 text-4xl font-semibold text-ink">Full product access</h3>
              <p className="mt-3 text-slate-600">No checkout flow is shown while public testing is active.</p>
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

  return (
    <section id="pricing" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow="Pricing"
          title="A premium tool with an intentionally low subscription price."
          description="Most premium AI subscriptions charge far more than students actually need. Sigma Solve keeps the full feature set available on both plans, then uses a simple daily cap for free access and a straightforward $5/month upgrade for unlimited use."
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-ink p-8 text-white shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-gold" />
              Why it feels affordable
            </div>
            <h3 className="mt-6 font-serif text-4xl leading-tight">Unlimited access for less than a typical takeout meal.</h3>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Sigma Solve focuses on the exact workflows STEM students repeat every week. That narrower focus makes a
              lower price possible without making the product feel cheap.
            </p>
            <p className="mt-5 text-sm uppercase tracking-[0.3em] text-slate-400">Unlimited: $5/month</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="glass-panel rounded-[2rem] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Free</p>
              <h3 className="mt-4 text-4xl font-semibold text-ink">$0</h3>
              <p className="mt-3 text-slate-600">Try every feature with a shared cap of 3 total uses per day.</p>
              <ul className="mt-8 space-y-4 text-sm text-slate-700">
                {comparisonRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <span>{row.label}</span>
                    <span className="font-semibold">{row.free === true ? <Check className="h-4 w-4 text-accent" /> : row.free}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[2rem] border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-8 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Unlimited</p>
              <h3 className="mt-4 text-4xl font-semibold text-ink">
                $5<span className="text-lg text-slate-500">/month</span>
              </h3>
              <p className="mt-3 text-slate-600">Everything included, no generation cap, built for regular coursework.</p>
              <ul className="mt-8 space-y-4 text-sm text-slate-700">
                {comparisonRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                    <span>{row.label}</span>
                    <span className="font-semibold">
                      {row.unlimited === true ? <Check className="h-4 w-4 text-accent" /> : row.unlimited}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/app" className="mt-8 block">
                <Button className="w-full">Upgrade when you're ready</Button>
              </Link>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
