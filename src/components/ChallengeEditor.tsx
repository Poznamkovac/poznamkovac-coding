import React, { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import { storageService } from "../services/storageService";
import { useI18n } from "../hooks/useI18n";

type CodeState = [string, boolean] | null;

interface ChallengeEditorProps {
  language: string;
  codeState: CodeState;
  setCode: React.Dispatch<React.SetStateAction<CodeState>>;
  categoryId: string;
  challengeId: string;
}

const ChallengeEditor: React.FC<ChallengeEditorProps> = ({ language, codeState, setCode, categoryId, challengeId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const localStorageKey = `uloha_${categoryId}_${challengeId}_${language}`;

  useEffect(() => {
    // Skip the effect if codeState is null
    if (!codeState) return;

    const [, readOnly] = codeState;

    const loadCode = async () => {
      setIsLoading(true);
      const storedValue = await storageService.getEditorCode(categoryId, challengeId, language);
      if (storedValue) {
        setCode([storedValue, readOnly]);
      }
      setIsLoading(false);
    };

    loadCode();
  }, [localStorageKey, setCode, categoryId, challengeId, language, codeState]);

  // Return early if codeState is null
  if (!codeState) return null;
  const [code, readOnly] = codeState;

  const handleEditorChange = async (value?: string) => {
    if (value && !readOnly) {
      setCode([value, readOnly]);
      // Save to IndexedDB
      await storageService.setEditorCode(categoryId, challengeId, language, value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 mb-2">
        <h2 className="mb-1 text-xl font-semibold">{language.toUpperCase()}</h2>
        <div className="flex items-center justify-center flex-1 min-h-0">{t("editor.loadingCode")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 mb-2">
      <h2 className="mb-1 text-xl font-semibold">{language.toUpperCase()}</h2>
      <div className="flex-1 min-h-0">
        <CodeEditor readOnly={readOnly} language={language} value={code} onChange={handleEditorChange} height="100%" />
      </div>
    </div>
  );
};

export default ChallengeEditor;
