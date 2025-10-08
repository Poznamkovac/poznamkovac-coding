import { storageService } from "./storage";
import type { ChallengeFile } from "../types";
import { isTestFile } from "../utils";

export interface VirtualFile extends ChallengeFile {
  content: string;
  originalContent?: string; // Track original content from server
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
  reset: () => Promise<void>;
  loadSolution: () => Promise<boolean>;
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
  initialFiles: Array<{ filename: string; readonly: boolean; hidden: boolean; autoreload?: boolean; removable?: boolean }>,
  language: string,
): Promise<VirtualFileSystem> {
  const filesMap = new Map<string, VirtualFile>();
  let currentActiveFile: string | null = null;
  const allFiles = [...initialFiles];

  // Check if we have a saved filesystem structure
  const savedStructure = await storageService.getFileSystemStructure(coursePath, challengeId);
  const filesToLoad = savedStructure || allFiles.map((f) => f.filename);

  // Load file contents from storage or fetch from server
  await Promise.all(
    filesToLoad.map(async (filename) => {
      // Skip test files entirely - they're now handled separately
      if (isTestFile(filename)) {
        return;
      }

      // Find file config from allFiles
      const fileConfig = allFiles.find((f) => f.filename === filename);

      // Try to get from storage first
      let content: string | null = await storageService.getEditorCode(coursePath, challengeId, filename);

      // If not in storage, try to fetch from server
      if (!content && fileConfig) {
        try {
          // Try new structure first: files/ subdirectory
          let response = await fetch(`/${language}/data/${coursePath}/${challengeId}/files/${filename}`);

          // Fallback to old structure: flat directory
          if (!response.ok) {
            response = await fetch(`/${language}/data/${coursePath}/${challengeId}/${filename}`);
          }

          if (response.ok) {
            content = await response.text();
          }
        } catch (error) {
          console.warn("error fetching file", filename, error);
          // will use empty content
        }
      }

      // Only add file if we have config or content
      if (fileConfig || content) {
        filesMap.set(filename, {
          filename,
          content: content || "",
          originalContent: content || "", // Store original content from server
          readonly: fileConfig?.readonly ?? false,
          hidden: fileConfig?.hidden ?? false,
          autoreload: fileConfig?.autoreload ?? false,
          removable: fileConfig?.removable ?? true,
        });
      }
    }),
  );

  // Set initial active file (first visible, non-hidden file)
  const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
  if (visibleFiles.length > 0) {
    currentActiveFile = visibleFiles[0].filename;
  }

  // Helper to save filesystem structure
  const saveStructure = () => {
    const filenames = Array.from(filesMap.keys());
    storageService.setFileSystemStructure(coursePath, challengeId, filenames);
  };

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
      }),
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

        // Only save to storage if content has been modified from original
        const hasBeenModified = content !== file.originalContent;
        if (hasBeenModified) {
          storageService.setEditorCode(coursePath, challengeId, filename, content);
        } else {
          // If content matches original, remove from storage (use server version)
          storageService.deleteEditorCode(coursePath, challengeId, filename);
        }

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
          removable: true,
        };
        filesMap.set(filename, newFile);
        storageService.setEditorCode(coursePath, challengeId, filename, "");
        saveStructure();
        dispatchEvent("file-added", filename);

        // Set as active file
        currentActiveFile = filename;
        dispatchEvent("active-file-change", filename);
      }
    },

    removeFile(filename: string) {
      const file = filesMap.get(filename);
      if (file && file.removable !== false) {
        filesMap.delete(filename);
        storageService.deleteEditorCode(coursePath, challengeId, filename);
        saveStructure();
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

    async reset() {
      // Clear all stored data for this challenge
      await storageService.clearChallengeData(coursePath, challengeId);

      // Clear current files
      filesMap.clear();

      // Reload all files (including test files) from server
      await Promise.all(
        allFiles.map(async (fileConfig) => {
          let content = "";
          try {
            // Try new structure first: files/ subdirectory
            let response = await fetch(`/${language}/data/${coursePath}/${challengeId}/files/${fileConfig.filename}`);

            // Fallback to old structure: flat directory
            if (!response.ok) {
              response = await fetch(`/${language}/data/${coursePath}/${challengeId}/${fileConfig.filename}`);
            }

            if (response.ok) {
              content = await response.text();
            }
          } catch {
            // File doesn't exist, will use empty content
          }

          filesMap.set(fileConfig.filename, {
            ...fileConfig,
            content,
            originalContent: content,
          });
        }),
      );

      // Reset active file
      const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
      if (visibleFiles.length > 0) {
        currentActiveFile = visibleFiles[0].filename;
        dispatchEvent("active-file-change", currentActiveFile);
      }

      // Trigger file-added event to refresh UI
      dispatchEvent("file-added", "");
    },

    async loadSolution(): Promise<boolean> {
      try {
        // Fetch solution directory listing from metadata (we need to discover solution files)
        // Try to fetch each file from allFiles from solution/ directory
        const solutionFiles = new Map<string, string>();

        // First, try to load all files from solution/ directory
        const loadPromises = allFiles.map(async (fileConfig) => {
          try {
            const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/solution/${fileConfig.filename}`);
            if (response.ok) {
              const content = await response.text();
              solutionFiles.set(fileConfig.filename, content);
            }
          } catch {
            // File doesn't exist in solution, skip it
          }
        });

        await Promise.all(loadPromises);

        // If no solution files found, return false
        if (solutionFiles.size === 0) {
          return false;
        }

        // Upsert solution files into the current filesystem
        // This preserves hidden/readonly files that are not in the solution
        for (const [filename, content] of solutionFiles.entries()) {
          const existingFile = filesMap.get(filename);
          if (existingFile) {
            // Update existing file
            filesMap.set(filename, {
              ...existingFile,
              content,
              originalContent: content,
            });
            // Save to storage
            storageService.setEditorCode(coursePath, challengeId, filename, content);
            dispatchEvent("file-change", filename, content, existingFile.autoreload);
          } else {
            // Add new file from solution
            const fileConfig = allFiles.find((f) => f.filename === filename);
            filesMap.set(filename, {
              filename,
              content,
              originalContent: content,
              readonly: fileConfig?.readonly ?? false,
              hidden: fileConfig?.hidden ?? false,
              autoreload: fileConfig?.autoreload ?? false,
              removable: fileConfig?.removable ?? true,
            });
            storageService.setEditorCode(coursePath, challengeId, filename, content);
            dispatchEvent("file-added", filename);
          }
        }

        // Update structure
        saveStructure();

        // Refresh active file display
        if (currentActiveFile && filesMap.has(currentActiveFile)) {
          dispatchEvent("file-change", currentActiveFile, filesMap.get(currentActiveFile)?.content);
        }

        return true;
      } catch (error) {
        console.error("Failed to load solution:", error);
        return false;
      }
    },
  };
}
