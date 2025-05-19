
'use server';
/**
 * @fileOverview Formats a narrative outline into a detailed JSON object for the game engine.
 *
 * - formatGameDataJson - A function that formats the narrative outline into JSON.
 * - FormatGameDataJsonInput - The input type for the formatGameDataJson function.
 * - FormatGameDataJsonOutput - The return type for the formatGameDataJson function (which is GameData).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GameData, SceneNode } from '@/context/GameContext'; // Import GameData type for output

const FormatGameDataJsonInputSchema = z.object({
  narrativeOutline: z
    .string()
    .describe('The narrative outline to be formatted into structured game JSON data.'),
});
export type FormatGameDataJsonInput = z.infer<typeof FormatGameDataJsonInputSchema>;

const SceneChoiceSchema = z.object({
  text: z.string().describe("The text presented to the player for this choice (e.g., 'Investigate the noise', 'Flee the scene')."),
  nextNodeId: z.string().describe("The ID of the scene to transition to if this choice is selected. This ID must correspond to another scene's ID."),
  // Optional: effects: z.array(z.string()).optional().describe("Any effects this choice has, e.g., 'gain_item_key', 'lose_trust_npc1'.")
});

const SceneNodeSchema = z.object({
  id: z.string().describe("A unique identifier for this game scene (e.g., 'forest_clearing_01', 'village_entrance')."),
  title: z.string().optional().describe("An optional title for this scene, displayed to the player (e.g., 'The Abandoned Shack')."),
  text: z.string().describe("The main narrative text for this scene, describing the current situation, environment, or events. Use newline characters (\\n) for paragraph breaks."),
  choices: z.array(SceneChoiceSchema).describe("A list of choices available to the player in this scene. If empty or not present, this scene might be an ending or a point where the story pauses."),
  isEnding: z.boolean().optional().describe("Set to true if this scene represents a conclusion or significant ending point of the adventure or a branch."),
  endingType: z.string().optional().describe("If isEnding is true, this field can describe the nature of the ending (e.g., 'victory', 'tragedy', 'cliffhanger', 'quest_complete')."),
  visualHint: z.string().optional().describe("A brief description or keywords for a visual element that could accompany this scene (e.g., 'sun-dappled forest path', 'ominous castle silhouette', 'cozy tavern interior')."),
  soundEffect: z.string().optional().describe("A suggestion for a sound effect that could be played during this scene (e.g., 'rustling leaves', 'distant bell tolling', 'crackling fireplace').")
  // Optional: effects: z.array(z.string()).optional().describe("Any effects that occur upon entering this scene, e.g., 'weather_change_rain', 'music_tense'.")
});

// Schema for AI generation (scenes as array)
const AIGameDataSchema = z.object({
  title: z.string().optional().describe("The overall title for the generated RPG adventure (e.g., 'The Shadow of the Forgotten King')."),
  startSceneId: z.string().describe("The ID of the initial scene where the game begins. This ID must correspond to one of the scene IDs in the 'scenes' array."),
  scenes: z.array(SceneNodeSchema).describe("An array of SceneNode objects. Each scene must have a unique 'id'."),
});

// This is the actual structure the game will use, as defined in GameContext.tsx as GameData
// We will transform the AI output (AIGameDataSchema) to this structure.
export type FormatGameDataJsonOutput = GameData; // This refers to the GameData type from context (scenes as Record)


export async function formatGameDataJson(
  input: FormatGameDataJsonInput
): Promise<FormatGameDataJsonOutput> {
  return formatGameDataJsonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatGameDataJsonPrompt',
  input: {schema: FormatGameDataJsonInputSchema},
  output: {schema: AIGameDataSchema}, // Output is now the AI-friendly AIGameDataSchema
  prompt: `You are an expert game designer specializing in creating interactive, text-based RPG adventures.
Your task is to take a narrative outline and transform it into a structured JSON game dataset.
The game should be a branching narrative where the player makes choices that lead to different scenes and outcomes.

Narrative Outline:
{{{narrativeOutline}}}

Please generate a JSON object adhering to the following structure:
- \`title\` (string, optional): An engaging title for the entire adventure.
- \`startSceneId\` (string): The ID of the scene where the game should begin. This must be the 'id' of one of the scenes in the \`scenes\` array.
- \`scenes\` (array of SceneNode objects): A list of all game scenes. Each SceneNode object in this array must have the following properties:
  - \`id\` (string): A unique identifier for this scene (e.g., "scene_01", "forest_encounter", "castle_throne_room").
  - \`title\` (string, optional): A short, descriptive title for the scene (e.g., "The Whispering Woods," "Confronting the Baron").
  - \`text\` (string): The main descriptive text for the scene. This text should be engaging and set the stage for the player. Use newline characters (\\n) for paragraph breaks where appropriate.
  - \`choices\` (array of SceneChoice objects): A list of actions the player can take.
    - Each \`SceneChoice\` object has:
      - \`text\` (string): The text displayed to the player for this choice (e.g., "Enter the dark cave," "Try to persuade the guard").
      - \`nextNodeId\` (string): The \`id\` of the scene to transition to if this choice is selected. This ID must correspond to another scene's 'id' in the \`scenes\` array.
  - \`isEnding\` (boolean, optional): Set to \`true\` if this scene is a conclusion of the adventure or a major branch. If true, the \`choices\` array might be empty or lead to a final "Game Over" type message.
  - \`endingType\` (string, optional): If \`isEnding\` is true, specify the nature of the ending (e.g., "victory", "heroic_sacrifice", "tragic_defeat", "mystery_unsolved", "peaceful_resolution").
  - \`visualHint\` (string, optional): A brief phrase describing the visual mood or key elements of the scene (e.g., "moonlit clearing," "ancient library," "stormy clifftop").
  - \`soundEffect\` (string, optional): A suggestion for a sound that might accompany the scene (e.g., "owl hooting," "pages turning," "wind howling").

Ensure that:
- All \`nextNodeId\` values in choices correctly point to existing \`id\`s within the \`scenes\` array.
- There is at least one scene with \`isEnding: true\`.
- The narrative flows logically based on the provided outline, creating a coherent and engaging player experience.
- Scene IDs are descriptive and unique.
- The story should branch and offer meaningful consequences for player choices.
- Provide a variety of scenes and choices to make the game engaging.
- The \`startSceneId\` refers to a valid scene 'id' defined in one of the objects in the \`scenes\` array.
`,
});

const formatGameDataJsonFlow = ai.defineFlow(
  {
    name: 'formatGameDataJsonFlow',
    inputSchema: FormatGameDataJsonInputSchema,
    outputSchema: AIGameDataSchema, // AI will output an array of scenes
  },
  async input => {
    const {output: aiOutput} = await prompt(input);
    if (!aiOutput) {
      throw new Error('AI failed to generate game data.');
    }

    // Transform scenes array into a Record<string, SceneNode>
    const scenesRecord: Record<string, SceneNode> = {};
    if (aiOutput.scenes && Array.isArray(aiOutput.scenes)) {
      aiOutput.scenes.forEach(scene => {
        if (scene.id) {
          scenesRecord[scene.id] = scene as SceneNode; // Cast to SceneNode from GameContext
        } else {
          console.warn('AI generated a scene without an ID:', scene);
        }
      });
    } else {
      throw new Error('AI did not return a valid scenes array.');
    }
    
    let finalStartSceneId = aiOutput.startSceneId;

    // Validate that startSceneId exists in the transformed scenesRecord
    if (!scenesRecord[finalStartSceneId]) {
      const availableSceneIds = Object.keys(scenesRecord);
      if (availableSceneIds.length > 0) {
        console.warn(`Generated startSceneId '${finalStartSceneId}' not found in scenes. Defaulting to first available scene: ${availableSceneIds[0]}`);
        finalStartSceneId = availableSceneIds[0];
      } else {
        throw new Error('AI generated game data with no scenes or an invalid startSceneId after transformation.');
      }
    }

    // Construct the final GameData object expected by the application
    const finalGameData: FormatGameDataJsonOutput = {
      title: aiOutput.title,
      startSceneId: finalStartSceneId,
      scenes: scenesRecord,
    };
    
    return finalGameData;
  }
);

