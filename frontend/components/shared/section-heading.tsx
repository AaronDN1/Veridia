type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: Props) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">{eyebrow}</p>
      <h2 className="font-serif text-4xl text-ink dark:text-white md:text-5xl">{title}</h2>
      <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
