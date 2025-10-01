export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  imageData?: string;
  htmlContent?: string;
}

export interface CodeRunner {
  language: string;
  initialize(): Promise<void>;
  execute(files: Record<string, string>, mainFile: string): Promise<ExecutionResult>;
  cleanup(): void;
  isInitialized(): boolean;
}

export abstract class BaseCodeRunner implements CodeRunner {
  abstract language: string;
  protected initialized = false;

  abstract initialize(): Promise<void>;
  abstract execute(files: Record<string, string>, mainFile: string): Promise<ExecutionResult>;

  cleanup(): void {
    // Default implementation - can be overridden
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
