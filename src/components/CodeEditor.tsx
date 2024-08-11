import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { Editor, OnMount } from '@monaco-editor/react';
import useAutoCloseTags from '../hooks/useAutoCloseTags';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, height = '200px' }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  useAutoCloseTags(editorRef.current);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        readOnly: false,
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
