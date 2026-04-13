import Link from "next/link";
import { ArrowRight, BadgeCheck, BrainCircuit, ChartSpline, FlaskConical } from "lucide-react";

import { Button } from "@/components/shared/button";

const highlights = [
  "Explains STEM work like a strong tutor, not a generic chatbot",
  "Turns rough lab notes into structured, grade-ready reports",
  "Generates clean graphs for homework and lab submissions"
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:px-8 lg:pt-24">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <BadgeCheck className="h-4 w-4 text-brand-500" />
            Public Beta — features currently free
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl font-serif text-5xl leading-tight text-ink dark:text-white md:text-7xl">
              Focused AI support for homework, lab reports, and graphing.
            </h1>
            <p className="max-w-2xl text-xl leading-9 text-slate-600 dark:text-slate-300">
              SigmaSolve gives STEM students a cleaner, smarter workspace for asking hard questions, drafting strong
              lab reports, and generating academic-quality graphs in a product built around clarity instead of clutter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/app">
              <Button className="gap-2">
                Start solving
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="secondary">Sign in with Google</Button>
            </Link>
          </div>

          <div className="grid gap-4 pt-2">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <div className="rounded-[1.6rem] bg-ink bg-hero-glow p-8 text-white">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <BrainCircuit className="mb-4 h-6 w-6 text-brand-100" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">AI Prompt</p>
                <p className="mt-3 text-lg leading-8 text-slate-100">
                  Ask about calculus, circuits, thermodynamics, statistics, or study strategy and get polished, guided
                  explanations.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <FlaskConical className="mb-4 h-6 w-6 text-brand-100" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Lab Helper</p>
                <p className="mt-3 text-lg leading-8 text-slate-100">
                  Convert raw notes, methods, observations, and data into a strong first-draft report with academic
                  structure.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:col-span-2">
                <ChartSpline className="mb-4 h-6 w-6 text-brand-100" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Graphing</p>
                <p className="mt-3 text-lg leading-8 text-slate-100">
                  Plot equations, scatter data, and lab measurements using Python-based generation and download the
                  result immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
