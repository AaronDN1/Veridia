import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingNav } from "@/components/landing/marketing-nav";
import { SeoTopicLayout } from "@/components/study-topics/seo-topic-layout";
import { getTopic, studyTopics } from "@/lib/study-topics";

type Props = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export function generateStaticParams() {
  return studyTopics.map((topic) => ({
    category: topic.categorySlug,
    slug: topic.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const topic = getTopic(category, slug);

  if (!topic) {
    return {
      title: "Study Topic Not Found | Veridia",
    };
  }

  return {
    title: `${topic.title} | Veridia Study Topics`,
    description: topic.metaDescription,
    alternates: {
      canonical: `/study-topics/${topic.categorySlug}/${topic.slug}`,
    },
  };
}

export default async function StudyTopicPage({ params }: Props) {
  const { category, slug } = await params;
  const topic = getTopic(category, slug);

  if (!topic) {
    notFound();
  }

  return (
    <main>
      <MarketingNav />
      <SeoTopicLayout topic={topic} />
    </main>
  );
}
