import type { Metadata } from "next";

import { MarketingNav } from "@/components/landing/marketing-nav";
import { CategorySearch } from "@/components/study-topics/category-search";
import { studyCategories } from "@/lib/study-topics";

export const metadata: Metadata = {
  title: "Study Topics | Veridia",
  description: "Search STEM study topics across calculus, algebra, physics, statistics, lab reports, graphing, and more.",
};

export default function StudyTopicsPage() {
  return (
    <main>
      <MarketingNav />
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">Study Topics</p>
          <h1 className="mt-5 font-serif text-4xl leading-[1.05] text-ink dark:text-white md:text-6xl">
            STEM explanations organized for quick study.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Browse professor-style explanations by subject, or search for a specific concept, formula, or writing task.
          </p>
        </div>

        <div className="mt-8">
          <CategorySearch categories={studyCategories} />
        </div>
      </section>
    </main>
  );
}
