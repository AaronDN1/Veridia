"use client";

import { useMemo } from "react";
import katex from "katex";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type Props = {
  content: string;
};

const BLOCK_COMMAND_RE =
  /\\(?:begin|end|frac|sqrt|left|right|cdot|times|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|Delta|partial|pm|mp|leq|geq|neq|approx|sum|prod|int|lim|quad|qquad|cases|aligned|align|matrix|bmatrix|pmatrix|text)\b/;

function protectByPattern(content: string, pattern: RegExp, marker: string) {
  const matches: string[] = [];
  const protectedText = content.replace(pattern, (match) => {
    const id = matches.push(match) - 1;
    return `@@${marker}_${id}@@`;
  });

  return { protectedText, matches };
}

function restoreByPattern(content: string, marker: string, matches: string[]) {
  return content.replace(new RegExp(`@@${marker}_(\\d+)@@`, "g"), (_, index: string) => matches[Number(index)] ?? "");
}

function validateMath(expression: string) {
  try {
    katex.renderToString(expression, { throwOnError: true, strict: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function looksLikeMath(expression: string) {
  return (
    BLOCK_COMMAND_RE.test(expression) ||
    /[_^=+\-*/]/.test(expression) ||
    /\d/.test(expression) ||
    /[(){}[\]]/.test(expression)
  );
}

function normalizeEscapes(content: string) {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\\\$(.+?)\\\$/g, (_, expression: string) => {
      const trimmed = expression.trim();
      return trimmed && (validateMath(trimmed) || looksLikeMath(trimmed)) ? `$${trimmed}$` : expression;
    })
    .replace(/\\\\(?=(begin|end|[A-Za-z]+|\(|\)|\[|\]))/g, "\\")
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, expression: string) => `\n$$\n${expression.trim()}\n$$\n`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, expression: string) => `$${expression.trim()}$`);
}

function normalizeEnvironmentBody(environment: string, body: string) {
  if (/\\\\/.test(body)) {
    return body.trim();
  }

  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (environment === "aligned" || environment === "align") {
    return lines.map((line) => line.replace(/\s*=\s*/, " &= ")).join(" \\\\ \n");
  }

  if (environment === "cases") {
    return lines.join(" \\\\ \n");
  }

  return body.trim();
}

function wrapEnvironmentBlocks(content: string) {
  return content.replace(
    /(^|\n)\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(?=\n|$)/g,
    (_, prefix: string, environment: string, body: string) =>
      `${prefix}\n$$\n\\begin{${environment}}\n${normalizeEnvironmentBody(environment, body)}\n\\end{${environment}}\n$$\n`,
  );
}

function canonicalizeDisplayBlocks(content: string) {
  return content.replace(/\$\$([\s\S]*?)\$\$/g, (_, block: string) => `\n$$\n${block.trim()}\n$$\n`);
}

function sanitizeDisplayDelimiterLines(content: string) {
  return content
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed === "$$") {
        return [line];
      }

      if (trimmed.startsWith("$$") && trimmed.length > 2) {
        return ["$$", trimmed.slice(2).trim()];
      }

      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        return [trimmed.slice(0, -2).trim()];
      }

      return [line];
    })
    .join("\n");
}

function isMathOnlyLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[@#>*-]/.test(trimmed)) return false;
  if (/[.!?]$/.test(trimmed)) return false;

  const alphaWords = trimmed.match(/[A-Za-z]+/g) ?? [];
  const containsMath =
    BLOCK_COMMAND_RE.test(trimmed) ||
    /[_^]/.test(trimmed) ||
    /[=<>≤≥]/.test(trimmed) ||
    /\\{2}/.test(trimmed);

  if (!containsMath) return false;
  if (alphaWords.length > 8 && !trimmed.startsWith("\\")) return false;
  if (/\b(convert|therefore|because|since|note|here|first|next|then|where)\b/i.test(trimmed)) return false;
  return true;
}

function toAlignedBlock(lines: string[]) {
  if (lines.length <= 1) {
    return lines[0] ?? "";
  }

  return `\\begin{aligned}\n${lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\s*=\s*/, " &= "))
    .join(" \\\\ \n")}\n\\end{aligned}`;
}

function wrapMathLineGroups(text: string) {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let index = 0; index < lines.length; ) {
    if (!isMathOnlyLine(lines[index])) {
      result.push(lines[index]);
      index += 1;
      continue;
    }

    const group: string[] = [];
    while (index < lines.length && (isMathOnlyLine(lines[index]) || lines[index].trim() === "")) {
      if (lines[index].trim()) {
        group.push(lines[index]);
      }
      index += 1;
    }

    if (!group.length) continue;
    const block = /\\begin\{/.test(group.join("\n")) ? group.join("\n") : toAlignedBlock(group);
    result.push("$$", block, "$$");
  }

  return result.join("\n");
}

function tryWrapInlineMath(expression: string) {
  const trimmed = expression.trim();
  if (!trimmed) return expression;
  return validateMath(trimmed) ? `$${trimmed}$` : trimmed.replace(/\\quad|\\qquad/g, " ").replace(/\\/g, "");
}

function wrapInlineMath(text: string) {
  const { protectedText, matches } = protectByPattern(text, /\$[^$\n]+\$/g, "INLINE_MATH");

  const wrapped = protectedText
    .replace(/\([^()\n]*\\[A-Za-z][^()\n]*\)/g, (match) => tryWrapInlineMath(match))
    .replace(/\\[A-Za-z][^.!?\n]*?(?=\s+(?:and|or|but)\b|[.,;:]|$)/g, (match) => tryWrapInlineMath(match));

  return restoreByPattern(wrapped, "INLINE_MATH", matches);
}

function processTextSegment(text: string) {
  return wrapMathLineGroups(
    text
      .split("\n")
      .map((line) => (isMathOnlyLine(line) ? line : wrapInlineMath(line)))
      .join("\n"),
  );
}

function splitDisplayBlocks(content: string) {
  const pieces: Array<{ type: "text" | "math"; value: string }> = [];
  const regex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      pieces.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    pieces.push({ type: "math", value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    pieces.push({ type: "text", value: content.slice(lastIndex) });
  }

  return pieces;
}

function normalizeMathContent(content: string) {
  const fenced = protectByPattern(content, /```[\s\S]*?```/g, "CODE_FENCE");
  const normalizedBase = canonicalizeDisplayBlocks(
    wrapEnvironmentBlocks(sanitizeDisplayDelimiterLines(normalizeEscapes(fenced.protectedText))),
  );

  const normalized = splitDisplayBlocks(normalizedBase)
    .map((piece) => {
      if (piece.type === "math") {
        return `\n$$\n${piece.value}\n$$\n`;
      }

      const withoutStrayDisplayDelimiters = piece.value.replace(/\$\$/g, "");
      return processTextSegment(withoutStrayDisplayDelimiters);
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return restoreByPattern(normalized, "CODE_FENCE", fenced.matches);
}

export function ResponseRenderer({ content }: Props) {
  const normalizedContent = useMemo(() => normalizeMathContent(content), [content]);

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
