import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingNav } from "@/components/landing/marketing-nav";
import { CategorySection } from "@/components/study-topics/category-section";
import { getCategory, studyCategories } from "@/lib/study-topics";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

export function generateStaticParams() {
  return studyCategories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);

  if (!category) {
    return {
      title: "Study Category Not Found | Veridia",
    };
  }

  return {
    title: `${category.name} Study Topics | Veridia`,
    description: `Browse Veridia study topics for ${category.name.toLowerCase()}: ${category.description}`,
    alternates: {
      canonical: `/study-topics/${category.slug}`,
    },
  };
}

export default async function StudyCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <main>
      <MarketingNav />
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/study-topics" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-100">
            Study Topics
          </Link>
          <span className="mx-2">/</span>
          <span>{category.name}</span>
        </nav>

        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">Study Topics</p>
          <h1 className="mt-5 font-serif text-4xl leading-[1.05] text-ink dark:text-white md:text-6xl">{category.name}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{category.description}</p>
        </div>

        <div className="mt-10">
          <CategorySection category={category} />
        </div>
      </section>
    </main>
  );
}
