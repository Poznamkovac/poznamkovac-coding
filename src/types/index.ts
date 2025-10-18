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
  removable?: boolean;
  autoreload?: boolean;
}

export type ChallengeType = "code" | "quiz" | "notebook";

export type QuizAnswerType = "radio" | "checkbox" | "input";

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizAnswerConfig {
  type: QuizAnswerType;
  options?: QuizOption[];
  correctAnswer?: string;
  caseSensitive?: boolean;
  diacriticSensitive?: boolean;
  correctFeedback?: string;
  incorrectFeedback?: string;
}

export interface QuizChallengeData {
  type: "quiz";
  title: string;
  assignment: string | string[];
  maxScore: number;
  answer: QuizAnswerConfig;
  imageUrl?: string;
}

export interface CodeChallengeData {
  type: "code";
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
    removable?: boolean;
    autoreload?: boolean;
  }>;
  imageUrl?: string;
}

export interface NotebookCell {
  id: string;
  code: string;
  readonly: boolean;
  hidden: boolean;
  mustExecute: boolean;
  autoreload: boolean;
  output?: string;
  error?: string;
}

export interface NotebookChallengeData {
  type: "notebook";
  title: string;
  maxScore: number;
  language: "python" | "web" | "sqlite";
  cells: NotebookCell[];
  markdownSections: string[];
  imageUrl?: string;
}

export type ChallengeData = QuizChallengeData | CodeChallengeData | NotebookChallengeData;

export interface TestResult {
  score?: number;
  details_ok?: string;
  details_wrong?: string;
}

export interface NotebookCellTestResult {
  cellIndex: number;
  cellId: string;
  testCases: Array<{
    name: string;
    passed: boolean;
    error?: string;
  }>;
  passed: boolean;
  error?: string;
}

export interface NotebookTestResult {
  score: number;
  maxScore: number;
  passed: boolean;
  cellResults: NotebookCellTestResult[];
}
