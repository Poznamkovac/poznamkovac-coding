import React from "react";
import { Test } from "../types/test";

interface ChallengeTestsProps {
  categoryId: string;
  challengeId: string;
}

const ChallengeTests: React.FC<ChallengeTestsProps> = ({ categoryId, challengeId }) => {
  const [testResults, setTestResults] = React.useState<Array<{ name: string; result: Test }>>([]);

  const runTests = async () => {
    try {
      const testModule = await import(/* @vite-ignore */ `/data/ulohy/${categoryId}/${challengeId}/testy.js`);
      const tester = new testModule.default();
      const previewWindow = (document.getElementById("preview") as HTMLIFrameElement)?.contentWindow;
      previewWindow?.location.reload(); // resetuje stav - JS premenné, atď.

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

  return (
    <div>
      <button
        onClick={runTests}
        className="px-4 py-2 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        ▶ Overiť riešenie
      </button>

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
