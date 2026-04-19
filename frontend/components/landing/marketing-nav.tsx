"use client";

import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SettingsModal } from "@/components/shared/settings-modal";
import { Button } from "@/components/shared/button";
import { VeridiaLogo } from "@/components/shared/veridia-logo";

export function MarketingNav() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<"home" | "features" | "how-it-works" | "about">(
    pathname === "/about" ? "about" : "home"
  );
  const featuresHref = pathname === "/" ? "#features" : "/#features";
  const howItWorksHref = pathname === "/" ? "#how-it-works" : "/#how-it-works";
  const navItemClass = (active: boolean) =>
    [
      "rounded-full px-4 py-2 text-sm transition",
      active
        ? "bg-brand-100/75 text-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-brand-500/10 dark:text-slate-50"
        : "hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/6 dark:hover:text-slate-100"
    ].join(" ");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname === "/about") {
      setActiveSection("about");
      return;
    }
    if (pathname !== "/") {
      return;
    }

    const sectionIds: Array<"home" | "features" | "how-it-works"> = ["home", "features", "how-it-works"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target.id) {
          setActiveSection(visibleEntries[0].target.id as "home" | "features" | "how-it-works");
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.55],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  function handleSectionClick(section: "home" | "features" | "how-it-works" | "about") {
    setActiveSection(section);
  }

  return (
    <>
      <header className="sticky top-0 z-30 px-4 pt-4 lg:px-6">
        <div
          className={[
            "mx-auto flex max-w-7xl items-center rounded-[1.75rem] px-4 py-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4 lg:px-6",
            scrolled
              ? "border border-white/80 bg-white/88 shadow-[0_18px_48px_rgba(16,32,22,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#1b2620]/78 dark:shadow-[0_18px_48px_rgba(7,12,9,0.22)]"
              : "border border-transparent bg-transparent shadow-none backdrop-blur-0"
          ].join(" ")}
        >
          <Link href="/" className="flex items-center gap-3 md:min-w-0 md:justify-self-start">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-sm font-bold text-white shadow-[0_14px_30px_rgba(31,143,85,0.18)] dark:bg-brand-500/12"
            >
              <VeridiaLogo className="h-8 w-8" />
            </motion.div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-200">Veridia</p>
              <div className="premium-accent inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-100">
                Public Beta - features currently free
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 justify-self-center rounded-full border border-slate-200/80 bg-white/70 px-2 py-1 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/9 dark:bg-white/[0.045] dark:text-slate-300 md:flex">
            <Link href="/" className={navItemClass(pathname === "/" && activeSection === "home")} onClick={() => handleSectionClick("home")}>
              Home
            </Link>
            <Link href={featuresHref} className={navItemClass(pathname === "/" && activeSection === "features")} onClick={() => handleSectionClick("features")}>
              Features
            </Link>
            <Link href={howItWorksHref} className={navItemClass(pathname === "/" && activeSection === "how-it-works")} onClick={() => handleSectionClick("how-it-works")}>
              How it works
            </Link>
            <Link href="/about" className={navItemClass(pathname === "/about" || activeSection === "about")} onClick={() => handleSectionClick("about")}>
              About Me
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0 md:min-w-0 md:justify-self-end">
            <Link href="/" className="md:hidden">
              <Button variant="ghost" className="text-slate-600 dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-200 dark:hover:border-brand-300/16 dark:hover:bg-white/[0.05] dark:hover:text-white">
                Home
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="premium-card inline-flex items-center justify-center rounded-full p-3 text-slate-600 transition hover:-translate-y-0.5 hover:text-ink dark:text-slate-200 dark:hover:text-white"
              aria-label="Open settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <Link href="/app">
              <Button className="dark:border-brand-400/18 dark:bg-brand-500/84 dark:text-slate-950 dark:shadow-[0_14px_32px_rgba(7,12,9,0.18)] dark:hover:bg-brand-500/92">Open Veridia</Button>
            </Link>
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
