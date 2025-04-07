import { ChallengeFile, VirtualFileSystem } from "../types/challenge";
import { storageService } from "./storageService";

// Custom event for file change notifications
export const FILE_CHANGE_EVENT = "fileChange";

export interface FileChangeEvent {
  categoryId: string;
  challengeId: string;
  filename: string;
  content: string;
  shouldReload: boolean;
}

/**
 * Creates a virtual file system for managing assignment files
 */
export const createVirtualFileSystem = (
  categoryId: string,
  challengeId: string,
  initialFiles: ChallengeFile[]
): VirtualFileSystem => {
  // Create a map of filenames to file data
  const filesMap = new Map<string, ChallengeFile>();
  let currentActiveFile: string | null = null;

  // Initialize file system with files
  const init = async () => {
    // Load files into the map
    for (const file of initialFiles) {
      filesMap.set(file.filename, { ...file });
    }

    // Set initial active file (first non-hidden file)
    const visibleFiles = initialFiles.filter((file) => !file.hidden);
    if (visibleFiles.length > 0) {
      currentActiveFile = visibleFiles[0].filename;
    }

    // Load file contents from storage or from API
    await Promise.all(
      initialFiles.map(async (file) => {
        // Try to get content from IndexedDB first
        const storedContent = await storageService.getEditorCode(categoryId, challengeId, file.filename);

        if (storedContent) {
          // If found in storage, use it
          const currentFile = filesMap.get(file.filename);
          if (currentFile) {
            filesMap.set(file.filename, { ...currentFile, content: storedContent });
          }
        } else {
          // Otherwise, fetch from the server
          try {
            const response = await fetch(`/data/ulohy/${categoryId}/${challengeId}/files/${file.filename}`);
            if (response.ok) {
              const content = await response.text();
              const currentFile = filesMap.get(file.filename);
              if (currentFile) {
                filesMap.set(file.filename, { ...currentFile, content });
              }
            } else {
              console.error(`Failed to load file: ${file.filename}`);
            }
          } catch (error) {
            console.error(`Error loading file: ${file.filename}`, error);
          }
        }
      })
    );
  };

  // Initialize the file system
  init();

  return {
    files: filesMap,

    // Get the currently active file
    get activeFile() {
      return currentActiveFile;
    },

    // Set the active file
    setActiveFile(filename: string) {
      if (filesMap.has(filename)) {
        currentActiveFile = filename;
      }
    },

    // Update the content of a file and save to storage
    updateFileContent(filename: string, content: string) {
      const file = filesMap.get(filename);
      if (file && !file.readonly) {
        // Update in memory
        filesMap.set(filename, { ...file, content });

        // Save to IndexedDB
        storageService.setEditorCode(categoryId, challengeId, filename, content);

        // Dispatch custom event for file changes
        window.dispatchEvent(
          new CustomEvent<FileChangeEvent>(FILE_CHANGE_EVENT, {
            detail: {
              categoryId,
              challengeId,
              filename,
              content,
              shouldReload: !!file.autoreload,
            },
          })
        );
      }
    },

    // Get content of a specific file
    getFileContent(filename: string) {
      return filesMap.get(filename)?.content;
    },

    // Get all visible files (not hidden)
    getVisibleFiles() {
      return Array.from(filesMap.values()).filter((file) => !file.hidden);
    },

    // Get all files
    getAllFiles() {
      return Array.from(filesMap.values());
    },
  };
};
