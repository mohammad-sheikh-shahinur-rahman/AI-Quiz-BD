'use server';
/**
 * @fileOverview Generates a shareable image for the quiz result.
 *
 * - generateResultImage - A function that generates the result image.
 * - GenerateResultImageInput - The input type for the generateResultImage function.
 * - GenerateResultImageOutput - The return type for the generateResultImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResultImageInputSchema = z.object({
  name: z.string().describe("The user's name."),
  score: z.number().describe("The user's achieved score."),
  totalPossibleScore: z.number().describe("The total possible score in the quiz."),
  quizTopicLabel: z.string().describe("The label of the quiz topic taken by the user.")
});
export type GenerateResultImageInput = z.infer<typeof GenerateResultImageInputSchema>;

const GenerateResultImageOutputSchema = z.object({
  imageDataUri: z.string().describe("A data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateResultImageOutput = z.infer<typeof GenerateResultImageOutputSchema>;

export async function generateResultImage(input: GenerateResultImageInput): Promise<GenerateResultImageOutput> {
  return generateResultImageFlow(input);
}

const generateResultImagePromptString = `
একটি কুইজের ফলাফলের জন্য আকর্ষণীয় এবং শেয়ার করার উপযোগী ছবি তৈরি করুন। ছবিটি অবশ্যই বাংলা ভাষায় হবে।

ছবিতে নিম্নলিখিত বিষয়গুলো স্পষ্টভাবে অন্তর্ভুক্ত করুন:
১. অ্যাপের নাম: "AI কুইজ বাংলাদেশ" (প্রধান শিরোনাম হিসেবে)।
২. ব্যবহারকারীর নাম: {{{name}}}
৩. প্রাপ্ত স্কোর: "{{{score}}} / {{{totalPossibleScore}}}" (উদাহরণস্বরূপ: ৮০ / ১০০)।
৪. কুইজের বিষয়: "{{{quizTopicLabel}}}"
৫. একটি সংক্ষিপ্ত এবং উৎসাহব্যঞ্জক অভিনন্দন বার্তা, যেমন "দারুণ খেলেছেন!", "চমৎকার ফলাফল!", অথবা "অভিনন্দন!"।

ডিজাইন সম্পর্কিত নির্দেশনা:
- রং: অ্যাপের থিমের সাথে সামঞ্জস্য রেখে Deep Sky Blue (#00BFFF), Light Cyan (#E0FFFF), এবং Medium Turquoise (#48D1CC) রং ব্যবহার করুন।
- লেআউট: আধুনিক, পরিচ্ছন্ন এবং আকর্ষণীয় লেআউট তৈরি করুন। লেখাগুলো যেন স্পষ্ট এবং সহজে পড়া যায়।
- ব্রান্ডিং: "AI কুইজ বাংলাদেশ" নামটি যেন ছবিতে সুন্দরভাবে ফুটে ওঠে।
- আবহ: ছবিটি যেন আনন্দদায়ক এবং অর্জনের অনুভূতি প্রকাশ করে।
- অতিরিক্ত গ্রাফিক্স: হালকা ও মানানসই গ্রাফিক্স (যেমন - অ্যাবস্ট্রাক্ট শেপ, কনফেত্তি, বা একটি প্রতীকী ট্রফি) যোগ করতে পারেন।

ছবিটি সোশ্যাল মিডিয়াতে শেয়ার করার জন্য উপযুক্ত অনুপাতে (যেমন, বর্গাকার বা ১৬:৯) তৈরি করুন। নিশ্চিত করুন ছবিটি উজ্জ্বল এবং আকর্ষণীয় হয়।
`;


const generateResultImageFlow = ai.defineFlow(
  {
    name: 'generateResultImageFlow',
    inputSchema: GenerateResultImageInputSchema,
    outputSchema: GenerateResultImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: generateResultImagePromptString
        .replace('{{{name}}}', input.name)
        .replace('{{{score}}}', input.score.toString())
        .replace('{{{totalPossibleScore}}}', input.totalPossibleScore.toString())
        .replace('{{{quizTopicLabel}}}', input.quizTopicLabel),
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ // Adding safety settings to reduce chances of blocks
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    if (!media || !media.url) {
      console.error('[generateResultImageFlow] AI did not return a valid image for input:', input);
      throw new Error('AI failed to generate the result image.');
    }
    return { imageDataUri: media.url };
  }
);
