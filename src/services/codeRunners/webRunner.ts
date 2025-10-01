import { BaseCodeRunner, type ExecutionResult } from "./base";

export class WebRunner extends BaseCodeRunner {
  language = "web";

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  /**
   * Process HTML to inline relative CSS and JS resources from virtual filesystem
   */
  private processHTML(html: string, files: Record<string, string>): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Process CSS link tags
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach((linkTag) => {
      const href = linkTag.getAttribute("href");
      if (href && this.isRelativePath(href)) {
        // Find the CSS file in virtual filesystem
        const cssContent = files[href];

        if (cssContent) {
          // Replace with inline style tag
          const styleTag = doc.createElement("style");
          styleTag.textContent = cssContent;
          styleTag.setAttribute("data-source-file", href);
          linkTag.replaceWith(styleTag);
        }
      }
      // External URLs (http://, https://, //) are left as-is
    });

    // Process script tags with src
    const scriptTags = doc.querySelectorAll("script[src]");
    scriptTags.forEach((scriptTag) => {
      const src = scriptTag.getAttribute("src");
      if (src && this.isRelativePath(src)) {
        // Find the JS file in virtual filesystem
        const jsContent = files[src];

        if (jsContent) {
          // Replace with inline script
          const newScriptTag = doc.createElement("script");
          newScriptTag.textContent = jsContent;
          newScriptTag.setAttribute("data-source-file", src);
          scriptTag.replaceWith(newScriptTag);
        }
      }
      // External URLs (http://, https://, //) are left as-is
    });

    return doc.documentElement.outerHTML;
  }

  /**
   * Check if a path is relative (not absolute URL)
   */
  private isRelativePath(path: string): boolean {
    // Relative paths don't start with:
    // - http:// or https://
    // - //
    // - /
    return !path.startsWith("http://") && !path.startsWith("https://") && !path.startsWith("//") && !path.startsWith("/");
  }

  async execute(files: Record<string, string>, mainFile: string): Promise<ExecutionResult> {
    try {
      // Find HTML file or create a wrapper
      let htmlContent = files["index.html"] || files[mainFile];

      if (!htmlContent) {
        // No HTML file found, create a basic wrapper
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
</body>
</html>`;
      }

      // Process HTML to inline relative resources
      htmlContent = this.processHTML(htmlContent, files);

      return {
        success: true,
        htmlContent,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  cleanup(): void {
    // No cleanup needed for web runner
  }
}
