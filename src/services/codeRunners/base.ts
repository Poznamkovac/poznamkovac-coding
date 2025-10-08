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

export interface CodeRunner {
  language: string;
  initialize(): Promise<void>;
  execute(files: Record<string, string>, mainFile: string, testJS?: string): Promise<ExecutionResult>;
  cleanup(): void;
  isInitialized(): boolean;
}

export abstract class BaseCodeRunner implements CodeRunner {
  abstract language: string;
  protected initialized = false;

  abstract initialize(): Promise<void>;
  abstract execute(files: Record<string, string>, mainFile: string, testJS?: string): Promise<ExecutionResult>;

  cleanup(): void {
    // Default implementation - can be overridden
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
