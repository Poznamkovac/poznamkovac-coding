import type { ChallengeData } from "../types/challenge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storageService } from "../services/storageService";

type CodeState = [string, boolean] | null;

export const useChallengeData = (categoryId: string, challengeId: string) => {
  const navigate = useNavigate();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [htmlCode, setHtmlCode] = useState<CodeState>(null);
  const [cssCode, setCssCode] = useState<CodeState>(null);
  const [jsCode, setJsCode] = useState<CodeState>(null);

  useEffect(() => {
    /** Spracuje dáta o počiatočnom kóde */
    const processInitialCode = (code: string | string[] | null | undefined): CodeState => {
      if (Array.isArray(code)) {
        if (code.length === 0) return null;
        return code.length === 1 ? [code[0], false] : [code[0], !!code[1]];
      }
      if (typeof code === "string") return [code, false];
      return null;
    };

    /** Načíta rozpracovaný kód alebo počiatočný stav (na začiatku úlohy) */
    const loadSavedOrInitialCode = async (language: string, initialCode: string | string[] | null | undefined) => {
      try {
        const savedCode = await storageService.getEditorCode(categoryId, challengeId, language);
        if (savedCode !== null) {
          return [savedCode, false] as CodeState;
        }
      } catch (error) {
        console.error(`Error loading code for ${language}:`, error);
      }
      return processInitialCode(initialCode);
    };

    // Načíta dáta o úlohe
    const loadChallengeData = async () => {
      try {
        const response = await fetch(`/data/ulohy/${categoryId}/${challengeId}/zadanie.json`);
        const data: ChallengeData = await response.json();
        setChallengeData(data);

        // Load code from IndexedDB or use initial code
        const html = await loadSavedOrInitialCode("html", data.pociatocnyKod.html);
        const css = await loadSavedOrInitialCode("css", data.pociatocnyKod.css);
        const js = await loadSavedOrInitialCode("js", data.pociatocnyKod.js);

        setHtmlCode(html);
        setCssCode(css);
        setJsCode(js);
      } catch (error) {
        console.error("Chyba pri načítavaní údajov úlohy:", error);
        navigate(`/ulohy/${categoryId}`);
      }
    };

    loadChallengeData();
  }, [categoryId, challengeId, navigate]);

  return { challengeData, htmlCode, cssCode, jsCode, setHtmlCode, setCssCode, setJsCode };
};
