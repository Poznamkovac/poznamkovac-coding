import React, { useEffect, useState } from "react";
import { VirtualFileSystem } from "../types/challenge";
import CodeEditor from "./CodeEditor";
import FileTabs from "./FileTabs";

interface ChallengeIDEProps {
  fileSystem: VirtualFileSystem;
}

/**
 * Gets appropriate language mode for Monaco editor based on file extension
 */
const getLanguageFromFilename = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "html":
      return "html";
    case "css":
      return "css";
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
};

/**
 * Complete IDE component with file tabs and editor
 */
const ChallengeIDE: React.FC<ChallengeIDEProps> = ({ fileSystem }) => {
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Initialize the editor with the active file
  useEffect(() => {
    // Get the current active file
    const currentActiveFile = fileSystem.activeFile;
    if (currentActiveFile) {
      setActiveFilename(currentActiveFile);

      // Get current file data
      const currentFileData = fileSystem.files.get(currentActiveFile);
      if (currentFileData) {
        setActiveFileContent(currentFileData.content || "");
        setIsReadOnly(currentFileData.readonly);
      }
    }
  }, [fileSystem]);

  // Handle file tab changes - update when activeFile changes
  useEffect(() => {
    const handleActiveFileChange = () => {
      const currentActiveFile = fileSystem.activeFile;
      if (currentActiveFile && currentActiveFile !== activeFilename) {
        setActiveFilename(currentActiveFile);

        // Get current file data
        const currentFileData = fileSystem.files.get(currentActiveFile);
        if (currentFileData) {
          setActiveFileContent(currentFileData.content || "");
          setIsReadOnly(currentFileData.readonly);
        }
      }
    };

    // Create a MutationObserver to watch for changes to the DOM
    const observer = new MutationObserver(handleActiveFileChange);

    // This is a hack to detect file tab changes since we don't have a direct event
    // In a real app, you would implement a proper event system
    const fileTabs = document.querySelector(".file-tabs");
    if (fileTabs) {
      observer.observe(fileTabs, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [fileSystem, activeFilename]);

  const handleEditorChange = (newContent?: string) => {
    if (activeFilename && !isReadOnly && newContent) {
      setActiveFileContent(newContent);
      fileSystem.updateFileContent(activeFilename, newContent);
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-700">
      <FileTabs fileSystem={fileSystem} />
      {activeFilename ? (
        <div className="flex-1 min-h-0">
          <CodeEditor
            language={getLanguageFromFilename(activeFilename)}
            value={activeFileContent}
            onChange={handleEditorChange}
            readOnly={isReadOnly}
            height="100%"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-gray-400">No file selected</div>
      )}
    </div>
  );
};

export default ChallengeIDE;
