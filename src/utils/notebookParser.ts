import { marked } from "marked";
import type { NotebookCell } from "../types";

interface CellMetadata {
  readonly: boolean;
  hidden: boolean;
  mustExecute: boolean;
  autoreload: boolean;
}

interface ParsedMarkdown {
  cells: NotebookCell[];
  markdownSections: string[];
}

function parseMetadata(lang: string | undefined): CellMetadata {
  const metadata: CellMetadata = {
    readonly: false,
    hidden: false,
    mustExecute: false,
    autoreload: false,
  };

  const match = lang?.match(/^\[(.*)\]$/);
  if (!match) return metadata;

  const flags = match[1].split(",").map((f) => f.trim().toLowerCase());

  return {
    readonly: flags.includes("readonly"),
    hidden: flags.includes("hidden"),
    mustExecute: flags.includes("mustexecute"),
    autoreload: flags.includes("autoreload"),
  };
}

export async function parseNotebookMarkdown(markdownContent: string): Promise<ParsedMarkdown> {
  const cells: NotebookCell[] = [];
  const markdownSections: string[] = [];
  const tokens = marked.lexer(markdownContent);
  let currentMarkdown = "";
  let cellIndex = 0;

  for (const token of tokens) {
    if (token.type === "code") {
      markdownSections.push(currentMarkdown.trim() ? await marked.parse(currentMarkdown) : "");
      currentMarkdown = "";

      const metadata = parseMetadata(token.lang);
      cells.push({
        id: `cell-${cellIndex++}`,
        code: token.text,
        ...metadata,
      });
    } else {
      currentMarkdown += token.raw;
    }
  }

  markdownSections.push(currentMarkdown.trim() ? await marked.parse(currentMarkdown) : "");

  return { cells, markdownSections };
}
