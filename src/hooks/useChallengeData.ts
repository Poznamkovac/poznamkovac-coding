import type { ChallengeData } from '../types/challenge';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      if (typeof code === 'string') return [code, false];
      return null;
    };

    /** Načíta rozpracovaný kód alebo počiatočný stav (na začiatku úlohy) */
    const loadSavedOrInitialCode = (language: string, initialCode: string | string[] | null | undefined) => {
      const savedCode = localStorage.getItem(`uloha_${categoryId}_${challengeId}_${language}`);
      if (savedCode !== null) {
        return [savedCode, false] as CodeState;
      }
      return processInitialCode(initialCode);
    };

    // Načíta dáta o úlohe
    fetch(`/data/ulohy/${categoryId}/${challengeId}/zadanie.json`)
      .then((response) => response.json())
      .then((data: ChallengeData) => {
        setChallengeData(data);
        setHtmlCode(loadSavedOrInitialCode('html', data.pociatocnyKod.html));
        setCssCode(loadSavedOrInitialCode('css', data.pociatocnyKod.css));
        setJsCode(loadSavedOrInitialCode('js', data.pociatocnyKod.js));
      })
      .catch((error) => {
        console.error("Chyba pri načítavaní údajov úlohy:", error);
        navigate(`/ulohy/${categoryId}`);
      });
  }, [categoryId, challengeId, navigate]);

  return { challengeData, htmlCode, cssCode, jsCode, setHtmlCode, setCssCode, setJsCode };
};
