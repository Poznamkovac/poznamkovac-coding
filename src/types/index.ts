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

export type ChallengeType = "code" | "quiz";

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

export type ChallengeData = QuizChallengeData | CodeChallengeData;

export interface TestResult {
  score?: number;
  details_ok?: string;
  details_wrong?: string;
}
