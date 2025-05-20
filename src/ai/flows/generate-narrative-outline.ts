
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
    .describe('The description of the character to integrate into the story (name, archetype, background, goals).'),
  desiredTone: z
    .string()
    .optional()
    .describe('The desired overall tone for the narrative (e.g., Heroic, Mysterious, Comedic, Tragic, Dramatic). Default will be inferred if not provided.'),
  desiredLength: z
    .string()
    .optional()
    .describe('The desired approximate length or complexity of the narrative outline (e.g., Short, Medium, Long). This should influence the number of key events and branches. Default will be medium if not provided.'),
  keyThemes: z
    .string()
    .optional()
    .describe('Specific themes from the source story or character goals that the user wants to emphasize in the narrative outline.'),
  // Added for model selection
  aiSettings: z.object({
    provider: z.enum(['googleAI', 'ollama']).optional().default('googleAI'),
    ollamaModel: z.string().optional(),
  }).optional(),
});
export type GenerateNarrativeOutlineInput = z.infer<
  typeof GenerateNarrativeOutlineInputSchema
>;

const GenerateNarrativeOutlineOutputSchema = z.object({
  narrativeOutline: z
    .string()
    .describe(
      'A narrative outline that integrates the character into the story, presenting compelling challenges, encounters, and potential resolutions, considering the desired tone, length, and themes if provided.'
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

const generateNarrativeOutlinePromptObj = ai.definePrompt({
  name: 'generateNarrativeOutlinePrompt',
  input: {schema: GenerateNarrativeOutlineInputSchema},
  output: {schema: GenerateNarrativeOutlineOutputSchema},
  prompt: `You are a master storyteller and RPG narrative outline generator.
Your task is to take a source story text and a player character description, and weave a compelling narrative outline that integrates the character into the story.
The outline should describe the character's journey, including key plot points, challenges, encounters, and potential resolutions.

Consider the following inputs:

Source Story Text:
{{{storyText}}}

Player Character Description:
{{{characterDescription}}}

{{#if desiredTone}}
Desired Narrative Tone: {{{desiredTone}}}
Please ensure the outline reflects this tone.
{{else}}
Desired Narrative Tone: Default (use a tone that best fits the story and character).
{{/if}}

{{#if desiredLength}}
Desired Narrative Length/Complexity: {{{desiredLength}}}
Adjust the depth and breadth of the outline accordingly. "Short" implies a more focused, linear path with fewer major branches. "Medium" allows for moderate branching and some side plots. "Long" suggests a more epic scope with significant branching, multiple subplots, and deeper character development arcs.
{{else}}
Desired Narrative Length/Complexity: Default (aim for a medium complexity).
{{/if}}

{{#if keyThemes}}
Key Themes to Emphasize: {{{keyThemes}}}
Try to weave these themes into the character's journey and the challenges they face.
{{/if}}

Generate a detailed narrative outline below. This outline will be used to create a structured text-based RPG.
Focus on creating a clear progression for the player character within the provided story's world.
The outline should be a single block of text.

Narrative Outline: `,
});

const generateNarrativeOutlineFlow = ai.defineFlow(
  {
    name: 'generateNarrativeOutlineFlow',
    inputSchema: GenerateNarrativeOutlineInputSchema,
    outputSchema: GenerateNarrativeOutlineOutputSchema,
  },
  async (input) => {
    let modelName = 'googleai/gemini-2.0-flash'; // Default model
    if (input.aiSettings?.provider === 'ollama' && input.aiSettings?.ollamaModel) {
      modelName = `ollama/${input.aiSettings.ollamaModel}`;
    }
    
    // Filter input for the prompt to only include fields defined in its schema
    const promptInput = {
        storyText: input.storyText,
        characterDescription: input.characterDescription,
        desiredTone: input.desiredTone,
        desiredLength: input.desiredLength,
        keyThemes: input.keyThemes,
    };

    const {output} = await generateNarrativeOutlinePromptObj(promptInput, { model: modelName });
    if (!output || !output.narrativeOutline) {
      throw new Error('AI failed to generate a narrative outline.');
    }
    return output;
  }
);
