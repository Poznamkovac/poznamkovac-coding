import type React from "react";
import type { Test } from "../types/test";
import { useState, useEffect } from "react";
import { emitScoreUpdate } from "../pages/CategoryPage";
import { storageService } from "../services/storageService";

interface ChallengeTestsProps {
  categoryId: string;
  challengeId: string;
  maxScore: number;
}

const ChallengeTests: React.FC<ChallengeTestsProps> = ({ categoryId, challengeId, maxScore }) => {
  const [testResults, setTestResults] = useState<Array<{ name: string; result: Test }>>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [allTestsPassed, setAllTestsPassed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load score from IndexedDB
    const loadScore = async () => {
      setIsLoading(true);
      const score = await storageService.getChallengeScore(categoryId, challengeId);
      setCurrentScore(score);
      setIsLoading(false);
    };

    loadScore();
  }, [categoryId, challengeId]);

  const saveHighestScore = async (newScore: number) => {
    if (newScore > currentScore) {
      setCurrentScore(newScore);
      // Use emitScoreUpdate to save to IndexedDB and broadcast the change
      await emitScoreUpdate(categoryId, challengeId, newScore);
    }
  };

  const runTests = async () => {
    try {
      const testModule = await import(/* @vite-ignore */ `/data/ulohy/${categoryId}/${challengeId}/tests.js`);
      const tester = new testModule.default();
      const previewWindow = (document.getElementById("preview") as HTMLIFrameElement)?.contentWindow;
      previewWindow?.location.reload();

      const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tester)).filter(
        (prop) => prop.startsWith("test_") && typeof tester[prop] === "function"
      );

      const results = await Promise.all(
        testMethods.map(async (method) => {
          try {
            const result: Test = await tester[method](previewWindow);
            return { name: method, result };
          } catch (error) {
            console.error(`Chyba v metóde: ${method}:`, error);
            return {
              name: method,
              result: { detaily_zle: `Chyba pri spúštaní testov: ${error}` },
            };
          }
        })
      );

      setTestResults(results);

      const passedTests = results.filter((result) => result.result.detaily_ok).length;
      const newScore = Math.round((passedTests / results.length) * maxScore);
      await saveHighestScore(newScore);

      setAllTestsPassed(passedTests === results.length);
    } catch (error: any) {
      console.error("Chyba pri spúštaní testov", error);
      setTestResults([
        {
          name: "Error",
          result: { detaily_zle: "Nastala chyba pri testovaní." },
        },
      ]);
    }
  };

  if (isLoading) {
    return <div>Načítavam...</div>;
  }

  return (
    <div>
      <button onClick={runTests} className="px-4 py-2 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
        {allTestsPassed ? "🔁 Skúsiť znovu" : "⏯️ Overiť riešenie"}
      </button>

      {allTestsPassed && (
        <button
          onClick={() => {
            window.location.hash = `#/ulohy/${categoryId}/${parseInt(challengeId, 10) + 1}`;
            window.location.reload();
          }}
          className="px-4 py-2 mt-4 ml-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
        >
          Ďalšia úloha
        </button>
      )}

      <div className="mt-4">
        {testResults.map(({ name, result }) => (
          <div key={name} className={`p-2 mb-2 rounded ${result.detaily_ok ? "bg-green-800" : "bg-red-800"}`}>
            <b>
              {result.detaily_ok ? "✓" : "✗"} {name}
            </b>
            {result.detaily_ok ? ` - ok!` : ` - zle!`}
            <br />

            <span className="text-sm text-gray-300 font-italic">
              <span dangerouslySetInnerHTML={{ __html: result.detaily_ok || "" }} />
              <span dangerouslySetInnerHTML={{ __html: result.detaily_zle || "" }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeTests;
