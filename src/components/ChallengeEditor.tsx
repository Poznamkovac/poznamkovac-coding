import React, { useEffect } from "react";
import CodeEditor from "./CodeEditor";

type CodeState = [string, boolean] | null;

interface ChallengeEditorProps {
  language: string;
  codeState: CodeState;
  setCode: React.Dispatch<React.SetStateAction<CodeState>>;
  categoryId: string;
  challengeId: string;
}

const ChallengeEditor: React.FC<ChallengeEditorProps> = ({ language, codeState, setCode, categoryId, challengeId }) => {
  if (!codeState) return null;
  const [code, readOnly] = codeState;

  const localStorageKey = `uloha_${categoryId}_${challengeId}_${language}`;
  useEffect(() => {
    const storedValue = localStorage.getItem(localStorageKey);
    if (storedValue) {
      setCode([storedValue, readOnly]);
    }
  }, [localStorageKey, setCode, readOnly]);

  const handleEditorChange = (value?: string) => {
    if (value && !readOnly) {
      setCode([value, readOnly]);
      localStorage.setItem(localStorageKey, value);
    }
  };

  return (
    <div className="mb-4">
      <h2 className="mb-2 text-xl font-semibold">{language.toUpperCase()}</h2>
      <CodeEditor readOnly={readOnly} language={language} value={code} onChange={handleEditorChange} />
    </div>
  );
};

export default ChallengeEditor;
