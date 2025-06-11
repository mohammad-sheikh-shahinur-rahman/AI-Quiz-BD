'use server';

/**
 * @fileOverview Generates a personalized congratulatory comment based on the user's final score.
 *
 * - generateFinalComment - A function that generates the final comment.
 * - GenerateFinalCommentInput - The input type for the generateFinalComment function.
 * - GenerateFinalCommentOutput - The return type for the generateFinalComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinalCommentInputSchema = z.object({
  score: z.number().describe('The user\'s final score on the quiz.'),
  name: z.string().describe('The user\'s name.'),
});
export type GenerateFinalCommentInput = z.infer<typeof GenerateFinalCommentInputSchema>;

const GenerateFinalCommentOutputSchema = z.object({
  comment: z.string().describe('A personalized congratulatory comment in Bangla.'),
});
export type GenerateFinalCommentOutput = z.infer<typeof GenerateFinalCommentOutputSchema>;

export async function generateFinalComment(input: GenerateFinalCommentInput): Promise<GenerateFinalCommentOutput> {
  return generateFinalCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinalCommentPrompt',
  input: {schema: GenerateFinalCommentInputSchema},
  output: {schema: GenerateFinalCommentOutputSchema},
  prompt: `ব্যবহারকারীর নাম: {{{name}}}\nস্কোর: {{{score}}}\n\nবাংলা ভাষায় একটি সংক্ষিপ্ত মন্তব্য তৈরি করুন যা ব্যবহারকারীকে তার স্কোর এবং কুইজে অংশগ্রহণের জন্য উৎসাহিত করবে। মন্তব্যটি অবশ্যই বাংলা ভাষায় হতে হবে।`,
});

const generateFinalCommentFlow = ai.defineFlow(
  {
    name: 'generateFinalCommentFlow',
    inputSchema: GenerateFinalCommentInputSchema,
    outputSchema: GenerateFinalCommentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
