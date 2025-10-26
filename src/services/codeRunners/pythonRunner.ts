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
        const pyodideModule = await import("pyodide");
        const { loadPyodide } = pyodideModule;
        const version = (pyodideModule as any).version;

        this.pyodide = await loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
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

      const plotContainer = options?.plotTargetId ? document.getElementById(options.plotTargetId) : null;
      if (plotContainer) {
        plotContainer.innerHTML = "";
      }
      for (const [filename, content] of Object.entries(files)) {
        this.pyodide.FS.writeFile(filename, content);
      }

      if (!this.requirementsInstalled && files["micropip.txt"]) {
        const reqLines = files["micropip.txt"]
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

      await this.pyodide.loadPackagesFromImports(mainContent);

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
  import matplotlib.pyplot as plt
  plt.rcParams['figure.figsize'] = [8, 5]
  plt.rcParams['figure.dpi'] = 100
  plt.close('all')
except ImportError:
  pass`);

      // execute code and capture last expression value
      const result = await this.pyodide.runPythonAsync(mainContent);

      // Check if result is a matplotlib Axes or Figure object and trigger display
      if (result !== undefined && result !== null) {
        try {
          // Store the result in globals so we can check it
          this.pyodide.globals.set('_last_result', result);

          const isMatplotlibObj = await this.pyodide.runPythonAsync(`
result_type = type(_last_result).__module__ + '.' + type(_last_result).__name__
'matplotlib' in result_type
`);

          // If it's a matplotlib Axes or Figure, show it
          if (isMatplotlibObj) {
            await this.pyodide.runPythonAsync(`
try:
  fig = None
  if hasattr(_last_result, 'get_figure'):
    # It's an Axes object, get the figure
    fig = _last_result.get_figure()
  elif hasattr(_last_result, 'figure'):
    # It might be another matplotlib object with a figure attribute
    fig = _last_result.figure
  elif hasattr(_last_result, 'canvas'):
    # It's a Figure object
    fig = _last_result

  if fig is not None and hasattr(fig, 'canvas') and hasattr(fig.canvas, 'show'):
    fig.canvas.show()
except Exception as e:
  print(f"Error displaying matplotlib figure: {e}")
`);
          }
        } catch {
          // Ignore errors in matplotlib detection
        }
      }

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
      this.pyodide.runPython(`
import sys
user_modules = [name for name in list(sys.modules.keys()) if not name.startswith('_') and name not in sys.builtin_module_names]
for module_name in user_modules:
    if module_name in sys.modules:
        del sys.modules[module_name]
        `);

      const files = this.pyodide.FS.readdir("/home/pyodide");
      for (const file of files) {
        if (file !== "." && file !== "..") {
          try {
            this.pyodide.FS.unlink(`/home/pyodide/${file}`);
          } catch {
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

  async executePythonTest(testCode: string, context: any): Promise<TestCaseResult[]> {
    if (!this.pyodide) {
      return [{ name: "Test initialization", passed: false, error: "Python runtime not initialized" }];
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

      const results = await this.pyodide.runPythonAsync(`
import sys
from io import StringIO

${testCode}

results`);

      return results.toJs().map((result: any, i: number) => {
        const [passed, name, error] = result;
        return {
          name: name || `Test ${i + 1}`,
          passed: Boolean(passed),
          error: error || undefined,
        };
      });
    } catch (error: any) {
      return [{ name: "Test execution", passed: false, error: error.message || String(error) }];
    }
  }
}
