import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MarketingNav } from "@/components/landing/marketing-nav";

export default function HomePage() {
  return (
    <main>
      <MarketingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Cta />
    </main>
  );
}
