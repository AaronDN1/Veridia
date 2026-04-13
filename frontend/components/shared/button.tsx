import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      type={props.type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200",
        variant === "primary" &&
          "bg-ink text-white shadow-soft hover:-translate-y-0.5 hover:bg-slate-900",
        variant === "secondary" &&
          "border border-white/20 bg-white/70 text-ink backdrop-blur hover:border-brand-100 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
        variant === "ghost" && "text-slate-200 hover:text-white dark:text-slate-300 dark:hover:text-white",
        className
      )}
      {...props}
    />
  );
}
