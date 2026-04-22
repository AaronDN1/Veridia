import Link from "next/link";

import { getCategoryHref, getVisibleTopicsForCategory, type StudyCategory } from "@/lib/study-topics";

type Props = {
  category: StudyCategory;
};

export function CategoryCard({ category }: Props) {
  const topicCount = getVisibleTopicsForCategory(category.slug).length;

  return (
    <Link
      href={getCategoryHref(category)}
      className="group block rounded-lg border border-slate-200/80 bg-white/64 p-5 shadow-[0_14px_34px_rgba(16,32,22,0.07)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-300/24 dark:hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink transition group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-100">
          {category.name}
        </h2>
        <span className="shrink-0 rounded-full border border-brand-200/70 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-300/20 dark:bg-brand-500/10 dark:text-brand-100">
          {topicCount}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{category.description}</p>
    </Link>
  );
}
