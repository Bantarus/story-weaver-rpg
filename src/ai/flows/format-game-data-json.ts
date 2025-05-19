
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

// Schema for SceneChoice (remains the same)
const SceneChoiceSchema = z.object({
  text: z.string().describe("The text presented to the player for this choice (e.g., 'Investigate the noise', 'Flee the scene')."),
  nextNodeId: z.string().describe("The ID of the scene to transition to if this choice is selected. This ID must correspond to another scene's ID."),
});

// Stricter SceneNode schema for AI generation (fields are required, AI will use empty strings/defaults)
const AISceneNodeSchema = z.object({
  id: z.string().describe("A unique identifier for this game scene (e.g., 'forest_clearing_01', 'village_entrance')."),
  title: z.string().describe("A title for this scene, displayed to the player (e.g., 'The Abandoned Shack'). If not applicable, provide an empty string."),
  text: z.string().describe("The main narrative text for this scene, describing the current situation, environment, or events. Use newline characters (\\n) for paragraph breaks."),
  choices: z.array(SceneChoiceSchema).describe("A list of choices available to the player in this scene. If empty or not present (e.g. for an ending scene), provide an empty array."),
  isEnding: z.boolean().describe("Set to true if this scene represents a conclusion or significant ending point of the adventure or a branch. Otherwise, set to false."),
  endingType: z.string().describe("If isEnding is true, this field can describe the nature of the ending (e.g., 'victory', 'tragedy', 'cliffhanger'). If isEnding is false or no specific type, provide an empty string or 'none'.").default("none"),
  visualHint: z.string().describe("A brief description or keywords for a visual element that could accompany this scene (e.g., 'sun-dappled forest path'). If not applicable, provide an empty string.").default(""),
  soundEffect: z.string().describe("A suggestion for a sound effect that could be played during this scene (e.g., 'rustling leaves'). If not applicable, provide an empty string.").default("")
});

// Stricter GameData schema for AI generation
const AIGameDataSchema = z.object({
  title: z.string().describe("The overall title for the generated RPG adventure (e.g., 'The Shadow of the Forgotten King'). If not applicable, provide an empty string.").default(""),
  startSceneId: z.string().describe("The ID of the initial scene where the game begins. This ID must correspond to one of the scene IDs in the 'scenes' array."),
  scenes: z.array(AISceneNodeSchema).describe("An array of AISceneNodeSchema objects. Each scene must have a unique 'id'."),
});

export type FormatGameDataJsonOutput = GameData; // This refers to the GameData type from context


export async function formatGameDataJson(
  input: FormatGameDataJsonInput
): Promise<FormatGameDataJsonOutput> {
  return formatGameDataJsonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatGameDataJsonPrompt',
  input: {schema: FormatGameDataJsonInputSchema},
  // REMOVED: output: {schema: AIGameDataSchema}, // We will parse and validate manually
  prompt: `You are an expert game designer specializing in creating interactive, text-based RPG adventures.
Your task is to take a narrative outline and transform it into a structured JSON game dataset.
The game should be a branching narrative where the player makes choices that lead to different scenes and outcomes.

Narrative Outline:
{{{narrativeOutline}}}

Please generate a JSON object adhering to the following structure. All string fields are required; if a feature is not applicable for a particular scene (e.g. title, visualHint, soundEffect, endingType), provide an empty string (""). For boolean fields like 'isEnding', provide true or false. Ensure 'endingType' is "none" if 'isEnding' is false or no specific type.
- \`title\` (string): An engaging title for the entire adventure. Use an empty string if not applicable.
- \`startSceneId\` (string): The ID of the scene where the game should begin. This must be the 'id' of one of the scenes in the \`scenes\` array.
- \`scenes\` (JSON ARRAY of SceneNode objects): A list of all game scenes. THIS MUST BE A JSON ARRAY, where each element is a SceneNode object. Each SceneNode object in this array must have the following properties:
  - \`id\` (string): A unique identifier for this scene (e.g., "scene_01", "forest_encounter").
  - \`title\` (string): A short, descriptive title for the scene. Use an empty string if not applicable.
  - \`text\` (string): The main descriptive text for the scene. Use newline characters (\\n) for paragraph breaks.
  - \`choices\` (array of SceneChoice objects): A list of actions the player can take. Each \`SceneChoice\` object has:
    - \`text\` (string): The text displayed to the player for this choice.
    - \`nextNodeId\` (string): The \`id\` of the scene to transition to if this choice is selected. This ID must correspond to another scene's 'id'.
    If a scene is an ending, provide an empty array for choices.
  - \`isEnding\` (boolean): Set to \`true\` if this scene is a conclusion, otherwise \`false\`.
  - \`endingType\` (string): If \`isEnding\` is true, specify the nature of the ending (e.g., "victory", "tragic_defeat"). If \`isEnding\` is false or no specific type, use an empty string or "none".
  - \`visualHint\` (string): A brief phrase describing the visual mood or key elements. Use an empty string if not applicable.
  - \`soundEffect\` (string): A suggestion for a sound effect. Use an empty string if not applicable.

Ensure that:
- The 'scenes' field is a JSON array of SceneNode objects.
- All \`nextNodeId\` values in choices correctly point to existing \`id\`s within the \`scenes\` array.
- There is at least one scene with \`isEnding: true\`.
- The narrative flows logically based on the provided outline.
- Scene IDs are descriptive and unique.
- The \`startSceneId\` refers to a valid scene 'id'.
`,
});

const formatGameDataJsonFlow = ai.defineFlow(
  {
    name: 'formatGameDataJsonFlow',
    inputSchema: FormatGameDataJsonInputSchema,
    outputSchema: AIGameDataSchema, // The flow's final output will be validated against this
  },
  async input => {
    const llmResponse = await prompt(input); // Returns GenerateResponse
    let aiOutputText = llmResponse.text;

    if (!aiOutputText) {
      throw new Error('AI failed to generate game data text.');
    }

    // Trim whitespace
    aiOutputText = aiOutputText.trim();

    // Strip Markdown fences if present
    if (aiOutputText.startsWith("```json")) {
      aiOutputText = aiOutputText.substring(7); // Remove ```json\n
      if (aiOutputText.endsWith("```")) {
        aiOutputText = aiOutputText.substring(0, aiOutputText.length - 3);
      }
    } else if (aiOutputText.startsWith("```")) { // In case it's just ```
        aiOutputText = aiOutputText.substring(3);
        if (aiOutputText.endsWith("```")) {
            aiOutputText = aiOutputText.substring(0, aiOutputText.length - 3);
        }
    }
    aiOutputText = aiOutputText.trim(); // Trim again after stripping

    let parsedJsonFromAI: any;
    try {
      parsedJsonFromAI = JSON.parse(aiOutputText);
    } catch (e) {
      console.error('AI output was not valid JSON after attempting to strip fences:', aiOutputText);
      throw new Error('AI output was not valid JSON: ' + (e instanceof Error ? e.message : String(e)));
    }

    let scenesArrayFromAI: any[];
    if (parsedJsonFromAI.scenes && typeof parsedJsonFromAI.scenes === 'object' && !Array.isArray(parsedJsonFromAI.scenes)) {
      // AI returned scenes as an object/map, convert to array
      console.warn('AI returned scenes as an object, converting to array.');
      scenesArrayFromAI = Object.values(parsedJsonFromAI.scenes);
    } else if (parsedJsonFromAI.scenes && Array.isArray(parsedJsonFromAI.scenes)) {
      // AI returned scenes as an array, use as is
      scenesArrayFromAI = parsedJsonFromAI.scenes;
    } else {
      console.error('AI output structure error. `scenes` field was not an array or object:', parsedJsonFromAI.scenes);
      throw new Error('AI output did not contain a valid scenes structure (expected array or object).');
    }
    
    const aiOutputForProcessing = {
      title: parsedJsonFromAI.title || "", 
      startSceneId: parsedJsonFromAI.startSceneId || "", 
      scenes: scenesArrayFromAI, 
    };

    try {
        AIGameDataSchema.parse(aiOutputForProcessing);
    } catch (validationError) {
        console.error("Processed AI output does not match AIGameDataSchema before transformation:", validationError);
        console.error("Data that failed validation:", JSON.stringify(aiOutputForProcessing, null, 2));
        throw new Error("Internal error: Processed AI output is not valid before final conversion.");
    }

    const scenesRecord: Record<string, SceneNode> = {};
    if (aiOutputForProcessing.scenes && Array.isArray(aiOutputForProcessing.scenes)) { 
      aiOutputForProcessing.scenes.forEach((aiScene: any) => { 
        if (aiScene.id) {
          const appScene: SceneNode = {
            id: aiScene.id,
            text: aiScene.text,
            choices: aiScene.choices, 
            title: aiScene.title && aiScene.title.trim() !== "" ? aiScene.title.trim() : undefined,
            isEnding: aiScene.isEnding,
            endingType: aiScene.endingType && aiScene.endingType.trim() !== "" && aiScene.endingType.trim().toLowerCase() !== "none" ? aiScene.endingType.trim() : undefined,
            visualHint: aiScene.visualHint && aiScene.visualHint.trim() !== "" ? aiScene.visualHint.trim() : undefined,
            soundEffect: aiScene.soundEffect && aiScene.soundEffect.trim() !== "" ? aiScene.soundEffect.trim() : undefined,
          };
          scenesRecord[aiScene.id] = appScene;
        } else {
          console.warn('AI generated a scene without an ID:', aiScene);
        }
      });
    } else {
      throw new Error('Error processing AI scenes: expected an array after initial processing.');
    }
    
    let finalStartSceneId = aiOutputForProcessing.startSceneId;

    if (!finalStartSceneId || !scenesRecord[finalStartSceneId]) {
      const availableSceneIds = Object.keys(scenesRecord);
      if (availableSceneIds.length > 0) {
        console.warn(`Generated startSceneId '${finalStartSceneId}' not found or invalid. Defaulting to first available scene: ${availableSceneIds[0]}`);
        finalStartSceneId = availableSceneIds[0];
      } else {
        throw new Error('AI generated game data with no scenes or an invalid startSceneId after transformation.');
      }
    }
    
    if(!parsedJsonFromAI.title && !finalStartSceneId) { // Check if both are problematic
        console.error('AI generated game data is critically incomplete (missing title and startSceneId). Parsed JSON from AI:', parsedJsonFromAI);
        throw new Error('AI generated game data is critically incomplete (missing title and startSceneId).');
    }


    const finalGameData: FormatGameDataJsonOutput = {
      title: aiOutputForProcessing.title && aiOutputForProcessing.title.trim() !== "" ? aiOutputForProcessing.title.trim() : undefined,
      startSceneId: finalStartSceneId,
      scenes: scenesRecord,
    };
    
    // Final validation against the application's expected GameData structure (loosely, as GameData has optional fields)
    // This is more for a sanity check. The AIGameDataSchema.parse above is the stricter one.
    if (!finalGameData.startSceneId || !finalGameData.scenes[finalGameData.startSceneId]) {
        console.error("Final game data is invalid after all transformations. StartSceneId or scene missing.", finalGameData);
        throw new Error("Critical error: Final game data structure is invalid.");
    }

    return finalGameData;
  }
);

