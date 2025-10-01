import { BaseCodeRunner, type ExecutionResult } from "./base";

export class WebRunner extends BaseCodeRunner {
  language = "web";

  async initialize(): Promise<void> {
    this.initialized = true;
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

      // Inject CSS files
      const cssFiles = Object.entries(files).filter(([name]) => name.endsWith(".css"));
      let cssContent = "";
      for (const [, content] of cssFiles) {
        cssContent += `<style>${content}</style>\n`;
      }

      // Inject JS files
      const jsFiles = Object.entries(files).filter(([name]) => name.endsWith(".js"));
      let jsContent = "";
      for (const [, content] of jsFiles) {
        jsContent += `<script>${content}</script>\n`;
      }

      // Insert CSS in <head> and JS before </body>
      if (cssContent) {
        htmlContent = htmlContent.replace("</head>", `${cssContent}</head>`);
      }
      if (jsContent) {
        htmlContent = htmlContent.replace("</body>", `${jsContent}</body>`);
      }

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
