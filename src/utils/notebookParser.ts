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
  markdownSections: string[]; // HTML rendered markdown between cells
}

/**
 * Parses metadata from code block language identifier
 * Example: [readonly,mustExecute] -> { readonly: true, hidden: false, mustExecute: true }
 */
function parseMetadata(lang: string | undefined): CellMetadata {
  const metadata: CellMetadata = {
    readonly: false,
    hidden: false,
    mustExecute: false,
    autoreload: false,
  };

  if (!lang) return metadata;

  // Check if lang starts with [ and ends with ]
  const match = lang.match(/^\[(.*)\]$/);
  if (!match) return metadata;

  const flags = match[1].split(",").map((f) => f.trim().toLowerCase());

  metadata.readonly = flags.includes("readonly");
  metadata.hidden = flags.includes("hidden");
  metadata.mustExecute = flags.includes("mustexecute");
  metadata.autoreload = flags.includes("autoreload");

  return metadata;
}

/**
 * Parses assignment.md content into cells and markdown sections
 */
export async function parseNotebookMarkdown(markdownContent: string): Promise<ParsedMarkdown> {
  const cells: NotebookCell[] = [];
  const markdownSections: string[] = [];

  // Custom renderer to capture code blocks and preserve other content
  const tokens = marked.lexer(markdownContent);
  let currentMarkdown = "";
  let cellIndex = 0;

  for (const token of tokens) {
    if (token.type === "code") {
      // Save accumulated markdown before this cell
      if (currentMarkdown.trim()) {
        const rendered = await marked.parse(currentMarkdown);
        markdownSections.push(rendered);
      } else {
        markdownSections.push("");
      }
      currentMarkdown = "";

      // Parse cell metadata and create cell
      const metadata = parseMetadata(token.lang);
      cells.push({
        id: `cell-${cellIndex++}`,
        code: token.text,
        readonly: metadata.readonly,
        hidden: metadata.hidden,
        mustExecute: metadata.mustExecute,
        autoreload: metadata.autoreload,
      });
    } else {
      // Accumulate non-code tokens as markdown
      currentMarkdown += token.raw;
    }
  }

  // Handle trailing markdown after last cell
  if (currentMarkdown.trim()) {
    const rendered = await marked.parse(currentMarkdown);
    markdownSections.push(rendered);
  } else if (cells.length > 0) {
    // Ensure we have a trailing empty section if last element was a cell
    markdownSections.push("");
  }

  return { cells, markdownSections };
}
