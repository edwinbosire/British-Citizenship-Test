export enum QuizState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum QuizMode {
  TIMED = 'TIMED',
  UNTIMED = 'UNTIMED',
  PRACTICE = 'PRACTICE',
  STREAK = 'STREAK'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  chapterReference: string;
}

export interface QuizResult {
  totalQuestions: number;
  score: number;
  passed: boolean;
  timeTaken: number; // in seconds
  answers: number[]; // indices of user selected answers
  questions: Question[];
  mode: QuizMode; // Added mode to result
}

export interface UserAnswers {
  [questionIndex: number]: number; // Maps question index to option index
}

// Flash Card Types
export interface FlashCard {
  id: string;
  front: string;
  back: string;
  box: number; // SRS Box level (0-5)
  nextReview: number; // Timestamp
  createdAt: number;
  topic: string;
}

export interface FlashCardDeckStats {
  totalCards: number;
  dueCards: number;
  masteredCards: number; // Box 4+
}