
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

// Schema for information about a single scene visited by the player
const PlayedSceneInfoSchema = z.object({
  sceneId: z.string().describe("The ID of the scene that was visited."),
  sceneTitle: z.string().optional().describe("The title of the visited scene."),
  sceneText: z.string().describe("The narrative text of the visited scene."),
  chosenChoiceText: z.string().optional().describe("The text of the choice the player made from this scene to proceed. Absent for the last scene in the path."),
  isEnding: z.boolean().optional().describe("True if this scene was an ending."),
  endingType: z.string().optional().describe("The type of ending, if applicable (e.g., 'victory', 'defeat')."),
});
export type PlayedSceneInfo = z.infer<typeof PlayedSceneInfoSchema>;

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
  playedPath: z.array(PlayedSceneInfoSchema).describe("An ordered array representing the player's exact path through the game. Each element contains the details of a visited scene and the choice made from it."),
  characterDescription: z.string().optional().describe("The original description of the player's character."),
  playerAlignment: z.number().optional().describe("The player's final alignment score."),
  playerInventory: z.array(z.string()).optional().describe("The player's final inventory items."),
  playerStatusEffects: z.array(z.string()).optional().describe("The player's final status effects."),
  // Added for model selection
  aiSettings: z.object({
    provider: z.enum(['googleAI', 'ollama']).optional().default('googleAI'),
    ollamaModel: z.string().optional(),
  }).optional(),
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

const generatePlaythroughStoryPromptObj = ai.definePrompt({
  name: 'generatePlaythroughStoryPrompt',
  input: { schema: GeneratePlaythroughStoryInputSchema },
  output: { schema: GeneratePlaythroughStoryOutputSchema },
  prompt: `You are a master storyteller. Your task is to transform a player's journey through a text-based RPG into a flowing, engaging narrative.
This narrative MUST strictly follow the sequence of scenes and choices provided in the 'playedPath' array.

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

The player progressed through the following scenes, making the indicated choices:

{{#each playedPath}}
Scene: {{#if sceneTitle}}'{{sceneTitle}}' (ID: {{sceneId}}){{else}}ID: {{sceneId}}{{/if}}
Narrative:
{{{sceneText}}}

{{#if chosenChoiceText}}
Player's Choice from this scene: "{{chosenChoiceText}}"
---
{{else}}
This was the final scene.
{{#if isEnding}}
Ending Type: {{endingType}}
{{/if}}
---
{{/if}}
{{/each}}

Narrative Construction Rules:
You will construct the story by processing each element from the 'playedPath' array, one by one, in the order they appear.

For each scene in 'playedPath':
1. Weave the 'sceneText' into your narrative. If the scene has a 'sceneTitle', you can incorporate it.
2. If the scene has a 'chosenChoiceText' (meaning it's not the last scene), narrate that the player made this specific choice, or describe the immediate consequence of this choice that logically leads to the next scene. This transition is key.
3. The story MUST conclude based on the 'sceneText' and 'endingType' of the *last* scene in the 'playedPath' array.

CRITICAL: Do NOT include scenes or choices that are not part of the provided 'playedPath'. The story must be a direct account of the path taken by the player.
Make the story engaging and readable. Do not just list scene texts; connect them smoothly as if narrating a continuous story, clearly driven by the player's choices as recorded in 'playedPath'.

{{#if playerAlignment}}The player's final moral alignment was {{playerAlignment}} (where positive is good, negative is evil, and zero is neutral). You can subtly reflect this in the tone of the ending if appropriate.{{/if}}
{{#if playerInventory.length}}Final Inventory: {{#each playerInventory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
{{#if playerStatusEffects.length}}Final Status Effects: {{#each playerStatusEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
(If inventory or status effects are mentioned, only include them if they are narratively significant for the conclusion described by the final scene in 'playedPath').

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
    let modelName = 'googleai/gemini-2.0-flash'; // Default model
    if (input.aiSettings?.provider === 'ollama' && input.aiSettings?.ollamaModel) {
      modelName = `ollama/${input.aiSettings.ollamaModel}`;
    }

    // Filter input for the prompt
    const promptInput = { ...input };
    delete promptInput.aiSettings; // Remove aiSettings from prompt input

    const { output } = await generatePlaythroughStoryPromptObj(promptInput, { model: modelName });
    if (!output || !output.playthroughStory) {
      throw new Error('AI failed to generate a playthrough story.');
    }
    return output;
  }
);
