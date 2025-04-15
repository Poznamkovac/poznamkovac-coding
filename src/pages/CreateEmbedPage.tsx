import type { ChallengeFile } from "../types/challenge";
import React, { useEffect, useState, useRef } from "react";
import { useQueryParams, EmbedOptions, DEFAULT_OPTIONS, toUrlSafeBase64 } from "../hooks/useQueryParams";
import { useI18n } from "../hooks/useI18n";
import { getEffectiveLanguage } from "../services/i18nService";

// Function to safely encode UTF-8 strings to base64
const utf8ToBase64 = (str: string): string => {
  return window.btoa(encodeURIComponent(str));
};

interface Category {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  color: string;
  children?: Category[];
}

// Default file templates
const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Custom Assignment</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Custom Assignment</h1>
  <div id="app"></div>
  <script src="script.js"></script>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: sans-serif;
  margin: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
}`;

const DEFAULT_JS = `// JavaScript code here
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  app.textContent = 'Hello from JavaScript!';
});`;

const DEFAULT_PYTHON = `# Python code here
print("Hello from Python!")

def main():
    print("This is the main function")
    
if __name__ == "__main__":
    main()`;

// Test templates for different languages
const TEST_TEMPLATES = {
  html5: `// Test file for HTML
// This file allows you to define tests for the assignment
// You can use regular JavaScript assertions

function runTests(window) {
  const tests = [
    {
      name: "Test 1: Page contains h1 element",
      test: function(window) {
        const h1 = window.document.querySelector('h1');
        return { 
          success: !!h1,
          message: h1 ? "Success: H1 found" : "Failure: No H1 element found" 
        };
      }
    },
    {
      name: "Test 2: App div contains text",
      test: function(window) {
        const app = window.document.getElementById('app');
        return { 
          success: app && app.textContent && app.textContent.length > 0,
          message: app?.textContent ? "Success: App has content" : "Failure: App missing or empty" 
        };
      }
    }
  ];
  
  return tests.map(t => {
    const result = t.test(window);
    return {
      name: t.name,
      success: result.success,
      message: result.message
    };
  });
}`,

  css3: `// Test file for CSS
// This file allows you to define tests for the assignment
// You can use regular JavaScript assertions

function runTests(window) {
  const tests = [
    {
      name: "Test 1: Stylesheets are applied",
      test: function(window) {
        const styles = window.getComputedStyle(window.document.body);
        return { 
          success: styles.backgroundColor !== "rgba(0, 0, 0, 0)",
          message: styles.backgroundColor !== "rgba(0, 0, 0, 0)" ? 
            "Success: Styles are applied" : 
            "Failure: No styles detected on body element" 
        };
      }
    },
    {
      name: "Test 2: H1 is styled",
      test: function(window) {
        const h1 = window.document.querySelector('h1');
        if (!h1) return { success: false, message: "No H1 element found" };
        
        const styles = window.getComputedStyle(h1);
        return { 
          success: styles.color !== "rgba(0, 0, 0, 0)",
          message: styles.color !== "rgba(0, 0, 0, 0)" ? 
            "Success: H1 has styles" : 
            "Failure: H1 appears unstyled" 
        };
      }
    }
  ];
  
  return tests.map(t => {
    const result = t.test(window);
    return {
      name: t.name,
      success: result.success,
      message: result.message
    };
  });
}`,

  js: `// Test file for JavaScript
// This file allows you to define tests for the assignment
// You can use regular JavaScript assertions

function runTests(window) {
  const tests = [
    {
      name: "Test 1: JavaScript is executing",
      test: function(window) {
        const app = window.document.getElementById('app');
        return { 
          success: app && app.textContent && app.textContent.includes('Hello from JavaScript'),
          message: app?.textContent?.includes('Hello from JavaScript') ? 
            "Success: JavaScript executed correctly" : 
            "Failure: JavaScript didn't update the DOM as expected" 
        };
      }
    },
    {
      name: "Test 2: DOM is loaded",
      test: function(window) {
        return { 
          success: window.document.readyState === 'complete',
          message: window.document.readyState === 'complete' ? 
            "Success: DOM is fully loaded" : 
            "Failure: DOM is not loaded yet" 
        };
      }
    }
  ];
  
  return tests.map(t => {
    const result = t.test(window);
    return {
      name: t.name,
      success: result.success,
      message: result.message
    };
  });
}`,

  python: `// Test file for Python
// This file allows you to define tests for the assignment

function runTests(window) {
  const tests = [
    {
      name: "Test 1: Python code executed",
      test: function(window) {
        // Python output is in a special stdout element
        const stdout = window.document.getElementById('stdout');
        return { 
          success: stdout && stdout.textContent && stdout.textContent.includes('Hello from Python'),
          message: stdout?.textContent?.includes('Hello from Python') ? 
            "Success: Python code executed successfully" : 
            "Failure: Python didn't produce expected output" 
        };
      }
    },
    {
      name: "Test 2: No errors occurred",
      test: function(window) {
        // Python errors appear in stderr
        const stderr = window.document.getElementById('stderr');
        return { 
          success: !stderr || !stderr.textContent || stderr.textContent.trim() === '',
          message: (!stderr || !stderr.textContent || stderr.textContent.trim() === '') ? 
            "Success: No errors occurred" : 
            "Failure: Python code produced errors" 
        };
      }
    }
  ];
  
  return tests.map(t => {
    const result = t.test(window);
    return {
      name: t.name,
      success: result.success,
      message: result.message
    };
  });
}`,
};

interface CustomAssignment {
  title: string;
  assignment: string;
  maxScore: number;
  files: ChallengeFile[];
  mainFile: string;
  previewTemplatePath?: string;
  rootCategory: string;
}

const CreateEmbedPage: React.FC = () => {
  const { customData, parseError: queryParseError } = useQueryParams();
  const { language } = useI18n();
  const [assignment, setAssignment] = useState<CustomAssignment>({
    title: "Custom Assignment",
    assignment: "<p>Description of your assignment</p>",
    maxScore: 2, // Default to 2 points for the two default tests
    files: [
      { filename: "index.html", readonly: false, hidden: false, autoreload: true, content: DEFAULT_HTML },
      { filename: "style.css", readonly: false, hidden: false, autoreload: true, content: DEFAULT_CSS },
      { filename: "script.js", readonly: false, hidden: false, autoreload: true, content: DEFAULT_JS },
      { filename: "test.js", readonly: false, hidden: true, autoreload: false, content: TEST_TEMPLATES.html5 },
    ],
    mainFile: "index.html",
    previewTemplatePath: "/data/challenges/web/previewTemplate.js",
    rootCategory: "web",
  });
  const [iframeCode, setIframeCode] = useState<string>("");
  const [fullEmbedUrl, setFullEmbedUrl] = useState<string>("");
  const [fullEditUrl, setFullEditUrl] = useState<string>("");
  const [displayOptions, setDisplayOptions] = useState<EmbedOptions>(DEFAULT_OPTIONS);
  const [currentFile, setCurrentFile] = useState<number>(0);
  const [parseError, setParseError] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [testEditorOpen, setTestEditorOpen] = useState<boolean>(false);
  const initializedRef = useRef(false);

  const effectiveLanguage = getEffectiveLanguage(language);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/data/${effectiveLanguage}/categories.json`);
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        setParseError("Failed to load programming languages.");
      }
    };

    fetchCategories();
  }, []);

  // Display parse error from query params
  useEffect(() => {
    if (queryParseError) {
      setParseError(queryParseError);
    }
  }, [queryParseError]);

  // Load data from URL if provided
  useEffect(() => {
    if (initializedRef.current || !customData) {
      return;
    }

    try {
      setAssignment((prevAssignment) => ({
        ...prevAssignment,
        ...customData,
      }));
      setParseError("");
      initializedRef.current = true;
    } catch (error) {
      console.error("Error loading custom data:", error);
      setParseError("Failed to parse the provided data. The URL may contain invalid data.");
    }
  }, [customData]);

  // Generate base64 data and iframe code when assignment changes
  useEffect(() => {
    try {
      const jsonData = JSON.stringify(assignment);
      const b64 = utf8ToBase64(jsonData); // Use UTF-8 safe encoding
      // Convert to URL-safe base64
      const urlSafeB64 = toUrlSafeBase64(b64);

      // Construct query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("data", urlSafeB64);

      if (!displayOptions.autoReload) queryParams.append("autoReload", "false");
      if (!displayOptions.showAssignment) queryParams.append("showAssignment", "false");
      if (!displayOptions.isScored) queryParams.append("isScored", "false");
      if (!displayOptions.showEditors) queryParams.append("showEditors", "false");
      if (!displayOptions.showPreview) queryParams.append("showPreview", "false");
      if (displayOptions.theme === "light") queryParams.append("theme", "light");

      const embedUrl = `${window.location.origin}/#/embed/custom?${queryParams.toString()}`;
      const fullUrl = `/#/embed/custom?${queryParams.toString()}`;
      const editUrl = `/#/embed/create?${queryParams.toString()}`;
      setFullEmbedUrl(fullUrl);
      setFullEditUrl(editUrl);

      const iframeHtml = `<iframe src="${embedUrl}" style="width: 100%; height: 850px; border: none;"></iframe>`;

      setIframeCode(iframeHtml);
    } catch (error) {
      console.error("Error generating embed code:", error);
    }
  }, [assignment, displayOptions]);

  // Update assignment fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssignment((prev) => ({
      ...prev,
      [name]: name === "maxScore" ? parseInt(value) || 0 : value,
    }));
  };

  // Update file content
  const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedFiles = [...assignment.files];
    updatedFiles[currentFile] = {
      ...updatedFiles[currentFile],
      content: e.target.value,
    };

    setAssignment((prev) => ({
      ...prev,
      files: updatedFiles,
    }));
  };

  // Toggle file visibility
  const toggleFileVisibility = () => {
    const updatedFiles = [...assignment.files];
    updatedFiles[currentFile] = {
      ...updatedFiles[currentFile],
      hidden: !updatedFiles[currentFile].hidden,
    };

    setAssignment((prev) => ({
      ...prev,
      files: updatedFiles,
    }));
  };

  // Toggle file autoReload
  const toggleFileAutoReload = () => {
    const updatedFiles = [...assignment.files];
    updatedFiles[currentFile] = {
      ...updatedFiles[currentFile],
      autoreload: !updatedFiles[currentFile].autoreload,
    };

    setAssignment((prev) => ({
      ...prev,
      files: updatedFiles,
    }));
  };

  // Add a new file
  const handleAddFile = () => {
    const filename = prompt("Enter filename (including extension):");
    if (!filename) return;

    const newFile: ChallengeFile = {
      filename,
      readonly: false,
      hidden: false,
      autoreload: true,
      content: "",
    };

    setAssignment((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));

    // Select the new file
    setCurrentFile(assignment.files.length);
  };

  // Delete current file
  const handleDeleteFile = () => {
    if (assignment.files.length <= 1) {
      alert("Cannot delete the last file");
      return;
    }

    if (!confirm(`Delete file ${assignment.files[currentFile].filename}?`)) return;

    const updatedFiles = assignment.files.filter((_, index) => index !== currentFile);

    // Update main file if it was the deleted one
    let mainFile = assignment.mainFile;
    if (assignment.files[currentFile].filename === assignment.mainFile) {
      mainFile = updatedFiles[0].filename;
    }

    setAssignment((prev) => ({
      ...prev,
      files: updatedFiles,
      mainFile,
    }));

    // Adjust selected file index
    setCurrentFile((prev) => Math.min(prev, updatedFiles.length - 1));
  };

  // Toggle options
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDisplayOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Set main file
  const handleSetMainFile = () => {
    setAssignment((prev) => ({
      ...prev,
      mainFile: prev.files[currentFile].filename,
    }));
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;
    const testIndex = assignment.files.findIndex((file) => file.filename === "test.js");
    const updatedFiles = [...assignment.files];

    // Update preview template path and test file
    const previewTemplatePath = selectedLanguage
      ? `/data/${effectiveLanguage}/challenges/${selectedLanguage}/previewTemplate.js`
      : undefined;

    // If a test file exists, update its content based on the selected language
    if (testIndex !== -1) {
      updatedFiles[testIndex] = {
        ...updatedFiles[testIndex],
        content: TEST_TEMPLATES[selectedLanguage as keyof typeof TEST_TEMPLATES] || TEST_TEMPLATES.html5,
      };
    }

    // Add appropriate main file if not exist
    let mainFile = assignment.mainFile;

    if (selectedLanguage === "python") {
      // Check if Python main file exists, create if not
      const pythonMainExists = updatedFiles.some((file) => file.filename === "main.py");
      if (!pythonMainExists) {
        updatedFiles.push({
          filename: "main.py",
          readonly: false,
          hidden: false,
          autoreload: false, // Python files typically don't auto-reload
          content: DEFAULT_PYTHON,
        });
      }
      mainFile = "main.py";
    } else if (selectedLanguage === "html5" || selectedLanguage === "css3" || selectedLanguage === "js") {
      // For web-based languages, ensure index.html exists
      const htmlExists = updatedFiles.some((file) => file.filename === "index.html");
      if (!htmlExists) {
        updatedFiles.push({
          filename: "index.html",
          readonly: false,
          hidden: false,
          autoreload: true,
          content: DEFAULT_HTML,
        });
      }
      mainFile = "index.html";
    }

    setAssignment((prev) => ({
      ...prev,
      previewTemplatePath,
      files: updatedFiles,
      mainFile,
      rootCategory: selectedLanguage,
    }));
  };

  // Open/close test editor
  const toggleTestEditor = () => {
    setTestEditorOpen(!testEditorOpen);

    // If opening the test editor, switch to the test file
    if (!testEditorOpen) {
      const testIndex = assignment.files.findIndex((file) => file.filename === "test.js");
      if (testIndex !== -1) {
        setCurrentFile(testIndex);
      }
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-gray-900">
      <h1 className="mb-8 text-3xl font-bold">Create Custom Embeddable Assignment</h1>

      {parseError && (
        <div className="p-4 mb-6 text-white bg-red-600 rounded-lg">
          <h3 className="mb-2 text-lg font-bold">Error</h3>
          <p>{parseError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {/* Assignment Details */}
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-xl font-bold">Assignment Details</h2>

          <div className="mb-4">
            <label className="block mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={assignment.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-gray-200 bg-gray-700 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Description (HTML)</label>
            <textarea
              name="assignment"
              value={assignment.assignment}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 text-gray-200 bg-gray-700 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Max Score</label>
            <input
              type="number"
              name="maxScore"
              value={assignment.maxScore}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 text-gray-200 bg-gray-700 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Programming Language</label>
            <select
              onChange={handleLanguageChange}
              className="w-full px-3 py-2 text-gray-200 bg-gray-700 rounded"
              value={assignment.rootCategory}
            >
              {categories
                .filter((category) => !category.children)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Display Options */}
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-xl font-bold">Display Options</h2>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="autoReload"
                checked={displayOptions.autoReload}
                onChange={handleOptionChange}
                className="mr-2"
              />
              Auto-reload preview
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showAssignment"
                checked={displayOptions.showAssignment}
                onChange={handleOptionChange}
                className="mr-2"
              />
              Show assignment title and description
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isScored"
                checked={displayOptions.isScored}
                onChange={handleOptionChange}
                className="mr-2"
              />
              Enable scoring and tests
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showEditors"
                checked={displayOptions.showEditors}
                onChange={handleOptionChange}
                className="mr-2"
              />
              Show code editors
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showPreview"
                checked={displayOptions.showPreview}
                onChange={handleOptionChange}
                className="mr-2"
              />
              Show preview
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="theme"
                checked={displayOptions.theme === "light"}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    theme: e.target.checked ? "light" : "dark",
                  }))
                }
                className="mr-2"
              />
              Light theme (default is dark)
            </label>
          </div>
        </div>
      </div>

      {/* Test Editor Section */}
      <div className="p-4 mb-8 bg-gray-800 rounded-lg">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold">Tests</h2>
          <button onClick={toggleTestEditor} className="px-3 py-1 ml-4 text-white bg-blue-600 rounded hover:bg-blue-700">
            {testEditorOpen ? "Close Test Editor" : "Open Test Editor"}
          </button>
        </div>

        {testEditorOpen && (
          <div className="mb-4">
            <p className="mb-2">Edit your test.js file to customize how your assignment is evaluated:</p>
            <textarea
              value={assignment.files.find((f) => f.filename === "test.js")?.content || ""}
              onChange={(e) => {
                const testIndex = assignment.files.findIndex((f) => f.filename === "test.js");
                if (testIndex !== -1) {
                  const updatedFiles = [...assignment.files];
                  updatedFiles[testIndex] = {
                    ...updatedFiles[testIndex],
                    content: e.target.value,
                  };
                  setAssignment((prev) => ({
                    ...prev,
                    files: updatedFiles,
                  }));
                }
              }}
              className="w-full px-3 py-2 font-mono text-green-300 bg-gray-900 rounded"
              rows={15}
            />
          </div>
        )}

        <p className="text-gray-400">
          The test file contains functions that will evaluate student submissions. You can customize the tests based on your
          assignment requirements.
        </p>
      </div>

      {/* Files Section */}
      <div className="p-4 mb-8 bg-gray-800 rounded-lg">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold">Files</h2>
          <div className="flex ml-auto">
            <button onClick={handleAddFile} className="px-3 py-1 mr-2 text-white bg-green-600 rounded hover:bg-green-700">
              Add File
            </button>
            <button onClick={handleDeleteFile} className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700">
              Delete Current
            </button>
          </div>
        </div>

        <div className="flex mb-2 overflow-x-auto">
          {assignment.files.map(
            (file, index) =>
              file.filename !== "test.js" && (
                <button
                  key={file.filename}
                  onClick={() => setCurrentFile(index)}
                  className={`px-3 py-1 mr-2 text-sm rounded-t ${index === currentFile ? "bg-blue-600" : "bg-gray-700"} ${
                    file.filename === assignment.mainFile ? "font-bold" : ""
                  } ${file.hidden ? "opacity-50" : ""}`}
                >
                  {file.filename}
                </button>
              )
          )}
        </div>

        {assignment.files.length > 0 && (
          <>
            <div className="flex items-center mb-2">
              <span className="mr-2">Current file: {assignment.files[currentFile].filename}</span>
              {assignment.files[currentFile].filename !== assignment.mainFile && (
                <button
                  onClick={handleSetMainFile}
                  className="px-2 py-1 mx-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Set as Main File
                </button>
              )}
              <button
                onClick={toggleFileVisibility}
                className="px-2 py-1 mx-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
              >
                {assignment.files[currentFile].hidden ? "Show File" : "Hide File"}
              </button>
              <button
                onClick={toggleFileAutoReload}
                className="px-2 py-1 mx-1 text-xs text-white bg-yellow-600 rounded hover:bg-yellow-700"
              >
                {assignment.files[currentFile].autoreload ? "Disable Auto-reload" : "Enable Auto-reload"}
              </button>
            </div>
            <textarea
              value={assignment.files[currentFile].content || ""}
              onChange={handleFileContentChange}
              className="w-full px-3 py-2 font-mono text-green-300 bg-gray-900 rounded"
              rows={15}
            />
          </>
        )}
      </div>

      {/* Embed Code Section */}
      <div className="p-4 mb-8 bg-gray-800 rounded-lg">
        <h2 className="mb-4 text-xl font-bold">Embed Code</h2>
        <p className="mb-4">Copy and paste this code to embed your assignment:</p>
        <textarea
          readOnly
          value={iframeCode}
          className="w-full px-3 py-2 mb-4 font-mono text-gray-200 bg-gray-900 rounded"
          rows={3}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />

        <div className="flex flex-wrap gap-4">
          <a
            href={fullEmbedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Preview Assignment
          </a>

          <a href={fullEditUrl} className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700">
            Get Shareable Edit Link
          </a>
        </div>
      </div>
    </div>
  );
};

export default CreateEmbedPage;
