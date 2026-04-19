"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ChartSpline, FlaskConical } from "lucide-react";

const highlights = [
  "Explains STEM work like a strong tutor, not a generic chatbot",
  "Turns rough lab notes into structured, grade-ready reports",
  "Generates clean graphs for homework and lab submissions"
];

const metrics = [
  { label: "Modes", value: "3 core tools" },
  { label: "Beta access", value: "20 prompts daily" },
  { label: "Focus", value: "Built for STEM" }
];

const cardTransition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-6 lg:px-8 lg:pt-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="space-y-6">
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-ink dark:text-white md:text-7xl">
              Focused AI support for homework, lab reports, and graphing.
            </h1>
            <p className="max-w-2xl text-xl leading-9 text-slate-600 dark:text-slate-300">
              Veridia gives STEM students a cleaner, smarter workspace for asking hard questions, drafting strong
              lab reports, and generating academic-quality graphs in a product built around clarity instead of clutter.
            </p>
          </div>

          <div className="grid gap-4 pt-1 md:grid-cols-3">
            {metrics.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...cardTransition, delay: 0.08 + index * 0.05 }}
                className="premium-card rounded-[1.6rem] px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-ink dark:text-white">{item.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 pt-1">
            {highlights.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...cardTransition, delay: 0.18 + index * 0.05 }}
                className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 shadow-[0_0_0_6px_rgba(31,143,85,0.12)] dark:bg-brand-300 dark:shadow-[0_0_0_6px_rgba(109,192,140,0.12)]" />
                <p>{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-[2.1rem] p-6 md:p-8"
        >
          <div className="mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Workspace snapshot</p>
              <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">Clear tools. Calm layout. Stronger output.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                icon: BrainCircuit,
                title: "AI Prompt",
                body:
                  "Ask about calculus, circuits, thermodynamics, statistics, or study strategy and get polished, guided explanations."
              },
              {
                icon: FlaskConical,
                title: "Lab Helper",
                body:
                  "Convert raw notes, methods, observations, and data into a strong first-draft report with academic structure."
              }
            ].map(({ icon: Icon, title, body }) => (
              <motion.div
                key={title}
                whileHover={{ y: -4 }}
                transition={cardTransition}
                className="premium-subtle rounded-[1.7rem] p-5"
              >
                <div className="icon-chip mb-4 h-11 w-11">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
                <p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-100">{body}</p>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ y: -4 }}
              transition={cardTransition}
              className="premium-subtle rounded-[1.7rem] p-5 md:col-span-2"
            >
              <div className="icon-chip mb-4 h-11 w-11">
                <ChartSpline className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Graphing</p>
              <p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-100">
                Plot equations, scatter data, and lab measurements using Python-based generation and download the
                result immediately.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
