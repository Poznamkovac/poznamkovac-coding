import { codeRunnerRegistry, type ExecutionResult, type TestCaseResult } from "./codeRunners";
import type { NotebookCell } from "../types";
import { parseTestMd, fetchTestMd } from "./testMdParser";
import { fetchTextAsset } from "../utils/fetchAsset";

export interface TestResult {
  score: number;
  maxScore: number;
  passed: boolean;
  feedback?: string;
  output?: string;
  error?: string;
  testCases?: TestCaseResult[];
}

export async function fetchTestJS(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  return await fetchTextAsset(`/${language}/data/${coursePath}/${challengeId}/test.js`);
}

export async function fetchTestPy(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  return await fetchTextAsset(`/${language}/data/${coursePath}/${challengeId}/test.py`);
}

export async function runTests(
  language: string,
  files: Record<string, string>,
  maxScore: number,
  mainFile: string,
  testContent?: string,
  testLanguage?: string,
): Promise<TestResult> {
  try {
    const runner = await codeRunnerRegistry.getOrInitializeRunner(language);

    if (!runner) {
      return { score: 0, maxScore, passed: false, error: `No runner found for language: ${language}` };
    }

    let result: ExecutionResult;

    if (testLanguage === "python" && testContent) {
      result = await runner.execute(files, mainFile);

      const context = {
        language: "python",
        pyodide: (runner as any).pyodide,
        stdout: result.output || "",
        stderr: result.error || "",
      };

      result.testCases = await executeTest(testContent, "python", context);
    } else {
      result = await runner.execute(files, mainFile, testContent);
    }

    const hasError = (result.error?.trim().length ?? 0) > 0;
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
    return { score: 0, maxScore, passed: false, error: error.message || String(error) };
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

export async function executeTest(testCode: string, testLanguage: string, context: any): Promise<TestCaseResult[]> {
  if (testLanguage === "python") {
    if (!context.pyodide) {
      return [{ name: "Test initialization", passed: false, error: "Python runtime not available in context" }];
    }

    const { PythonRunner } = await import("./codeRunners/pythonRunner");
    const runner = new PythonRunner();
    runner["pyodide"] = context.pyodide;
    return await runner.executePythonTest(testCode, context);
  }
  return await executeTestJS(testCode, context);
}

export interface NotebookCellTestResult {
  cellIndex: number;
  cellId: string;
  testCases: TestCaseResult[];
  passed: boolean;
  error?: string;
}

export interface NotebookTestResult {
  score: number;
  maxScore: number;
  passed: boolean;
  cellResults: NotebookCellTestResult[];
}

const createNotebookErrorResult = (
  maxScore: number,
  errorName: string,
  errorMessage: string,
): NotebookTestResult => ({
  score: 0,
  maxScore,
  passed: false,
  cellResults: [
    {
      cellIndex: 0,
      cellId: "",
      testCases: [{ name: errorName, passed: false, error: errorMessage }],
      passed: false,
    },
  ],
});

export async function runNotebookTests(
  cells: NotebookCell[],
  language: "python" | "web" | "sqlite",
  coursePath: string,
  challengeId: string,
  uiLanguage: string,
  maxScore: number,
  executeCellsUpTo: (cellIndex: number) => Promise<any>,
  options?: { failFast?: boolean; specificCellIndex?: number },
): Promise<NotebookTestResult> {
  try {
    const testMdContent = await fetchTestMd(coursePath, challengeId, uiLanguage);
    if (!testMdContent) {
      return createNotebookErrorResult(maxScore, "Test file loading", "No test.md file found for this notebook");
    }

    const editableCellIndices = cells
      .map((cell, index) => (!cell.readonly && !cell.hidden ? index : -1))
      .filter((index) => index !== -1);
    const cellTests = parseTestMd(testMdContent, editableCellIndices, language);

    if (cellTests.length === 0) {
      return createNotebookErrorResult(maxScore, "Test parsing", "No tests found in test.md");
    }

    const cellResults: NotebookCellTestResult[] = [];
    let totalPassed = 0;
    const testsToRun =
      options?.specificCellIndex !== undefined
        ? cellTests.filter((test) => test.cellIndex === options.specificCellIndex)
        : cellTests;

    for (const cellTest of testsToRun) {
      const cell = cells[cellTest.cellIndex];

      if (options?.failFast && cell.error) {
        cellResults.push({
          cellIndex: cellTest.cellIndex,
          cellId: cell.id,
          testCases: [{ name: "Cell execution", passed: false, error: `Cell execution failed: ${cell.error}` }],
          passed: false,
        });
        break;
      }

      const context = await executeCellsUpTo(cellTest.cellIndex);
      const testCases = await executeTest(cellTest.testCode, cellTest.language, context);
      const allTestsPassed = testCases.every((tc) => tc.passed);

      cellResults.push({
        cellIndex: cellTest.cellIndex,
        cellId: cell.id,
        testCases,
        passed: allTestsPassed,
      });

      if (allTestsPassed) {
        totalPassed++;
      } else if (options?.failFast) {
        break;
      }
    }

    const scorePerCell = maxScore / cellTests.length;
    const score = Math.round(totalPassed * scorePerCell);
    const allPassed = totalPassed === cellTests.length;

    return {
      score,
      maxScore,
      passed: allPassed,
      cellResults,
    };
  } catch (error: any) {
    return createNotebookErrorResult(maxScore, "Test execution", error.message || String(error));
  }
}

export async function runNotebookTestsFailFast(
  cells: NotebookCell[],
  language: "python" | "web" | "sqlite",
  coursePath: string,
  challengeId: string,
  uiLanguage: string,
  maxScore: number,
  executeCellsUpTo: (cellIndex: number) => Promise<any>,
): Promise<NotebookTestResult> {
  return runNotebookTests(cells, language, coursePath, challengeId, uiLanguage, maxScore, executeCellsUpTo, {
    failFast: true,
  });
}
