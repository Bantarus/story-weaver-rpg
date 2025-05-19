// 'use server';
/**
 * @fileOverview A narrative outline generation AI agent. This agent takes a story and a character description as input, and generates a narrative outline that integrates the character into the story.
 *
 * - generateNarrativeOutline - A function that handles the narrative outline generation process.
 * - GenerateNarrativeOutlineInput - The input type for the generateNarrativeOutline function.
 * - GenerateNarrativeOutlineOutput - The return type for the generateNarrativeOutline function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNarrativeOutlineInputSchema = z.object({
  storyText: z
    .string()
    .describe('The text of the story to generate a narrative outline for.'),
  characterDescription: z
    .string()
    .describe('The description of the character to integrate into the story.'),
});
export type GenerateNarrativeOutlineInput = z.infer<
  typeof GenerateNarrativeOutlineInputSchema
>;

const GenerateNarrativeOutlineOutputSchema = z.object({
  narrativeOutline: z
    .string()
    .describe(
      'A narrative outline that integrates the character into the story, presenting compelling challenges, encounters, and potential resolutions.'
    ),
});
export type GenerateNarrativeOutlineOutput = z.infer<
  typeof GenerateNarrativeOutlineOutputSchema
>;

export async function generateNarrativeOutline(
  input: GenerateNarrativeOutlineInput
): Promise<GenerateNarrativeOutlineOutput> {
  return generateNarrativeOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNarrativeOutlinePrompt',
  input: {schema: GenerateNarrativeOutlineInputSchema},
  output: {schema: GenerateNarrativeOutlineOutputSchema},
  prompt: `You are a narrative outline generator. You will take a story and a character description as input, and generate a narrative outline that integrates the character into the story.

Story Text: {{{storyText}}}
Character Description: {{{characterDescription}}}

Narrative Outline: `,
});

const generateNarrativeOutlineFlow = ai.defineFlow(
  {
    name: 'generateNarrativeOutlineFlow',
    inputSchema: GenerateNarrativeOutlineInputSchema,
    outputSchema: GenerateNarrativeOutlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
