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
  maxScore: number
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
    // Expected format:
    // - Lines starting with "✓" or "PASS" indicate success
    // - Lines starting with "✗" or "FAIL" or "AssertionError" indicate failure
    // - Score can be indicated with "SCORE: X/Y" format

    const output = result.output || "";
    const lines = output.split("\n");

    let passed = true;
    let score = maxScore;
    let feedback = "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for failure indicators
      if (
        trimmed.startsWith("✗") ||
        trimmed.startsWith("FAIL") ||
        trimmed.includes("AssertionError") ||
        trimmed.includes("assert") && trimmed.includes("False")
      ) {
        passed = false;
        score = 0;
        feedback = trimmed;
        break;
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
      score,
      maxScore,
      passed,
      feedback: feedback || (passed ? "Všetky testy prešli!" : "Niektoré testy zlyhali."),
      output: result.output,
    };
  } catch (error: any) {
    return {
      score: 0,
      maxScore,
      passed: false,
      error: error.message || String(error),
    };
  }
}
