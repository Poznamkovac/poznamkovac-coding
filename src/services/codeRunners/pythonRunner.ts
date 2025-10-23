import { type CodeRunner, type ExecutionResult, type TestCaseResult } from "./base";
import type { PyodideInterface } from "pyodide";

export class PythonRunner implements CodeRunner {
  language = "python";
  private pyodide: PyodideInterface | null = null;
  private initPromise: Promise<void> | null = null;
  private initialized = false;
  private requirementsInstalled = false;

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

  async execute(
    files: Record<string, string>,
    mainFile: string,
    testJS?: string,
    options?: { skipCleanup?: boolean; plotTargetId?: string }
  ): Promise<ExecutionResult> {
    if (!this.pyodide) {
      return {
        success: false,
        error: "Python runtime not initialized",
      };
    }

    try {
      if (!options?.skipCleanup) {
        await this.cleanup();
        this.requirementsInstalled = false;
      }
      const oldPlots = document.querySelectorAll('body > div[style*="display: inline-block"]');
      oldPlots.forEach((plot) => {
        if (plot.querySelector(".mpl-canvas, .mpl-toolbar")) {
          plot.remove();
        }
      });
      for (const [filename, content] of Object.entries(files)) {
        this.pyodide.FS.writeFile(filename, content);
      }

      // Install packages from requirements.txt only once (for non-bundled packages like seaborn)
      if (!this.requirementsInstalled && files["requirements.txt"]) {
        const reqLines = files["requirements.txt"]
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));

        if (reqLines.length > 0) {
          await this.pyodide.loadPackage("micropip");
          const micropip = this.pyodide.pyimport("micropip");
          await micropip.install(reqLines, { verbose: false });
        }

        this.requirementsInstalled = true;
      }
      let stdout = "";
      let stderr = "";

      this.pyodide.setStdout({
        batched: (msg) => {
          // filter out micropip noise
          if (msg === "No new packages to load" || msg.endsWith(" already loaded from default channel")) {
            return;
          }
          stdout += msg + "\n";
        },
      });

      this.pyodide.setStderr({
        batched: (msg) => {
          stderr += msg + "\n";
        },
      });
      const mainContent = files[mainFile];
      if (!mainContent) {
        return {
          success: false,
          error: `Main file '${mainFile}' not found`,
        };
      }

      // load packages from imports in the code before each run
      await this.pyodide.loadPackagesFromImports(mainContent);

      const requirements: string[] = [];
      if (files["requirements.txt"]) {
        const reqLines = files["requirements.txt"]
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));
        requirements.push(...reqLines);
      }

      // set the target element BEFORE importing matplotlib
      if (options?.plotTargetId) {
        const targetElement = document.getElementById(options.plotTargetId);
        if (targetElement) {
          (document as any).pyodideMplTarget = targetElement;
        }
      }

      await this.pyodide.runPythonAsync(`
import warnings
warnings.filterwarnings('ignore')

try:
  import matplotlib
  matplotlib.use('webagg')

  # set smaller default figure size to prevent resize loops
  import matplotlib.pyplot as plt
  plt.rcParams['figure.figsize'] = [8, 5]
  plt.rcParams['figure.dpi'] = 100
except ImportError:
  pass`);

      // Reset target and clean up old plots before each execution
      if (options?.plotTargetId) {
        const targetElement = document.getElementById(options.plotTargetId);
        if (targetElement) {
          (document as any).pyodideMplTarget = targetElement;
        }
      }

      this.pyodide.runPython(`
try:
  import matplotlib.pyplot as plt
  plt.close('all')
except ImportError:
  pass
        `);

      // execute code and capture last expression value
      const result = await this.pyodide.runPythonAsync(mainContent);

      // if there's a non-None result, add it to output
      let output = stdout.trim();
      if (result !== undefined && result !== null) {
        const resultStr = String(result);
        if (resultStr !== "None") {
          output = output ? `${output}\n${resultStr}` : resultStr;
        }
      }

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
        output,
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

  async cleanup(): Promise<void> {
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

  /**
   * Execute Python test code and return test results
   * @param testCode - Python test code to execute
   * @param context - Execution context (includes pyodide, stdout, stderr)
   * @returns Array of test case results
   */
  async executePythonTest(testCode: string, context: any): Promise<TestCaseResult[]> {
    if (!this.pyodide) {
      return [
        {
          name: "Test initialization",
          passed: false,
          error: "Python runtime not initialized",
        },
      ];
    }

    try {
      this.pyodide.globals.set(
        "context",
        this.pyodide.toPy({
          language: context.language || "python",
          stdout: context.stdout || "",
          stderr: context.stderr || "",
        })
      );
      const wrappedTestCode = `
import sys
from io import StringIO

# test code
${testCode}

if 'results' not in dir():
    results = [(False, "Test execution", "Test code must define a 'results' variable with test results")]

results`;

      const results = await this.pyodide.runPythonAsync(wrappedTestCode);
      const testCases: TestCaseResult[] = [];
      for (let i = 0; i < results.length; i++) {
        const [passed, name, error] = results[i];
        testCases.push({
          name: name || `Test ${i + 1}`,
          passed: Boolean(passed),
          error: error || undefined,
        });
      }

      return testCases;
    } catch (error: any) {
      return [
        {
          name: "Test execution",
          passed: false,
          error: error.message || String(error),
        },
      ];
    }
  }
}
