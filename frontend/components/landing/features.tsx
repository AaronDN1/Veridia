import { BrainCircuit, ChartSpline, FileChartColumnIncreasing, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";

const features = [
  {
    icon: BrainCircuit,
    title: "Professor-style AI guidance",
    body: "Structured explanations that teach students how to think through STEM problems instead of just dumping answers."
  },
  {
    icon: UploadCloud,
    title: "Image and PDF context",
    body: "Attach homework screenshots, lab sheets, or reference pages so Sigma Solve answers with the actual material in view."
  },
  {
    icon: FileChartColumnIncreasing,
    title: "Lab report drafting",
    body: "Build a complete report from methods, observations, data, and notes with a format instructors expect."
  },
  {
    icon: ChartSpline,
    title: "Python graph generation",
    body: "Use equations or raw measured data to create clean visualizations for homework, labs, and reports."
  },
  {
    icon: ShieldCheck,
    title: "Stable beta guardrails",
    body: "Public beta keeps the full feature set open while enforcing a clean 20-prompt daily cap per signed-in user."
  },
  {
    icon: Sparkles,
    title: "Readable math output",
    body: "Responses are optimized for plain-English teaching and properly rendered equations instead of raw symbolic dumps."
  }
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow="Features"
          title="Everything is designed around serious STEM workflows."
          description="Sigma Solve is opinionated about quality: clear explanations, strong academic structure, clean visuals, and a product surface that feels reliable enough to use every day."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="glass-panel rounded-[1.75rem] p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-white/10 dark:text-brand-100">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink dark:text-white">{title}</h3>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
