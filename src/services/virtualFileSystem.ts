import { storageService } from "./storage";
import type { ChallengeFile } from "../types";

export interface VirtualFile extends ChallengeFile {
  content: string;
}

export interface VirtualFileSystem {
  files: Map<string, VirtualFile>;
  activeFile: string | null;
  setActiveFile: (filename: string) => void;
  updateFileContent: (filename: string, content: string) => void;
  addFile: (filename: string) => void;
  removeFile: (filename: string) => void;
  renameFile: (oldFilename: string, newFilename: string) => void;
  getFileContent: (filename: string) => string | undefined;
  getVisibleFiles: () => VirtualFile[];
  getAllFiles: () => VirtualFile[];
}

export type FileSystemEventType = "file-change" | "active-file-change" | "file-added" | "file-removed";

export interface FileSystemEvent {
  type: FileSystemEventType;
  coursePath: string;
  challengeId: string;
  filename: string;
  content?: string;
  autoreload?: boolean;
}

/**
 * Creates a virtual file system for managing code challenge files
 */
export async function createVirtualFileSystem(
  coursePath: string,
  challengeId: string,
  initialFiles: Array<{ filename: string; readonly: boolean; hidden: boolean; autoreload?: boolean }>,
  language: string
): Promise<VirtualFileSystem> {
  const filesMap = new Map<string, VirtualFile>();
  let currentActiveFile: string | null = null;

  // Load file contents from storage or fetch from server
  await Promise.all(
    initialFiles.map(async (fileConfig) => {
      // Try to get from storage first
      const storedContent = await storageService.getEditorCode(
        coursePath,
        challengeId,
        fileConfig.filename
      );

      let content = storedContent;

      // If not in storage, try to fetch from server
      if (!content) {
        try {
          const response = await fetch(
            `/${language}/challenges/${coursePath}/${challengeId}/files/${fileConfig.filename}`
          );
          if (response.ok) {
            content = await response.text();
          }
        } catch (error) {
          console.error(`Failed to load file ${fileConfig.filename}:`, error);
          content = ""; // Empty content as fallback
        }
      }

      filesMap.set(fileConfig.filename, {
        ...fileConfig,
        content: content || "",
      });
    })
  );

  // Set initial active file (first visible, non-hidden file)
  const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
  if (visibleFiles.length > 0) {
    currentActiveFile = visibleFiles[0].filename;
  }

  const dispatchEvent = (type: FileSystemEventType, filename: string, content?: string, autoreload?: boolean) => {
    window.dispatchEvent(
      new CustomEvent<FileSystemEvent>("vfs-event", {
        detail: {
          type,
          coursePath,
          challengeId,
          filename,
          content,
          autoreload,
        },
      })
    );
  };

  return {
    files: filesMap,

    get activeFile() {
      return currentActiveFile;
    },

    setActiveFile(filename: string) {
      if (filesMap.has(filename) && currentActiveFile !== filename) {
        currentActiveFile = filename;
        dispatchEvent("active-file-change", filename);
      }
    },

    updateFileContent(filename: string, content: string) {
      const file = filesMap.get(filename);
      if (file && !file.readonly) {
        filesMap.set(filename, { ...file, content });

        // Save to storage
        storageService.setEditorCode(coursePath, challengeId, filename, content);

        dispatchEvent("file-change", filename, content, file.autoreload);
      }
    },

    addFile(filename: string) {
      if (!filesMap.has(filename)) {
        const newFile: VirtualFile = {
          filename,
          content: "",
          readonly: false,
          hidden: false,
          autoreload: false,
        };
        filesMap.set(filename, newFile);
        storageService.setEditorCode(coursePath, challengeId, filename, "");
        dispatchEvent("file-added", filename);

        // Set as active file
        currentActiveFile = filename;
        dispatchEvent("active-file-change", filename);
      }
    },

    removeFile(filename: string) {
      const file = filesMap.get(filename);
      if (file && !file.readonly) {
        filesMap.delete(filename);
        storageService.deleteEditorCode(coursePath, challengeId, filename);
        dispatchEvent("file-removed", filename);

        // If this was the active file, switch to another
        if (currentActiveFile === filename) {
          const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
          currentActiveFile = visibleFiles.length > 0 ? visibleFiles[0].filename : null;
          if (currentActiveFile) {
            dispatchEvent("active-file-change", currentActiveFile);
          }
        }
      }
    },

    renameFile(oldFilename: string, newFilename: string) {
      const file = filesMap.get(oldFilename);
      if (file && !file.readonly && !filesMap.has(newFilename)) {
        filesMap.delete(oldFilename);
        filesMap.set(newFilename, { ...file, filename: newFilename });

        storageService.deleteEditorCode(coursePath, challengeId, oldFilename);
        storageService.setEditorCode(coursePath, challengeId, newFilename, file.content);

        if (currentActiveFile === oldFilename) {
          currentActiveFile = newFilename;
          dispatchEvent("active-file-change", newFilename);
        }
      }
    },

    getFileContent(filename: string) {
      return filesMap.get(filename)?.content;
    },

    getVisibleFiles() {
      return Array.from(filesMap.values()).filter((f) => !f.hidden);
    },

    getAllFiles() {
      return Array.from(filesMap.values());
    },
  };
}
