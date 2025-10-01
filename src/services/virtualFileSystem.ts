import { storageService } from "./storage";
import type { ChallengeFile } from "../types";

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
 * Helper to check if a filename is a test file
 */
function isTestFile(filename: string): boolean {
  return filename.startsWith("test.") || filename.startsWith("test_");
}

/**
 * Discover all files in the challenge directory
 */
async function discoverChallengeFiles(
  coursePath: string,
  challengeId: string,
  language: string
): Promise<string[]> {
  // We can't list directory contents in browser, so we'll need to try fetching common files
  // For now, we'll just return empty - files should be defined in metadata or discovered via fetch
  return [];
}

/**
 * Creates a virtual file system for managing code challenge files
 */
export async function createVirtualFileSystem(
  coursePath: string,
  challengeId: string,
  initialFiles: Array<{ filename: string; readonly: boolean; hidden: boolean; autoreload?: boolean; removable?: boolean }>,
  language: string
): Promise<VirtualFileSystem> {
  const filesMap = new Map<string, VirtualFile>();
  let currentActiveFile: string | null = null;

  // Try to discover test files by attempting to fetch them
  const testFileExtensions = ['.py', '.js', '.ts'];
  const testFilePatterns = ['test', 'test_main'];
  const discoveredTestFiles: string[] = [];

  for (const pattern of testFilePatterns) {
    for (const ext of testFileExtensions) {
      const testFilename = `${pattern}${ext}`;
      try {
        const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/${testFilename}`);
        if (response.ok) {
          discoveredTestFiles.push(testFilename);
        }
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  // Combine initialFiles with discovered test files
  const allFiles = [...initialFiles];
  for (const testFile of discoveredTestFiles) {
    if (!allFiles.some(f => f.filename === testFile)) {
      allFiles.push({
        filename: testFile,
        readonly: true,
        hidden: true,
        autoreload: false,
        removable: false,
      });
    }
  }

  // Check if we have a saved filesystem structure
  const savedStructure = await storageService.getFileSystemStructure(coursePath, challengeId);
  const filesToLoad = savedStructure || allFiles.map(f => f.filename);

  // Load file contents from storage or fetch from server
  await Promise.all(
    filesToLoad.map(async (filename) => {
      // Find file config from allFiles (includes discovered test files)
      const fileConfig = allFiles.find(f => f.filename === filename);
      const isUserAdded = !fileConfig; // File added by user

      // For test files, always make them readonly and hidden
      const isTest = isTestFile(filename);

      // Try to get from storage first (but not for test files)
      let content: string | null = null;
      if (!isTest) {
        content = await storageService.getEditorCode(
          coursePath,
          challengeId,
          filename
        );
      }

      // If not in storage, try to fetch from server
      if (!content && fileConfig) {
        try {
          const response = await fetch(
            `/${language}/data/${coursePath}/${challengeId}/${filename}`
          );
          if (response.ok) {
            content = await response.text();
          }
        } catch (error) {
          console.error(`Failed to load file ${filename}:`, error);
          content = ""; // Empty content as fallback
        }
      }

      filesMap.set(filename, {
        filename,
        content: content || "",
        originalContent: content || "", // Store original content from server
        readonly: isTest ? true : (fileConfig?.readonly ?? false),
        hidden: isTest ? true : (fileConfig?.hidden ?? false),
        autoreload: fileConfig?.autoreload ?? false,
        removable: isTest ? false : (fileConfig?.removable ?? true),
      });
    })
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

      // Re-fetch assignment.json to get the latest file list
      let freshFileList = initialFiles;
      try {
        const cacheBuster = `?t=${Date.now()}`;
        const assignmentResponse = await fetch(
          `/${language}/data/${coursePath}/${challengeId}/assignment.json${cacheBuster}`,
          { cache: 'no-store' }
        );
        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          if (assignmentData.files) {
            freshFileList = assignmentData.files;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch fresh assignment.json, using original:', error);
      }

      // Reload files from server with cache busting
      await Promise.all(
        freshFileList.map(async (fileConfig) => {
          let content = "";
          try {
            // Add cache-busting parameter to force fresh fetch
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(
              `/${language}/data/${coursePath}/${challengeId}/${fileConfig.filename}${cacheBuster}`,
              { cache: 'no-store' }
            );
            if (response.ok) {
              content = await response.text();
            }
          } catch (error) {
            console.error(`Failed to load file ${fileConfig.filename}:`, error);
          }

          filesMap.set(fileConfig.filename, {
            ...fileConfig,
            content,
          });
        })
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
  };
}
