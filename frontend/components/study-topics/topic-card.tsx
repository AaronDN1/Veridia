import Link from "next/link";

import { getTopicHref, type StudyTopic } from "@/lib/study-topics";

type Props = {
  topic: StudyTopic;
};

export function TopicCard({ topic }: Props) {
  return (
    <Link
      href={getTopicHref(topic)}
      className="group block rounded-lg border border-slate-200/80 bg-white/72 p-5 shadow-[0_14px_34px_rgba(16,32,22,0.07)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-brand-300/24 dark:hover:bg-white/[0.07]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">{topic.category}</p>
      <h3 className="mt-3 text-lg font-semibold leading-7 text-ink transition group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-100">
        {topic.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{topic.description}</p>
    </Link>
  );
}
