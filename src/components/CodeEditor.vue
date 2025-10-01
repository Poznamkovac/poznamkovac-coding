<script lang="ts">
import { defineComponent } from "vue";
import * as monaco from "monaco-editor";

// Shared editor instance to avoid recreating
let sharedEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let currentContainer: HTMLElement | null = null;

export default defineComponent({
  name: "CodeEditor",

  props: {
    content: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["update:content"],

  data() {
    return {
      updateTimer: null as number | null,
      isInitialized: false,
    };
  },

  computed: {
    language(): string {
      const ext = this.filename.split(".").pop()?.toLowerCase() || "";
      const langMap: Record<string, string> = {
        html: "html",
        css: "css",
        js: "javascript",
        ts: "typescript",
        json: "json",
        md: "markdown",
        py: "python",
        sql: "sql",
        lua: "lua",
        txt: "plaintext",
      };
      return langMap[ext] || "plaintext";
    },
  },

  watch: {
    content(newContent) {
      if (sharedEditor) {
        const currentValue = sharedEditor.getValue();
        if (currentValue !== newContent) {
          const position = sharedEditor.getPosition();
          sharedEditor.setValue(newContent);
          if (position) {
            sharedEditor.setPosition(position);
          }
        }
      }
    },

    filename() {
      this.updateLanguage();
    },

    readonly(newValue) {
      if (sharedEditor) {
        sharedEditor.updateOptions({ readOnly: newValue });
      }
    },
  },

  async mounted() {
    await this.$nextTick();
    requestAnimationFrame(() => {
      this.initOrReuseEditor();
    });
  },

  beforeUnmount() {
    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }
    // Don't dispose the shared editor, just remove listeners
    if (sharedEditor) {
      const model = sharedEditor.getModel();
      if (model) {
        model.onDidChangeContent(() => {}); // Remove listener
      }
    }
  },

  methods: {
    initOrReuseEditor() {
      const container = this.$refs.editorContainer as HTMLElement;
      if (!container) return;

      // If editor exists and is in a different container, move it
      if (sharedEditor && currentContainer !== container) {
        // Detach from old container
        if (currentContainer && sharedEditor) {
          currentContainer.innerHTML = '';
        }

        // Recreate in new container
        const currentModel = sharedEditor.getModel();
        const currentValue = currentModel?.getValue() || '';
        sharedEditor.dispose();
        sharedEditor = null;

        this.createEditor(container, currentValue);
      } else if (!sharedEditor) {
        // Create new editor
        this.createEditor(container, this.content);
      } else {
        // Reuse existing editor - just update content and language
        this.updateEditorContent();
      }

      currentContainer = container;
      this.isInitialized = true;
    },

    createEditor(container: HTMLElement, initialContent: string) {
      const model = monaco.editor.createModel(initialContent, this.language);

      sharedEditor = monaco.editor.create(container, {
        model: model,
        theme: "vs-dark",
        readOnly: this.readonly,
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        lineNumbers: "on",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnPaste: true,
        formatOnType: true,
      });

      model.onDidChangeContent(() => {
        this.handleContentChange();
      });
    },

    updateEditorContent() {
      if (!sharedEditor) return;

      const model = sharedEditor.getModel();
      if (model) {
        const currentValue = model.getValue();
        if (currentValue !== this.content) {
          model.setValue(this.content);
        }
        monaco.editor.setModelLanguage(model, this.language);
      }

      sharedEditor.updateOptions({ readOnly: this.readonly });
    },

    updateLanguage() {
      if (sharedEditor) {
        const model = sharedEditor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, this.language);
        }
      }
    },

    handleContentChange() {
      if (this.updateTimer) {
        window.clearTimeout(this.updateTimer);
      }

      this.updateTimer = window.setTimeout(() => {
        if (sharedEditor) {
          const model = sharedEditor.getModel();
          if (model) {
            const newContent = model.getValue();
            this.$emit("update:content", newContent);
          }
        }
      }, 300);
    },
  },
});
</script>

<template>
  <div class="code-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<style scoped>
.code-editor {
  height: 100%;
  width: 100%;
}

.editor-container {
  height: 100%;
  width: 100%;
}
</style>
