import React from "react";
import { ChallengeFile, VirtualFileSystem } from "../types/challenge";

interface FileTabsProps {
  fileSystem: VirtualFileSystem;
}

/**
 * Returns appropriate icon for file based on extension
 */
const getFileIcon = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "html":
      return "🌐";
    case "css":
      return "🎨";
    case "js":
    case "ts":
      return "📜";
    case "json":
      return "📊";
    case "md":
      return "📝";
    default:
      return "📄";
  }
};

/**
 * VS Code-like file tabs component
 */
const FileTabs: React.FC<FileTabsProps> = ({ fileSystem }) => {
  const visibleFiles = fileSystem.getVisibleFiles();
  const activeFile = fileSystem.activeFile;

  return (
    <div className="flex bg-gray-800 text-white">
      {visibleFiles.map((file) => (
        <div
          key={file.filename}
          className={`px-3 py-2 cursor-pointer border-r border-gray-700 flex items-center
            ${activeFile === file.filename ? "bg-gray-700" : "hover:bg-gray-700"}`}
          onClick={() => fileSystem.setActiveFile(file.filename)}
        >
          <span className="mr-2">{getFileIcon(file.filename)}</span>
          <span>{file.filename}</span>
          {file.readonly && <span className="ml-2 text-xs bg-gray-600 px-1 rounded">(read-only)</span>}
        </div>
      ))}
    </div>
  );
};

export default FileTabs;
