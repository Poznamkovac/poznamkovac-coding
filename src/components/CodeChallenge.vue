<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FileTabs from "./FileTabs.vue";
import CodeEditor from "./CodeEditor.vue";
import { createVirtualFileSystem, type VirtualFileSystem, type VirtualFile } from "../services/virtualFileSystem";
import { codeRunnerRegistry } from "../services/codeRunners";
import { runTests, type TestResult } from "../services/testRunner";
import type { CodeChallengeData } from "../types";

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
  },

  async mounted() {
    await this.initializeFileSystem();
    this.setupAutoReload();
  },

  beforeUnmount() {
    window.removeEventListener("vfs-event", this.handleFileSystemEvent as EventListener);
  },

  methods: {
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
          this.runCode();
        }
      } else if (type === "file-added" || type === "file-removed") {
        this.updateVisibleFiles();
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
      if (confirm(`Naozaj chcete odstrániť súbor "${filename}"?`)) {
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
        const testFile = this.challengeData.files.find((f) =>
          f.filename.startsWith("test.") || f.filename.endsWith("_test.py")
        );

        if (!testFile) {
          this.executionError = "No test file found in challenge";
          return;
        }

        this.testResult = await runTests(
          this.runnerLanguage,
          files,
          testFile.filename,
          this.challengeData.maxScore
        );

        if (this.testResult.output) {
          this.executionOutput = this.testResult.output;
        }
        if (this.testResult.error) {
          this.executionError = this.testResult.error;
        }
      } catch (error: any) {
        this.executionError = error.message || String(error);
      } finally {
        this.isTesting = false;
      }
    },
  },
});
</script>

<template>
  <div class="code-challenge">
    <div class="ide-container">
      <FileTabs
        :files="visibleFiles"
        :active-file="activeFile"
        @file-select="handleFileSelect"
        @file-add="handleFileAdd"
        @file-remove="handleFileRemove"
      />

      <CodeEditor
        v-if="activeFile"
        :content="activeFileContent"
        :filename="activeFile"
        :readonly="activeFileReadonly"
        @update:content="handleContentUpdate"
      />
    </div>

    <div class="actions-bar">
      <button
        @click="runCode"
        :disabled="isRunning"
        class="btn btn-primary"
      >
        {{ isRunning ? "Spúšťa sa..." : "Spustiť kód" }}
      </button>
      <button
        @click="runTestSuite"
        :disabled="isTesting"
        class="btn btn-success"
      >
        {{ isTesting ? "Testuje sa..." : "Otestovať riešenie" }}
      </button>
      <label v-if="hasAutoReloadFiles" class="auto-reload-toggle">
        <input type="checkbox" v-model="autoReloadEnabled" />
        <span>Auto-reload</span>
      </label>
    </div>

    <!-- Preview/Output Area -->
    <div v-if="previewType || executionOutput || executionError || testResult" class="output-container">
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
        <h4>Výstup:</h4>
        <pre>{{ executionOutput }}</pre>
      </div>

      <!-- Execution Error -->
      <div v-if="executionError" class="error">
        <h4>Chyba:</h4>
        <pre>{{ executionError }}</pre>
      </div>

      <!-- Test Results -->
      <div v-if="testResult" class="test-results" :class="{ passed: testResult.passed, failed: !testResult.passed }">
        <div class="test-header">
          <span class="test-icon">{{ testResult.passed ? "✓" : "✗" }}</span>
          <h4>{{ testResult.passed ? "Testy prešli!" : "Testy zlyhali" }}</h4>
        </div>
        <div class="test-score">
          Skóre: {{ testResult.score }} / {{ testResult.maxScore }}
        </div>
        <div v-if="testResult.feedback" class="test-feedback">
          {{ testResult.feedback }}
        </div>
        <div v-if="testResult.output" class="test-output">
          <h5>Výstup testov:</h5>
          <pre>{{ testResult.output }}</pre>
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

.ide-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.actions-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  px: 16px;
  py: 8px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
}

.preview-web iframe {
  width: 100%;
  height: 400px;
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
</style>
