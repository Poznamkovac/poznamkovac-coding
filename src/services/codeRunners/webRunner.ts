import { type CodeRunner, type ExecutionResult } from "./base";

export class WebRunner implements CodeRunner {
  language = "web";
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  /**
   * Process HTML to inline relative CSS and JS resources from virtual filesystem
   */
  private processHTML(html: string, files: Record<string, string>): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // CSS link tags
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach((linkTag) => {
      const href = linkTag.getAttribute("href");
      if (href && this.isRelativePath(href)) {
        const cssContent = files[href];

        if (cssContent) {
          const styleTag = doc.createElement("style");
          styleTag.textContent = cssContent;
          styleTag.setAttribute("data-source-file", href);
          linkTag.replaceWith(styleTag);
        }
      }
    });

    // script tags
    const scriptTags = doc.querySelectorAll("script[src]");
    scriptTags.forEach((scriptTag) => {
      const src = scriptTag.getAttribute("src");
      if (src && this.isRelativePath(src)) {
        const jsContent = files[src];

        if (jsContent) {
          const newScriptTag = doc.createElement("script");
          newScriptTag.textContent = jsContent;
          newScriptTag.setAttribute("data-source-file", src);
          scriptTag.replaceWith(newScriptTag);
        }
      }
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

  async execute(files: Record<string, string>, mainFile: string, testJS?: string): Promise<ExecutionResult> {
    try {
      let htmlContent = files["index.html"] || files[mainFile];

      if (!htmlContent) {
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

      htmlContent = this.processHTML(htmlContent, files);

      let testCases;
      if (testJS) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        const testScript = doc.createElement("script");
        testScript.textContent = testJS;
        doc.body.appendChild(testScript);

        const runnerScript = doc.createElement("script");
        runnerScript.textContent = `
          window.addEventListener('load', async function() {
            if (typeof test === 'function') {
              const context = {
                language: 'web',
                dom: document,
                window: window
              };
              try {
                const results = await test(context);
                window.__testResults = Array.isArray(results) ? results : [results];
              } catch (error) {
                window.__testResults = [{
                  name: 'Test execution',
                  passed: false,
                  error: error.message
                }];
              }
            }
          });
        `;
        doc.body.appendChild(runnerScript);

        htmlContent = doc.documentElement.outerHTML;
      }

      return {
        success: true,
        htmlContent,
        testCases,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  cleanup(): void {
    // no cleanup needed for web runner
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
