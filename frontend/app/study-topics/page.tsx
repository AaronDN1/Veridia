import type { Metadata } from "next";

import { MarketingNav } from "@/components/landing/marketing-nav";
import { CategorySection } from "@/components/study-topics/category-section";
import { StudyTopicSearch } from "@/components/study-topics/study-topic-search";
import { studyCategories, studyTopics } from "@/lib/study-topics";

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
          <StudyTopicSearch topics={studyTopics} />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studyCategories.map((category) => (
            <a
              key={category.slug}
              href={`#${category.slug}`}
              className="rounded-lg border border-slate-200/80 bg-white/58 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-white hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-200 dark:hover:border-brand-300/24 dark:hover:text-brand-100"
            >
              {category.name}
            </a>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          {studyCategories.map((category) => (
            <CategorySection key={category.slug} category={category} />
          ))}
        </div>
      </section>
    </main>
  );
}
