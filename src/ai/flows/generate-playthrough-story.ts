
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
export const PlayedSceneInfoSchema = z.object({
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
}).nullable().optional().describe("Structured analysis of the original story: plot points, characters, settings, themes, tone.");


export const GeneratePlaythroughStoryInputSchema = z.object({
  gameTitle: z.string().optional().describe("The title of the adventure."),
  originalStoryText: z.string().optional().describe("The original source story text that the adventure was based on. This provides overall context."),
  analysisResult: AnalysisResultSchemaForStory,
  playedPath: z.array(PlayedSceneInfoSchema).describe("An ordered array representing the player's exact path through the game. Each element contains the details of a visited scene and the choice made from it."),
  characterDescription: z.string().optional().describe("The original description of the player's character."),
  playerAlignment: z.number().optional().describe("The player's final alignment score."),
  playerInventory: z.array(z.string()).optional().describe("The player's final inventory items."),
  playerStatusEffects: z.array(z.string()).optional().describe("The player's final status effects."),
  aiSettings: z.object({
    provider: z.enum(['googleAI', 'ollama']).optional().default('googleAI'),
    ollamaModel: z.string().optional(),
    language: z.string().optional().default('en-US').describe("The language for the AI to generate output, e.g., 'en-US', 'es-ES'."),
  }).optional(),
});
export type GeneratePlaythroughStoryInput = z.infer<typeof GeneratePlaythroughStoryInputSchema>;

export const GeneratePlaythroughStoryOutputSchema = z.object({
  playthroughStory: z.string().describe("The generated narrative text of the player's unique playthrough, written in an engaging, novelistic style."),
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
  prompt: `You are a master novelist and storyteller. Your task is to transform a player's specific journey through a text-based RPG into a rich, detailed, and engaging narrative, like chapters in a book.
This narrative MUST strictly follow the sequence of scenes and choices provided in the 'playedPath' array. Do not invent new paths or outcomes.
The goal is to create a compelling story, not just a summary. Expand on the provided text, describe environments, character thoughts and emotions, and elaborate on actions and consequences.
All generated story text must be in the language: {{{aiSettings.language}}}.

First, here is context about the original source material (also in {{{aiSettings.language}}}):
{{#if originalStoryText}}
Original Source Story:
{{{originalStoryText}}}
---
{{/if}}
{{#if analysisResult}}
Key Literary Elements from Original Story:
- Plot Points: {{{analysisResult.plotPoints}}}
- Characters: {{{analysisResult.characters}}}
- Settings: {{{analysisResult.settings}}}
- Themes: {{{analysisResult.themes}}}
- Tone: {{{analysisResult.tone}}}
---
{{/if}}

Adventure Context (player-provided context may be in any language, but your output MUST be in {{{aiSettings.language}}}):
{{#if gameTitle}}Adventure Title: {{{gameTitle}}}{{/if}}
{{#if characterDescription}}Player Character: {{{characterDescription}}}{{/if}}

The player's journey unfolded as follows (scene text and choice text are in {{{aiSettings.language}}}):

{{#each playedPath}}
## Chapter: {{#if sceneTitle}}'{{sceneTitle}}'{{else}}Scene ID: {{sceneId}}{{/if}}

The setting was as described:
{{{sceneText}}}

{{#if chosenChoiceText}}
From this situation, the player made the choice: "{{chosenChoiceText}}"
---
{{else}}
This was the final chapter of their adventure.
{{#if isEnding}}
The outcome was: {{endingType}}
{{/if}}
---
{{/if}}
{{/each}}

Narrative Construction Rules (Output in {{{aiSettings.language}}}, aim for a detailed, novelistic style):

1.  **Treat Each 'playedPath' Element as a Chapter/Major Segment:** For each element in the 'playedPath' array, craft a substantial narrative portion.
2.  **Elaborate on 'sceneText':** Use the provided 'sceneText' as the foundation for the chapter. Expand upon it significantly. Describe the environment in detail, portray the character's actions, internal thoughts, emotions, and any dialogues or interactions that occur. Make it immersive.
3.  **Narrate Transitions and Consequences:** If 'chosenChoiceText' is present for a chapter, this is critical. Narrate how the character's decision (the 'chosenChoiceText') led them to the next situation. Describe the immediate consequences of their choice, the journey (if any) to the next scene, or the unfolding events that bridge the gap. Make these transitions smooth and logical.
4.  **Maintain Character Focus:** Keep the narrative focused on the player character's experiences and perspective.
5.  **Contextual Consistency:** Weave in elements from the 'originalStoryText' and 'analysisResult' where appropriate to enrich the world and maintain thematic consistency.
6.  **Concluding Chapter:** The final chapter of your story must be based on the 'sceneText' and 'endingType' of the *last* scene in the 'playedPath' array. Develop this ending fully, reflecting the culmination of the player's journey.
7.  **Length and Detail:** Aim for a detailed and expansive narrative. Each "chapter" should feel fleshed out. Don't just list events; describe them vividly.

CRITICAL: Do NOT include scenes, choices, or outcomes that are not part of the provided 'playedPath'. The story must be a direct, though elaborated, account of the path taken by the player.
Make the story engaging and highly readable in {{{aiSettings.language}}}.

{{#if playerAlignment}}The player's final moral alignment was {{playerAlignment}} (where positive is good, negative is evil, and zero is neutral). You can subtly reflect this in the tone of the ending if appropriate and narratively consistent.{{/if}}
{{#if playerInventory.length}}At the end of their journey, their inventory contained: {{#each playerInventory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
{{#if playerStatusEffects.length}}They also bore the following status effects: {{#each playerStatusEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
(If inventory or status effects are mentioned, only include them if they are narratively significant for the conclusion described by the final scene in 'playedPath', or if they can be woven into the expanded narrative of the final chapter.)

Generated Novelistic Story (in {{{aiSettings.language}}}):
`,
});

const generatePlaythroughStoryFlow = ai.defineFlow(
  {
    name: 'generatePlaythroughStoryFlow',
    inputSchema: GeneratePlaythroughStoryInputSchema,
    outputSchema: GeneratePlaythroughStoryOutputSchema,
  },
  async (input) => {
    let modelName = 'googleai/gemini-2.0-flash'; 
    if (input.aiSettings?.provider === 'ollama' && input.aiSettings?.ollamaModel) {
      modelName = `ollama/${input.aiSettings.ollamaModel}`;
    }

    const promptInput = { ...input };
    
    const { output } = await generatePlaythroughStoryPromptObj(promptInput, { model: modelName });
    if (!output || !output.playthroughStory) {
      throw new Error('AI failed to generate a playthrough story.');
    }
    return output;
  }
);

    
