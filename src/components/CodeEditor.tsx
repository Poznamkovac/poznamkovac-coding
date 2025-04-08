import type React from "react";
import type * as monaco from "monaco-editor";
import { useRef, useEffect } from "react";

import { BeforeMount, Editor, Monaco, OnMount } from "@monaco-editor/react";
import { emmetHTML, emmetCSS } from "emmet-monaco-es";

import useAutoCloseTags from "../hooks/useAutoCloseTags";

// Define a specific type for the emmet disposable functions
interface DisposableFunction {
  (): void;
}

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value?: string) => void;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, readOnly = false, height = "200px" }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposeEmmetHtmlRef = useRef<DisposableFunction | null>(null);
  const disposeEmmetCssRef = useRef<DisposableFunction | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorWillMount: BeforeMount = (m: Monaco) => {
    // Configure available languages and emmet support
    disposeEmmetHtmlRef.current = emmetHTML(m, ["html", "jsx", "tsx"]);
    disposeEmmetCssRef.current = emmetCSS(m, ["css", "scss"]);

    // Enable typescript intellisense features
    m.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add basic libraries for JavaScript/TypeScript
    m.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: m.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
      module: m.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ["node_modules/@types"],
    });
  };

  useAutoCloseTags(editorRef.current);

  useEffect(() => {
    return () => {
      editorRef.current?.dispose();
      if (typeof disposeEmmetHtmlRef.current === "function") {
        disposeEmmetHtmlRef.current();
      }
      if (typeof disposeEmmetCssRef.current === "function") {
        disposeEmmetCssRef.current();
      }
    };
  }, []);

  return (
    <Editor
      loading={<div>Načítavam editor kódu...</div>}
      height={height || "100%"}
      language={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        theme: "vs-dark",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        wordWrap: "on",
        suggest: {
          showWords: true,
        },
      }}
    />
  );
};

export default CodeEditor;
