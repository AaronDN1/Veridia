"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { TopicCard } from "@/components/study-topics/topic-card";
import { getTopicsForCategory, getVisibleTopicsForCategory, type StudyCategory } from "@/lib/study-topics";

type Props = {
  category: StudyCategory;
};

export function CategorySection({ category }: Props) {
  const [query, setQuery] = useState("");
  const topics = getTopicsForCategory(category.slug);
  const visibleTopics = getVisibleTopicsForCategory(category.slug);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTopics = useMemo(() => {
    if (!normalizedQuery) {
      return visibleTopics;
    }

    return visibleTopics.filter((topic) =>
      [topic.title, topic.description].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, visibleTopics]);

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

      <div className="mt-5 rounded-lg border border-slate-200/80 bg-white/62 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <label htmlFor={`${category.slug}-topic-search`} className="text-sm font-semibold text-ink dark:text-white">
          Search {category.name} topics
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/82 px-4 py-3 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
          <Search className="h-4 w-4 shrink-0" />
          <input
            id={`${category.slug}-topic-search`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${category.name.toLowerCase()} topics...`}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {filteredTopics.length} {filteredTopics.length === 1 ? "topic" : "topics"}
          {normalizedQuery ? " matching your search" : ""}
        </p>
      </div>

      {filteredTopics.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filteredTopics.map((topic) => (
            <TopicCard key={`${category.slug}/${topic.categorySlug}/${topic.slug}`} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-200/90 bg-white/45 px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
          No matching topics found in this subject.
        </div>
      )}
    </section>
  );
}
