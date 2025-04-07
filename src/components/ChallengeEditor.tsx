import React, { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import { storageService } from "../services/storageService";

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
  const [isLoading, setIsLoading] = useState(false);

  const localStorageKey = `uloha_${categoryId}_${challengeId}_${language}`;

  useEffect(() => {
    const loadCode = async () => {
      setIsLoading(true);
      const storedValue = await storageService.getEditorCode(categoryId, challengeId, language);
      if (storedValue) {
        setCode([storedValue, readOnly]);
      }
      setIsLoading(false);
    };

    loadCode();
  }, [localStorageKey, setCode, readOnly, categoryId, challengeId, language]);

  const handleEditorChange = async (value?: string) => {
    if (value && !readOnly) {
      setCode([value, readOnly]);
      // Save to IndexedDB
      await storageService.setEditorCode(categoryId, challengeId, language, value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col mb-2">
        <h2 className="mb-1 text-xl font-semibold">{language.toUpperCase()}</h2>
        <div className="flex-1 min-h-0 flex items-center justify-center">Načítavam kód...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col mb-2">
      <h2 className="mb-1 text-xl font-semibold">{language.toUpperCase()}</h2>
      <div className="flex-1 min-h-0">
        <CodeEditor readOnly={readOnly} language={language} value={code} onChange={handleEditorChange} height="100%" />
      </div>
    </div>
  );
};

export default ChallengeEditor;
