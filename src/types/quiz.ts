import type { GenerateQuizQuestionOutput } from '@/ai/flows/generate-quiz-question';

export interface QuizQuestion extends GenerateQuizQuestionOutput {
  id: string; // Unique ID for the question if needed client-side
}

export interface QuizHistoryEntry {
  questionText: string;
  options: string[];
  userSelectedAnswer: string | null; // null if time ran out or skipped
  correctAnswerText: string;
  isCorrect: boolean;
  aiFeedback: string; // Feedback from AI or system message like "Time's up!"
  pointsAwarded: number;
}

export interface QuizState {
  userName: string | null;
  currentQuestionNumber: number; // 1-indexed
  totalScore: number;
  quizHistory: QuizHistoryEntry[];
  quizTopic: string;
}
