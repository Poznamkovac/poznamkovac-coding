import React, { useEffect, useState, useRef } from "react";
import { VirtualFileSystem } from "../types/challenge";
import CodeEditor from "./CodeEditor";
import FileTabs from "./FileTabs";
import { ACTIVE_FILE_CHANGE_EVENT, ActiveFileChangeEvent } from "../services/virtualFileSystemService";
import { useI18n } from "../hooks/useI18n";

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
    case "py":
      return "python";
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
  const fileSystemRef = useRef(fileSystem);
  const { t } = useI18n();

  // Update fileSystemRef when fileSystem prop changes
  useEffect(() => {
    fileSystemRef.current = fileSystem;
  }, [fileSystem]);

  // Initialize the editor with the active file once
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
  }, [fileSystem.activeFile, fileSystem.files]);

  // Listen for active file changes
  useEffect(() => {
    const handleActiveFileChange = (event: Event) => {
      const { filename } = (event as CustomEvent<ActiveFileChangeEvent>).detail;
      const fs = fileSystemRef.current;

      // Get current file data
      const currentFileData = fs.files.get(filename);
      if (currentFileData) {
        setActiveFilename(filename);
        setActiveFileContent(currentFileData.content || "");
        setIsReadOnly(currentFileData.readonly);
      }
    };

    // Add event listener for active file changes
    window.addEventListener(ACTIVE_FILE_CHANGE_EVENT, handleActiveFileChange);

    // Cleanup
    return () => {
      window.removeEventListener(ACTIVE_FILE_CHANGE_EVENT, handleActiveFileChange);
    };
  }, []);

  const handleEditorChange = (newContent?: string) => {
    if (activeFilename && !isReadOnly && newContent) {
      setActiveFileContent(newContent);
      fileSystemRef.current.updateFileContent(activeFilename, newContent);
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
        <div className="flex items-center justify-center flex-1 text-gray-400">{t("editor.noFileSelected")}</div>
      )}
    </div>
  );
};

export default ChallengeIDE;
