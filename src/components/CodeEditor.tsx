import React, { useRef, useEffect } from 'react';
import type * as monaco from 'monaco-editor';
import { Editor, OnMount } from '@monaco-editor/react';
import { emmetHTML, emmetCSS } from 'emmet-monaco-es'
import useAutoCloseTags from '../hooks/useAutoCloseTags';

declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, readOnly = false, height = '200px' }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposeEmmetHtmlRef = useRef<any>(null);
  const disposeEmmetCssRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorWillMount = (m: typeof monaco) => {
    disposeEmmetHtmlRef.current = emmetHTML(m, ["html"]);
    disposeEmmetCssRef.current = emmetCSS(m, ["css"]);
  };

  useAutoCloseTags(editorRef.current);

  useEffect(() => {
    return () => {
      editorRef.current?.dispose();
      disposeEmmetHtmlRef.current?.dispose();
      disposeEmmetCssRef.current?.dispose();
    };
  }, []);

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        theme: 'vs-dark',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
};

export default CodeEditor;
