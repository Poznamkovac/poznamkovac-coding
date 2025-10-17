import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import sql from "highlight.js/lib/languages/sql";
import xml from "highlight.js/lib/languages/xml"; // For HTML

// Register languages
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("html", xml);

/**
 * Highlights code with syntax highlighting matching VS Code Dark+ theme
 */
export function highlightCode(code: string, language: "python" | "web" | "sqlite"): string {
  const langMap: Record<string, string> = {
    python: "python",
    web: "html",
    sqlite: "sql",
  };

  const hlLang = langMap[language] || "plaintext";

  try {
    const result = hljs.highlight(code, { language: hlLang });
    return result.value;
  } catch (e) {
    console.error("Syntax highlighting failed:", e);
    // Fallback to escaped plain text
    return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
