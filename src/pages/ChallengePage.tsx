import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useChallengeData } from "../hooks/useChallengeData";

import ChallengeEditor from "../components/ChallengeEditor";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";

const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams();
  const { challengeData, htmlCode, cssCode, jsCode, imageExists, setHtmlCode, setCssCode, setJsCode } = useChallengeData(categoryId!, challengeId!);
  const [_, setPreviewError] = useState<string | null>(null);

  const handleCodeChange = (language: string, value: string) => {
    const updateCode = (prevState: [string, boolean] | null): [string, boolean] | null => 
      prevState ? [value, prevState[1]] : [value, false];

    switch (language) {
      case "html":
        setHtmlCode(updateCode);
        break;
      case "css":
        setCssCode(updateCode);
        break;
      case "js":
        setJsCode(updateCode);
        break;
    }
    setPreviewError(null);
  };

  if (!challengeData) return <div>Načítavam...</div>;

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        <h2 className="mb-4 text-3xl font-bold">{challengeData.nazov}</h2>
        <p className="mb-6" dangerouslySetInnerHTML={{ __html: challengeData.zadanie }} />

        {imageExists && (
          <div className="mb-6">
            <img
              src={`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`}
              alt="Obrázok k úlohe"
              className="h-auto max-w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <ChallengeEditor language="html" codeState={htmlCode} setCode={setHtmlCode} handleCodeChange={handleCodeChange} />
            <ChallengeEditor language="css" codeState={cssCode} setCode={setCssCode} handleCodeChange={handleCodeChange} />
            <ChallengeEditor language="javascript" codeState={jsCode} setCode={setJsCode} handleCodeChange={handleCodeChange} />
          </div>

          <div>
            <ChallengePreview
              htmlCode={htmlCode?.[0] || ''}
              cssCode={cssCode?.[0] || ''}
              jsCode={jsCode?.[0] || ''}
              setPreviewError={setPreviewError}
            />

            <ChallengeTests
              categoryId={categoryId!}
              challengeId={challengeId!}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengePage;
