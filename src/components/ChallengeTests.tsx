import type React from "react";
import type { Test } from "../types/test";
import { useState, useEffect } from "react";
import { emitScoreUpdate } from "../services/scoreService";
import { storageService } from "../services/storageService";

interface ChallengeTestsProps {
  categoryId: string;
  challengeId: string;
  maxScore: number;
  needsTestRun?: boolean;
  onTestRun?: () => void;
  files?: string[];
  readonlyFiles?: string[];
}

interface SolutionFile {
  name: string;
  content: string;
}

const ChallengeTests: React.FC<ChallengeTestsProps> = ({
  categoryId,
  challengeId,
  maxScore,
  needsTestRun = false,
  onTestRun = () => {},
  files,
  readonlyFiles,
}) => {
  const [testResults, setTestResults] = useState<Array<{ name: string; result: Test }>>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [allTestsPassed, setAllTestsPassed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [solutionFiles, setSolutionFiles] = useState<SolutionFile[]>([]);
  const [solutionError, setSolutionError] = useState<string | null>(null);

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
    // Call the onTestRun callback to reset the needsTestRun flag
    onTestRun();

    try {
      const testModule = await import(/* @vite-ignore */ `/data/challenges/${categoryId}/${challengeId}/tests.js`);
      const tester = new testModule.default();
      const previewWindow = (document.getElementById("preview") as HTMLIFrameElement)?.contentWindow;
      previewWindow?.location.reload();

      const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tester)).filter(
        (prop) => prop.startsWith("test_") && typeof tester[prop as keyof typeof tester] === "function"
      );

      const results = await Promise.all(
        testMethods.map(async (method) => {
          try {
            const result: Test = await tester[method as keyof typeof tester](previewWindow);
            return { name: method, result };
          } catch (error) {
            console.error(`Error in method: ${method}:`, error);
            return {
              name: method,
              result: { detaily_zle: `Test execution error: ${error}` },
            };
          }
        })
      );

      setTestResults(results);

      const passedTests = results.filter((result) => result.result.detaily_ok).length;
      const newScore = Math.round((passedTests / results.length) * maxScore);
      await saveHighestScore(newScore);

      // Track failed attempts to show solution
      if (newScore < maxScore / 2) {
        setFailedAttempts((prev) => prev + 1);
      } else {
        // Reset failed attempts if they're doing well
        setFailedAttempts(0);
      }

      setAllTestsPassed(passedTests === results.length);
    } catch (error: unknown) {
      console.error("Error running tests", error);
      setTestResults([
        {
          name: "Error",
          result: { detaily_zle: "An error occurred during testing." },
        },
      ]);
    }
  };

  const loadSolution = async () => {
    try {
      // Use files from props if available, otherwise attempt to fetch
      let filesList: string[] = [];
      let readonlyList: string[] = [];

      if (files && files.length > 0) {
        filesList = files;
        readonlyList = readonlyFiles || [];
      } else {
        // Fallback to fetching assignment.json if files aren't provided
        const metadataResponse = await fetch(`/data/challenges/${categoryId}/${challengeId}/assignment.json`);
        if (!metadataResponse.ok) {
          setSolutionError("Assignment metadata not available");
          setShowSolution(true);
          return;
        }

        const metadata = await metadataResponse.json();
        filesList = metadata.files || [];
        readonlyList = metadata.readonly || [];
      }

      if (filesList.length === 0) {
        setSolutionError("No solution files defined for this challenge");
        setShowSolution(true);
        return;
      }

      const loadedFiles: SolutionFile[] = [];

      for (const filename of filesList) {
        // Skip hidden or readonly files
        if (filename.startsWith(".") || readonlyList.includes(filename)) {
          continue;
        }

        // Fetch the solution files
        const response = await fetch(`/data/challenges/${categoryId}/${challengeId}/solution/${filename}`);
        if (!response.ok) {
          continue; // Skip files that don't have solutions
        }

        // Store the solution content
        const content = await response.text();
        loadedFiles.push({ name: filename, content });
      }

      if (loadedFiles.length === 0) {
        setSolutionError("No solutions available.");
      } else {
        setSolutionFiles(loadedFiles);
      }

      setShowSolution(true);
    } catch (error) {
      console.error("Error loading solutions:", error);
      setSolutionError("Error loading solutions");
      setShowSolution(true);
    }
  };

  if (isLoading) {
    return <div>⌛️...</div>;
  }

  return (
    <div className="mx-4">
      <button
        onClick={runTests}
        className={`px-4 py-2 mt-4 font-bold text-white rounded hover:bg-blue-700 ${
          needsTestRun ? "bg-orange-600 hover:bg-orange-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {needsTestRun ? "🔄" : allTestsPassed ? "🔁" : "⏯️"}
      </button>

      {allTestsPassed && (
        <button
          onClick={() => {
            window.location.hash = `#/challenges/${categoryId}/${parseInt(challengeId, 10) + 1}`;
            window.location.reload();
          }}
          className="px-4 py-2 mt-4 ml-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
        >
          Next Challenge
        </button>
      )}

      {failedAttempts >= 5 && (
        <button
          onClick={loadSolution}
          className="px-4 py-2 mt-4 ml-2 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700"
        >
          Show Solution
        </button>
      )}

      <div className="mt-4">
        {testResults.map(({ name, result }) => (
          <div key={name} className={`p-2 mb-2 rounded ${result.detaily_ok ? "bg-green-800" : "bg-red-800"}`}>
            <b>
              {result.detaily_ok ? "✓" : "✗"} {name}
            </b>
            {result.detaily_ok ? ` - ok!` : ` - failed!`}
            <br />

            <span className="text-sm text-gray-300 font-italic">
              <span dangerouslySetInnerHTML={{ __html: result.detaily_ok || "" }} />
              <span dangerouslySetInnerHTML={{ __html: result.detaily_zle || "" }} />
            </span>
          </div>
        ))}
      </div>

      {showSolution && (
        <div className="p-4 mt-4 bg-yellow-800 rounded">
          <h3 className="mb-2 font-bold">Solution</h3>
          <p>
            Here's how this challenge can be solved. Study the solution to understand the concepts, then try implementing it
            yourself.
          </p>

          {solutionError ? (
            <div className="mt-2 text-yellow-300">{solutionError}</div>
          ) : (
            solutionFiles.map((file) => (
              <div key={file.name} className="mt-4">
                <div className="mb-1 font-semibold text-yellow-300">{file.name}</div>
                <pre className="p-3 overflow-auto text-sm bg-gray-900 rounded">
                  <code>{file.content}</code>
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeTests;
