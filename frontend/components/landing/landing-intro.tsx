"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/shared/button";

export function LandingIntro() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl -translate-y-6 items-center justify-center md:-translate-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-center"
        >
          <h1 className="font-serif text-6xl leading-[0.9] text-brand-700 dark:text-brand-100 md:text-8xl">
            Veridia
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
            An AI tutor tailored to the way you learn.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/app">
              <Button>Get Started</Button>
            </Link>
            <Link href="/signin">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
