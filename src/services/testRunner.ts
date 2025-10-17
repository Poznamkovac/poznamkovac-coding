import { codeRunnerRegistry, type ExecutionResult, type TestCaseResult } from "./codeRunners";
import type { NotebookCell } from "../types";
import { parseTestMd, fetchTestMd } from "./testMdParser";

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
  const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/test.js`);
  const contentType = response.headers.get("content-type");
  const isJavaScript = contentType?.includes("javascript") || contentType?.includes("text/plain");

  return response.ok && isJavaScript ? await response.text() : null;
}

export async function fetchTestPy(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/test.py`);
  const contentType = response.headers.get("content-type");

  if (!response.ok || contentType?.includes("text/html")) {
    return null;
  }

  const text = await response.text();
  const isHtml = text.trim().toLowerCase().startsWith("<!doctype html>") || text.trim().toLowerCase().startsWith("<html");

  return isHtml ? null : text;
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
      return {
        score: 0,
        maxScore,
        passed: false,
        error: `No runner found for language: ${language}`,
      };
    }

    let result: ExecutionResult;

    // For Python tests, execute them differently
    if (testLanguage === 'python' && testContent) {
      result = await runner.execute(files, mainFile);

      // Run Python tests
      const context = {
        language: 'python',
        pyodide: (runner as any).pyodide,
        stdout: result.output || '',
        stderr: result.error || '',
      };

      const testCases = await executeTest(testContent, 'python', context);
      result.testCases = testCases;
    } else {
      // For JS tests or no tests, use the old method
      result = await runner.execute(files, mainFile, testContent);
    }

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

/**
 * Execute test code in the appropriate language (Python or JavaScript)
 * @param testCode - Test code to execute
 * @param testLanguage - Language of the test code ('python' or 'javascript')
 * @param context - Execution context
 * @returns Array of test case results
 */
export async function executeTest(
  testCode: string,
  testLanguage: string,
  context: any
): Promise<TestCaseResult[]> {
  if (testLanguage === "python") {
    // Execute Python test
    if (!context.pyodide) {
      return [
        {
          name: "Test initialization",
          passed: false,
          error: "Python runtime not available in context",
        },
      ];
    }

    const { PythonRunner } = await import("./codeRunners/pythonRunner");
    const runner = new PythonRunner();
    runner["pyodide"] = context.pyodide; // Access private field for test execution
    return await runner.executePythonTest(testCode, context);
  } else {
    // Execute JavaScript test
    return await executeTestJS(testCode, context);
  }
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

/**
 * Run tests for a notebook challenge
 * @param cells - All notebook cells
 * @param language - Language of the notebook (python, web, sqlite)
 * @param coursePath - Path to the course
 * @param challengeId - Challenge ID
 * @param uiLanguage - UI language (sk, en)
 * @param maxScore - Maximum score for the challenge
 * @param executeCellsUpTo - Function to execute cells up to a specific index
 * @returns Test results for all cells
 */
export async function runNotebookTests(
  cells: NotebookCell[],
  language: "python" | "web" | "sqlite",
  coursePath: string,
  challengeId: string,
  uiLanguage: string,
  maxScore: number,
  executeCellsUpTo: (cellIndex: number) => Promise<any>
): Promise<NotebookTestResult> {
  try {
    // Fetch test.md file
    const testMdContent = await fetchTestMd(coursePath, challengeId, uiLanguage);
    if (!testMdContent) {
      return {
        score: 0,
        maxScore,
        passed: false,
        cellResults: [
          {
            cellIndex: 0,
            cellId: "",
            testCases: [
              {
                name: "Test file loading",
                passed: false,
                error: "No test.md file found for this notebook",
              },
            ],
            passed: false,
          },
        ],
      };
    }

    // Get indices of editable cells only
    const editableCellIndices = cells
      .map((cell, index) => (!cell.readonly && !cell.hidden ? index : -1))
      .filter((index) => index !== -1);

    // Parse test.md to get test code for each editable cell
    const cellTests = parseTestMd(testMdContent, editableCellIndices, language);

    if (cellTests.length === 0) {
      return {
        score: 0,
        maxScore,
        passed: false,
        cellResults: [
          {
            cellIndex: 0,
            cellId: "",
            testCases: [
              {
                name: "Test parsing",
                passed: false,
                error: "No tests found in test.md",
              },
            ],
            passed: false,
          },
        ],
      };
    }

    // Run tests for each cell
    const cellResults: NotebookCellTestResult[] = [];
    let totalPassed = 0;

    for (const cellTest of cellTests) {
      const cell = cells[cellTest.cellIndex];

      // Execute all cells up to and including this cell
      const context = await executeCellsUpTo(cellTest.cellIndex);

      // Execute the test for this cell
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
      }
    }

    // Calculate score (equal weight for each tested cell)
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
    return {
      score: 0,
      maxScore,
      passed: false,
      cellResults: [
        {
          cellIndex: 0,
          cellId: "",
          testCases: [
            {
              name: "Test execution",
              passed: false,
              error: error.message || String(error),
            },
          ],
          passed: false,
        },
      ],
    };
  }
}
