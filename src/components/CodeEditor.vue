<script lang="ts">
import { defineComponent } from "vue";
import * as monaco from "monaco-editor";

let sharedEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let currentContainer: HTMLElement | null = null;
let currentChallengeKey: string | null = null;
let modelChangeListener: monaco.IDisposable | null = null;

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
    challengeKey: {
      type: String,
      required: true,
    },
  },

  emits: ["update:content", "focus", "blur"],

  data() {
    return {
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
    if (modelChangeListener) {
      modelChangeListener.dispose();
      modelChangeListener = null;
    }
  },

  methods: {
    initOrReuseEditor() {
      const container = this.$refs.editorContainer as HTMLElement;
      if (!container) return;

      if (sharedEditor && currentChallengeKey !== this.challengeKey) {
        sharedEditor.dispose();
        sharedEditor = null;
        currentContainer = null;
        currentChallengeKey = this.challengeKey;
        this.createEditor(container, this.content);
      }
      else if (sharedEditor && currentContainer !== container) {
        if (currentContainer && sharedEditor) {
          currentContainer.innerHTML = "";
        }

        const currentModel = sharedEditor.getModel();
        const currentValue = currentModel?.getValue() || "";
        sharedEditor.dispose();
        sharedEditor = null;

        this.createEditor(container, currentValue);
      } else if (!sharedEditor) {
        currentChallengeKey = this.challengeKey;
        this.createEditor(container, this.content);
      } else {
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

      if (modelChangeListener) {
        modelChangeListener.dispose();
      }

      modelChangeListener = model.onDidChangeContent(() => {
        this.handleContentChange();
      });

      sharedEditor.onDidFocusEditorText(() => {
        this.$emit("focus");
      });

      sharedEditor.onDidBlurEditorText(() => {
        this.$emit("blur");
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

        if (modelChangeListener) {
          modelChangeListener.dispose();
        }
        modelChangeListener = model.onDidChangeContent(() => {
          this.handleContentChange();
        });
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
      if (sharedEditor) {
        const model = sharedEditor.getModel();
        if (model) {
          const newContent = model.getValue();
          this.$emit("update:content", newContent);
        }
      }
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
