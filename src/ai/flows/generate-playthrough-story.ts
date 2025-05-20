
'use server';
/**
 * @fileOverview Generates a narrative story based on a player's playthrough of an RPG.
 *
 * - generatePlaythroughStory - Function to generate the playthrough story.
 * - GeneratePlaythroughStoryInput - Input type for the function.
 * - GeneratePlaythroughStoryOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { AnalyzeSourceMaterialOutput } from './analyze-source-material'; // For type safety

// We need a Zod schema for SceneNode if we pass it directly.
// For simplicity in the prompt, we might just pass relevant parts or expect a structured string.

const SceneChoiceSchemaForStory = z.object({
  text: z.string(),
  nextNodeId: z.string(),
  // We don't need effects or alignment for story generation itself from choices
});

const SceneNodeSchemaForStory = z.object({
  id: z.string(),
  title: z.string().optional(),
  text: z.string(),
  choices: z.array(SceneChoiceSchemaForStory),
  isEnding: z.boolean().optional(),
  endingType: z.string().optional(),
});

// Schema for the analysis result, matching AnalyzeSourceMaterialOutput
const AnalysisResultSchemaForStory = z.object({
  plotPoints: z.string().describe('Key plot points of the story.'),
  characters: z.string().describe('Important characters in the story.'),
  settings: z.string().describe('Key settings and locations in the story.'),
  themes: z.string().describe('Underlying themes explored in the story.'),
  tone: z.string().describe('Overall tone and style of the story.'),
}).optional().describe("Structured analysis of the original story: plot points, characters, settings, themes, tone.");


export const GeneratePlaythroughStoryInputSchema = z.object({
  gameTitle: z.string().optional().describe("The title of the adventure."),
  originalStoryText: z.string().optional().describe("The original source story text that the adventure was based on. This provides overall context."),
  analysisResult: AnalysisResultSchemaForStory,
  scenes: z.record(SceneNodeSchemaForStory).describe("A record of all scene nodes in the game, keyed by scene ID."),
  gameHistory: z.array(z.string()).describe("An ordered list of scene IDs the player traversed."),
  characterDescription: z.string().optional().describe("The original description of the player's character."),
  playerAlignment: z.number().optional().describe("The player's final alignment score."),
  playerInventory: z.array(z.string()).optional().describe("The player's final inventory items."),
  playerStatusEffects: z.array(z.string()).optional().describe("The player's final status effects."),
});
export type GeneratePlaythroughStoryInput = z.infer<typeof GeneratePlaythroughStoryInputSchema>;

export const GeneratePlaythroughStoryOutputSchema = z.object({
  playthroughStory: z.string().describe("The generated narrative text of the player's unique playthrough."),
});
export type GeneratePlaythroughStoryOutput = z.infer<typeof GeneratePlaythroughStoryOutputSchema>;

export async function generatePlaythroughStory(
  input: GeneratePlaythroughStoryInput
): Promise<GeneratePlaythroughStoryOutput> {
  return generatePlaythroughStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlaythroughStoryPrompt',
  input: { schema: GeneratePlaythroughStoryInputSchema },
  output: { schema: GeneratePlaythroughStoryOutputSchema },
  prompt: `You are a master storyteller. Your task is to transform a player's journey through a text-based RPG into a flowing, engaging narrative.

First, here is some context about the original source material the RPG adventure was based on:

{{#if originalStoryText}}
Original Story Text:
{{{originalStoryText}}}
---
{{/if}}

{{#if analysisResult}}
Key Elements from Original Story:
- Plot Points: {{{analysisResult.plotPoints}}}
- Characters: {{{analysisResult.characters}}}
- Settings: {{{analysisResult.settings}}}
- Themes: {{{analysisResult.themes}}}
- Tone: {{{analysisResult.tone}}}
---
{{/if}}

Now, here is the specific context for the adventure the player experienced:
{{#if gameTitle}}Adventure Title: {{{gameTitle}}}{{/if}}
{{#if characterDescription}}Player Character: {{{characterDescription}}}{{/if}}

The player progressed through the following scenes in this order:
{{#each gameHistory}}
- Scene ID: {{{this}}}
{{/each}}

Use the provided 'scenes' data (a map of scene IDs to scene details) to construct the story. For each scene ID in the player's 'gameHistory':
1. Retrieve the scene details: 'scenes[sceneId].title' (if any), 'scenes[sceneId].text'.
2. Incorporate the main text of the scene.
3. Identify which choice the player made from 'scenes[sceneId].choices' to get to the *next* scene in their 'gameHistory'. The choices list contains 'text' and 'nextNodeId'. Match the 'nextNodeId' with the ID of the next scene in 'gameHistory'. Describe this choice or its consequence as a natural transition in the story.
4. If it's an ending scene ('scenes[sceneId].isEnding' is true), use its text and 'scenes[sceneId].endingType' to conclude the story.

Weave these elements into a single, coherent story. Make it engaging and readable. Do not just list scene texts; connect them smoothly as if narrating a continuous story.

{{#if playerAlignment}}The player's final moral alignment was {{playerAlignment}} (where positive is good, negative is evil, and zero is neutral). You can subtly reflect this in the tone of the ending if appropriate.{{/if}}
{{#if playerInventory}}Final Inventory: {{#each playerInventory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
{{#if playerStatusEffects}}Final Status Effects: {{#each playerStatusEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
If inventory or status effects are mentioned, only include them if they significantly impacted the story's conclusion or character's state in a narratively interesting way.

Generated Story:
`,
});

const generatePlaythroughStoryFlow = ai.defineFlow(
  {
    name: 'generatePlaythroughStoryFlow',
    inputSchema: GeneratePlaythroughStoryInputSchema,
    outputSchema: GeneratePlaythroughStoryOutputSchema,
  },
  async (input) => {
    // The prompt is designed to directly use the input structure.
    // No complex pre-processing of gameHistory vs scenes needed here for the prompt itself,
    // as the prompt guides the AI to do the lookup.

    const { output } = await prompt(input);
    if (!output || !output.playthroughStory) {
      throw new Error('AI failed to generate a playthrough story.');
    }
    return output;
  }
);
    
