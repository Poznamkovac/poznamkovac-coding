import React from "react";
import { VirtualFileSystem } from "../types/challenge";
import { useI18n } from "../hooks/useI18n";

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
    case "py":
      return "🐍";
    case "sql":
      return "🗄️";
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
  const { t } = useI18n();

  const handleTabClick = (filename: string) => {
    if (activeFile !== filename) {
      fileSystem.setActiveFile(filename);
      // Force a re-render or state update if needed
      // This is a controlled component so React will handle re-rendering
    }
  };

  return (
    <div className="flex text-white bg-gray-800 file-tabs">
      {visibleFiles.map((file) => (
        <div
          key={file.filename}
          className={`px-3 py-2 cursor-pointer flex items-center ${
            activeFile === file.filename ? "" : "bg-gray-800 hover:text-blue-300"
          }`}
          style={activeFile === file.filename ? { backgroundColor: "#1e1e1e" } : undefined}
          onClick={() => handleTabClick(file.filename)}
        >
          <span className="mr-2">{getFileIcon(file.filename)}</span>
          <span>{file.filename}</span>
          {file.readonly && <span className="px-1 ml-2 text-xs bg-gray-600 rounded">{t("editor.readOnly")}</span>}
        </div>
      ))}
    </div>
  );
};

export default FileTabs;
