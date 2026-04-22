import { TopicCard } from "@/components/study-topics/topic-card";
import { getTopicsForCategory, studyTopics, type StudyCategory, type StudyTopic } from "@/lib/study-topics";

type Props = {
  category: StudyCategory;
};

const relatedTopicSlugsByCategory: Record<string, string[]> = {
  geometry: ["unit-circle-explained", "how-to-graph-a-function"],
  mechanics: ["newtons-second-law", "work-and-energy-basics"],
  "electricity-and-magnetism": ["work-and-energy-basics", "newtons-second-law"],
  chemistry: ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  "organic-chemistry": ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  biology: ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  "differential-equations": ["derivative-of-x-squared", "integration-by-parts"],
  "computer-science": ["what-is-a-matrix", "how-to-graph-a-function"],
  "data-structures": ["what-is-a-matrix", "how-to-graph-a-function"],
  algorithms: ["how-to-graph-a-function", "mean-vs-median-vs-mode"],
};

export function CategorySection({ category }: Props) {
  const topics = getTopicsForCategory(category.slug);
  const relatedTopics = (relatedTopicSlugsByCategory[category.slug] ?? [])
    .map((slug) => studyTopics.find((topic) => topic.slug === slug))
    .filter((topic): topic is StudyTopic => Boolean(topic));
  const visibleTopics = topics.length ? topics : relatedTopics;

  return (
    <section id={category.slug} className="scroll-mt-28 rounded-lg border border-slate-200/80 bg-white/58 p-5 shadow-[0_16px_42px_rgba(16,32,22,0.07)] dark:border-white/10 dark:bg-white/[0.035] md:p-6">
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
