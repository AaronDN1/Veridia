"use client";

import { useMemo } from "react";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type Props = {
  content: string;
};

const LATEX_COMMAND_RE =
  /\\(?:begin|end|frac|sqrt|left|right|cdot|times|alpha|beta|gamma|theta|pi|sin|cos|tan|log|ln|sum|prod|int|lim|approx|neq|leq|geq|pm|mp|to|infty|Delta|partial|vec|text|quad|qquad|cases|aligned|align|matrix|bmatrix|pmatrix)\b/;

function wrapLatexEnvironmentBlocks(content: string) {
  return content.replace(
    /(^|\n)(\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\})(?=\n|$)/g,
    (_, prefix: string, block: string) => `${prefix}$$\n${block.trim()}\n$$`,
  );
}

function wrapDisplayMathParagraphs(content: string) {
  return content.replace(
    /(^|\n)(?![-*#>])((?:\\[A-Za-z]+.*|[A-Za-z0-9\\({\[][^\n]*[=^_][^\n]*)(?:\n(?!\n|[-*#>]).+)*)/g,
    (match: string, prefix: string, block: string) => {
      const trimmed = block.trim();
      if (!trimmed || trimmed.includes("$$") || trimmed.includes("$")) return match;

      const looksMathy =
        LATEX_COMMAND_RE.test(trimmed) ||
        /[_^]/.test(trimmed) ||
        /[=<>≤≥]/.test(trimmed) ||
        /\\begin\{/.test(trimmed);
      const looksLikeSentence = /[.!?]$/.test(trimmed) && !/\\\\/.test(trimmed);

      if (!looksMathy || looksLikeSentence) return match;
      if (trimmed.includes("\n") || /\\begin\{/.test(trimmed) || /\\\\/.test(trimmed)) {
        return `${prefix}$$\n${trimmed}\n$$`;
      }

      return match;
    },
  );
}

function wrapInlineLatexCommands(content: string) {
  return content.replace(
    /(^|[^\w$])((?:\\(?:theta|alpha|beta|gamma|pi|lambda|mu|sigma|Delta|partial|pm|mp|leq|geq|neq|approx|cdot|times|quad|qquad|frac|sqrt|sin|cos|tan|log|ln|left|right)\b(?:\s*\{[^{}]*\}|\s*\([^)]*\)|\s*\[[^\]]*\)|\s+[A-Za-z0-9]+|[A-Za-z0-9_^{}()+\-*/=,.])*)(?=[^\w]|$))/g,
    (_, prefix: string, expression: string) => `${prefix}$${expression.trim()}$`,
  );
}

function normalizeMathDelimiters(content: string) {
  return wrapInlineLatexCommands(
    wrapDisplayMathParagraphs(
      wrapLatexEnvironmentBlocks(
        content
          .replace(/```(?:latex|tex)\s*([\s\S]*?)```/g, (_, expression: string) => `\n$$\n${expression.trim()}\n$$\n`)
          .replace(/\\\[((?:.|\n)*?)\\\]/g, "\n$$\n$1\n$$\n")
          .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, expression: string) => `$${expression.trim()}$`)
      )
    )
  ).trim();
}

export function ResponseRenderer({ content }: Props) {
  const normalizedContent = useMemo(() => normalizeMathDelimiters(content), [content]);

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[[remarkMath, { singleDollarTextMath: true }], remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
