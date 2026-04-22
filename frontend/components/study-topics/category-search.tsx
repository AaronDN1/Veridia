"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryCard } from "@/components/study-topics/category-card";
import { type StudyCategory } from "@/lib/study-topics";

type Props = {
  categories: StudyCategory[];
};

export function CategorySearch({ categories }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => {
      const categoryText = `${category.name} ${category.description}`.toLowerCase();
      return categoryText.includes(normalizedQuery);
    });
  }, [categories, normalizedQuery]);

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white/70 p-4 shadow-[0_16px_44px_rgba(16,32,22,0.08)] dark:border-white/10 dark:bg-white/[0.045] md:p-5">
      <label htmlFor="study-category-search" className="text-sm font-semibold text-ink dark:text-white">
        Search subjects
      </label>
      <div className="mt-3 flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/82 px-4 py-3 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
        <Search className="h-4 w-4 shrink-0" />
        <input
          id="study-category-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search calculus, physics, lab reports..."
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-5">
        {normalizedQuery ? (
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            {matches.length ? `${matches.length} subject${matches.length === 1 ? "" : "s"} found` : "No matching subjects yet."}
          </p>
        ) : null}

        {matches.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
