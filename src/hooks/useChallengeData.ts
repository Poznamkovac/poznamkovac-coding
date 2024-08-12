import { useState, useEffect } from 'react';
import { ChallengeData } from '../types/challenge';

type CodeState = [string, boolean] | null;

export const useChallengeData = (categoryId: string, challengeId: string) => {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [htmlCode, setHtmlCode] = useState<CodeState>(null);
  const [cssCode, setCssCode] = useState<CodeState>(null);
  const [jsCode, setJsCode] = useState<CodeState>(null);
  const [imageExists, setImageExists] = useState<boolean>(false);

  useEffect(() => {
    const processInitialCode = (code: string | string[] | null | undefined): CodeState => {
      if (Array.isArray(code)) {
        if (code.length === 0) return null;
        return code.length === 1 ? [code[0], false] : [code[0], !!code[1]];
      }
      if (typeof code === 'string') return [code, false];
      return null;
    };

    // Načíta dáta o úlohe
    fetch(`/data/ulohy/${categoryId}/${challengeId}/zadanie.json`)
      .then((response) => response.json())
      .then((data: ChallengeData) => {
        setChallengeData(data);
        setHtmlCode(processInitialCode(data.pociatocnyKod.html));
        setCssCode(processInitialCode(data.pociatocnyKod.css));
        setJsCode(processInitialCode(data.pociatocnyKod.js));
      })
      .catch((error) => console.error("Chyba pri načítavaní údajov úlohy:", error));

    // Zobrazí obrázok, ak existuje
    fetch(`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`)
      .then((response) => {
        if (response.headers.get("content-type")?.startsWith("image")) {
          setImageExists(true);
        }
      })
      .catch(() => setImageExists(false));
  }, [categoryId, challengeId]);

  return { challengeData, htmlCode, cssCode, jsCode, imageExists, setHtmlCode, setCssCode, setJsCode };
};
