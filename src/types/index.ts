export type LanguageCode = "sk" | "en" | "auto";

export interface Course {
  slug: string;
  title: string;
  color: string;
  challengeCount?: number;
}

export interface Challenge {
  id: number;
  title: string;
  maxScore: number;
  currentScore?: number;
}

export interface ChallengeFile {
  filename: string;
  content: string;
  readonly: boolean;
  hidden: boolean;
  autoreload?: boolean;
}

export interface ChallengeData {
  title: string;
  assignment: string | string[];
  maxScore: number;
  showPreview: boolean;
  mainFile: string;
  previewTemplatePath?: string;
  rootCategory?: string;
  files: Array<{
    filename: string;
    readonly: boolean;
    hidden: boolean;
    autoreload?: boolean;
  }>;
  imageUrl?: string;
}

export interface TestResult {
  score?: number;
  details_ok?: string;
  details_wrong?: string;
}
