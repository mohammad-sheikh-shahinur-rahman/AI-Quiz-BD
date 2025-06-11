
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

// Internal schema for the prompt, including topic-specific flags and data
const PromptInternalInputSchema = z.object({
  topic: z.string().describe('The general topic of the quiz question.'),
  previouslyAskedQuestions: z.array(z.string()).optional().describe('A list of questions already asked in this session, to avoid repetition.'),
  isShahinurRahmanTopic: z.boolean().describe('True if the topic is specifically about মোহাম্মদ শেখ শাহিনুর রহমান.'),
  shahinurRahmanWebsite1: z.string().optional().describe('URL of the personal website for Mohammad Sheikh Shahinur Rahman, for context if available in training data.'),
  shahinurRahmanWebsite2: z.string().optional().describe('URL of the "Amader Somaj" profile for Mohammad Sheikh Shahinur Rahman, for context if available in training data.'),
});

export async function generateQuizQuestion(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  return generateQuizQuestionFlow(input);
}

const generateQuizQuestionPrompt = ai.definePrompt({
  name: 'generateQuizQuestionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: PromptInternalInputSchema}, // Use the new internal schema
  output: {schema: GenerateQuizQuestionOutputSchema},
  prompt: `বাংলা ভাষায় একটি কুইজ প্রশ্ন তৈরি করো। বিষয়: {{{topic}}}।

{{#if isShahinurRahmanTopic}}
বিশেষভাবে সাহিত্যিক মোহাম্মদ শেখ শাহিনুর রহমান এবং তাঁর কাজ সম্পর্কিত প্রশ্ন তৈরি করার চেষ্টা করুন। তাঁর পরিচিতি (যেমন জন্ম তারিখ, শিক্ষা, কর্মজীবনের গুরুত্বপূর্ণ দিক), প্রকাশিত গ্রন্থ (যেমন 'আমি কবি', 'Bug Bounty Beginner to Master', 'LinkedIn-এ ক্লায়েন্ট হান্টিং মাস্টারি'), সাহিত্যকর্মের ধরণ, প্রাপ্ত পুরস্কার বা তাঁর সাহিত্য সম্পর্কিত উল্লেখযোগ্য তথ্য ব্যবহার করে প্রশ্ন তৈরি করুন। নিশ্চিত করুন যে প্রশ্নগুলো সুনির্দিষ্ট এবং তাঁর জীবন ও কাজের উপর ভিত্তি করে তৈরি।
আপনি নিম্নলিখিত ওয়েবসাইটগুলো থেকে তথ্যসূত্র হিসেবে সাহায্য নিতে পারেন, যদি এই তথ্যগুলো আপনার প্রশিক্ষণে ইতিমধ্যে অন্তর্ভুক্ত না থাকে:
- {{{shahinurRahmanWebsite1}}}
- {{{shahinurRahmanWebsite2}}}
{{/if}}

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
    inputSchema: GenerateQuizQuestionInputSchema, // Public input schema for the flow
    outputSchema: GenerateQuizQuestionOutputSchema,
  },
  async (flowInput: GenerateQuizQuestionInput) => {
    const isShahinurRahmanTopic = flowInput.topic === "সাহিত্য মোহাম্মদ শেখ শাহিনুর রহমান";
    
    const promptInputData: z.infer<typeof PromptInternalInputSchema> = {
      topic: flowInput.topic,
      previouslyAskedQuestions: flowInput.previouslyAskedQuestions,
      isShahinurRahmanTopic: isShahinurRahmanTopic,
      shahinurRahmanWebsite1: isShahinurRahmanTopic ? "https://mohammad-sheikh-shahinur-rahman.vercel.app/" : undefined,
      shahinurRahmanWebsite2: isShahinurRahmanTopic ? "http://shahinur.amadersomaj.com/" : undefined,
    };

    const {output} = await generateQuizQuestionPrompt(promptInputData);
    if (!output) {
      console.error(`[${generateQuizQuestionPrompt.name}] did not return a valid output for input:`, promptInputData);
      throw new Error('AI failed to generate a quiz question.');
    }
    return output;
  }
);

