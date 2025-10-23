<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import CodeEditor from "./CodeEditor.vue";
import { highlightCode } from "../utils/syntaxHighlight";
import { codeRunnerRegistry } from "../services/codeRunners";
import { storageService } from "../services/storage";
import { useDebouncedSave } from "../composables/useDebouncedSave";
import { fetchTextAsset } from "../utils/fetchAsset";
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
    const { debouncedSave } = useDebouncedSave();
    return { t, debouncedSave };
  },

  data() {
    return {
      cells: [] as NotebookCell[],
      markdownSections: [] as string[],
      focusedCellId: null as string | null,
      isRunning: false,
      isRunningAll: false,
      hasExecutedMustExecute: false,
      requirementsTxt: null as string | null,
      isRunningTests: false,
      testResults: null as any,
      virtualFiles: {} as Record<string, string>, // Files to load into virtual FS
      cellsWithTests: new Set<string>(), // Set of cell IDs that have tests
      maxRevealedCellIndex: -1, // Max cell index that should be revealed (for progressive mode)
      newlyRevealedCells: new Set<number>(), // Track cells that were just revealed for animation
    };
  },

  computed: {
    runnerLanguage(): "python" | "web" | "sqlite" {
      return this.challengeData.language || "python";
    },

    isProgressiveMode(): boolean {
      return this.challengeData.progressive === true;
    },

    isAnyCodeRunning(): boolean {
      return this.isRunning || this.isRunningAll || this.isRunningTests;
    },

    visibleCells(): NotebookCell[] {
      return this.cells.filter((cell) => !cell.hidden);
    },

    totalNonHiddenCells(): number {
      return this.visibleCells.length;
    },

    revealedCellCount(): number {
      if (!this.isProgressiveMode) {
        return this.totalNonHiddenCells;
      }
      // Count cells up to maxRevealedCellIndex in the original cells array
      let count = 0;
      for (let i = 0; i <= this.maxRevealedCellIndex && i < this.cells.length; i++) {
        if (!this.cells[i].hidden) {
          count++;
        }
      }
      return count;
    },

    shouldRevealCell(): (cellIndex: number) => boolean {
      return (cellIndex: number) => {
        if (!this.isProgressiveMode) {
          return true;
        }
        return cellIndex <= this.maxRevealedCellIndex;
      };
    },

    shouldRevealMarkdownSection(): (sectionIndex: number) => boolean {
      return (sectionIndex: number) => {
        if (!this.isProgressiveMode) {
          return true;
        }
        // Section at index N is revealed if cell at index N is revealed
        // (section comes before the cell)
        return sectionIndex <= this.maxRevealedCellIndex;
      };
    },
  },

  async mounted() {
    this.cells = JSON.parse(JSON.stringify(this.challengeData.cells));
    this.markdownSections = [...this.challengeData.markdownSections];

    if (this.runnerLanguage === "python") {
      await this.loadRequirementsTxt();
    }

    await this.loadVirtualFiles();
    await this.loadCellsFromStorage();
    await this.loadCellsWithTests();
    await this.initializeProgressiveMode();
  },

  methods: {
    async loadRequirementsTxt() {
      try {
        const lang = this.language === "auto" ? "sk" : this.language;
        const requirementsPath = `/${lang}/data/${this.coursePath}/${this.challengeId}/micropip.txt`;
        const text = await fetchTextAsset(requirementsPath, "text/plain");

        if (text) {
          this.requirementsTxt = text;
        }
      } catch {}
    },

    async loadVirtualFiles() {
      // Load files specified in metadata.json into virtual FS
      if (!this.challengeData.files || this.challengeData.files.length === 0) {
        return;
      }

      try {
        const lang = this.language === "auto" ? "sk" : this.language;

        await Promise.all(
          this.challengeData.files.map(async (filename) => {
            const filePath = `/${lang}/data/${this.coursePath}/${this.challengeId}/files/${filename}`;
            const content = await fetchTextAsset(filePath);

            if (content !== null) {
              this.virtualFiles[filename] = content;
            }
          })
        );
      } catch (error) {
        console.error("Error loading virtual files:", error);
      }
    },

    async loadCellsFromStorage() {
      for (let i = 0; i < this.cells.length; i++) {
        const savedCode = await storageService.getEditorCode(this.coursePath, this.challengeId, this.cells[i].id, this.language);
        if (savedCode !== null) {
          this.cells[i].code = savedCode;
        }
      }
    },

    async loadCellsWithTests() {
      try {
        const { fetchTestMd, parseTestMd } = await import("../services/testMdParser");
        const lang = this.language === "auto" ? "sk" : this.language;
        const testMdContent = await fetchTestMd(this.coursePath, this.challengeId, lang);

        if (!testMdContent) {
          return;
        }

        const editableCellIndices = this.cells
          .map((cell, index) => (!cell.readonly && !cell.hidden ? index : -1))
          .filter((index) => index !== -1);

        const cellTests = parseTestMd(testMdContent, editableCellIndices, this.runnerLanguage);

        // Build a set of cell IDs that have tests
        const cellIdsWithTests = new Set<string>();
        for (const cellTest of cellTests) {
          const cell = this.cells[cellTest.cellIndex];
          if (cell) {
            cellIdsWithTests.add(cell.id);
          }
        }

        this.cellsWithTests = cellIdsWithTests;
      } catch (error) {
        console.error("Error loading test information:", error);
      }
    },

    async initializeProgressiveMode() {
      if (!this.isProgressiveMode) {
        // In non-progressive mode, all cells are revealed
        this.maxRevealedCellIndex = this.cells.length - 1;
        return;
      }

      // Load saved progress
      const savedMaxIndex = await storageService.getMaxSuccessfulCellIndex(this.coursePath, this.challengeId, this.language);

      // Find the first non-hidden cell index
      const firstNonHiddenIndex = this.cells.findIndex((cell) => !cell.hidden);

      if (savedMaxIndex >= 0) {
        // Restore saved progress
        this.maxRevealedCellIndex = savedMaxIndex;
      } else {
        // First time: reveal only the first non-hidden cell
        this.maxRevealedCellIndex = firstNonHiddenIndex >= 0 ? firstNonHiddenIndex : 0;
      }
    },

    async updateProgressiveReveal(cellIndex: number) {
      if (!this.isProgressiveMode) {
        return;
      }

      // Track which cells are newly revealed
      const oldMaxIndex = this.maxRevealedCellIndex;

      // Update maxRevealedCellIndex if this cell index is higher
      if (cellIndex > this.maxRevealedCellIndex) {
        this.maxRevealedCellIndex = cellIndex;
        await storageService.setMaxSuccessfulCellIndex(this.coursePath, this.challengeId, cellIndex, this.language);

        // Mark newly revealed cells for animation
        for (let i = oldMaxIndex + 1; i <= cellIndex; i++) {
          if (!this.cells[i]?.hidden) {
            this.newlyRevealedCells.add(i);
          }
        }

        // Wait for DOM update, then scroll to the last revealed cell and remove animation class
        await this.$nextTick();
        this.scrollToLastRevealed();

        // Remove animation class after animation completes
        setTimeout(() => {
          this.newlyRevealedCells.clear();
        }, 600); // Match animation duration
      }
    },

    scrollToLastRevealed() {
      // Find the last non-hidden cell that was revealed
      const lastRevealedIndex = this.maxRevealedCellIndex;
      if (lastRevealedIndex >= 0 && lastRevealedIndex < this.cells.length) {
        const cell = this.cells[lastRevealedIndex];
        if (cell && !cell.hidden) {
          const element = document.getElementById(`cell-${cell.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    },

    isCellSuccessful(cellIndex: number): boolean {
      const cell = this.cells[cellIndex];
      if (!cell) return false;

      // Check if cell has error
      if (cell.error) {
        return false;
      }

      // If cell has tests, check if at least 50% passed
      if (this.cellsWithTests.has(cell.id)) {
        const testResult = this.getCellTestResults(cell.id);
        if (!testResult) {
          return false;
        }

        const totalTests = testResult.testCases.length;
        const passedTests = testResult.testCases.filter((tc: any) => tc.passed).length;
        return passedTests >= totalTests * 0.5;
      }

      // If no tests, cell is successful if it has been executed and has no error
      // Cell is considered executed if output is defined (can be empty string) OR if error is defined
      // This handles cells with no output (like imports) - they will have output as "" after execution
      return cell.output !== undefined && !cell.error;
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

    handleCellBlur() {},

    handleCellUpdate(cellId: string, newCode: string) {
      const cellIndex = this.getCellIndex(cellId);
      if (cellIndex !== -1) {
        this.cells[cellIndex].code = newCode;

        const cell = this.cells[cellIndex];
        if (cell.autoreload && this.runnerLanguage === "web") {
          this.debouncedSave(async () => {
            storageService.setEditorCode(this.coursePath, this.challengeId, cellId, newCode, this.language);
            await this.runCell(cellId);
          });
        } else {
          this.debouncedSave(() => {
            storageService.setEditorCode(this.coursePath, this.challengeId, cellId, newCode, this.language);
          });
        }
      }
    },

    getHighlightedCode(code: string): string {
      return highlightCode(code, this.runnerLanguage);
    },

    getWebCellHTML(cellIndex: number): string {
      return this.cells[cellIndex]?.output || "";
    },

    getCodeWithLineNumbers(code: string): string {
      const lines = code.split("\n");
      const highlighted = highlightCode(code, this.runnerLanguage);
      const highlightedLines = highlighted.split("\n");

      return highlightedLines
        .map((line, index) => {
          const lineNum = (index + 1).toString().padStart(lines.length.toString().length, " ");
          return `<span class="line-number">${lineNum}</span>${line}`;
        })
        .join("\n");
    },

    getCellHeight(code: string): string {
      const lineCount = code.split("\n").length;
      // add extra height to prevent scrollbar when Monaco editor is focused
      return `${Math.max(60, lineCount * 24)}px`;
    },

    async runCell(cellId: string) {
      await this.executeCells([cellId]);
    },

    async runAllCells() {
      this.isRunningAll = true;
      try {
        const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
        if (!runner) {
          throw new Error(`No runner available for ${this.runnerLanguage}`);
        }

        // Execute mustExecute cells first
        if (!this.hasExecutedMustExecute) {
          const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
          for (const cell of mustExecuteCells) {
            await this.executeCell(runner, cell);
            // Check if mustExecute cell failed
            if (cell.error) {
              console.warn("MustExecute cell failed, stopping execution");
              return;
            }
          }
          this.hasExecutedMustExecute = true;
        }

        // In progressive mode, only execute currently revealed cells and DON'T reveal new ones
        // In non-progressive mode, execute all cells
        const cellsToExecute: number[] = [];
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (cell.hidden || cell.mustExecute) continue;

          // In progressive mode, only include currently revealed cells
          if (this.isProgressiveMode && !this.shouldRevealCell(i)) {
            continue;
          }

          cellsToExecute.push(i);
        }

        // Execute the captured cells
        for (const i of cellsToExecute) {
          const cell = this.cells[i];
          await this.executeCell(runner, cell);

          // In non-progressive mode: stop on error
          // In progressive mode: don't stop, just continue (don't reveal)
          if (!this.isProgressiveMode && cell.error) {
            console.warn("Cell execution failed, stopping");
            return;
          }
        }
      } catch (error: any) {
        console.error("Execution error:", error);
      } finally {
        this.isRunningAll = false;
      }
    },

    findNextNonHiddenCellIndex(currentIndex: number): number {
      for (let i = currentIndex + 1; i < this.cells.length; i++) {
        if (!this.cells[i].hidden) {
          return i;
        }
      }
      return -1;
    },

    async executeCells(cellIds: string[]) {
      if (this.isRunning) return;

      this.isRunning = true;

      try {
        const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
        if (!runner) {
          throw new Error(`No runner available for ${this.runnerLanguage}`);
        }
        if (!this.hasExecutedMustExecute) {
          const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
          for (const cell of mustExecuteCells) {
            await this.executeCell(runner, cell);
          }
          this.hasExecutedMustExecute = true;
        }
        for (const cellId of cellIds) {
          const cell = this.cells.find((c) => c.id === cellId);
          if (cell) {
            // Only execute if not mustExecute (mustExecute cells are already executed above)
            if (!cell.mustExecute) {
              await this.executeCell(runner, cell);
            }

            // Handle progressive reveal for single cell execution
            // Only reveal if: (1) in progressive mode, (2) cell executed successfully,
            // (3) cell does NOT have tests (cells with tests should only reveal when tests pass)
            if (this.isProgressiveMode && !cell.error && cell.output !== undefined) {
              const cellIndex = this.getCellIndex(cellId);
              if (cellIndex !== -1 && !this.cellsWithTests.has(cellId)) {
                const nextNonHiddenIndex = this.findNextNonHiddenCellIndex(cellIndex);
                if (nextNonHiddenIndex !== -1) {
                  await this.updateProgressiveReveal(nextNonHiddenIndex);
                }
              }
            }
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
        this.cells[cellIndex].output = undefined;
        this.cells[cellIndex].error = undefined;

        const plotTargetId = `plot-target-${cell.id}`;
        const plotTarget = document.getElementById(plotTargetId);
        if (plotTarget) plotTarget.innerHTML = "";

        if (this.runnerLanguage === "web") {
          await this.executeWebCell(cell, cellIndex);
          return;
        }

        await this.$nextTick();

        const files: Record<string, string> = { main: cell.code };

        if (this.runnerLanguage === "python" && this.requirementsTxt) {
          files["micropip.txt"] = this.requirementsTxt;
        }

        // Add virtual files to the files object (for Python, SQLite, etc.)
        for (const [filename, content] of Object.entries(this.virtualFiles)) {
          files[filename] = content;
        }

        const result = await runner.execute(files, "main", undefined, {
          skipCleanup: true,
          plotTargetId,
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
      this.cells[cellIndex].output = cell.code;
    },

    async resetEnvironment() {
      if (!confirm(this.t("challenge.resetConfirm"))) return;

      this.hasExecutedMustExecute = false;

      // Reset cells to original state and clear storage
      for (let i = 0; i < this.cells.length; i++) {
        const originalCell = this.challengeData.cells[i];
        this.cells[i].code = originalCell.code;
        this.cells[i].output = undefined;
        this.cells[i].error = undefined;

        // Clear saved code from storage
        await storageService.deleteEditorCode(this.coursePath, this.challengeId, this.cells[i].id, this.language);
      }

      const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
      await runner?.cleanup?.();

      this.testResults = null;

      // Reset progressive mode progress
      if (this.isProgressiveMode) {
        await storageService.deleteMaxSuccessfulCellIndex(this.coursePath, this.challengeId, this.language);
        // Reset to first non-hidden cell
        const firstNonHiddenIndex = this.cells.findIndex((cell) => !cell.hidden);
        this.maxRevealedCellIndex = firstNonHiddenIndex >= 0 ? firstNonHiddenIndex : 0;
      }
    },

    async createExecuteCellsUpToFunction() {
      const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
      if (!runner) {
        throw new Error(`No runner available for ${this.runnerLanguage}`);
      }

      return async (cellIndex: number) => {
        if (!this.hasExecutedMustExecute) {
          const mustExecuteCells = this.cells.filter((c) => c.mustExecute);
          for (const cell of mustExecuteCells) {
            await this.executeCell(runner, cell);
          }
          this.hasExecutedMustExecute = true;
        }

        for (let i = 0; i <= cellIndex; i++) {
          const cell = this.cells[i];
          if (!cell.mustExecute) {
            await this.executeCell(runner, cell);
          }
        }

        if (this.runnerLanguage === "web") {
          let combinedHTML = "";
          for (let i = 0; i <= cellIndex; i++) {
            const cell = this.cells[i];
            if (cell.output) {
              combinedHTML += cell.code + "\n";
            }
          }

          const parser = new DOMParser();
          const doc = parser.parseFromString(
            `<!DOCTYPE html><html><head></head><body>${combinedHTML}</body></html>`,
            "text/html"
          );

          return {
            language: "web",
            dom: doc,
            window: window,
          };
        } else if (this.runnerLanguage === "sqlite") {
          const targetCell = this.cells[cellIndex];
          const files: Record<string, string> = { "main.sql": targetCell.code };
          const result = await runner.execute(files, "main.sql", undefined, { skipCleanup: true });
          return result.testContext || {};
        } else {
          // collect stdout from all executed cells for Python
          let combinedStdout = "";
          let combinedStderr = "";

          for (let i = 0; i <= cellIndex; i++) {
            const cell = this.cells[i];
            if (cell.output) {
              combinedStdout += cell.output + "\n";
            }
            if (cell.error) {
              combinedStderr += cell.error + "\n";
            }
          }

          return {
            language: "python",
            pyodide: (runner as any).pyodide,
            stdout: combinedStdout.trim(),
            stderr: combinedStderr.trim(),
          };
        }
      };
    },

    async runTests() {
      if (this.isRunningTests || this.isRunning) return;

      this.isRunningTests = true;
      this.testResults = null;

      try {
        // In progressive mode, we need to handle tests differently
        if (this.isProgressiveMode) {
          await this.runTestsProgressive();
        } else {
          await this.runTestsNormal();
        }
      } catch (error: any) {
        console.error("Test execution error:", error);
        alert(`Test error: ${error.message}`);
      } finally {
        this.isRunningTests = false;
      }
    },

    async runTestsNormal() {
      const { runNotebookTestsFailFast } = await import("../services/testRunner");
      const executeCellsUpTo = await this.createExecuteCellsUpToFunction();

      const results = await runNotebookTestsFailFast(
        this.cells,
        this.runnerLanguage,
        this.coursePath,
        this.challengeId,
        this.language,
        this.challengeData.maxScore,
        executeCellsUpTo
      );

      this.testResults = results;
      this.$emit("score-update", results.score);
      if (results.passed && results.score > 0) {
        await storageService.setChallengeScore(this.coursePath, this.challengeId, results.score, this.language as "sk" | "en");
      }
    },

    async runTestsProgressive() {
      const { fetchTestMd, parseTestMd } = await import("../services/testMdParser");
      const { executeTest } = await import("../services/testRunner");

      const lang = this.language === "auto" ? "sk" : this.language;
      const testMdContent = await fetchTestMd(this.coursePath, this.challengeId, lang);

      if (!testMdContent) {
        this.testResults = {
          score: 0,
          maxScore: this.challengeData.maxScore,
          passed: false,
          cellResults: [],
        };
        return;
      }

      const editableCellIndices = this.cells
        .map((cell, index) => (!cell.readonly && !cell.hidden ? index : -1))
        .filter((index) => index !== -1);
      const allCellTests = parseTestMd(testMdContent, editableCellIndices, this.runnerLanguage);

      if (allCellTests.length === 0) {
        this.testResults = {
          score: 0,
          maxScore: this.challengeData.maxScore,
          passed: false,
          cellResults: [],
        };
        return;
      }

      const executeCellsUpTo = await this.createExecuteCellsUpToFunction();
      const cellResults: any[] = [];
      let totalPassed = 0;
      let lastSuccessfulTestCellIndex = -1;

      // Run ALL tests (not just revealed ones), with fail-fast
      for (const cellTest of allCellTests) {
        const cell = this.cells[cellTest.cellIndex];
        const context = await executeCellsUpTo(cellTest.cellIndex);

        // Check if cell execution failed
        if (cell.error) {
          cellResults.push({
            cellIndex: cellTest.cellIndex,
            cellId: cell.id,
            testCases: [{ name: "Cell execution", passed: false, error: `Cell execution failed: ${cell.error}` }],
            passed: false,
          });
          break;
        }

        const testCases = await executeTest(cellTest.testCode, cellTest.language, context);
        const allTestsPassed = testCases.every((tc: any) => tc.passed);

        cellResults.push({
          cellIndex: cellTest.cellIndex,
          cellId: cell.id,
          testCases,
          passed: allTestsPassed,
        });

        if (allTestsPassed) {
          totalPassed++;
          lastSuccessfulTestCellIndex = cellTest.cellIndex;
        } else {
          // Stop on first failure
          break;
        }
      }

      // Reveal cells progressively based on execution success
      // Check ALL cells (not just tested ones) up to the last successful test
      if (lastSuccessfulTestCellIndex >= 0) {
        let maxRevealIndex = this.maxRevealedCellIndex;

        // Helper function to check if a cell's tests passed (using cellResults, not this.testResults)
        const cellTestsPassed = (cellIndex: number): boolean => {
          const result = cellResults.find((r: any) => r.cellIndex === cellIndex);
          if (!result) return false;
          const totalTests = result.testCases.length;
          const passedTests = result.testCases.filter((tc: any) => tc.passed).length;
          return passedTests >= totalTests * 0.5;
        };

        // Check all cells from 0 to the end to determine max reveal point
        // We check beyond lastSuccessfulTestCellIndex to handle cells without tests that come after
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (cell.hidden) continue;

          // Stop if we've gone past all executed cells
          // (executeCellsUpTo would have executed up to lastSuccessfulTestCellIndex)
          if (i > lastSuccessfulTestCellIndex && !cell.output && !cell.error) {
            break;
          }

          // Check if this cell should reveal the next one
          const hasTests = this.cellsWithTests.has(cell.id);
          const isSuccessful = hasTests
            ? !cell.error && cellTestsPassed(i) // Cell with tests: check if tests passed
            : !cell.error && cell.output !== undefined; // Cell without tests: check if executed successfully

          if (isSuccessful) {
            const nextNonHiddenIndex = this.findNextNonHiddenCellIndex(i);
            if (nextNonHiddenIndex !== -1 && nextNonHiddenIndex > maxRevealIndex) {
              maxRevealIndex = nextNonHiddenIndex;
            }
          } else if (!cell.mustExecute) {
            // Stop revealing if we hit a non-mustExecute cell that didn't succeed
            break;
          }
        }

        // Update to the max reveal index in one go
        if (maxRevealIndex > this.maxRevealedCellIndex) {
          const oldMaxIndex = this.maxRevealedCellIndex;
          this.maxRevealedCellIndex = maxRevealIndex;
          await storageService.setMaxSuccessfulCellIndex(this.coursePath, this.challengeId, maxRevealIndex, this.language);

          // Mark newly revealed cells for animation
          for (let i = oldMaxIndex + 1; i <= maxRevealIndex; i++) {
            if (!this.cells[i]?.hidden) {
              this.newlyRevealedCells.add(i);
            }
          }

          // Wait for DOM update, then scroll to the last revealed cell
          await this.$nextTick();
          this.scrollToLastRevealed();

          // Remove animation class after animation completes
          setTimeout(() => {
            this.newlyRevealedCells.clear();
          }, 600);
        }
      }

      const scorePerCell = this.challengeData.maxScore / allCellTests.length;
      const score = Math.round(totalPassed * scorePerCell);
      const allPassed = totalPassed === allCellTests.length;

      this.testResults = {
        score,
        maxScore: this.challengeData.maxScore,
        passed: allPassed,
        cellResults,
      };

      this.$emit("score-update", score);
      if (allPassed && score > 0) {
        await storageService.setChallengeScore(this.coursePath, this.challengeId, score, this.language as "sk" | "en");
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
        const executeCellsUpTo = await this.createExecuteCellsUpToFunction();
        const results = await runNotebookTests(
          this.cells,
          this.runnerLanguage,
          this.coursePath,
          this.challengeId,
          this.language,
          this.challengeData.maxScore,
          executeCellsUpTo,
          cellIndex
        );
        if (!this.testResults) {
          this.testResults = {
            score: 0,
            maxScore: this.challengeData.maxScore,
            passed: false,
            cellResults: [],
          };
        }

        this.testResults.cellResults = this.testResults.cellResults.filter((r: any) => r.cellId !== cellId);

        const cellResult = results.cellResults.find((r: any) => r.cellIndex === cellIndex);
        if (cellResult) {
          cellResult.cellId = cellId;
          this.testResults.cellResults.push(cellResult);
        }

        const totalCells = this.testResults.cellResults.length;
        const passedCells = this.testResults.cellResults.filter((r: any) => r.passed).length;
        if (totalCells > 0) {
          this.testResults.score = Math.round((passedCells / totalCells) * this.challengeData.maxScore);
          this.testResults.passed = passedCells === totalCells;
        }

        // Handle progressive reveal for this cell
        if (this.isProgressiveMode && this.isCellSuccessful(cellIndex)) {
          const nextNonHiddenIndex = this.findNextNonHiddenCellIndex(cellIndex);
          if (nextNonHiddenIndex !== -1) {
            await this.updateProgressiveReveal(nextNonHiddenIndex);
          }
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
      <button :disabled="isAnyCodeRunning" class="btn btn-primary" @click="runAllCells">
        <span class="btn-icon">{{ isRunning || isRunningAll ? "⏳" : "▶️" }}</span>
        {{ isRunning || isRunningAll ? t("challenge.running") : t("challenge.runAllCells") }}
      </button>
      <button v-if="cellsWithTests.size > 0" :disabled="isAnyCodeRunning" class="btn btn-success" @click="runTests">
        <span class="btn-icon">{{ isRunningTests ? "⏳" : "✓" }}</span>
        {{ isRunningTests ? t("challenge.runningTests") : t("challenge.runTests") }}
      </button>
      <button class="btn btn-secondary" @click="resetEnvironment">
        <span class="btn-icon">↻</span>
        {{ t("challenge.reset") }}
      </button>
    </div>

    <!-- Test Results Summary -->
    <div v-if="testResults" class="test-results-summary" :class="{ passed: testResults.passed, failed: !testResults.passed }">
      <div class="test-summary-header">
        <span class="test-icon">{{ testResults.passed ? "✅" : "❌" }}</span>
        <span class="test-summary-text">
          {{ testResults.passed ? t("challenge.allTestsPassed") : t("challenge.someTestsFailed") }}
        </span>
        <span class="test-score">{{ t("challenge.score") }}: {{ testResults.score }} / {{ testResults.maxScore }}</span>
      </div>
    </div>

    <div class="notebook-container">
      <template v-for="(cell, index) in cells" :key="cell.id">
        <template v-if="!cell.hidden && shouldRevealCell(index)">
          <!-- Markdown section before cell -->
          <div
            v-if="markdownSections[index] && shouldRevealMarkdownSection(index)"
            class="markdown-section"
            :class="{ 'reveal-animation': newlyRevealedCells.has(index) }"
            v-html="markdownSections[index]"
          />

          <!-- Cell -->
          <div
            :id="`cell-${cell.id}`"
            class="notebook-cell"
            :class="{
              focused: focusedCellId === cell.id,
              readonly: cell.readonly,
              'has-output': cell.output || cell.error,
              'reveal-animation': newlyRevealedCells.has(index),
            }"
            @click="handleCellClick(cell.id)"
          >
            <!-- Cell input -->
            <div class="cell-input">
              <!-- Read-only indicator -->
              <div v-if="cell.readonly" class="readonly-indicator">{{ t("challenge.readonly") }}</div>
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
                <pre v-else class="cell-code-highlight" v-html="getCodeWithLineNumbers(cell.code)" />
              </div>
              <div class="cell-actions">
                <button
                  v-if="!cell.readonly && cellsWithTests.has(cell.id)"
                  :disabled="isAnyCodeRunning"
                  class="cell-test-btn"
                  title="Test cell"
                  @click.stop="runCellTests(cell.id)"
                >
                  ✓
                </button>
                <button :disabled="isAnyCodeRunning" class="cell-run-btn" title="Run cell" @click.stop="runCell(cell.id)">
                  ▶
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
                  />
                  <!-- HTML output (for dataframes/SQLite) -->
                  <iframe
                    v-else-if="cell.output.includes('<table')"
                    :srcdoc="cell.output"
                    sandbox="allow-scripts"
                    class="cell-output-iframe"
                  />
                  <!-- Text output -->
                  <pre v-else>{{ cell.output }}</pre>
                </div>
              </div>
            </div>

            <!-- Test Results for this cell -->
            <div v-if="getCellTestResults(cell.id)" class="cell-test-results">
              <div class="test-results-header">
                <span class="test-icon">{{ getCellTestResults(cell.id).passed ? "✅" : "❌" }}</span>
                <span>{{ t("challenge.cellTests") }}</span>
              </div>
              <div
                v-for="(testCase, tcIndex) in getCellTestResults(cell.id).testCases"
                :key="tcIndex"
                class="test-case"
                :class="{ passed: testCase.passed, failed: !testCase.passed }"
              >
                <span class="test-case-icon">{{ testCase.passed ? "✓" : "✗" }}</span>
                <span class="test-case-name">{{ testCase.name }}</span>
                <div v-if="testCase.error" class="test-case-error">
                  {{ testCase.error }}
                </div>
              </div>
            </div>
          </div>

          <!-- Matplotlib plot target - must exist even for unrevealed cells (for rendering during tests) -->
          <div v-if="runnerLanguage === 'python'" :id="`plot-target-${cell.id}`" class="plot-target" />
        </template>

        <!-- Plot target for unrevealed cells (hidden but present in DOM for test execution) -->
        <div
          v-if="runnerLanguage === 'python' && !cell.hidden && !shouldRevealCell(index)"
          :id="`plot-target-${cell.id}`"
          class="plot-target"
          style="display: none"
        />
      </template>

      <!-- Trailing markdown section -->
      <div
        v-if="markdownSections[cells.length] && (!isProgressiveMode || shouldRevealMarkdownSection(cells.length))"
        class="markdown-section"
        v-html="markdownSections[cells.length]"
      />
    </div>

    <!-- Cell counter for progressive mode -->
    <div v-if="isProgressiveMode" class="cell-counter">
      {{ t("challenge.revealedCells") }}: {{ revealedCellCount }} / {{ totalNonHiddenCells }}
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
  overflow-x: hidden;
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
  overflow: hidden;
  /* height is set dynamically via inline style */
}

.readonly-indicator {
  position: absolute;
  top: -10px;
  left: 10px;
  background: rgb(156, 163, 175);
  color: black;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}

.cell-code-highlight {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 14px;
  line-height: 21px; /* Increased line height for better vertical spacing */
  padding: 0;
  margin: 0;
  color: #d4d4d4;
  white-space: pre-wrap;
  height: 100%;
}

.cell-code-highlight :deep(.line-number) {
  display: inline-block;
  width: 50px;
  padding-right: 16px; /* Increased horizontal spacing between line numbers and code */
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
.plot-target :deep(> div),
.plot-target :deep(> div > div[tabindex="0"]) {
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

.cell-counter {
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-top: 16px;
}

/* Progressive reveal animation */
@keyframes revealPulse {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.reveal-animation {
  animation: revealPulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>

<style>
/* Import highlight.js VS Code Dark+ theme */
@import "highlight.js/styles/vs2015.css";

/* Override to match Monaco VS Code Dark+ theme more closely */
.notebook-cell .hljs {
  background: transparent;
  color: #d4d4d4;
  padding: 0;
}

/* Python/JavaScript function calls - match Monaco's light blue */
.notebook-cell .hljs-built_in,
.notebook-cell .hljs-title.function_ {
  color: #dcdcaa; /* Yellow for functions like in Monaco */
}

/* Python function definitions */
.notebook-cell .hljs-title.function {
  color: #dcdcaa; /* Yellow for function definitions */
}

/* Keywords (def, class, import, return, etc.) - match Monaco's purple/blue */
.notebook-cell .hljs-keyword {
  color: #c586c0; /* Purple for keywords */
}

/* Strings - match Monaco's orange/brown */
.notebook-cell .hljs-string {
  color: #ce9178;
}

/* Numbers - match Monaco's light green */
.notebook-cell .hljs-number {
  color: #b5cea8;
}

/* Comments - match Monaco's green */
.notebook-cell .hljs-comment {
  color: #6a9955;
  font-style: italic;
}

/* Variables and parameters */
.notebook-cell .hljs-params,
.notebook-cell .hljs-variable {
  color: #9cdcfe; /* Light blue */
}

/* Class names */
.notebook-cell .hljs-title.class_,
.notebook-cell .hljs-class .hljs-title {
  color: #4ec9b0; /* Cyan/teal for classes */
}

/* Operators */
.notebook-cell .hljs-operator {
  color: #d4d4d4;
}

/* Brackets - use different colors for bracket pairs like Monaco */
.notebook-cell .hljs-punctuation {
  color: #d4d4d4;
}

/* Decorators (@) */
.notebook-cell .hljs-meta {
  color: #c586c0;
}

/* Boolean values (True, False, None) */
.notebook-cell .hljs-literal {
  color: #569cd6; /* Blue for literals */
}

/* SQL specific */
.notebook-cell .hljs-type {
  color: #4ec9b0;
}
</style>
