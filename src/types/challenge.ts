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
  /** Type of preview to use: "html", "console", etc. */
  previewType: string;
  /** The main file to execute or display in preview */
  mainFile: string;
  files: ChallengeFile[];
  // Keep for backward compatibility, will be removed later
  pociatocnyKod?: {
    /**
     * Počiatočný HTML kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    html?: string | string[];
    /**
     * Počiatočný CSS kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    css?: string | string[];
    /**
     * Počiatočný JavaScript kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    js?: string | string[];
  };
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
