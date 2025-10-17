export interface TestCaseResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  htmlContent?: string;
  testContext?: any; // Context object for test execution (e.g., pyodide instance, database, DOM)
  testCases?: TestCaseResult[]; // Test case results if test.js was executed
}

export interface ExecutionOptions {
  skipCleanup?: boolean; // For notebooks to preserve environment between cells
  plotTargetId?: string; // ID of DOM element where matplotlib plots should be rendered
}

export interface CodeRunner {
  language: string;
  initialize(): Promise<void>;
  execute(files: Record<string, string>, mainFile: string, testJS?: string, options?: ExecutionOptions): Promise<ExecutionResult>;
  cleanup(): void;
  isInitialized(): boolean;
}
