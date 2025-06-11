import { config } from 'dotenv';
config();

import '@/ai/flows/generate-quiz-question.ts';
import '@/ai/flows/generate-final-comment.ts';
import '@/ai/flows/evaluate-user-answer.ts';