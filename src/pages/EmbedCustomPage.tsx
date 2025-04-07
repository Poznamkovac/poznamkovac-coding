import React, { useEffect, useState, useRef, useCallback } from "react";
import ChallengeIDE from "../components/ChallengeIDE";
import ChallengePreview from "../components/ChallengePreview";
import EmbedLayout from "../components/EmbedLayout";
import { useQueryParams } from "../hooks/useQueryParams";
import { createVirtualFileSystem, FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import { ChallengeData, VirtualFileSystem } from "../types/challenge";

interface TestResult {
  name: string;
  success: boolean;
  message: string;
}

const EmbedCustomPage: React.FC = () => {
  const { options, customData } = useQueryParams();
  const optionsRef = useRef(options);
  const [fileSystem, setFileSystem] = useState<VirtualFileSystem | null>(null);
  const fileSystemRef = useRef<VirtualFileSystem | null>(null);
  const [assignmentData, setAssignmentData] = useState<ChallengeData | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [needsTestRun, setNeedsTestRun] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const initializedRef = useRef(false);

  // Update optionsRef when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Process custom assignment data from URL parameter - only run once
  useEffect(() => {
    if (initializedRef.current || !customData) {
      return;
    }

    try {
      // Create default challenge data structure
      const defaultData: ChallengeData = {
        title: "Custom Assignment",
        assignment: "Custom assignment loaded from URL",
        maxScore: 0,
        previewType: "html",
        mainFile: "index.html",
        files: [],
      };

      // Merge with custom data
      const assignmentData: ChallengeData = {
        ...defaultData,
        ...customData,
      };

      // Ensure all required fields are present
      if (!assignmentData.previewType) assignmentData.previewType = "html";
      if (!assignmentData.files || !Array.isArray(assignmentData.files) || assignmentData.files.length === 0) {
        // Create default files if none provided
        assignmentData.files = [
          {
            filename: "index.html",
            content: "<html><body><h1>Custom Assignment</h1></body></html>",
            readonly: false,
            hidden: false,
            autoreload: true,
          },
        ];
      }

      // Set main file if not specified
      if (!assignmentData.mainFile) {
        assignmentData.mainFile = assignmentData.files.find((f) => f.filename === "index.html")
          ? "index.html"
          : assignmentData.files[0].filename;
      }

      // Create file system
      const fs = createVirtualFileSystem("custom", "embed", assignmentData.files);

      setAssignmentData(assignmentData);
      setFileSystem(fs);
      fileSystemRef.current = fs;
      initializedRef.current = true;
    } catch (error) {
      console.error("Error processing custom data:", error);
    }
  }, [customData]);

  // Set up event listeners only once
  useEffect(() => {
    // Skip if no file system yet
    if (!fileSystem) return;

    // Function to handle file changes
    const handleFileChange = (event: Event) => {
      const { shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

      if (!shouldReload && !optionsRef.current.autoReload) {
        // If the file doesn't auto-reload, the user should run tests
        setNeedsTestRun(true);
      }
    };

    // Add event listener
    window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);

    // Cleanup
    return () => {
      window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
    };
  }, [fileSystem]); // Only re-run when fileSystem changes

  // Run tests for the custom assignment
  const runTests = useCallback(async () => {
    if (!fileSystem || !assignmentData) return;

    setNeedsTestRun(false);

    try {
      // Find test.js file
      const testFile = Array.from(fileSystem.files.values()).find((file) => file.filename === "test.js");

      if (!testFile || !testFile.content) {
        console.error("No test.js file found");
        return;
      }

      // Get the preview iframe
      const iframe = document.getElementById("preview") as HTMLIFrameElement;
      if (!iframe || !iframe.contentWindow) {
        console.error("Preview iframe not found");
        return;
      }

      // Prepare the test file for execution
      const testCode = testFile.content;

      // Create a function from the test code
      const testFunction = new Function(
        "window",
        `
        ${testCode}
        return typeof runTests === 'function' ? runTests(window) : [];
      `
      );

      // Execute the tests in the iframe context
      const results = testFunction(iframe.contentWindow) as TestResult[];

      setTestResults(results || []);

      // Calculate score based on passed tests
      const passedTests = results.filter((result) => result.success).length;
      if (results.length > 0) {
        const calculatedScore = Math.round((passedTests / results.length) * assignmentData.maxScore);
        setCurrentScore(calculatedScore);
      }
    } catch (error) {
      console.error("Error running tests:", error);
      setTestResults([
        {
          name: "Error",
          success: false,
          message: `Test execution error: ${error}`,
        },
      ]);
    }
  }, [fileSystem, assignmentData]);

  if (!fileSystem || !assignmentData) {
    return (
      <div className="min-h-screen text-white bg-gray-900">
        <div className="container p-4 mx-auto">
          <h2 className="text-xl font-bold">Error Loading Custom Assignment</h2>
          <p>
            No valid assignment data was provided. Make sure the URL contains a valid base64-encoded JSON object in the "data"
            parameter.
          </p>
          <p className="mt-4">
            <a href="#/embed/create" className="text-blue-400 underline">
              Create a custom assignment
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmbedLayout
      title={assignmentData.title}
      description={assignmentData.assignment}
      score={currentScore}
      maxScore={assignmentData.maxScore}
      options={options}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.showEditors && (
          <div className="flex flex-col h-[500px]">
            <ChallengeIDE fileSystem={fileSystem} />
          </div>
        )}

        <div className={`h-[500px] flex flex-col ${!options.showEditors ? "md:col-span-2" : ""}`}>
          <ChallengePreview
            fileSystem={fileSystem}
            mainFile={assignmentData.mainFile}
            previewType={assignmentData.previewType}
            autoReload={options.autoReload}
          />

          {options.isScored && (
            <div className="mt-4">
              <button
                onClick={runTests}
                className={`px-4 py-2 font-bold text-white rounded hover:bg-blue-700 ${
                  needsTestRun ? "bg-orange-600 hover:bg-orange-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {needsTestRun ? "🔄 Run Tests (changes need testing)" : "⏯️ Run Tests"}
              </button>

              <div className="mt-4">
                {testResults.map(({ name, success, message }, index) => (
                  <div key={index} className={`p-2 mb-2 rounded ${success ? "bg-green-800" : "bg-red-800"}`}>
                    <b>
                      {success ? "✓" : "✗"} {name}
                    </b>
                    <br />
                    <span className="text-sm text-gray-300">{message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </EmbedLayout>
  );
};

export default EmbedCustomPage;
