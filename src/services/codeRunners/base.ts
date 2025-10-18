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
  testContext?: any;
  testCases?: TestCaseResult[];
}

export interface ExecutionOptions {
  skipCleanup?: boolean;
  plotTargetId?: string;
}

export interface CodeRunner {
  language: string;
  initialize(): Promise<void>;
  execute(files: Record<string, string>, mainFile: string, testJS?: string, options?: ExecutionOptions): Promise<ExecutionResult>;
  cleanup(): void;
  isInitialized(): boolean;
}
