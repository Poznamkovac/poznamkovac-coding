import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import sql from "highlight.js/lib/languages/sql";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("html", xml);

const LANG_MAP: Record<string, string> = {
  python: "python",
  web: "html",
  sqlite: "sql",
};

export function highlightCode(code: string, language: "python" | "web" | "sqlite"): string {
  try {
    return hljs.highlight(code, { language: LANG_MAP[language] || "plaintext" }).value;
  } catch {
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
