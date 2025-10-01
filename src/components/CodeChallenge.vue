<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FileTabs from "./FileTabs.vue";
import CodeEditor from "./CodeEditor.vue";
import { createVirtualFileSystem, type VirtualFileSystem, type VirtualFile } from "../services/virtualFileSystem";
import { codeRunnerRegistry } from "../services/codeRunners";
import { runTests, type TestResult } from "../services/testRunner";
import { storageService } from "../services/storage";
import type { CodeChallengeData } from "../types";
import { useI18nStore } from "../stores/i18n";

export default defineComponent({
  name: "CodeChallenge",

  components: {
    FileTabs,
    CodeEditor,
  },

  props: {
    challengeData: {
      type: Object as PropType<CodeChallengeData>,
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
    const i18nStore = useI18nStore();
    return {
      i18nStore,
    };
  },

  data() {
    return {
      fileSystem: null as VirtualFileSystem | null,
      activeFile: null as string | null,
      activeFileContent: "",
      activeFileReadonly: false,
      visibleFiles: [] as VirtualFile[],
      isRunning: false,
      isTesting: false,
      executionOutput: "",
      executionError: "",
      previewContent: "",
      previewType: null as "web" | "image" | "text" | null,
      testResult: null as TestResult | null,
      autoReloadEnabled: false,
      splitPosition: 50,
      isResizing: false,
      editorHasFocus: false,
      pendingAutoReload: false,
    };
  },

  computed: {
    runnerLanguage(): string {
      const ext = this.challengeData.mainFile.split(".").pop()?.toLowerCase() || "";
      if (ext === "py") return "python";
      if (["html", "css", "js"].includes(ext)) return "web";
      return "python";
    },

    hasAutoReloadFiles(): boolean {
      return this.visibleFiles.some((f) => f.autoreload);
    },

    hasPreviewOrOutput(): boolean {
      return !!(this.previewType || this.executionOutput || this.executionError || this.testResult);
    },

    showPlaceholder(): boolean {
      return !this.hasPreviewOrOutput;
    },
  },

  async mounted() {
    await this.initializeFileSystem();
    this.setupAutoReload();
  },

  beforeUnmount() {
    window.removeEventListener("vfs-event", this.handleFileSystemEvent as EventListener);
    // Clean up resize listeners in case component unmounts during resize
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("blur", this.handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Remove overlay if it exists
    const overlay = document.getElementById('resize-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  methods: {
    t(key: string, params?: Record<string, string | number>): string {
      return this.i18nStore.t(key, params);
    },

    async initializeFileSystem() {
      try {
        this.fileSystem = await createVirtualFileSystem(
          this.coursePath,
          this.challengeId,
          this.challengeData.files,
          this.language
        );

        this.updateVisibleFiles();
        this.updateActiveFile();

        window.addEventListener("vfs-event", this.handleFileSystemEvent as EventListener);
      } catch (error) {
        console.error("Failed to initialize filesystem:", error);
      }
    },

    async resetFileSystem() {
      const message = this.t("challenge.resetConfirm");
      if (confirm(message)) {
        try {
          if (this.fileSystem) {
            await this.fileSystem.reset();
            this.updateVisibleFiles();
            this.updateActiveFile();
          }
        } catch (error) {
          console.error("Failed to reset filesystem:", error);
        }
      }
    },

    setupAutoReload() {
      if (this.hasAutoReloadFiles) {
        this.autoReloadEnabled = true;
      }
    },

    handleFileSystemEvent(event: Event) {
      const customEvent = event as CustomEvent;
      const { type, autoreload } = customEvent.detail;

      if (type === "active-file-change") {
        this.updateActiveFile();
      } else if (type === "file-change") {
        if (autoreload && this.autoReloadEnabled) {
          // Don't reload immediately while editor has focus
          // Instead, mark that we need to reload when focus is lost
          if (this.editorHasFocus) {
            this.pendingAutoReload = true;
          } else {
            this.runCode();
          }
        }
      } else if (type === "file-added" || type === "file-removed") {
        this.updateVisibleFiles();
      }
    },

    handleEditorFocus() {
      this.editorHasFocus = true;
    },

    handleEditorBlur() {
      this.editorHasFocus = false;
      // If there's a pending autoreload, execute it now that focus is lost
      if (this.pendingAutoReload && this.autoReloadEnabled) {
        this.pendingAutoReload = false;
        this.runCode();
      }
    },

    updateVisibleFiles() {
      if (this.fileSystem) {
        this.visibleFiles = this.fileSystem.getVisibleFiles();
      }
    },

    updateActiveFile() {
      if (!this.fileSystem) return;

      this.activeFile = this.fileSystem.activeFile;
      if (this.activeFile) {
        const file = this.fileSystem.files.get(this.activeFile);
        if (file) {
          this.activeFileContent = file.content;
          this.activeFileReadonly = file.readonly;
        }
      }
    },

    handleFileSelect(filename: string) {
      this.fileSystem?.setActiveFile(filename);
    },

    handleFileAdd(filename: string) {
      this.fileSystem?.addFile(filename);
      this.updateVisibleFiles();
    },

    handleFileRemove(filename: string) {
      const message = this.t("challenge.deleteFileConfirm", { filename });
      if (confirm(message)) {
        this.fileSystem?.removeFile(filename);
        this.updateVisibleFiles();
      }
    },

    handleContentUpdate(newContent: string) {
      if (this.activeFile && this.fileSystem) {
        this.fileSystem.updateFileContent(this.activeFile, newContent);
        this.activeFileContent = newContent;
      }
    },

    async runCode() {
      if (!this.fileSystem || this.isRunning) return;

      this.isRunning = true;
      this.executionOutput = "";
      this.executionError = "";
      this.previewContent = "";
      this.previewType = null;
      this.testResult = null;

      try {
        const runner = await codeRunnerRegistry.getOrInitializeRunner(this.runnerLanguage);
        if (!runner) {
          this.executionError = `No runner available for ${this.runnerLanguage}`;
          return;
        }

        const files: Record<string, string> = {};
        for (const file of this.fileSystem.getAllFiles()) {
          files[file.filename] = file.content;
        }

        const result = await runner.execute(files, this.challengeData.mainFile);

        if (result.success) {
          this.executionOutput = result.output || "";

          if (result.htmlContent) {
            this.previewContent = result.htmlContent;
            this.previewType = "web";
          } else if (result.imageData) {
            this.previewContent = result.imageData;
            this.previewType = "image";
          } else if (result.output) {
            this.previewContent = result.output;
            this.previewType = "text";
          }
        } else {
          this.executionError = result.error || "Unknown error occurred";
        }
      } catch (error: any) {
        this.executionError = error.message || String(error);
      } finally {
        this.isRunning = false;
      }
    },

    async runTestSuite() {
      if (!this.fileSystem || this.isTesting) return;

      this.isTesting = true;
      this.testResult = null;
      this.executionOutput = "";
      this.executionError = "";

      try {
        const files: Record<string, string> = {};
        for (const file of this.fileSystem.getAllFiles()) {
          files[file.filename] = file.content;
        }

        // Find test file
        const testFile = this.challengeData.files.find((f) => f.filename.startsWith("test.") || f.filename.endsWith("_test.py"));

        if (!testFile) {
          this.executionError = "No test file found in challenge";
          return;
        }

        this.testResult = await runTests(this.runnerLanguage, files, testFile.filename, this.challengeData.maxScore);

        if (this.testResult.output) {
          this.executionOutput = this.testResult.output;
        }
        if (this.testResult.error) {
          this.executionError = this.testResult.error;
        }

        // Save score to storage if test passed
        if (this.testResult.passed && this.testResult.score > 0) {
          await storageService.setChallengeScore(
            this.coursePath,
            this.challengeId,
            this.testResult.score,
            this.language as "sk" | "en"
          );
          console.log(`Code challenge score saved: ${this.testResult.score}/${this.testResult.maxScore} points`);
        }
      } catch (error: any) {
        this.executionError = error.message || String(error);
      } finally {
        this.isTesting = false;
      }
    },

    startResize(e: MouseEvent) {
      e.preventDefault();
      this.isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      // Create overlay to prevent iframe from capturing events
      const overlay = document.createElement('div');
      overlay.id = 'resize-overlay';
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; cursor: col-resize;';
      document.body.appendChild(overlay);

      document.addEventListener("mousemove", this.handleMouseMove);
      document.addEventListener("mouseup", this.handleMouseUp);
      window.addEventListener("blur", this.handleMouseUp);
    },

    handleMouseMove(e: MouseEvent) {
      if (!this.isResizing) return;
      e.preventDefault();

      const container = document.querySelector(".split-container") as HTMLElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      this.splitPosition = Math.max(20, Math.min(80, newPosition));
    },

    handleMouseUp() {
      if (!this.isResizing) return;

      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Remove overlay
      const overlay = document.getElementById('resize-overlay');
      if (overlay) {
        overlay.remove();
      }

      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
      window.removeEventListener("blur", this.handleMouseUp);
    },
  },
});
</script>

<template>
  <div class="code-challenge">
    <div class="actions-bar">
      <button @click="runCode" :disabled="isRunning" class="btn btn-primary">
        {{ isRunning ? t("challenge.running") : t("challenge.runCode") }}
      </button>
      <button @click="runTestSuite" :disabled="isTesting" class="btn btn-success">
        {{ isTesting ? t("challenge.testing") : t("challenge.testSolution") }}
      </button>
      <button @click="resetFileSystem" class="btn btn-secondary" :title="t('challenge.resetConfirm')">
        {{ t("challenge.reset") }}
      </button>
      <label v-if="hasAutoReloadFiles" class="auto-reload-toggle">
        <input type="checkbox" v-model="autoReloadEnabled" />
        <span>{{ t("challenge.autoReload") }}</span>
      </label>
    </div>

    <!-- Desktop: Split View, Mobile: Stacked -->
    <div class="split-container has-preview">
      <div class="editor-panel" :style="{ width: `${splitPosition}%` }">
        <div class="ide-container">
          <FileTabs
            :files="visibleFiles"
            :active-file="activeFile"
            @file-select="handleFileSelect"
            @file-add="handleFileAdd"
            @file-remove="handleFileRemove"
          />

          <div class="editor-wrapper">
            <CodeEditor
              v-if="activeFile"
              :content="activeFileContent"
              :filename="activeFile"
              :readonly="activeFileReadonly"
              :challenge-key="`${coursePath}/${challengeId}`"
              @update:content="handleContentUpdate"
              @focus="handleEditorFocus"
              @blur="handleEditorBlur"
            />
            <!-- Busy indicator overlay -->
            <div v-if="isRunning || isTesting" class="editor-busy-overlay">
              <div class="busy-indicator">
                <div class="busy-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>{{ isRunning ? t("challenge.running") : t("challenge.testing") }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="resize-handle" @mousedown="startResize"></div>

      <div class="preview-panel" :style="{ width: `${100 - splitPosition}%` }">
        <div class="output-container">
          <!-- Placeholder when no output -->
          <div v-if="showPlaceholder" class="preview-placeholder">
            <div class="placeholder-icon">▶</div>
            <p>{{ t("challenge.previewPlaceholder") }}</p>
          </div>
          <!-- Preview -->
          <div v-if="previewType === 'web'" class="preview-web">
            <iframe :srcdoc="previewContent" sandbox="allow-scripts"></iframe>
          </div>
          <div v-else-if="previewType === 'image'" class="preview-image">
            <img :src="previewContent" alt="Output" />
          </div>
          <pre v-else-if="previewType === 'text'" class="preview-text">{{ previewContent }}</pre>

          <!-- Execution Output -->
          <div v-if="executionOutput && !testResult" class="output">
            <h4>{{ t("challenge.output") }}</h4>
            <pre>{{ executionOutput }}</pre>
          </div>

          <!-- Execution Error -->
          <div v-if="executionError" class="error">
            <h4>{{ t("challenge.error") }}</h4>
            <pre>{{ executionError }}</pre>
          </div>

          <!-- Test Results -->
          <div v-if="testResult" class="test-results" :class="{ passed: testResult.passed, failed: !testResult.passed }">
            <div class="test-header">
              <span class="test-icon">{{ testResult.passed ? "✓" : "✗" }}</span>
              <h4>{{ testResult.passed ? t("challenge.testsPassed") : t("challenge.testsFailed") }}</h4>
            </div>
            <div class="test-score">{{ t("challenge.score") }}: {{ testResult.score }} / {{ testResult.maxScore }}</div>
            <div v-if="testResult.feedback" class="test-feedback">
              {{ testResult.feedback }}
            </div>
            <div v-if="testResult.output" class="test-output">
              <h5>{{ t("challenge.testOutput") }}</h5>
              <pre>{{ testResult.output }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-challenge {
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
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.split-container {
  display: flex;
  gap: 0;
  flex: 1;
  min-height: 500px;
  position: relative;
}

.split-container.has-preview {
  flex-direction: row;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  transition: width 0.05s ease-out;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  overflow: auto;
  transition: width 0.05s ease-out;
}

.resize-handle {
  width: 8px;
  background: #2d2d2d;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #3d3d3d;
}

.resize-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 40px;
  background: #555;
  border-radius: 2px;
}

.ide-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.editor-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.editor-busy-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: all;
}

.busy-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.busy-dots {
  display: flex;
  gap: 8px;
}

.busy-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0066cc;
  animation: busy-bounce 1.4s infinite ease-in-out both;
}

.busy-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.busy-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes busy-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.busy-indicator p {
  color: #fff;
  font-size: 14px;
  margin: 0;
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

.btn-success {
  background: #16a34a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #15803d;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.auto-reload-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  cursor: pointer;
  user-select: none;
}

.output-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow: auto;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  text-align: center;
  gap: 16px;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.preview-placeholder p {
  font-size: 16px;
  max-width: 300px;
  line-height: 1.5;
  margin: 0;
}

.preview-web {
  flex: 1;
  min-height: 400px;
}

.preview-web iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  background: white;
}

.preview-image {
  text-align: center;
  padding: 20px;
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
}

.preview-image img {
  max-width: 100%;
  height: auto;
}

.preview-text,
.output pre,
.error pre,
.test-output pre {
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  padding: 16px;
  color: #ccc;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error {
  color: #f87171;
}

.error h4 {
  margin-bottom: 8px;
  color: #f87171;
}

.test-results {
  border: 2px solid;
  border-radius: 8px;
  padding: 20px;
}

.test-results.passed {
  border-color: #16a34a;
  background: rgba(22, 163, 74, 0.1);
}

.test-results.failed {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.test-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.test-icon {
  font-size: 24px;
}

.test-results.passed .test-icon {
  color: #16a34a;
}

.test-results.failed .test-icon {
  color: #dc2626;
}

.test-results h4 {
  margin: 0;
  color: white;
}

.test-score {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.test-feedback {
  color: #ccc;
  margin-bottom: 12px;
}

.test-output h5 {
  color: white;
  margin-bottom: 8px;
}

/* Mobile responsive - stack editor and preview vertically */
@media (max-width: 768px) {
  .split-container {
    flex-direction: column !important;
  }

  .editor-panel,
  .preview-panel {
    width: 100% !important;
    min-width: unset;
  }

  .resize-handle {
    display: none;
  }

  .ide-container {
    min-height: 400px;
  }

  .preview-panel {
    margin-top: 16px;
  }
}
</style>

<style>
/* Global styles for matplotlib plots rendered by Pyodide */
/* These need to be global (not scoped) to affect matplotlib's DOM elements */

/* Container for matplotlib figure */
body > div[style*="display: inline-block"] {
  display: block !important;
  margin: 16px !important;
  padding: 0 !important;
  max-width: calc(100% - 32px) !important;
  overflow-x: hidden !important;
}

/* Matplotlib title bar */
.ui-dialog-titlebar {
  background: #2d2d2d !important;
  color: #fff !important;
  padding: 8px !important;
  border-radius: 4px 4px 0 0 !important;
}

.ui-dialog-title {
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

/* Matplotlib canvas container - make it responsive */
body > div[style*="display: inline-block"] > div[style*="resize: both"] {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  min-height: 400px !important;
  max-height: 600px !important;
  resize: vertical !important;
  border: 1px solid #3d3d3d !important;
  background: #1e1e1e !important;
}

/* Matplotlib canvas */
.mpl-canvas {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
}

/* Matplotlib toolbar */
.mpl-toolbar {
  background: #2d2d2d !important;
  padding: 8px !important;
  border-top: 1px solid #3d3d3d !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.mpl-button-group {
  display: flex !important;
  gap: 4px !important;
}

.mpl-widget {
  background: #3d3d3d !important;
  border: 1px solid #4d4d4d !important;
  border-radius: 4px !important;
  padding: 4px 8px !important;
  cursor: pointer !important;
  color: #fff !important;
}

.mpl-widget:hover:not(:disabled) {
  background: #4d4d4d !important;
}

.mpl-widget:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.mpl-widget.active {
  background: #0066cc !important;
  border-color: #0052a3 !important;
}

.mpl-message {
  color: #ccc !important;
  font-size: 12px !important;
  margin-left: auto !important;
}

/* Dropdown for export formats */
.mpl-toolbar select {
  background: #3d3d3d !important;
  border: 1px solid #4d4d4d !important;
  border-radius: 4px !important;
  padding: 4px 8px !important;
  color: #fff !important;
  cursor: pointer !important;
}
</style>
