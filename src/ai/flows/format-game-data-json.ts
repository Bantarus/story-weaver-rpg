'use server';
/**
 * @fileOverview Formats a narrative outline into a detailed JSON object for the game engine.
 *
 * - formatGameDataJson - A function that formats the narrative outline into JSON.
 * - FormatGameDataJsonInput - The input type for the formatGameDataJson function.
 * - FormatGameDataJsonOutput - The return type for the formatGameDataJson function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatGameDataJsonInputSchema = z.object({
  narrativeOutline: z
    .string()
    .describe('The narrative outline to be formatted into JSON.'),
});
export type FormatGameDataJsonInput = z.infer<typeof FormatGameDataJsonInputSchema>;

const FormatGameDataJsonOutputSchema = z.object({
  gameDataJson: z
    .string()
    .describe(
      'A JSON object containing game scenes, descriptive text, player choices, and scene transitions.'
    ),
});
export type FormatGameDataJsonOutput = z.infer<typeof FormatGameDataJsonOutputSchema>;

export async function formatGameDataJson(
  input: FormatGameDataJsonInput
): Promise<FormatGameDataJsonOutput> {
  return formatGameDataJsonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatGameDataJsonPrompt',
  input: {schema: FormatGameDataJsonInputSchema},
  output: {schema: FormatGameDataJsonOutputSchema},
  prompt: `You are an expert game designer who specializes in formatting narrative outlines into detailed JSON objects for RPG game engines.

  The JSON object should contain game scenes, descriptive text, player choices, and scene transitions.

  Format the following narrative outline into a JSON object:

  {{{narrativeOutline}}}`,
});

const formatGameDataJsonFlow = ai.defineFlow(
  {
    name: 'formatGameDataJsonFlow',
    inputSchema: FormatGameDataJsonInputSchema,
    outputSchema: FormatGameDataJsonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
