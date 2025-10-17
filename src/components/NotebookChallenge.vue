<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import CodeEditor from "./CodeEditor.vue";
import { highlightCode } from "../utils/syntaxHighlight";
import { codeRunnerRegistry } from "../services/codeRunners";
import { storageService } from "../services/storage";
import type { NotebookChallengeData, NotebookCell } from "../types";

export default defineComponent({
  name: "NotebookChallenge",

  components: {
    CodeEditor,
  },

  props: {
    challengeData: {
      type: Object as PropType<NotebookChallengeData>,
      required: true,
    },
    coursePath: {
      type: String,
      required: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
  },

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      cells: [] as NotebookCell[],
      markdownSections: [] as string[],
      focusedCellId: null as string | null,
      isRunning: false,
      isRunningAll: false,
      hasExecutedMustExecute: false,
      saveTimer: null as number | null,
      requirementsTxt: null as string | null,
      isRunningTests: false,
      testResults: null as any,
    };
  },

  computed: {
    runnerLanguage(): "python" | "web" | "sqlite" {
      return this.challengeData.language || "python";
    },

    visibleCells(): NotebookCell[] {
      return this.cells.filter((cell) => !cell.hidden);
    },
  },

  async mounted() {
    // Initialize cells and markdown sections from challenge data
    this.cells = JSON.parse(JSON.stringify(this.challengeData.cells));
    this.markdownSections = [...this.challengeData.markdownSections];

    // Load requirements.txt if it exists (for Python notebooks)
    if (this.runnerLanguage === "python") {
      await this.loadRequirementsTxt();
    }

    // Load saved cell contents from storage
    await this.loadCellsFromStorage();
  },

  beforeUnmount() {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
    }
  },

  methods: {
    async loadRequirementsTxt() {
      try {
        const lang = this.language === "auto" ? "sk" : this.language;
        const requirementsPath = `/${lang}/data/${this.coursePath}/${this.challengeId}/requirements.txt`;
        const response = await fetch(requirementsPath);

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          // Check if we got HTML instead of the actual file (404 fallback to index.html)
          if (contentType?.includes("text/html")) {
            console.log("No requirements.txt found (optional)");
            return;
          }

          const text = await response.text();
          // Double-check content isn't HTML
          if (text.trim().toLowerCase().startsWith("<!doctype html>") || text.trim().toLowerCase().startsWith("<html")) {
            console.log("No requirements.txt found (optional)");
            return;
          }

          this.requirementsTxt = text;
          console.log("Loaded requirements.txt");
        }
      } catch (error) {
        // requirements.txt is optional, so no error if not found
        console.log("No requirements.txt found (optional)");
      }
    },

    async loadCellsFromStorage() {
      for (let i = 0; i < this.cells.length; i++) {
        const savedCode = await storageService.getEditorCode(
          this.coursePath,
          this.challengeId,
          this.cells[i].id,
          this.language
        );
        if (savedCode !== null) {
          this.cells[i].code = savedCode;
        }
      }
    },

    getCellIndex(cellId: string): number {
      return this.cells.findIndex((c) => c.id === cellId);
    },

    handleCellClick(cellId: string) {
      const cell = this.cells.find((c) => c.id === cellId);
      if (cell && !cell.readonly) {
        this.focusedCellId = cellId;
      }
    },

    handleCellBlur() {
      // Keep cell focused to maintain Monaco editor
      // We'll only unfocus when clicking another cell
    },

    handleCellUpdate(cellId: string, newCode: string) {
      const cellIndex = this.getCellIndex(cellId);
      if (cellIndex !== -1) {
        this.cells[cellIndex].code = newCode;

        // Auto-execute if autoreload is enabled for this cell
        const cell = this.cells[cellIndex];
        if (cell.autoreload && this.runnerLanguage === "web") {
          // Debounced auto-execution for web cells with autoreload
          if (this.saveTimer) {
            window.clearTimeout(this.saveTimer);
          }

          this.saveTimer = window.setTimeout(async () => {
            // Save to storage
            storageService.setEditorCode(
              this.coursePath,
              this.challengeId,
              cellId,
              newCode,
              this.language
            );

            // Auto-execute the cell
            await this.runCell(cellId);
          }, 500);
        } else {
          // Just save without auto-execution
          if (this.saveTimer) {
            window.clearTimeout(this.saveTimer);
          }

          this.saveTimer = window.setTimeout(() => {
            storageService.setEditorCode(
              this.coursePath,
              this.challengeId,
              cellId,
              newCode,
              this.language
            );
          }, 500);
        }
      }
    },

    getHighlightedCode(code: string): string {
      return highlightCode(code, this.runnerLanguage);
    },

    getWebCellHTML(cellIndex: number): string {
      // Return the stored output (set by executeWebCell) or empty string
      const cell = this.cells[cellIndex];
      if (!cell || !cell.output) return '';
      return cell.output;
    },

    getCodeWithLineNumbers(code: string): string {
      const lines = code.split('\n');
      const highlighted = highlightCode(code, this.runnerLanguage);
      const highlightedLines = highlighted.split('\n');

      return highlightedLines.map((line, index) => {
        const lineNum = (index + 1).toString().padStart(lines.length.toString().length, ' ');
        return `<span class="line-number">${lineNum}</span>${line}`;
      }).join('\n');
    },

    getCellHeight(code: string): string {
      // Calculate height based on number of lines (Monaco line height 19px)
      const lineCount = code.split('\n').length;
      const lineHeight = 19;
      const minHeight = 60;
      const calculatedHeight = lineCount * lineHeight;
      return `${Math.max(minHeight, calculatedHeight)}px`;
    },

    async runCell(cellId: string) {
      await this.executeCells([cellId]);
    },

    async runAllCells() {
      this.isRunningAll = true;
      const cellIds = this.cells.map((c) => c.id);
      await this.executeCells(cellIds);
      this.isRunningAll = false;
    },

    async executeCells(cellIds: string[]) {
      if (this.isRunning) return;

      this.isRunning = true;

      try {
        const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
        if (!runner) {
          throw new Error(`No runner available for ${this.runnerLanguage}`);
        }

        // Execute mustExecute cells first if not yet executed
        if (!this.hasExecutedMustExecute) {
          const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
          for (const cell of mustExecuteCells) {
            await this.executeCell(runner, cell);
          }
          this.hasExecutedMustExecute = true;
        }

        // Execute requested cells
        for (const cellId of cellIds) {
          const cell = this.cells.find((c) => c.id === cellId);
          if (cell && !cell.mustExecute) {
            // Skip mustExecute cells since they're already run
            await this.executeCell(runner, cell);
          }
        }
      } catch (error: any) {
        console.error("Execution error:", error);
      } finally {
        this.isRunning = false;
      }
    },

    async executeCell(runner: any, cell: NotebookCell) {
      const cellIndex = this.getCellIndex(cell.id);
      if (cellIndex === -1) return;

      try {
        // Clear previous output
        this.cells[cellIndex].output = undefined;
        this.cells[cellIndex].error = undefined;

        // Clear previous matplotlib plots from the target container
        const plotTargetId = `plot-target-${cell.id}`;
        const plotTarget = document.getElementById(plotTargetId);
        if (plotTarget) {
          plotTarget.innerHTML = '';
        }

        // Handle web notebooks differently to maintain shared context
        if (this.runnerLanguage === "web") {
          await this.executeWebCell(cell, cellIndex);
          return;
        }

        // Wait for next tick to ensure DOM is updated
        await this.$nextTick();

        // Prepare files for execution
        const files: Record<string, string> = { "main": cell.code };

        // Include requirements.txt for Python if available
        if (this.runnerLanguage === "python" && this.requirementsTxt) {
          files["requirements.txt"] = this.requirementsTxt;
        }

        const result = await runner.execute(files, "main", undefined, {
          skipCleanup: true,
          plotTargetId
        });

        if (result.success) {
          this.cells[cellIndex].output = result.htmlContent || result.output || "";
        } else {
          this.cells[cellIndex].error = result.error || "Unknown error";
        }
      } catch (error: any) {
        this.cells[cellIndex].error = error.message || String(error);
      }
    },

    async executeWebCell(cell: NotebookCell, cellIndex: number) {
      try {
        // Simple approach: just mark as executed, the iframe will render the cell's code directly
        this.cells[cellIndex].output = cell.code;
      } catch (error: any) {
        this.cells[cellIndex].error = error.message || String(error);
      }
    },


    async resetEnvironment() {
      const message = this.t("challenge.resetConfirm");
      if (confirm(message)) {
        this.hasExecutedMustExecute = false;

        // Clear all outputs
        for (const cell of this.cells) {
          cell.output = undefined;
          cell.error = undefined;
        }

        // Reinitialize runner (for Python/SQLite)
        const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
        if (runner && runner.cleanup) {
          await runner.cleanup();
        }

        // Clear test results
        this.testResults = null;
      }
    },

    async runTests() {
      if (this.isRunningTests || this.isRunning) return;

      this.isRunningTests = true;
      this.testResults = null;

      try {
        const { runNotebookTests } = await import("../services/testRunner");

        // Create a function to execute cells up to a specific index
        const executeCellsUpTo = async (cellIndex: number) => {
          const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
          if (!runner) {
            throw new Error(`No runner available for ${this.runnerLanguage}`);
          }

          // Execute mustExecute cells first if not yet executed
          if (!this.hasExecutedMustExecute) {
            const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
            for (const cell of mustExecuteCells) {
              await this.executeCell(runner, cell);
            }
            this.hasExecutedMustExecute = true;
          }

          // Execute all cells up to and including cellIndex
          for (let i = 0; i <= cellIndex; i++) {
            const cell = this.cells[i];
            if (!cell.mustExecute) {
              await this.executeCell(runner, cell);
            }
          }

          // Return context for testing
          if (this.runnerLanguage === 'web') {
            // For web notebooks, build combined HTML and create DOM context
            let combinedHTML = '';
            for (let i = 0; i <= cellIndex; i++) {
              const cell = this.cells[i];
              if (cell.output) {
                combinedHTML += cell.code + '\n';
              }
            }

            // Create a temporary iframe to get DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!DOCTYPE html><html><head></head><body>${combinedHTML}</body></html>`, 'text/html');

            return {
              language: 'web',
              dom: doc,
              window: window,
            };
          } else if (this.runnerLanguage === 'sqlite') {
            // For SQLite, execute the target cell to get its results
            const targetCell = this.cells[cellIndex];
            const files: Record<string, string> = { "main.sql": targetCell.code };
            const result = await runner.execute(files, "main.sql", undefined, { skipCleanup: true });
            return result.testContext || {};
          } else {
            // For Python, get context from pyodide
            return {
              language: 'python',
              pyodide: (runner as any).pyodide,
              stdout: '',
              stderr: ''
            };
          }
        };

        const results = await runNotebookTests(
          this.cells,
          this.runnerLanguage,
          this.coursePath,
          this.challengeId,
          this.language,
          this.challengeData.maxScore,
          executeCellsUpTo
        );

        this.testResults = results;

        // Emit score update event
        this.$emit("score-update", results.score);
      } catch (error: any) {
        console.error("Test execution error:", error);
        alert(`Test error: ${error.message}`);
      } finally {
        this.isRunningTests = false;
      }
    },

    getCellTestResults(cellId: string) {
      if (!this.testResults || !this.testResults.cellResults) return null;
      return this.testResults.cellResults.find((r: any) => r.cellId === cellId);
    },

    async runCellTests(cellId: string) {
      if (this.isRunningTests || this.isRunning) return;

      const cellIndex = this.getCellIndex(cellId);
      if (cellIndex === -1) return;

      this.isRunningTests = true;

      try {
        const { runNotebookTests } = await import("../services/testRunner");

        // Create a function to execute cells up to a specific index
        const executeCellsUpTo = async (targetCellIndex: number) => {
          const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
          if (!runner) {
            throw new Error(`No runner available for ${this.runnerLanguage}`);
          }

          // Execute mustExecute cells first if not yet executed
          if (!this.hasExecutedMustExecute) {
            const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
            for (const cell of mustExecuteCells) {
              await this.executeCell(runner, cell);
            }
            this.hasExecutedMustExecute = true;
          }

          // Execute all cells up to and including targetCellIndex
          for (let i = 0; i <= targetCellIndex; i++) {
            const cell = this.cells[i];
            if (!cell.mustExecute) {
              await this.executeCell(runner, cell);
            }
          }

          // Return context for testing
          if (this.runnerLanguage === 'web') {
            // For web notebooks, build combined HTML and create DOM context
            let combinedHTML = '';
            for (let i = 0; i <= targetCellIndex; i++) {
              const cell = this.cells[i];
              if (cell.output) {
                combinedHTML += cell.code + '\n';
              }
            }

            // Create a temporary iframe to get DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!DOCTYPE html><html><head></head><body>${combinedHTML}</body></html>`, 'text/html');

            return {
              language: 'web',
              dom: doc,
              window: window,
            };
          } else if (this.runnerLanguage === 'sqlite') {
            // For SQLite, execute the target cell to get its results
            const targetCell = this.cells[targetCellIndex];
            const files: Record<string, string> = { "main.sql": targetCell.code };
            const result = await runner.execute(files, "main.sql", undefined, { skipCleanup: true });
            return result.testContext || {};
          } else {
            // For Python, get context from pyodide
            return {
              language: 'python',
              pyodide: (runner as any).pyodide,
              stdout: '',
              stderr: ''
            };
          }
        };

        // Only test the specific cell by filtering cells
        const singleCellArray = [this.cells[cellIndex]];

        const results = await runNotebookTests(
          singleCellArray,
          this.runnerLanguage,
          this.coursePath,
          this.challengeId,
          this.language,
          this.challengeData.maxScore,
          executeCellsUpTo
        );

        // Update test results for this specific cell
        if (!this.testResults) {
          this.testResults = {
            score: 0,
            maxScore: this.challengeData.maxScore,
            passed: false,
            cellResults: []
          };
        }

        // Remove old result for this cell if exists
        this.testResults.cellResults = this.testResults.cellResults.filter(
          (r: any) => r.cellId !== cellId
        );

        // Add new result
        if (results.cellResults.length > 0) {
          const cellResult = results.cellResults[0];
          cellResult.cellIndex = cellIndex;
          cellResult.cellId = cellId;
          this.testResults.cellResults.push(cellResult);
        }

        // Recalculate overall score based on all cell results
        const totalCells = this.testResults.cellResults.length;
        const passedCells = this.testResults.cellResults.filter((r: any) => r.passed).length;
        if (totalCells > 0) {
          this.testResults.score = Math.round((passedCells / totalCells) * this.challengeData.maxScore);
          this.testResults.passed = passedCells === totalCells;
        }
      } catch (error: any) {
        console.error("Cell test execution error:", error);
        alert(`Test error: ${error.message}`);
      } finally {
        this.isRunningTests = false;
      }
    },
  },
});
</script>

<template>
  <div class="notebook-challenge">
    <div class="actions-bar">
      <button
        @click="runAllCells"
        :disabled="isRunning || isRunningAll"
        class="btn btn-primary"
      >
        <span class="btn-icon">{{ isRunning || isRunningAll ? "⏳" : "▶️" }}</span>
        {{ isRunning || isRunningAll ? t("challenge.running") : "Run All Cells" }}
      </button>
      <button
        @click="runTests"
        :disabled="isRunningTests || isRunning"
        class="btn btn-success"
      >
        <span class="btn-icon">{{ isRunningTests ? "⏳" : "✓" }}</span>
        {{ isRunningTests ? "Running Tests..." : "Run Tests" }}
      </button>
      <button @click="resetEnvironment" class="btn btn-secondary">
        <span class="btn-icon">↻</span>
        {{ t("challenge.reset") }}
      </button>
    </div>

    <!-- Test Results Summary -->
    <div v-if="testResults" class="test-results-summary" :class="{ passed: testResults.passed, failed: !testResults.passed }">
      <div class="test-summary-header">
        <span class="test-icon">{{ testResults.passed ? "✅" : "❌" }}</span>
        <span class="test-summary-text">
          {{ testResults.passed ? "All tests passed!" : "Some tests failed" }}
        </span>
        <span class="test-score">Score: {{ testResults.score }} / {{ testResults.maxScore }}</span>
      </div>
    </div>

    <div class="notebook-container">
      <template v-for="(cell, index) in visibleCells" :key="cell.id">
        <!-- Markdown section before cell -->
        <div
          v-if="markdownSections[index]"
          class="markdown-section"
          v-html="markdownSections[index]"
        ></div>

        <!-- Cell -->
        <div
          class="notebook-cell"
          :class="{
            focused: focusedCellId === cell.id,
            readonly: cell.readonly,
            'has-output': cell.output || cell.error,
          }"
          @click="handleCellClick(cell.id)"
        >
          <!-- Cell input -->
          <div class="cell-input">
            <div class="cell-prompt">In [{{ index + 1 }}]:</div>
            <div class="cell-code" :style="{ height: getCellHeight(cell.code) }">
              <!-- Monaco editor for focused cell -->
              <CodeEditor
                v-if="focusedCellId === cell.id"
                :content="cell.code"
                :filename="`${cell.id}.${runnerLanguage === 'python' ? 'py' : runnerLanguage === 'sqlite' ? 'sql' : 'html'}`"
                :readonly="cell.readonly"
                :challenge-key="`${coursePath}/${challengeId}/${cell.id}`"
                @update:content="(newCode) => handleCellUpdate(cell.id, newCode)"
                @blur="handleCellBlur"
              />
              <!-- Syntax highlighted code for unfocused cells -->
              <pre
                v-else
                class="cell-code-highlight"
                v-html="getCodeWithLineNumbers(cell.code)"
              ></pre>
            </div>
            <div v-if="!cell.readonly" class="cell-actions">
              <button
                @click.stop="runCell(cell.id)"
                :disabled="isRunning"
                class="cell-run-btn"
                title="Run cell"
              >
                ▶
              </button>
              <button
                @click.stop="runCellTests(cell.id)"
                :disabled="isRunningTests || isRunning"
                class="cell-test-btn"
                title="Test cell"
              >
                ✓
              </button>
            </div>
          </div>

          <!-- Cell output -->
          <div v-if="cell.output || cell.error" class="cell-output">
            <div class="cell-prompt">Out [{{ index + 1 }}]:</div>
            <div class="cell-result">
              <div v-if="cell.error" class="cell-error">
                <pre>{{ cell.error }}</pre>
              </div>
              <div v-else-if="cell.output" class="cell-output-content">
                <!-- Web cell output - simple iframe with cell's HTML -->
                <iframe
                  v-if="runnerLanguage === 'web'"
                  :key="cell.output"
                  :srcdoc="getWebCellHTML(index)"
                  class="web-cell-output-iframe"
                ></iframe>
                <!-- HTML output (for dataframes/SQLite) -->
                <iframe
                  v-else-if="cell.output.includes('<table')"
                  :srcdoc="cell.output"
                  sandbox="allow-scripts"
                  class="cell-output-iframe"
                ></iframe>
                <!-- Text output -->
                <pre v-else>{{ cell.output }}</pre>
              </div>
            </div>
          </div>

          <!-- Matplotlib plot target (always present for Python cells) -->
          <div
            v-if="runnerLanguage === 'python'"
            :id="`plot-target-${cell.id}`"
            class="plot-target"
          ></div>

          <!-- Test Results for this cell -->
          <div v-if="getCellTestResults(cell.id)" class="cell-test-results">
            <div class="test-results-header">
              <span class="test-icon">{{ getCellTestResults(cell.id).passed ? "✅" : "❌" }}</span>
              <span>Cell Tests</span>
            </div>
            <div
              v-for="(testCase, tcIndex) in getCellTestResults(cell.id).testCases"
              :key="tcIndex"
              class="test-case"
              :class="{ passed: testCase.passed, failed: !testCase.passed }"
            >
              <span class="test-case-icon">{{ testCase.passed ? "✓" : "✗" }}</span>
              <span class="test-case-name">{{ testCase.name }}</span>
              <div v-if="testCase.error" class="test-case-error">{{ testCase.error }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Trailing markdown section -->
      <div
        v-if="markdownSections[visibleCells.length]"
        class="markdown-section"
        v-html="markdownSections[visibleCells.length]"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.notebook-challenge {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.actions-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.notebook-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 8px;
}

.markdown-section {
  color: #ccc;
  padding: 16px 0;
}

.notebook-cell {
  display: flex;
  flex-direction: column;
  border: 2px solid #2d2d2d;
  border-radius: 4px;
  background: #1e1e1e;
  transition: border-color 0.2s;
  cursor: pointer;
}

.notebook-cell:hover {
  border-color: #3d3d3d;
}

.notebook-cell.focused {
  border-color: #0066cc;
  cursor: default;
}

.notebook-cell.readonly {
  opacity: 0.8;
  cursor: default;
}

.cell-input {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.cell-prompt {
  color: #888;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  padding: 12px;
  min-width: 80px;
  flex-shrink: 0;
  user-select: none;
}

.cell-code {
  flex: 1;
  position: relative;
  /* Height is set dynamically via inline style */
}

.cell-code-highlight {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 14px;
  line-height: 19px; /* Match Monaco line height */
  padding: 0;
  margin: 0;
  color: #d4d4d4;
  white-space: pre;
  overflow-x: auto;
  height: 100%;
}

.cell-code-highlight :deep(.line-number) {
  display: inline-block;
  width: 50px;
  padding-right: 10px;
  text-align: right;
  color: #858585;
  background: #1e1e1e;
  user-select: none;
  vertical-align: top;
}

.cell-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.cell-run-btn,
.cell-test-btn {
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.cell-test-btn {
  background: #4caf50;
}

.cell-run-btn:hover:not(:disabled) {
  background: #0052a3;
}

.cell-test-btn:hover:not(:disabled) {
  background: #45a049;
}

.cell-run-btn:disabled,
.cell-test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cell-output {
  display: flex;
  align-items: flex-start;
  border-top: 1px solid #2d2d2d;
  background: #1a1a1a;
}

.cell-result {
  flex: 1;
  padding: 12px;
}

.cell-error {
  color: #f87171;
}

.cell-error pre {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.cell-output-content pre {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  color: #ccc;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.cell-output-iframe,
.web-cell-output-iframe {
  width: 100%;
  min-height: 200px;
  border: none;
  background: white;
  border-radius: 4px;
}

.plot-target {
  margin-top: 10px;
}

/* Style matplotlib plots to fit container */
.plot-target :deep(> div), .plot-target :deep(> div > div[tabindex="0"]) {
  width: 100% !important;
  max-width: 100%;
}

/* Test Results Styling */
.test-results-summary {
  margin: 15px 0;
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.05);
}

.test-results-summary.passed {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.test-results-summary.failed {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.test-summary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
}

.test-summary-text {
  flex: 1;
}

.test-score {
  font-size: 14px;
  opacity: 0.9;
}

.cell-test-results {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #666;
  border-radius: 4px;
}

.test-results-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.test-case {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 13px;
}

.test-case.passed {
  background: rgba(76, 175, 80, 0.1);
  border-left: 2px solid #4caf50;
}

.test-case.failed {
  background: rgba(244, 67, 54, 0.1);
  border-left: 2px solid #f44336;
}

.test-case-icon {
  font-weight: bold;
  min-width: 16px;
}

.test-case.passed .test-case-icon {
  color: #4caf50;
}

.test-case.failed .test-case-icon {
  color: #f44336;
}

.test-case-name {
  flex: 1;
}

.test-case-error {
  margin-top: 4px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  color: #ff6b6b;
  width: 100%;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #45a049;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<style>
/* Import highlight.js VS Code Dark+ theme */
@import "highlight.js/styles/vs2015.css";

/* Override to match Monaco more closely */
.notebook-cell .hljs {
  background: transparent;
  color: #d4d4d4;
  padding: 0;
}
</style>
