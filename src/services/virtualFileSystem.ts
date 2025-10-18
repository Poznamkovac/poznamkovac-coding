import { storageService } from "./storage";
import type { ChallengeFile } from "../types";
export interface VirtualFile extends ChallengeFile {
  content: string;
  originalContent?: string;
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

export async function createVirtualFileSystem(
  coursePath: string,
  challengeId: string,
  initialFiles: Array<{ filename: string; readonly: boolean; hidden: boolean; autoreload?: boolean; removable?: boolean }>,
  language: string,
): Promise<VirtualFileSystem> {
  const filesMap = new Map<string, VirtualFile>();
  let currentActiveFile: string | null = null;
  const allFiles = [...initialFiles];

  const savedStructure = await storageService.getFileSystemStructure(coursePath, challengeId);
  const filesToLoad = savedStructure || allFiles.map((f) => f.filename);

  await Promise.all(
    filesToLoad.map(async (filename) => {
      const fileConfig = allFiles.find((f) => f.filename === filename);
      let content: string | null = await storageService.getEditorCode(coursePath, challengeId, filename, language);

      if (!content && fileConfig) {
        try {
          const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/files/${filename}`);
          if (response.ok) content = await response.text();
        } catch (error) {
          console.warn("error fetching file", filename, error);
        }
      }

      if (fileConfig || content) {
        filesMap.set(filename, {
          filename,
          content: content || "",
          originalContent: content || "",
          readonly: fileConfig?.readonly ?? false,
          hidden: fileConfig?.hidden ?? false,
          autoreload: fileConfig?.autoreload ?? false,
          removable: fileConfig?.removable ?? true,
        });
      }
    }),
  );

  const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
  if (visibleFiles.length > 0) {
    currentActiveFile = visibleFiles[0].filename;
  }

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
      if (!file || file.readonly) return;

      filesMap.set(filename, { ...file, content });

      if (content !== file.originalContent) {
        storageService.setEditorCode(coursePath, challengeId, filename, content, language);
      } else {
        storageService.deleteEditorCode(coursePath, challengeId, filename, language);
      }

      dispatchEvent("file-change", filename, content, file.autoreload);
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
        storageService.setEditorCode(coursePath, challengeId, filename, "", language);
        saveStructure();
        dispatchEvent("file-added", filename);

        currentActiveFile = filename;
        dispatchEvent("active-file-change", filename);
      }
    },

    removeFile(filename: string) {
      const file = filesMap.get(filename);
      if (file && file.removable !== false) {
        filesMap.delete(filename);
        storageService.deleteEditorCode(coursePath, challengeId, filename, language);
        saveStructure();
        dispatchEvent("file-removed", filename);

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

        storageService.deleteEditorCode(coursePath, challengeId, oldFilename, language);
        storageService.setEditorCode(coursePath, challengeId, newFilename, file.content, language);

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
      await storageService.clearChallengeData(coursePath, challengeId);

      filesMap.clear();

      await Promise.all(
        allFiles.map(async (fileConfig) => {
          let content = "";
          try {
            let response = await fetch(`/${language}/data/${coursePath}/${challengeId}/files/${fileConfig.filename}`);

            if (!response.ok) {
              response = await fetch(`/${language}/data/${coursePath}/${challengeId}/${fileConfig.filename}`);
            }

            if (response.ok) {
              content = await response.text();
            }
          } catch {}

          filesMap.set(fileConfig.filename, {
            ...fileConfig,
            content,
            originalContent: content,
          });
        }),
      );

      const visibleFiles = Array.from(filesMap.values()).filter((f) => !f.hidden);
      if (visibleFiles.length > 0) {
        currentActiveFile = visibleFiles[0].filename;
        dispatchEvent("active-file-change", currentActiveFile);
      }

      dispatchEvent("file-added", "");
    },

    async loadSolution(): Promise<boolean> {
      try {
        const solutionFiles = new Map<string, string>();

        const loadPromises = allFiles.map(async (fileConfig) => {
          try {
            const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/solution/${fileConfig.filename}`);
            if (response.ok) {
              const content = await response.text();
              solutionFiles.set(fileConfig.filename, content);
            }
          } catch {}
        });

        await Promise.all(loadPromises);

        if (solutionFiles.size === 0) {
          return false;
        }

        for (const [filename, content] of solutionFiles.entries()) {
          const existingFile = filesMap.get(filename);
          if (existingFile) {
            filesMap.set(filename, {
              ...existingFile,
              content,
              originalContent: content,
            });
            storageService.setEditorCode(coursePath, challengeId, filename, content, language);
            dispatchEvent("file-change", filename, content, existingFile.autoreload);
          } else {
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
            storageService.setEditorCode(coursePath, challengeId, filename, content, language);
            dispatchEvent("file-added", filename);
          }
        }

        saveStructure();

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
