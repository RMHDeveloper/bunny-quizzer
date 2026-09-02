
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export type QuestionCount = 5 | 10 | 15;

export interface Option {
  text: string;
  correct: boolean;
  /** One short sentence: why this option is right or wrong. */
  reason: string;
}

export interface Question {
  id: string;
  question: string;
  options: Option[];
  /** A direct fact about the correct answer. */
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  /** null = ran out of time / skipped */
  selectedAnswer: string | null;
  isCorrect: boolean;
}

export interface QuizSettings {
  topic: string;
  difficulty: Difficulty;
  count: QuestionCount;
  /** Language to write the quiz in, e.g. "English", "Hindi". */
  language: string;
}

export enum QuizStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface PlayerStats {
  xp: number;
  level: number;
  title: string;
  /** XP earned inside the current level. */
  levelXp: number;
  /** XP needed to clear the current level. */
  levelNeed: number;
}

export interface HistoryEntry {
  topic: string;
  score: number;
  total: number;
  date: string;
}
