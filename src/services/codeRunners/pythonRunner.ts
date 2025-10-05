import { BaseCodeRunner, type ExecutionResult } from "./base";
import type { PyodideInterface } from "pyodide";

export class PythonRunner extends BaseCodeRunner {
  language = "python";
  private pyodide: PyodideInterface | null = null;
  private initPromise: Promise<void> | null = null;

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

  async execute(files: Record<string, string>, mainFile: string): Promise<ExecutionResult> {
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

# Use the webagg backend for interactive plots
import matplotlib
matplotlib.use('webagg')
        `);
      }

      await this.pyodide.runPythonAsync(mainContent);

      return {
        success: !stderr,
        output: stdout.trim(),
        error: stderr.trim() || undefined,
        testContext: { pyodide: this.pyodide },
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
      // Clear matplotlib figures if loaded
      try {
        this.pyodide.runPython(`
import sys
if 'matplotlib.pyplot' in sys.modules:
    import matplotlib.pyplot as plt
    plt.close('all')
        `);
      } catch (e) {
        // Matplotlib not loaded, skip
      }

      // Clear files from filesystem
      const files = this.pyodide.FS.readdir("/home/pyodide");
      for (const file of files) {
        if (file !== "." && file !== "..") {
          try {
            this.pyodide.FS.unlink(`/home/pyodide/${file}`);
          } catch (e) {
            // Ignore errors for directories or special files
          }
        }
      }
    } catch (error) {
      console.warn("Error during Python cleanup:", error);
    }
  }
}
