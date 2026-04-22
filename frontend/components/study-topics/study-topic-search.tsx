"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { TopicCard } from "@/components/study-topics/topic-card";
import { type StudyTopic } from "@/lib/study-topics";

type Props = {
  topics: StudyTopic[];
};

export function StudyTopicSearch({ topics }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return topics.filter((topic) =>
      [topic.title, topic.category, topic.description, topic.problem].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, topics]);

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white/70 p-4 shadow-[0_16px_44px_rgba(16,32,22,0.08)] dark:border-white/10 dark:bg-white/[0.045] md:p-5">
      <label htmlFor="study-topic-search" className="text-sm font-semibold text-ink dark:text-white">
        Search study topics
      </label>
      <div className="mt-3 flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/82 px-4 py-3 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
        <Search className="h-4 w-4 shrink-0" />
        <input
          id="study-topic-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search calculus, physics, graphing..."
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      {normalizedQuery ? (
        <div className="mt-5">
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            {matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"} found` : "No matching topics yet."}
          </p>
          {matches.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((topic) => (
                <TopicCard key={`${topic.categorySlug}/${topic.slug}`} topic={topic} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
