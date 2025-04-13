/**
 * Dáta o úlohe.
 */
export interface ChallengeFile {
  filename: string;
  readonly: boolean;
  hidden: boolean;
  autoreload?: boolean; // If true, preview will update automatically when this file changes
  content?: string; // Content loaded from the file
}

export interface ChallengeData {
  /** Názov/nadpis úlohy. Nepodporuje HTML tagy. */
  title: string;
  /** Zadanie úlohy. Môže obsahovať HTML tagy. */
  assignment: string;
  /** Maximálne skóre ktoré možno za túto úlohu dostať. */
  maxScore: number;
  /** Type of preview to use: "web", "preview", etc. */
  previewType: string;
  /** Whether or not to show the preview. */
  showPreview: boolean;
  /** The main file to execute or display in preview */
  mainFile: string;
  /** Category specific preview template path (optional) */
  previewTemplatePath?: string;
  files: ChallengeFile[];
}

/**
 * Zoznam úloh v kategórii.
 */
export interface ChallengeList {
  [id: string]: {
    title: string;
    assignment: string;
    maxScore: number;
  };
}

export interface VirtualFileSystem {
  files: Map<string, ChallengeFile>;
  activeFile: string | null;
  setActiveFile: (filename: string) => void;
  updateFileContent: (filename: string, content: string) => void;
  getFileContent: (filename: string) => string | undefined;
  getVisibleFiles: () => ChallengeFile[];
  getAllFiles: () => ChallengeFile[];
}
