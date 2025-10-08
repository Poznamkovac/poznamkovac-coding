import { type CodeRunner, type ExecutionResult } from "./base";
import type { PyodideInterface } from "pyodide";

export class PythonRunner implements CodeRunner {
  language = "python";
  private pyodide: PyodideInterface | null = null;
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const { loadPyodide } = await import("pyodide");
        this.pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
        });

        this.initialized = true;
      } catch (error) {
        console.error("Failed to initialize Pyodide:", error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  async execute(files: Record<string, string>, mainFile: string, testJS?: string): Promise<ExecutionResult> {
    if (!this.pyodide) {
      return {
        success: false,
        error: "Python runtime not initialized",
      };
    }

    try {
      // Clear previous modules to ensure clean state
      await this.cleanup();

      // Remove old matplotlib plots from DOM
      const oldPlots = document.querySelectorAll('body > div[style*="display: inline-block"]');
      oldPlots.forEach((plot) => {
        // Check if this is actually a matplotlib plot by looking for canvas or toolbar
        if (plot.querySelector(".mpl-canvas, .mpl-toolbar")) {
          plot.remove();
        }
      });

      // Write all files to Pyodide filesystem
      for (const [filename, content] of Object.entries(files)) {
        this.pyodide.FS.writeFile(filename, content);
      }

      // Check for requirements.txt and install packages
      const requirements: string[] = [];
      if (files["requirements.txt"]) {
        const reqLines = files["requirements.txt"]
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));

        requirements.push(...reqLines);

        if (requirements.length > 0) {
          // Load packages specified in requirements.txt
          await this.pyodide.loadPackage(requirements);
        }
      }

      // Capture stdout and stderr
      let stdout = "";
      let stderr = "";

      this.pyodide.setStdout({
        batched: (msg) => {
          stdout += msg + "\n";
        },
      });

      this.pyodide.setStderr({
        batched: (msg) => {
          stderr += msg + "\n";
        },
      });

      // Execute main file
      const mainContent = files[mainFile];
      if (!mainContent) {
        return {
          success: false,
          error: `Main file '${mainFile}' not found`,
        };
      }

      // Suppress warnings if matplotlib is loaded
      const hasMatplotlib = requirements.includes("matplotlib");
      if (hasMatplotlib) {
        await this.pyodide.runPythonAsync(`
import warnings
warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('webagg')
        `);
      }

      await this.pyodide.runPythonAsync(mainContent);

      // check if we need to execute tests
      let testCases;
      if (testJS) {
        const { executeTestJS } = await import("../testRunner");
        const context = {
          language: "python",
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          pyodide: this.pyodide,
        };

        testCases = await executeTestJS(testJS, context);
      }

      return {
        success: !stderr,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
        testContext: { pyodide: this.pyodide },
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
    if (!this.pyodide) return;

    try {
      // clear all user modules from sys.modules to force reimport
      try {
        this.pyodide.runPython(`
import sys
user_modules = [name for name in list(sys.modules.keys()) if not name.startswith('_') and name not in sys.builtin_module_names]
for module_name in user_modules:
    if module_name in sys.modules:
        del sys.modules[module_name]
        `);
      } catch (e) {
        console.warn("Error clearing Python modules:", e);
      }

      // clear files from filesystem
      const files = this.pyodide.FS.readdir("/home/pyodide");
      for (const file of files) {
        if (file !== "." && file !== "..") {
          try {
            this.pyodide.FS.unlink(`/home/pyodide/${file}`);
          } catch (e) {
            // ignore errors for directories or special files
          }
        }
      }
    } catch (error) {
      console.warn("Error during Python cleanup:", error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
