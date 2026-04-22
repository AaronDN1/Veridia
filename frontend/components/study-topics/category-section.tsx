import { TopicCard } from "@/components/study-topics/topic-card";
import { getTopicsForCategory, getVisibleTopicsForCategory, type StudyCategory } from "@/lib/study-topics";

type Props = {
  category: StudyCategory;
};

export function CategorySection({ category }: Props) {
  const topics = getTopicsForCategory(category.slug);
  const visibleTopics = getVisibleTopicsForCategory(category.slug);

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white/58 p-5 shadow-[0_16px_42px_rgba(16,32,22,0.07)] dark:border-white/10 dark:bg-white/[0.035] md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink dark:text-white">{category.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{category.description}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {visibleTopics.length} {visibleTopics.length === 1 ? "topic" : "topics"}
        </span>
      </div>

      {!topics.length ? <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Relevant starting points</p> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visibleTopics.map((topic) => (
          <TopicCard key={`${category.slug}/${topic.categorySlug}/${topic.slug}`} topic={topic} />
        ))}
      </div>
    </section>
  );
}
