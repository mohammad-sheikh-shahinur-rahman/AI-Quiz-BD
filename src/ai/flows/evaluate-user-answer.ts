'use server';

/**
 * @fileOverview A flow to evaluate user answers to quiz questions and provide feedback.
 *
 * - evaluateUserAnswer - A function that evaluates the user's answer and returns a score and feedback.
 * - EvaluateUserAnswerInput - The input type for the evaluateUserAnswer function.
 * - EvaluateUserAnswerOutput - The return type for the evaluateUserAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateUserAnswerInputSchema = z.object({
  userAnswer: z.string().describe('The user\s answer to the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type EvaluateUserAnswerInput = z.infer<typeof EvaluateUserAnswerInputSchema>;

const EvaluateUserAnswerOutputSchema = z.object({
  score: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe('The score for the user answer, from 1 to 5.'),
  feedback: z.string().describe('The AI-generated feedback for the user answer in Bangla.'),
});
export type EvaluateUserAnswerOutput = z.infer<typeof EvaluateUserAnswerOutputSchema>;

export async function evaluateUserAnswer(input: EvaluateUserAnswerInput): Promise<EvaluateUserAnswerOutput> {
  return evaluateUserAnswerFlow(input);
}

const evaluateUserAnswerPrompt = ai.definePrompt({
  name: 'evaluateUserAnswerPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: EvaluateUserAnswerInputSchema},
  output: {schema: EvaluateUserAnswerOutputSchema},
  prompt: `ব্যবহারকারীর উত্তর: "{{userAnswer}}"\n\nসঠিক উত্তর: "{{correctAnswer}}"\n\nব্যবহারকারীর উত্তর কতটা মিল আছে? ১ থেকে ৫ এর মধ্যে নম্বর দাও এবং একটি সংক্ষিপ্ত মন্তব্য করো।\n\nOutput format: { "score": number, "feedback": string }`,
});

const evaluateUserAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateUserAnswerFlow',
    inputSchema: EvaluateUserAnswerInputSchema,
    outputSchema: EvaluateUserAnswerOutputSchema,
  },
  async input => {
    const {output} = await evaluateUserAnswerPrompt(input);
    if (!output) {
      console.error(`[${evaluateUserAnswerPrompt.name}] did not return a valid output for input:`, input);
      throw new Error('AI failed to evaluate the answer.');
    }
    return output;
  }
);
