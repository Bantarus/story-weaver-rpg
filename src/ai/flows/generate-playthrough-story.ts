
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


const GeneratePlaythroughStoryInputSchema = z.object({
  gameTitle: z.string().optional().describe("The title of the adventure."),
  originalStoryText: z.string().optional().describe("The original source story text that the adventure was based on. This provides overall context."),
  analysisResult: AnalysisResultSchemaForStory,
  scenes: z.record(SceneNodeSchemaForStory).describe("A record of all scene nodes in the game, keyed by scene ID. Each key is a scene ID, and its value is the scene object."),
  gameHistory: z.array(z.string()).describe("An ordered list of scene IDs the player traversed. The LAST ID in this array is the player's actual ending scene."),
  characterDescription: z.string().optional().describe("The original description of the player's character."),
  playerAlignment: z.number().optional().describe("The player's final alignment score."),
  playerInventory: z.array(z.string()).optional().describe("The player's final inventory items."),
  playerStatusEffects: z.array(z.string()).optional().describe("The player's final status effects."),
});
export type GeneratePlaythroughStoryInput = z.infer<typeof GeneratePlaythroughStoryInputSchema>;

const GeneratePlaythroughStoryOutputSchema = z.object({
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
This narrative MUST strictly follow the sequence of scenes the player visited, as detailed in the 'gameHistory' array.

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

The player progressed through the following scenes, in this EXACT order (this is the 'gameHistory'):
{{#each gameHistory}}
- Scene ID: {{{this}}}
{{/each}}

Narrative Construction Rules:
You will construct the story by processing each scene ID from the 'gameHistory' array, one by one, in the order they appear.

For each 'current_scene_id' in 'gameHistory':
1. Retrieve the current scene's details from the 'scenes' data using the 'current_scene_id' (e.g., \`scenes[current_scene_id]\`).
2. Weave the 'text' of this current scene into your narrative. If the scene has a 'title' (e.g., \`scenes[current_scene_id].title\`), you can incorporate it.

3. **If this is NOT the last scene ID in 'gameHistory'**:
    a. Get the 'next_scene_id' from the 'gameHistory' array (the ID immediately following the 'current_scene_id').
    b. Look at the 'choices' array of the *current* scene (e.g., \`scenes[current_scene_id].choices\`).
    c. Find the specific choice object within that array where its 'nextNodeId' property matches the 'next_scene_id'.
    d. Narrate that the player made this specific choice (you can use the 'text' property of the found choice object) or describe the immediate consequence of this choice that logically leads to the 'next_scene_id'. This transition is key.

4. **If this IS the last scene ID in 'gameHistory'**:
    a. This scene is the player's actual ending. Fully narrate the 'text' of this final scene (\`scenes[last_scene_id_in_history].text\`).
    b. Conclude the story based on this final scene's 'endingType' (e.g., \`scenes[last_scene_id_in_history].endingType\`). The narrative must reflect this specific ending.

CRITICAL: Do NOT include scenes or outcomes that are not part of the provided 'gameHistory' path. The story must be a direct account of the path taken by the player.
Make the story engaging and readable. Do not just list scene texts; connect them smoothly as if narrating a continuous story, clearly driven by the player's choices as recorded in 'gameHistory'.

{{#if playerAlignment}}The player's final moral alignment was {{playerAlignment}} (where positive is good, negative is evil, and zero is neutral). You can subtly reflect this in the tone of the ending if appropriate.{{/if}}
{{#if playerInventory.length}}Final Inventory: {{#each playerInventory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
{{#if playerStatusEffects.length}}Final Status Effects: {{#each playerStatusEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
(If inventory or status effects are mentioned, only include them if they are narratively significant for the conclusion described by the final scene in 'gameHistory').

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
    

    