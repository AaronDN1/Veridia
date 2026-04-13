import Link from "next/link";

import { MarketingNav } from "@/components/landing/marketing-nav";
import { Button } from "@/components/shared/button";

const sections = [
  {
    title: "Who I Am",
    body:
      "I am building SigmaSolve as a focused product for students who want academic help that feels rigorous, readable, and actually useful. I care about shipping software that respects the user, solves a narrow problem well, and leaves room for thoughtful iteration instead of noise."
  },
  {
    title: "What SigmaSolve Is",
    body:
      "SigmaSolve is a STEM-focused AI workspace for long-form problem solving, lab report drafting, and graph generation. The goal is not to be a generic chatbot. It is to feel more like a polished study environment that helps students understand material, organize work, and produce cleaner outputs."
  },
  {
    title: "My Technical Interests",
    body:
      "I am especially interested in applied AI products, human-centered interface design, developer tooling, and systems that turn complex workflows into something calm and intuitive. I enjoy working across frontend and backend boundaries, tightening product details, and making technical products feel more legible to real users."
  },
  {
    title: "What I Am Looking For",
    body:
      "I am interested in internships and early-career software roles where I can contribute to ambitious product engineering, learn from strong technical teams, and keep growing across product thinking, full-stack development, and AI-enabled systems. This page is intentionally editable so it can evolve alongside the project and the opportunities I pursue."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <MarketingNav />
      <section className="px-6 pb-24 pt-14 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="glass-panel rounded-[2rem] p-8 md:p-10">
            <div className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50/80 px-4 py-2 text-sm font-semibold text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-brand-100">
              Recruiter-facing overview
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-tight text-ink dark:text-white md:text-6xl">
              Building SigmaSolve with product taste, technical depth, and room to grow.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              This page is a professional placeholder that explains the project, my interests, and the kind of roles I
              am exploring. It is written to stay realistic, editable, and easy to tailor for conversations with
              recruiters and hiring teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/app">
                <Button>Open SigmaSolve</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" className="dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  Back to product
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="glass-panel rounded-[1.75rem] p-7">
                <h2 className="text-2xl font-semibold text-ink dark:text-white">{section.title}</h2>
                <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
