import { codeRunnerRegistry, type ExecutionResult } from "./codeRunners";

export interface TestResult {
  score: number;
  maxScore: number;
  passed: boolean;
  feedback?: string;
  output?: string;
  error?: string;
}

export async function runTests(
  language: string,
  files: Record<string, string>,
  testFile: string,
  maxScore: number,
  metadata?: { mainFile?: string },
): Promise<TestResult> {
  try {
    const runner = await codeRunnerRegistry.getOrInitializeRunner(language);

    if (!runner) {
      return {
        score: 0,
        maxScore,
        passed: false,
        error: `No runner found for language: ${language}`,
      };
    }

    // Check if this is a JS test file
    if (testFile === "test.js") {
      // First, find and execute the main file to set up the environment
      console.log("[TestRunner] Metadata:", metadata);
      const mainFile = metadata?.mainFile;

      if (!mainFile) {
        throw new Error("mainFile not found in metadata");
      }

      // Execute the main code first to set up the environment
      const result: ExecutionResult = await runner.execute(files, mainFile);

      // Check for execution errors first (stderr)
      if (result.error && result.error.trim().length > 0) {
        console.log("[TestRunner] Execution failed with stderr:", result.error);
        return {
          score: 0,
          maxScore,
          passed: false,
          feedback: "Program skončil s chybou",
          error: result.error,
          output: result.output,
        };
      }

      // Create test context
      const context = {
        language,
        stdout: result.output || "",
        stderr: result.error || "",
        ...(result.testContext || {}), // Spread language-specific context (pyodide, sqlite, dom)
      };

      console.log("[TestRunner] Running test.js with context:", {
        language,
        hasStdout: !!context.stdout,
        hasStderr: !!context.stderr,
        contextKeys: Object.keys(result.testContext || {}),
      });

      const testCode = files["test.js"];
      if (!testCode) {
        return {
          score: 0,
          maxScore,
          passed: false,
          error: "test.js file not found",
        };
      }

      try {
        // Create and execute test function
        // Wrap in async IIFE to handle async test functions
        const testWrapper = `
          ${testCode}

          if (typeof test !== 'function') {
            throw new Error('test.js must export a test(context) function');
          }

          return (async function() {
            try {
              const result = await test(context);
              return result;
            } catch (error) {
              return {
                passed: false,
                score: 0,
                feedback: 'Test error: ' + error.message,
                error: error.stack
              };
            }
          })();
        `;

        // Execute test in a sandboxed environment
        const testFunction = new Function("context", "console", testWrapper);
        console.log("[TestRunner] Test function:", testFunction.toString());
        const testResult = await testFunction(context, console);

        // Validate test result format
        if (!testResult || typeof testResult !== "object") {
          throw new Error("Test function must return an object with { passed, score, feedback }");
        }

        return {
          score: testResult.score || 0,
          maxScore,
          passed: testResult.passed || false,
          feedback: testResult.feedback || (testResult.passed ? "All tests passed!" : "Some tests failed"),
          output: result.output,
          error: testResult.error,
        };
      } catch (error: any) {
        console.error("[TestRunner] Test execution error:", error);
        return {
          score: 0,
          maxScore,
          passed: false,
          error: `Test execution error: ${error.message}`,
          output: result.output,
        };
      }
    } else {
      // Legacy test execution for Python test files
      const result: ExecutionResult = await runner.execute(files, testFile);

      if (!result.success) {
        return {
          score: 0,
          maxScore,
          passed: false,
          error: result.error,
          output: result.output,
        };
      }

      // Parse test output
      const output = result.output || "";
      const lines = output.split("\n");

      let passed = false;
      let score = 0;
      let feedback = "";

      for (const line of lines) {
        const trimmed = line.trim();

        // Check for failure indicators
        if (
          trimmed.startsWith("✗") ||
          trimmed.startsWith("FAIL") ||
          trimmed.includes("AssertionError") ||
          (trimmed.includes("assert") && trimmed.includes("False"))
        ) {
          passed = false;
          score = 0;
          feedback = trimmed;
          break;
        }

        // Check for success indicators
        if (trimmed === "OK" || trimmed.startsWith("✓") || trimmed.startsWith("PASS")) {
          passed = true;
          score = maxScore;
        }

        // Check for explicit score
        const scoreMatch = trimmed.match(/SCORE:\s*(\d+)\s*\/\s*(\d+)/i);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1], 10);
          const max = parseInt(scoreMatch[2], 10);
          passed = score === max;
        }

        // Collect feedback
        if (trimmed.startsWith("FEEDBACK:")) {
          feedback = trimmed.substring(9).trim();
        }
      }

      return {
        score: passed ? maxScore : 0,
        maxScore,
        passed,
        feedback: feedback || (passed ? "All tests passed!" : "Some tests failed"),
        output: result.output,
      };
    }
  } catch (error: any) {
    console.error("[TestRunner] Runner error:", error);
    return {
      score: 0,
      maxScore,
      passed: false,
      error: error.message || String(error),
    };
  }
}
