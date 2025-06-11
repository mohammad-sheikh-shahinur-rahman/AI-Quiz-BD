
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating quiz questions in Bangla using the Gemini API.
 *
 * - generateQuizQuestion - A function that generates a quiz question.
 * - GenerateQuizQuestionInput - The input type for the generateQuizQuestion function.
 * - GenerateQuizQuestionOutput - The return type for the generateQuizQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz question.'),
  previouslyAskedQuestions: z.array(z.string()).optional().describe('A list of questions already asked in this session, to avoid repetition.'),
});
export type GenerateQuizQuestionInput = z.infer<typeof GenerateQuizQuestionInputSchema>;

const GenerateQuizQuestionOutputSchema = z.object({
  question: z.string().describe('The quiz question in Bangla.'),
  options: z.array(z.string()).describe('An array of possible answers.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type GenerateQuizQuestionOutput = z.infer<typeof GenerateQuizQuestionOutputSchema>;

export async function generateQuizQuestion(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  return generateQuizQuestionFlow(input);
}

const generateQuizQuestionPrompt = ai.definePrompt({
  name: 'generateQuizQuestionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateQuizQuestionInputSchema},
  output: {schema: GenerateQuizQuestionOutputSchema},
  prompt: `বাংলা ভাষায় একটি কুইজ প্রশ্ন তৈরি করো। বিষয়: {{{topic}}}।
{{#if previouslyAskedQuestions}}
এই প্রশ্নগুলো ইতিমধ্যে জিজ্ঞাসা করা হয়েছে, অনুগ্রহ করে এগুলোর পুনরাবৃত্তি করবে না:
{{#each previouslyAskedQuestions}}
- {{{this}}}
{{/each}}
{{/if}}
প্রশ্নের সাথে ৪টি অপশন দাও এবং সঠিক উত্তরটি চিহ্নিত করো। প্রশ্নটি যেন নতুন হয় এবং বিষয়টির উপর ব্যাপক জ্ঞান থেকে আসে তা নিশ্চিত করবে। একটি নতুন এবং স্বতন্ত্র প্রশ্ন তৈরি করার চেষ্টা করবে।

Output in JSON format:
{
  "question": "question in bangla",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correctAnswer": "the correct option"
}
`,
});

const generateQuizQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionFlow',
    inputSchema: GenerateQuizQuestionInputSchema,
    outputSchema: GenerateQuizQuestionOutputSchema,
  },
  async input => {
    const {output} = await generateQuizQuestionPrompt(input);
    if (!output) {
      console.error(`[${generateQuizQuestionPrompt.name}] did not return a valid output for input:`, input);
      throw new Error('AI failed to generate a quiz question.');
    }
    return output;
  }
);

