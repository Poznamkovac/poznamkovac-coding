import type { CodeRunner } from "./base";
import { PythonRunner } from "./pythonRunner";
import { WebRunner } from "./webRunner";

class CodeRunnerRegistry {
  private runners: Map<string, CodeRunner> = new Map();

  constructor() {
    this.registerRunner(new PythonRunner());
    this.registerRunner(new WebRunner());
  }

  registerRunner(runner: CodeRunner): void {
    this.runners.set(runner.language, runner);
  }

  getRunner(language: string): CodeRunner | undefined {
    return this.runners.get(language);
  }

  async getOrInitializeRunner(language: string): Promise<CodeRunner | undefined> {
    const runner = this.getRunner(language);
    if (runner && !runner.isInitialized()) {
      await runner.initialize();
    }
    return runner;
  }
}

export const codeRunnerRegistry = new CodeRunnerRegistry();
export type { CodeRunner, ExecutionResult } from "./base";
