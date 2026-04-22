import Link from "next/link";

import { ResponseRenderer } from "@/components/app/response-renderer";
import { getTopicHref, studyTopics, type StudyTopic } from "@/lib/study-topics";

type Props = {
  topic: StudyTopic;
};

export function SeoTopicLayout({ topic }: Props) {
  const relatedTopics = studyTopics
    .filter((candidate) => candidate.categorySlug === topic.categorySlug && candidate.slug !== topic.slug)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600 dark:text-slate-300">
        <Link href="/study-topics" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-100">
          Study Topics
        </Link>
        <span className="mx-2">/</span>
        <span>{topic.category}</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600 dark:text-brand-200">{topic.category}</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.06] text-ink dark:text-white md:text-6xl">{topic.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{topic.description}</p>
      </header>

      <section aria-labelledby="problem-statement" className="mb-10 rounded-lg border border-slate-200/80 bg-white/70 p-5 shadow-[0_16px_42px_rgba(16,32,22,0.08)] dark:border-white/10 dark:bg-white/[0.045] md:p-6">
        <h2 id="problem-statement" className="text-2xl font-semibold text-ink dark:text-white">
          Problem Statement
        </h2>
        <div className="mt-4">
          <ResponseRenderer content={topic.problem} />
        </div>
      </section>

      <section aria-labelledby="step-by-step-solution" className="rounded-lg border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_52px_rgba(16,32,22,0.09)] dark:border-white/10 dark:bg-white/[0.055] md:p-8">
        <h2 id="step-by-step-solution" className="sr-only">
          Step-by-step solution
        </h2>
        <ResponseRenderer content={topic.content} />
      </section>

      {relatedTopics.length ? (
        <aside className="mt-10 rounded-lg border border-slate-200/80 bg-white/58 p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <h2 className="text-xl font-semibold text-ink dark:text-white">More {topic.category} topics</h2>
          <div className="mt-4 grid gap-3">
            {relatedTopics.map((relatedTopic) => (
              <Link
                key={relatedTopic.slug}
                href={getTopicHref(relatedTopic)}
                className="rounded-lg border border-slate-200/70 bg-white/62 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-brand-100"
              >
                {relatedTopic.title}
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </article>
  );
}
