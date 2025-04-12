import type React from "react";
import type { Test } from "../types/test";
import { useState, useEffect, useRef } from "react";
import { emitScoreUpdate } from "../services/scoreService";
import { storageService } from "../services/storageService";

interface ChallengeTestsProps {
  categoryId: string;
  challengeId: string;
  maxScore: number;
  needsTestRun?: boolean;
  showNextButton?: boolean;
  onTestRun?: () => void;
  files?: string[];
  readonlyFiles?: string[];
  forceReloadPreview?: () => Promise<void>;
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
  showNextButton = true,
  onTestRun = () => {},
  files,
  readonlyFiles,
  forceReloadPreview,
}) => {
  const [testResults, setTestResults] = useState<Array<{ name: string; result: Test }>>([]);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [allTestsPassed, setAllTestsPassed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [solutionFiles, setSolutionFiles] = useState<SolutionFile[]>([]);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [solutionLoaded, setSolutionLoaded] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState(false);

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewReadyRef = useRef<boolean>(false);
  const testerRef = useRef<unknown>(null);

  useEffect(() => {
    // Load score from IndexedDB
    const loadScore = async () => {
      setIsLoading(true);
      const score = await storageService.getChallengeScore(categoryId, challengeId);
      setCurrentScore(score);
      setIsLoading(false);
    };

    loadScore();

    // Listen for PREVIEW_READY messages from the iframe
    const handlePreviewMessages = (event: MessageEvent) => {
      if (event.data && event.data.type === "PREVIEW_READY") {
        previewReadyRef.current = true;
      } else if (event.data && event.data.type === "PREVIEW_RELOADING") {
        // Reset ready state when preview is being reloaded
        previewReadyRef.current = false;
      }
    };

    window.addEventListener("message", handlePreviewMessages);

    return () => {
      window.removeEventListener("message", handlePreviewMessages);
    };
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
    setIsTestRunning(true);

    // Always reset preview ready state at the start of each test run
    previewReadyRef.current = false;

    try {
      // Get the test module
      const testModule = await import(/* @vite-ignore */ `/data/challenges/${categoryId}/${challengeId}/tests.js`);
      const tester = new testModule.default();
      testerRef.current = tester;

      const previewIframe = document.getElementById("preview") as HTMLIFrameElement;
      previewIframeRef.current = previewIframe;

      // Create a variable to store the preview window
      let previewWindow: Window | null = null;

      // If we have a force reload function, use it and wait for it
      if (forceReloadPreview) {
        await forceReloadPreview();
        // Get the window after reload
        previewWindow = previewIframe.contentWindow;
      } else {
        // Otherwise fall back to the old reload mechanism
        // Function to reload iframe and wait for it to load
        const reloadAndWaitForIframe = () => {
          return new Promise<Window>((resolve) => {
            // Reset ready state
            previewReadyRef.current = false;

            // Set loading state
            setIframeLoading(true);

            // Create one-time load handler
            const handleLoad = () => {
              previewIframe.removeEventListener("load", handleLoad);
              if (previewIframe.contentWindow) {
                resolve(previewIframe.contentWindow);
              }
            };

            // Add event listener
            previewIframe.addEventListener("load", handleLoad);

            // Force reload
            previewIframe.contentWindow?.location.reload();

            // If for some reason the load event doesn't fire (fallback)
            setTimeout(() => {
              previewIframe.removeEventListener("load", handleLoad);
              if (previewIframe.contentWindow) {
                resolve(previewIframe.contentWindow);
              }
            }, 5000); // 5 second fallback timeout
          });
        };

        // Wait for the iframe to reload and be ready
        previewWindow = await reloadAndWaitForIframe();
      }

      // If we have a preview window, wait for it to signal it's ready
      if (!previewWindow) {
        throw new Error("Preview window not available");
      }

      // Wait for the PREVIEW_READY message if not already received
      if (!previewReadyRef.current) {
        await new Promise<void>((resolve, reject) => {
          const checkInterval = 100; // ms
          const maxWaitTime = 10000; // 10 seconds timeout
          let elapsedTime = 0;

          const checkReadyState = () => {
            if (previewReadyRef.current) {
              setIframeLoading(false);
              resolve();
            } else if (elapsedTime >= maxWaitTime) {
              setIframeLoading(false);
              reject(new Error("Timeout waiting for preview to be ready"));
            } else {
              elapsedTime += checkInterval;
              setTimeout(checkReadyState, checkInterval);
            }
          };

          checkReadyState();
        });
      } else {
        setIframeLoading(false);
      }

      // Set the preview window on the tester once
      if (typeof tester.setPreviewWindow === "function") {
        tester.setPreviewWindow(previewWindow);
      }

      const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tester)).filter(
        (prop) => prop.startsWith("test_") && typeof tester[prop as keyof typeof tester] === "function"
      );

      const results = await Promise.all(
        testMethods.map(async (method) => {
          try {
            // Call test method without passing previewWindow since it's set at class level
            const result: Test = await tester[method as keyof typeof tester]();
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
          result: { detaily_zle: `An error occurred during testing: ${error instanceof Error ? error.message : String(error)}` },
        },
      ]);
    } finally {
      setIsTestRunning(false);
    }
  };

  const loadSolution = async () => {
    try {
      // Use files from props if available, otherwise attempt to fetch
      let filesList: string[] | { filename: string }[] = [];
      let readonlyList: string[] = [];

      if (files && files.length > 0) {
        filesList = files;
        readonlyList = readonlyFiles || [];
      } else {
        // Fallback to fetching assignment.json if files aren't provided
        const metadataResponse = await fetch(`/data/challenges/${categoryId}/${challengeId}/assignment.json`);
        if (!metadataResponse.ok) {
          setSolutionError("Assignment metadata not available");
          return;
        }

        const metadata = await metadataResponse.json();
        filesList = metadata.files || [];
        readonlyList = metadata.readonly || [];
      }

      if (filesList.length === 0) {
        setSolutionError("No solution files defined for this challenge");
        return;
      }

      const loadedFiles: SolutionFile[] = [];

      for (const file of filesList) {
        const filename = typeof file === "string" ? file : file.filename || "";

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

      setSolutionLoaded(true);
    } catch (error) {
      console.error("Error loading solutions:", error);
      setSolutionError("Error loading solutions");
    }
  };

  const toggleSolution = async () => {
    if (!solutionLoaded) {
      await loadSolution();
    }
    setShowSolution((prev) => !prev);
  };

  if (isLoading) {
    return <div>⌛️...</div>;
  }

  return (
    <div className="mx-4">
      <button
        onClick={runTests}
        disabled={isTestRunning || iframeLoading}
        className={`px-4 py-2 mt-4 font-bold text-white rounded ${
          isTestRunning || iframeLoading ? "opacity-50 cursor-not-allowed" : ""
        } ${needsTestRun ? "bg-orange-600 hover:bg-orange-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isTestRunning || iframeLoading ? "⌛️" : needsTestRun ? "🔄" : allTestsPassed ? "🔁" : "⏯️"}
      </button>

      {showNextButton && allTestsPassed && (
        <button
          onClick={() => {
            window.location.hash = `#/challenges/${categoryId}/${parseInt(challengeId, 10) + 1}`;
            window.location.reload();
          }}
          className="px-4 py-2 mt-4 ml-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
        >
          ➡️
        </button>
      )}

      {failedAttempts >= 5 && (
        <button
          onClick={toggleSolution}
          className="px-4 py-2 mt-4 ml-2 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700"
        >
          💡
        </button>
      )}

      <div className="mt-4">
        {testResults.map(({ name, result }) => (
          <div key={name} className={`p-2 mb-2 rounded ${result.detaily_ok ? "bg-green-800" : "bg-red-800"}`}>
            <b>
              {result.detaily_ok ? "✓" : "✗"} {name}
            </b>
            {result.detaily_ok ? ` - ok!` : ` - fail!`}
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
          <h3 className="mb-2 font-bold">👀</h3>
          {solutionError ? (
            <div className="mt-2 text-yellow-300">{solutionError}</div>
          ) : (
            solutionFiles.map((file) => (
              <div key={file.name} className="mt-4">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    title="Copy to clipboard"
                    className="px-1 mb-1 text-lg font-semibold text-yellow-300 bg-yellow-500 rounded-lg hover:bg-yellow-600 active:bg-yellow-700"
                    onClick={() => {
                      navigator.clipboard.writeText(file.content);
                    }}
                  >
                    📋
                  </button>
                  <div className="mb-1 font-semibold text-yellow-300">{file.name}:</div>
                </div>
                <pre className="p-3 overflow-auto text-sm bg-gray-900 rounded">{file.content}</pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeTests;
