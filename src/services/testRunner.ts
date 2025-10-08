import { codeRunnerRegistry, type ExecutionResult, type TestCaseResult } from "./codeRunners";

export interface TestResult {
  score: number;
  maxScore: number;
  passed: boolean;
  feedback?: string;
  output?: string;
  error?: string;
  testCases?: TestCaseResult[];
}

/**
 * Fetches test.js file from the challenge directory
 */
export async function fetchTestJS(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  try {
    const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/test.js`);
    const contentType = response.headers.get("content-type");
    const isJavaScript = contentType?.includes("javascript") || contentType?.includes("text/plain");

    if (response.ok && isJavaScript) {
      return await response.text();
    }
  } catch {
    // test.js doesn't exist
  }
  return null;
}

export async function runTests(
  language: string,
  files: Record<string, string>,
  maxScore: number,
  mainFile: string,
  testJSContent?: string,
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

    // Execute the code (test.js is passed separately, not in files)
    const result: ExecutionResult = await runner.execute(files, mainFile, testJSContent);

    // Simple rule: if there are errors, tests fail
    const hasError = result.error && result.error.trim().length > 0;
    const testCases = result.testCases || [];
    const allTestsPassed = testCases.length > 0 && testCases.every((tc) => tc.passed);
    const passed = !hasError && (!testCases.length || allTestsPassed);

    return {
      score: passed ? maxScore : 0,
      maxScore,
      passed,
      feedback: hasError ? "Program ended with an error" : passed ? "All tests passed!" : "Some tests failed",
      output: result.output,
      error: result.error,
      testCases,
    };
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

export async function executeTestJS(testJSCode: string, context: any): Promise<TestCaseResult[]> {
  try {
    const testFunction = new Function(
      "context",
      "console",
      `
      return (async function(ctx) {
        ${testJSCode}

        if (typeof test !== 'function') {
          return [{
            name: 'Test setup',
            passed: false,
            error: 'test.js must define a test(context) function'
          }];
        }

        const results = await test(ctx);
        return Array.isArray(results) ? results : [results];
      })(context);
    `,
    );

    return await testFunction(context, console);
  } catch (error: any) {
    return [
      {
        name: "Test execution",
        passed: false,
        error: error.message,
      },
    ];
  }
}
