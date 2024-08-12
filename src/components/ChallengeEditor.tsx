import React from 'react';
import CodeEditor from './CodeEditor';

type CodeState = [string, boolean] | null;

interface ChallengeEditorProps {
  language: string;
  codeState: CodeState;
  setCode: React.Dispatch<React.SetStateAction<CodeState>>;
  handleCodeChange: (language: string, value: string) => void;
}

const ChallengeEditor: React.FC<ChallengeEditorProps> = ({ language, codeState, setCode, handleCodeChange }) => {
  if (!codeState) return null;
  const [code, readOnly] = codeState;

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-xl font-semibold">{language.toUpperCase()}</h2>
      <CodeEditor
        readOnly={readOnly}
        language={language}
        value={code}
        onChange={(value) => {
          if (!readOnly) {
            setCode([value || "", readOnly]);
            handleCodeChange(language, value || "");
          }
        }}
      />
    </div>
  );
};

export default ChallengeEditor;
