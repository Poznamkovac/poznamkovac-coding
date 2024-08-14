import type React from "react";
import { useParams } from "react-router-dom";
import { useChallengeData } from "../hooks/useChallengeData";
import ChallengeEditor from "../components/ChallengeEditor";
import ChallengePreview from "../components/ChallengePreview";
import ChallengeTests from "../components/ChallengeTests";
import { useEffect, useState } from "react";

const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams();
  const { challengeData, htmlCode, cssCode, jsCode, setHtmlCode, setCssCode, setJsCode } = useChallengeData(
    categoryId!,
    challengeId!
  );
  const [currentScore, setCurrentScore] = useState<number>(0);

  useEffect(() => {
    if (challengeData) {
      const storedScore = localStorage.getItem(`uloha_${categoryId}_${challengeId}_skore`);
      setCurrentScore(storedScore ? parseInt(storedScore, 10) : 0);
    }
  }, [challengeData, categoryId, challengeId]);

  if (!challengeData) return <div>Načítavam...</div>;

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        <h2 className="my-4 text-3xl font-bold">
          {currentScore === challengeData.maxSkore && "✅ "}
          {currentScore > challengeData.maxSkore && "(si veľmi šikovný :D)"}
          {challengeData.nazov}
          <span className="ml-2 text-xl font-normal">
            (Skóre: {currentScore} / {challengeData.maxSkore})
          </span>
        </h2>

        <p className="mb-6" dangerouslySetInnerHTML={{ __html: challengeData.zadanie }} />
        <div className="mb-6">
          <img
            src={`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`}
            alt="Obrázok k úlohe"
            className="h-auto max-w-full"
            onError={(e) => e.currentTarget.remove()}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <ChallengeEditor
              language="html"
              codeState={htmlCode}
              setCode={setHtmlCode}
              categoryId={categoryId!}
              challengeId={challengeId!}
            />
            <ChallengeEditor
              language="css"
              codeState={cssCode}
              setCode={setCssCode}
              categoryId={categoryId!}
              challengeId={challengeId!}
            />
            <ChallengeEditor
              language="javascript"
              codeState={jsCode}
              setCode={setJsCode}
              categoryId={categoryId!}
              challengeId={challengeId!}
            />
          </div>

          <div>
            <ChallengePreview htmlKod={htmlCode?.[0] || ""} cssKod={cssCode?.[0] || ""} jsKod={jsCode?.[0] || ""} />
            <ChallengeTests categoryId={categoryId!} challengeId={challengeId!} maxScore={challengeData.maxSkore} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengePage;
