
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
import type { SceneNode } from '@/context/GameContext'; // Assuming SceneNode is exported or can be imported

// We need a Zod schema for SceneNode if we pass it directly.
// For simplicity in the prompt, we might just pass relevant parts or expect a structured string.
// Let's define a simplified SceneNode for the input schema here if needed, or rely on the main one.

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

export const GeneratePlaythroughStoryInputSchema = z.object({
  gameTitle: z.string().optional().describe("The title of the adventure."),
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

Here is the context for the adventure:
{{#if gameTitle}}Adventure Title: {{{gameTitle}}}{{/if}}
{{#if characterDescription}}Player Character: {{{characterDescription}}}{{/if}}

The player progressed through the following scenes in this order:
{{#each gameHistory}}
- Scene ID: {{{this}}}
{{/each}}

Use the provided 'scenes' data to construct the story. For each scene in the player's history:
1. Incorporate the main text of the scene ('scenes[sceneId].text').
2. Identify which choice the player made to get to the *next* scene in their history. Describe this choice or its consequence as a transition. The choices for a scene 'scenes[sceneId].choices' lists 'text' and 'nextNodeId'. Match the 'nextNodeId' with the ID of the next scene in 'gameHistory'.
3. If it's an ending scene ('scenes[sceneId].isEnding' is true), use its text and 'endingType' to conclude the story.

Weave these elements into a single, coherent story. Make it engaging and readable.

{{#if playerAlignment}}The player's final moral alignment was {{playerAlignment}} (where positive is good, negative is evil, and zero is neutral). You can subtly reflect this in the tone of the ending if appropriate.{{/if}}
{{#if playerInventory}}Final Inventory: {{#each playerInventory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
{{#if playerStatusEffects}}Final Status Effects: {{#each playerStatusEffects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}
If inventory or status effects are mentioned, only include them if they significantly impacted the story's conclusion or character's state in a narratively interesting way.

Focus on narrative flow. Do not just list scene texts. Connect them smoothly.

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
    // Pre-process input for the prompt if necessary, e.g., to make choices easier to reference
    // For this prompt, direct templating should work, but complex logic could go here.

    // Construct a map of choices for easier lookup if the prompt struggles
    const enrichedInput = { ...input, sceneDetailsForPrompt: [] as any[] };
    input.gameHistory.forEach((sceneId, index) => {
        const scene = input.scenes[sceneId];
        if (!scene) return;

        let choiceText = "The story progressed.";
        if (index < input.gameHistory.length - 1) {
            const nextSceneIdInHistory = input.gameHistory[index + 1];
            const madeChoice = scene.choices.find(c => c.nextNodeId === nextSceneIdInHistory);
            if (madeChoice) {
                choiceText = `Then, they chose to: "${madeChoice.text}"`;
            } else {
                choiceText = `The path led them to the next part of their adventure.`
            }
        }
        enrichedInput.sceneDetailsForPrompt.push({
            id: scene.id,
            title: scene.title,
            text: scene.text,
            isEnding: scene.isEnding,
            endingType: scene.endingType,
            choiceMadeToProgress: index < input.gameHistory.length - 1 ? choiceText : "This was the final scene."
        });
    });
    
    // The prompt needs to be updated to use enrichedInput.sceneDetailsForPrompt instead of iterating gameHistory and looking up scenes
    // However, the initial prompt design is simpler and might work. Let's try it first.
    // If it fails, we can switch to a more complex input structure for the prompt.

    const { output } = await prompt(input); // Use original input for now
    if (!output || !output.playthroughStory) {
      throw new Error('AI failed to generate a playthrough story.');
    }
    return output;
  }
);

// Add this to src/ai/dev.ts:
// import '@/ai/flows/generate-playthrough-story.ts';
    