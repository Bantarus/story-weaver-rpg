
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGame, type GameData, type SceneNode, type DesiredTone, type DesiredLength, type CharacterProfile, type AnalyzeSourceMaterialOutput } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookText, UserPlus, Wand2, AlertCircle, CheckCircle, Play, Palette, Scale, Sparkles, RefreshCcw, Save, LibraryBig, UserCheck, Download, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import { analyzeSourceMaterial } from "@/ai/flows/analyze-source-material";
import { generateNarrativeOutline } from "@/ai/flows/generate-narrative-outline";
import { formatGameDataJson, type FormatGameDataJsonOutput, type AISceneNode } from "@/ai/flows/format-game-data-json";
import { mockGameData } from "@/lib/mock-game-data";

const USE_MOCK_GENERATION = true;

const toneOptions: DesiredTone[] = ["Default", "Heroic", "Mysterious", "Comedic", "Tragic", "Dramatic"];
const lengthOptions: DesiredLength[] = ["Default", "Short", "Medium", "Long"];


// Zod Schemas for Import Validation
const ImportEffectSchema = z.object({
  type: z.enum(["ADD_ITEM", "REMOVE_ITEM", "ADD_STATUS", "REMOVE_STATUS"]),
  value: z.string(),
  description: z.string().optional(),
});

const ImportSceneChoiceSchema = z.object({
  text: z.string(),
  nextNodeId: z.string(),
  effects: z.array(ImportEffectSchema).optional(),
  alignmentEffect: z.number().optional().default(0),
});

const ImportSceneNodeSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  text: z.string(),
  choices: z.array(ImportSceneChoiceSchema),
  effects: z.array(ImportEffectSchema).optional(),
  visualHint: z.string().optional(),
  soundEffect: z.string().optional(),
  isEnding: z.boolean().optional(),
  endingType: z.string().optional(),
});

const AnalyzeSourceMaterialOutputSchemaForImport = z.object({
  plotPoints: z.string(),
  characters: z.string(),
  settings: z.string(),
  themes: z.string(),
  tone: z.string(),
}).nullable().optional();


const ImportGameDataSchema = z.object({
  id: z.string().optional(),
  adventureName: z.string().optional(),
  title: z.string().optional(),
  startSceneId: z.string(),
  scenes: z.record(ImportSceneNodeSchema), // Expects scenes as a record
  storyText: z.string().optional(),
  characterDescription: z.string().optional(),
  analysisResult: AnalyzeSourceMaterialOutputSchemaForImport,
  narrativeOutline: z.string().optional(),
});


export default function CreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    storyText, setStoryText,
    characterDescription, setCharacterDescription,
    analysisResult, setAnalysisResult,
    narrativeOutline, setNarrativeOutline,
    desiredTone, setDesiredTone,
    desiredLength, setDesiredLength,
    keyThemes, setKeyThemes,
    gameData,
    setGameData,
    isLoading, setIsLoading,
    error, setError,
    creationStep, setCreationStep,
    resetCreationProgress,
    saveAdventureToLibrary,
    isAdventureInLibrary,
    savedCharacters,
    saveCharacterProfile,
    deleteCharacterProfile,
    getCharacterProfileById
  } = useGame();

  const { aiProvider, ollamaModel, isSettingsLoaded } = useSettings();

  const [charName, setCharNameLocal] = useState("");
  const [charArchetype, setCharArchetypeLocal] = useState("");
  const [charBackground, setCharBackgroundLocal] = useState("");
  const [charGoals, setCharGoalsLocal] = useState("");

  const [loadedCharId, setLoadedCharId] = useState<string | null>(null);
  const [selectedLibraryCharId, setSelectedLibraryCharId] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (characterDescription && creationStep === 'character' && !loadedCharId) {
      const nameMatch = characterDescription.match(/Name: (.*?)(?:\nArchetype:|\nBackground:|\nGoals:|$)/s);
      if (nameMatch) setCharNameLocal(nameMatch[1].trim()); else setCharNameLocal("");
      const archetypeMatch = characterDescription.match(/Archetype: (.*?)(?:\nBackground:|\nGoals:|$)/s);
      if (archetypeMatch) setCharArchetypeLocal(archetypeMatch[1].trim()); else setCharArchetypeLocal("");
      const backgroundMatch = characterDescription.match(/Background: (.*?)(?:\nGoals:|$)/s);
      if (backgroundMatch) setCharBackgroundLocal(backgroundMatch[1].trim()); else setCharBackgroundLocal("");
      const goalsMatch = characterDescription.match(/Goals: (.*)/s);
      if (goalsMatch) setCharGoalsLocal(goalsMatch[1].trim()); else setCharGoalsLocal("");
    } else if (creationStep === 'character' && !loadedCharId && !characterDescription) {
      setCharNameLocal("");
      setCharArchetypeLocal("");
      setCharBackgroundLocal("");
      setCharGoalsLocal("");
    }
  }, [characterDescription, creationStep, loadedCharId]);


  const progressValue = {
    story: 0,
    character: 33,
    generate: 66,
    error: creationStep === 'story' ? 0 : creationStep === 'character' ? 33 : 66,
  }[creationStep];

  useEffect(() => {
    setError(null);
  }, [creationStep, setError]);

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText || storyText.trim().length < 50) {
      setError("Please provide a story text of at least 50 characters.");
      toast({ variant: "destructive", title: "Error", description: "Story text is too short." });
      setCreationStep('error');
      return;
    }
    if (USE_MOCK_GENERATION) {
        setAnalysisResult({ plotPoints: "Mocked plot points.", characters: "Mocked characters.", settings: "Mocked settings.", themes: "Mocked themes.", tone: "Mocked tone."});
        toast({ title: "Mock Story Analysis Complete", description: "Proceed to character creation (using mock data).", className: "bg-primary text-primary-foreground" });
        setCreationStep("character");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSourceMaterial({
        storyText,
        aiSettings: { provider: aiProvider, ollamaModel: aiProvider === 'ollama' ? ollamaModel : undefined }
      });
      setAnalysisResult(result);
      toast({ title: "Story Analysis Complete", description: "Proceed to character creation.", className: "bg-primary text-primary-foreground" });
      setCreationStep("character");
    } catch (err) {
      console.error("Error analyzing source material:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during story analysis.";
      setError(errorMessage);
      setCreationStep('error');
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim() || !charArchetype.trim() || !charBackground.trim() || !charGoals.trim()) {
      setError("Please fill in all character details.");
      toast({ variant: "destructive", title: "Error", description: "All character fields are required." });
      setCreationStep('error');
      return;
    }
    const fullCharacterDescription = `Name: ${charName.trim()}\nArchetype: ${charArchetype.trim()}\nBackground: ${charBackground.trim()}\nGoals: ${charGoals.trim()}`;
    setCharacterDescription(fullCharacterDescription);

    if (USE_MOCK_GENERATION) {
        setNarrativeOutline("This is a mocked narrative outline based on your character and the mocked story analysis. It sets the stage for an exciting adventure!");
        toast({ title: "Mock Narrative Outline Generated", description: "Ready to generate the mock game data.", className: "bg-primary text-primary-foreground" });
        setCreationStep("generate");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!storyText) {
        setError("Story text not found. Please go back to the story step.");
        setCreationStep('error');
        toast({ variant: "destructive", title: "Error", description: "Story text not found." });
        setIsLoading(false);
        return;
      }
      const result = await generateNarrativeOutline({
        storyText,
        characterDescription: fullCharacterDescription,
        desiredTone: desiredTone === "Default" ? undefined : desiredTone,
        desiredLength: desiredLength === "Default" ? undefined : desiredLength,
        keyThemes: keyThemes || undefined,
        aiSettings: { provider: aiProvider, ollamaModel: aiProvider === 'ollama' ? ollamaModel : undefined }
      });
      setNarrativeOutline(result.narrativeOutline);
      toast({ title: "Narrative Outline Generated", description: "Ready to generate the full game data.", className: "bg-primary text-primary-foreground" });
      setCreationStep("generate");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during outline generation.";
      setError(errorMessage);
      setCreationStep('error');
      toast({ variant: "destructive", title: "Outline Generation Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let finalGameDataToSet: GameData | null = null;

      if (USE_MOCK_GENERATION) {
        // Simulate the structure the AI flow would return (scenes as array) before conversion
        const mockAIScenesArray = Object.values(mockGameData.scenes);
        const mockAIOutput: FormatGameDataJsonOutput = {
            title: mockGameData.title,
            startSceneId: mockGameData.startSceneId,
            scenes: mockAIScenesArray as AISceneNode[] // Cast for mock, AI would return this structure
        };
        
        const scenesRecord: Record<string, SceneNode> = {};
        mockAIOutput.scenes.forEach((aiScene: AISceneNode) => {
          scenesRecord[aiScene.id] = {
            ...aiScene, // Spread existing AISceneNode fields
            title: aiScene.title && aiScene.title.trim() !== "" ? aiScene.title.trim() : undefined,
            choices: aiScene.choices.map(choice => ({
                ...choice, // Spread existing choice fields
                effects: choice.effects && choice.effects.length > 0 ? choice.effects : undefined,
                alignmentEffect: typeof choice.alignmentEffect === 'number' ? choice.alignmentEffect : 0,
            })),
            effects: aiScene.effects && aiScene.effects.length > 0 ? aiScene.effects : undefined,
            endingType: aiScene.endingType && aiScene.endingType.trim() !== "" && aiScene.endingType.trim().toLowerCase() !== "none" ? aiScene.endingType.trim() : undefined,
            visualHint: aiScene.visualHint && aiScene.visualHint.trim() !== "" ? aiScene.visualHint.trim() : undefined,
            soundEffect: aiScene.soundEffect && aiScene.soundEffect.trim() !== "" ? aiScene.soundEffect.trim() : undefined,
          };
        });
        
        finalGameDataToSet = {
          title: mockAIOutput.title,
          startSceneId: mockAIOutput.startSceneId,
          scenes: scenesRecord,
          // Optionally include mock story context if you want to test that persistence
          storyText: storyText || "Mock story text for this adventure.",
          characterDescription: characterDescription || "Mock character for this adventure.",
          analysisResult: analysisResult || null,
          narrativeOutline: narrativeOutline || "Mock narrative outline for this adventure."
        };
        toast({ title: "Mock RPG Weaved!", description: "Your mock adventure is ready to play or save.", className: "bg-primary text-primary-foreground" });

      } else {
        if (!narrativeOutline) {
          setError("Narrative outline not found. Please go back to the character step.");
          setCreationStep('error');
          toast({ variant: "destructive", title: "Error", description: "Narrative outline not found." });
          setIsLoading(false);
          return;
        }

        const aiFormattedOutput: FormatGameDataJsonOutput = await formatGameDataJson({
            narrativeOutline,
            aiSettings: { provider: aiProvider, ollamaModel: aiProvider === 'ollama' ? ollamaModel : undefined }
        });

        if (!aiFormattedOutput || !aiFormattedOutput.scenes || !aiFormattedOutput.startSceneId || aiFormattedOutput.scenes.length === 0) {
            console.error("AI output structure error:", aiFormattedOutput);
            throw new Error("Received incomplete or invalid game data structure from AI. Check console for details.");
        }

        const scenesRecord: Record<string, SceneNode> = {};
        aiFormattedOutput.scenes.forEach((aiScene: AISceneNode) => {
          scenesRecord[aiScene.id] = {
            id: aiScene.id,
            title: aiScene.title && aiScene.title.trim() !== "" ? aiScene.title.trim() : undefined,
            text: aiScene.text,
            choices: aiScene.choices.map(choice => ({
                text: choice.text,
                nextNodeId: choice.nextNodeId,
                effects: choice.effects && choice.effects.length > 0 ? choice.effects : undefined,
                alignmentEffect: typeof choice.alignmentEffect === 'number' ? choice.alignmentEffect : 0,
            })),
            effects: aiScene.effects && aiScene.effects.length > 0 ? aiScene.effects : undefined,
            isEnding: aiScene.isEnding,
            endingType: aiScene.endingType && aiScene.endingType.trim() !== "" && aiScene.endingType.trim().toLowerCase() !== "none" ? aiScene.endingType.trim() : undefined,
            visualHint: aiScene.visualHint && aiScene.visualHint.trim() !== "" ? aiScene.visualHint.trim() : undefined,
            soundEffect: aiScene.soundEffect && aiScene.soundEffect.trim() !== "" ? aiScene.soundEffect.trim() : undefined,
          };
        });

        let finalStartSceneId = aiFormattedOutput.startSceneId;
        if (!scenesRecord[finalStartSceneId]) {
            const availableSceneIds = Object.keys(scenesRecord);
            if (availableSceneIds.length > 0) {
                console.warn(`AI-generated startSceneId '${finalStartSceneId}' not found in processed scenes. Defaulting to first available scene: ${availableSceneIds[0]}`);
                finalStartSceneId = availableSceneIds[0];
            } else {
                console.error('AI generated game data with no processable scenes.');
                throw new Error('AI generated game data with no processable scenes.');
            }
        }

        finalGameDataToSet = {
          title: aiFormattedOutput.title && aiFormattedOutput.title.trim() !== "" ? aiFormattedOutput.title.trim() : undefined,
          startSceneId: finalStartSceneId,
          scenes: scenesRecord,
          // Persist current creation context with the game data
          storyText: storyText || undefined,
          characterDescription: characterDescription || undefined,
          analysisResult: analysisResult || undefined,
          narrativeOutline: narrativeOutline || undefined,
        };
        toast({ title: "RPG Weaved!", description: "Your adventure is ready to play or save.", className: "bg-primary text-primary-foreground" });
      }

      setGameData(finalGameDataToSet);

    } catch (err) {
      console.error("Error formatting/generating game data:", err);
      let errorMessage = "An unknown error occurred during game generation.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes("Schema validation failed") || err.message.includes("AI output was not valid JSON")) {
            errorMessage = `AI data structure error: ${err.message}. Please check console for details. You might want to try modifying your inputs or story.`;
        }
      }
      setError(errorMessage);
      setCreationStep('error');
      toast({ variant: "destructive", title: "Game Generation Failed", description: errorMessage, duration: 7000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAdventureClick = useCallback(() => {
    if (!gameData) {
      toast({ variant: "destructive", title: "Cannot Save", description: "No game data available to save." });
      return;
    }
    console.log("handleSaveAdventureClick called. setTimeout pending.");
    setTimeout(() => {
        console.log("setTimeout callback executed.");
        const defaultName = gameData.adventureName || gameData.title || "My Awesome Adventure";
        let adventureName: string | null = null;
        try {
            console.log("About to call window.prompt with default:", defaultName);
            adventureName = window.prompt("Enter a name for your adventure:", defaultName);
            console.log("window.prompt returned:", adventureName);
        } catch (promptError) {
            console.error("Error during window.prompt for adventure name:", promptError);
            toast({ variant: "destructive", title: "Dialog Error", description: "Could not display the save name dialog." });
            return;
        }

        if (adventureName === null) {
            console.log("Prompt cancelled by user.");
            toast({ title: "Save Cancelled", description: "Adventure was not saved." });
        } else if (adventureName.trim() === "") {
            console.log("Prompt returned empty string: User entered no name.");
            toast({ variant: "destructive", title: "Save Error", description: "Adventure name cannot be empty. Please provide a valid name." });
        } else {
            console.log("Attempting to save with name:", adventureName.trim());
            if (saveAdventureToLibrary(adventureName.trim())) {
                toast({ title: "Adventure Saved!", description: `"${adventureName.trim()}" has been saved to your library.`, className: "bg-primary text-primary-foreground" });
            } else {
                // This case might not be hit if saveAdventureToLibrary always returns true or errors out
                toast({ variant: "destructive", title: "Save Failed", description: "Could not save the adventure." });
            }
        }
    }, 0);
  }, [gameData, saveAdventureToLibrary, toast]);

  const handlePlayNowClick = () => {
    if (!gameData) {
      toast({ variant: "destructive", title: "Cannot Play", description: "No game data available to play."});
      setError("No game data to play. Please generate an adventure first.");
      setCreationStep('error');
      return;
    }
    resetCreationProgress();
    router.push("/play");
  };

  const handleExportGameData = useCallback(() => {
    if (!gameData) {
      toast({ variant: "destructive", title: "Cannot Export", description: "No game data available to export." });
      return;
    }
    try {
      const fileNameBase = gameData.adventureName || gameData.title || "story-weaver-adventure";
      const safeFileNameBase = fileNameBase.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
      const fileName = `${safeFileNameBase}_gamedata.json`;

      const jsonString = JSON.stringify(gameData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      toast({ title: "Game Data Exported", description: `Saved as ${fileName}`, className: "bg-primary text-primary-foreground" });
    } catch (exportError) {
      console.error("Error exporting game data:", exportError);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export game data." });
    }
  }, [gameData, toast]);

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: "destructive", title: "Import Failed", description: "No file selected." });
      return;
    }

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsedJson = JSON.parse(content);
        
        const validationResult = ImportGameDataSchema.safeParse(parsedJson);

        if (validationResult.success) {
          const validatedGameData = validationResult.data;
          // Cast to GameData type from context, as Zod's inferred type might be slightly different
          // if we didn't perfectly align all optional/null properties.
          // However, if ImportGameDataSchema is built to match GameData, this cast is mostly for TypeScript.
          setGameData(validatedGameData as unknown as GameData); 
          
          // Optionally, update other context fields if they exist in the imported data
          if (validatedGameData.storyText) setStoryText(validatedGameData.storyText);
          else setStoryText("Imported Adventure: " + (validatedGameData.title || "Untitled Adventure"));
          
          if (validatedGameData.characterDescription) setCharacterDescription(validatedGameData.characterDescription);
          else setCharacterDescription("Character for imported adventure.");
          
          if (validatedGameData.narrativeOutline) setNarrativeOutline(validatedGameData.narrativeOutline);
          else setNarrativeOutline("Narrative from imported adventure.");
          
          if (validatedGameData.analysisResult) setAnalysisResult(validatedGameData.analysisResult as AnalyzeSourceMaterialOutput);
          else setAnalysisResult(null);
          
          setCreationStep('generate');
          toast({ title: "Adventure Imported!", description: "The game data has been loaded.", className: "bg-primary text-primary-foreground" });

        } else {
          console.error("Imported JSON validation failed:", validationResult.error.flatten());
          const errorMessages = validationResult.error.errors.map(err => `Field '${err.path.join('.') || 'root'}': ${err.message}`).join('; ');
          throw new Error(`Invalid game data file structure. Details: ${errorMessages}`);
        }
      } catch (importError) {
        console.error("Error importing game data:", importError);
        const errorMsg = importError instanceof Error ? importError.message : "Failed to parse or validate the adventure file.";
        setError(errorMsg);
        setCreationStep('error'); 
        toast({ variant: "destructive", title: "Import Failed", description: errorMsg, duration: 7000 });
      } finally {
        setIsLoading(false);
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    reader.onerror = () => {
      setError("Failed to read the adventure file.");
      setCreationStep('error');
      toast({ variant: "destructive", title: "Import Failed", description: "Could not read the selected file." });
      setIsLoading(false);
       if (event.target) {
          event.target.value = '';
        }
    };

    reader.readAsText(file);
  };


  const handleTryAgainOnError = () => {
    setError(null);
    // Attempt to go back to the most relevant previous step based on available data
    if (gameData && narrativeOutline) { // If gameData was being generated but failed, retry generation
        setCreationStep('generate');
    } else if (narrativeOutline) { // If outline exists, error was likely in final game generation
        setCreationStep('generate');
    } else if (analysisResult) { // If analysis exists, error was likely in character/outline step
        setCreationStep('character');
    } else { // Default to story input if very early error
        setCreationStep('story');
    }
  };

  const handleLoadCharacterFromLibrary = () => {
    if (!selectedLibraryCharId) {
      toast({ variant: "destructive", title: "No Character Selected", description: "Please select a character from the library to load." });
      return;
    }
    const charProfile = getCharacterProfileById(selectedLibraryCharId);
    if (charProfile) {
      setCharNameLocal(charProfile.name);
      setCharArchetypeLocal(charProfile.archetype);
      setCharBackgroundLocal(charProfile.background);
      setCharGoalsLocal(charProfile.goals);
      setLoadedCharId(charProfile.id);
      const fullDesc = `Name: ${charProfile.name}\nArchetype: ${charProfile.archetype}\nBackground: ${charProfile.background}\nGoals: ${charProfile.goals}`;
      setCharacterDescription(fullDesc); 
      toast({ title: "Character Loaded", description: `"${charProfile.name}" has been loaded into the form.`, className: "bg-primary text-primary-foreground" });
    } else {
      toast({ variant: "destructive", title: "Load Failed", description: "Could not find the selected character." });
    }
  };

  const handleSaveCurrentCharacterToLibrary = () => {
    if (!charName.trim() || !charArchetype.trim() || !charBackground.trim() || !charGoals.trim()) {
      toast({ variant: "destructive", title: "Cannot Save Character", description: "Please fill in all character details (Name, Archetype, Background, Goals)." });
      return;
    }
    const characterDataToSave: Omit<CharacterProfile, 'id'> & { id?: string } = {
      id: loadedCharId || undefined, 
      name: charName.trim(),
      archetype: charArchetype.trim(),
      background: charBackground.trim(),
      goals: charGoals.trim(),
    };
    const savedProfile = saveCharacterProfile(characterDataToSave);
    setLoadedCharId(savedProfile.id); 
    toast({ title: "Character Saved!", description: `"${savedProfile.name}" has been saved to your library.`, className: "bg-primary text-primary-foreground" });
  };

  let saveCharButtonText = "Save Current Character to Library";
  let isCurrentCharSaved = false;
  if (loadedCharId) {
    const loadedProfile = getCharacterProfileById(loadedCharId);
    if (loadedProfile &&
        loadedProfile.name === charName.trim() &&
        loadedProfile.archetype === charArchetype.trim() &&
        loadedProfile.background === charBackground.trim() &&
        loadedProfile.goals === charGoals.trim()) {
      saveCharButtonText = "Character is Saved/Up-to-date";
      isCurrentCharSaved = true;
    } else if (loadedProfile) { // Loaded and modified
      saveCharButtonText = "Update Character in Library";
    } else { // loadedCharId is set but profile not found (should not happen)
       saveCharButtonText = "Save Current Character to Library"; // Default back
    }
  } else if (charName.trim() || charArchetype.trim() || charBackground.trim() || charGoals.trim()) { // New character being typed
     // Check if the *current form content* matches an existing character in the library
     const existingCharInLib = savedCharacters.find(c =>
        c.name === charName.trim() &&
        c.archetype === charArchetype.trim() &&
        c.background === charBackground.trim() &&
        c.goals === charGoals.trim()
      );
      if (existingCharInLib) {
        saveCharButtonText = "Character is Saved/Up-to-date"; // Implies it matches one in lib
        isCurrentCharSaved = true;
        // setLoadedCharId(existingCharInLib.id); // Optionally set this to make save an "update"
      } else {
        saveCharButtonText = "Save Current Character to Library";
      }
  }


  const isCurrentAdventureSaved = gameData && gameData.id && isAdventureInLibrary(gameData.id);

  if (!isSettingsLoaded) {
    return (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Loading settings...</p>
        </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-center text-primary">Create Your RPG Adventure</h2>
      <Progress value={progressValue} className="w-full" />

      {USE_MOCK_GENERATION && (
         <Alert variant="default" className="bg-blue-100 border-blue-300 text-blue-700">
          <Play className="h-4 w-4 !text-blue-700" />
          <AlertTitle>Development Mode</AlertTitle>
          <AlertDescription>Using mocked data for faster development. AI calls are currently bypassed.</AlertDescription>
        </Alert>
      )}

      {error && creationStep === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Encountered</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleTryAgainOnError} variant="outline" className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button onClick={() => { setGameData(null); resetCreationProgress(); setCreationStep('story');}} variant="destructive" className="w-full sm:w-auto">
                Start Over
            </Button>
          </div>
        </Alert>
      )}

      <input
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileImport}
      />
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><FileUp /> Or Import an Existing Adventure</CardTitle>
            <CardDescription>Have an adventure file? Upload it here to continue your journey or explore a shared story.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleImportButtonClick} variant="outline" className="w-full" disabled={isLoading}>
                <FileUp className="mr-2 h-4 w-4" /> Import Adventure File (.json)
            </Button>
        </CardContent>
      </Card>


      {creationStep === "story" && !error &&(
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><BookText /> Step 1: Provide Your Story</CardTitle>
            <CardDescription>Paste the text of a book, short story, or any narrative you enjoy. This will be the world your character explores.</CardDescription>
          </CardHeader>
          <form onSubmit={handleStorySubmit}>
            <CardContent>
              <Textarea
                placeholder="Paste your story text here (min. 50 characters)..."
                value={storyText || ""}
                onChange={(e) => { setStoryText(e.target.value); }}
                rows={15}
                className="text-base leading-relaxed"
                disabled={isLoading}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !storyText || storyText.trim().length < 50} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {USE_MOCK_GENERATION ? "Use Mock Story & Analyze" : "Analyze Story"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {creationStep === "character" && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><UserPlus /> Step 2: Define Your Character</CardTitle>
            <CardDescription>Create your protagonist. Their background, goals, and your preferences below will shape their journey.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCharacterSubmit}>
            <CardContent className="space-y-6">
              <Card className="pt-4 bg-muted/20 border-dashed">
                <CardHeader className="pt-0 pb-2">
                  <CardTitle className="text-xl flex items-center gap-2"><LibraryBig className="text-primary"/> Character Library</CardTitle>
                  <CardDescription>Load a saved character or save your current creation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedCharacters.length > 0 ? (
                    <div className="flex items-end gap-2">
                      <div className="flex-grow">
                        <Label htmlFor="libraryCharSelect">Load Saved Character</Label>
                        <Select value={selectedLibraryCharId} onValueChange={setSelectedLibraryCharId}>
                          <SelectTrigger id="libraryCharSelect">
                            <SelectValue placeholder="Select a character..." />
                          </SelectTrigger>
                          <SelectContent>
                            {savedCharacters.map(char => (
                              <SelectItem key={char.id} value={char.id}>
                                {char.name} ({char.archetype})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="outline" onClick={handleLoadCharacterFromLibrary} disabled={!selectedLibraryCharId || isLoading}>
                        <UserCheck className="mr-2 h-4 w-4" /> Load
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Your character library is empty. Save a character using the button below!</p>
                  )}
                   <Button
                    type="button"
                    variant={isCurrentCharSaved ? "secondary" : "outline"}
                    onClick={handleSaveCurrentCharacterToLibrary}
                    disabled={isLoading || !(charName.trim() || charArchetype.trim() || charBackground.trim() || charGoals.trim()) || isCurrentCharSaved}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveCharButtonText}
                  </Button>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="charName">Character Name</Label>
                <Input id="charName" value={charName} onChange={(e) => {setCharNameLocal(e.target.value); setLoadedCharId(null);}} placeholder="e.g., Elara Meadowlight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charArchetype">Archetype/Class</Label>
                <Input id="charArchetype" value={charArchetype} onChange={(e) => {setCharArchetypeLocal(e.target.value); setLoadedCharId(null);}} placeholder="e.g., Wandering Scholar, Cursed Knight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charBackground">Background Story</Label>
                <Textarea id="charBackground" value={charBackground} onChange={(e) => {setCharBackgroundLocal(e.target.value); setLoadedCharId(null);}} placeholder="A brief history of your character..." rows={3} disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charGoals">Personal Goals</Label>
                <Textarea id="charGoals" value={charGoals} onChange={(e) => {setCharGoalsLocal(e.target.value); setLoadedCharId(null);}} placeholder="What does your character hope to achieve?" rows={3} disabled={isLoading} />
              </div>

              <Card className="pt-4 bg-muted/30 border-dashed">
                <CardHeader className="pt-0 pb-2">
                  <CardTitle className="text-xl flex items-center gap-2"><Sparkles className="text-primary"/> Advanced Generation (Optional)</CardTitle>
                  <CardDescription>Fine-tune the AI's narrative generation. (Future: May be tied to account plan)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="desiredTone" className="flex items-center gap-1"><Palette size={16}/> Desired Tone</Label>
                    <Select value={desiredTone} onValueChange={(value: DesiredTone) => setDesiredTone(value)} disabled={isLoading}>
                      <SelectTrigger id="desiredTone">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map(tone => (
                          <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="desiredLength" className="flex items-center gap-1"><Scale size={16}/> Desired Length</Label>
                    <Select value={desiredLength} onValueChange={(value: DesiredLength) => setDesiredLength(value)} disabled={isLoading}>
                      <SelectTrigger id="desiredLength">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map(len => (
                          <SelectItem key={len} value={len}>{len}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="keyThemes">Key Themes to Emphasize</Label>
                    <Textarea
                      id="keyThemes"
                      value={keyThemes || ""}
                      onChange={(e) => setKeyThemes(e.target.value)}
                      placeholder="e.g., Redemption, The struggle between good and evil, The importance of friendship"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <Button variant="outline" onClick={() => setCreationStep("story")} disabled={isLoading}>Back to Story</Button>
              <Button type="submit" disabled={isLoading || !charName.trim() || !charArchetype.trim() || !charBackground.trim() || !charGoals.trim() } className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {USE_MOCK_GENERATION ? "Craft Character & Get Mock Outline" : "Craft Character & Get Outline"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {creationStep === "generate" && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {!gameData ? <Wand2 /> : <CheckCircle className="text-green-500" />}
              Step 3: {!gameData ? "Weave Your RPG" : "Adventure Ready!"}
            </CardTitle>
            {!gameData && narrativeOutline && (
              <CardDescription>
                {USE_MOCK_GENERATION
                  ? "The mock narrative outline is ready. Click below to generate the mock RPG data."
                  : "Your story and character are ready. The AI has generated a narrative outline. Click below to generate the full RPG data."
                }
              </CardDescription>
            )}
            {gameData && (
              <CardDescription>
                Your adventure "{gameData.adventureName || gameData.title || "Untitled Adventure"}" is woven! You can save it to your library, export it, import another, or play it now.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!gameData && narrativeOutline && (
              <>
                <h4 className="font-semibold mb-2">
                  {USE_MOCK_GENERATION ? "Mock Narrative Outline Snippet:" : "Generated Narrative Outline Snippet:"}
                </h4>
                <Textarea value={narrativeOutline.substring(0, 300) + (narrativeOutline.length > 300 ? "..." : "")} readOnly rows={5} className="bg-muted/50" />
              </>
            )}
             {gameData && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
                <CheckCircle className="h-4 w-4 !text-green-700" />
                <AlertTitle>Ready to Go!</AlertTitle>
                <AlertDescription>
                  Your adventure data has been successfully generated or loaded.
                  {gameData.title && <p className="mt-1"><strong>Title:</strong> {gameData.title}</p>}
                   {gameData.scenes && gameData.startSceneId && gameData.scenes[gameData.startSceneId] &&
                    <p className="mt-1"><strong>Start Scene:</strong> {gameData.scenes[gameData.startSceneId]?.title || gameData.startSceneId}</p>
                   }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => setCreationStep("character")} disabled={isLoading || !!gameData} className="w-full">
              Back to Character {!gameData && "(Modifies Outline)"}
            </Button>
            {!gameData && (
              <Button onClick={handleGenerateGame} disabled={isLoading || !narrativeOutline} className="w-full sm:col-span-2 lg:col-span-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {USE_MOCK_GENERATION ? "Weave Mock RPG!" : "Weave Your RPG!"}
              </Button>
            )}
            {gameData && (
              <>
                <Button
                  onClick={handleSaveAdventureClick}
                  variant={isCurrentAdventureSaved ? "secondary" : "default"}
                  className="w-full"
                  disabled={isLoading || isCurrentAdventureSaved}
                >
                  {isCurrentAdventureSaved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isCurrentAdventureSaved ? "Saved to Library" : "Save to Library"}
                </Button>
                 <Button onClick={handleExportGameData} variant="outline" className="w-full" disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" /> Export Game Data
                </Button>
                <Button onClick={handlePlayNowClick} className="w-full bg-primary hover:bg-primary/90 sm:col-span-2 lg:col-span-1 lg:col-start-3" disabled={isLoading}>
                  <Play className="mr-2 h-4 w-4" /> Play Now
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    