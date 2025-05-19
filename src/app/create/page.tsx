
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame, type GameData, type SceneNode, type DesiredTone, type DesiredLength } from "@/context/GameContext"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookText, UserPlus, Wand2, AlertCircle, CheckCircle, Play, Palette, Scale, Sparkles, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { analyzeSourceMaterial } from "@/ai/flows/analyze-source-material";
import { generateNarrativeOutline } from "@/ai/flows/generate-narrative-outline";
import { formatGameDataJson, type FormatGameDataJsonOutput, type AISceneNode } from "@/ai/flows/format-game-data-json";
import { mockGameData } from "@/lib/mock-game-data"; 

// --- DEVELOPMENT FLAG ---
const USE_MOCK_GENERATION = true; 
// ------------------------

const toneOptions: DesiredTone[] = ["Default", "Heroic", "Mysterious", "Comedic", "Tragic", "Dramatic"];
const lengthOptions: DesiredLength[] = ["Default", "Short", "Medium", "Long"];

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
    setGameData,
    isLoading, setIsLoading,
    error, setError,
    creationStep, setCreationStep,
    resetCreationProgress
  } = useGame();

  // Local state for character form inputs (name, archetype, background, goals)
  const [charName, setCharNameLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Name: (.*?)(?:\nArchetype:|\nBackground:|\nGoals:|$)/s);
    return match ? match[1].trim() : "";
  });
  const [charArchetype, setCharArchetypeLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Archetype: (.*?)(?:\nBackground:|\nGoals:|$)/s);
    return match ? match[1].trim() : "";
  });
  const [charBackground, setCharBackgroundLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Background: (.*?)(?:\nGoals:|$)/s);
    return match ? match[1].trim() : "";
  });
  const [charGoals, setCharGoalsLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Goals: (.*)/s);
    return match ? match[1].trim() : "";
  });

  // Effect to re-populate local char fields if characterDescription changes in context
  useEffect(() => {
    if (characterDescription) {
      const nameMatch = characterDescription.match(/Name: (.*?)(?:\nArchetype:|\nBackground:|\nGoals:|$)/s);
      if (nameMatch) setCharNameLocal(nameMatch[1].trim());
      const archetypeMatch = characterDescription.match(/Archetype: (.*?)(?:\nBackground:|\nGoals:|$)/s);
      if (archetypeMatch) setCharArchetypeLocal(archetypeMatch[1].trim());
      const backgroundMatch = characterDescription.match(/Background: (.*?)(?:\nGoals:|$)/s);
      if (backgroundMatch) setCharBackgroundLocal(backgroundMatch[1].trim());
      const goalsMatch = characterDescription.match(/Goals: (.*)/s);
      if (goalsMatch) setCharGoalsLocal(goalsMatch[1].trim());
    }
  }, [characterDescription]);


  const progressValue = {
    story: 0,
    character: 33,
    generate: 66,
    error: creationStep === 'story' ? 0 : creationStep === 'character' ? 33 : 66,
  }[creationStep];

  useEffect(() => {
    setError(null); // Clear error when step changes
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
      const result = await analyzeSourceMaterial({ storyText });
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
    const fullCharacterDescription = `Name: ${charName}\nArchetype: ${charArchetype}\nBackground: ${charBackground}\nGoals: ${charGoals}`;
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
        throw new Error("Story text not found. Please go back to the story step.");
      }
      const result = await generateNarrativeOutline({ 
        storyText, 
        characterDescription: fullCharacterDescription,
        desiredTone: desiredTone === "Default" ? undefined : desiredTone,
        desiredLength: desiredLength === "Default" ? undefined : desiredLength,
        keyThemes: keyThemes || undefined,
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
      if (USE_MOCK_GENERATION) {
        setGameData(mockGameData as GameData); 
        toast({ title: "Mock RPG Weaved!", description: "Your mock adventure is ready. Redirecting to game...", className: "bg-primary text-primary-foreground" });
        resetCreationProgress(); 
        router.push("/play");
        return;
      }

      if (!narrativeOutline) { 
        throw new Error("Narrative outline not found. Please go back to the character step.");
      }
      
      const aiFormattedGameData: FormatGameDataJsonOutput = await formatGameDataJson({ narrativeOutline });
      
      if (!aiFormattedGameData || !aiFormattedGameData.scenes || !aiFormattedGameData.startSceneId || aiFormattedGameData.scenes.length === 0) {
        throw new Error("Received incomplete or invalid game data structure from AI.");
      }
      
      const scenesRecord: Record<string, SceneNode> = {};
      aiFormattedGameData.scenes.forEach((aiScene: AISceneNode) => {
        scenesRecord[aiScene.id] = {
          id: aiScene.id,
          title: aiScene.title && aiScene.title.trim() !== "" ? aiScene.title.trim() : undefined,
          text: aiScene.text,
          choices: aiScene.choices, 
          isEnding: aiScene.isEnding,
          endingType: aiScene.endingType && aiScene.endingType.trim() !== "" && aiScene.endingType.trim().toLowerCase() !== "none" ? aiScene.endingType.trim() : undefined,
          visualHint: aiScene.visualHint && aiScene.visualHint.trim() !== "" ? aiScene.visualHint.trim() : undefined,
          soundEffect: aiScene.soundEffect && aiScene.soundEffect.trim() !== "" ? aiScene.soundEffect.trim() : undefined,
        };
      });
      
      let finalStartSceneId = aiFormattedGameData.startSceneId;
      if (!scenesRecord[finalStartSceneId]) {
        const availableSceneIds = Object.keys(scenesRecord);
        if (availableSceneIds.length > 0) {
          console.warn(`AI-generated startSceneId '${finalStartSceneId}' not found in processed scenes. Defaulting to first available scene: ${availableSceneIds[0]}`);
          finalStartSceneId = availableSceneIds[0];
        } else {
          throw new Error('AI generated game data with no processable scenes.');
        }
      }

      const finalGameData: GameData = {
        title: aiFormattedGameData.title && aiFormattedGameData.title.trim() !== "" ? aiFormattedGameData.title.trim() : undefined,
        startSceneId: finalStartSceneId,
        scenes: scenesRecord,
      };
      
      setGameData(finalGameData);
      toast({ title: "RPG Weaved!", description: "Your adventure is ready. Redirecting to game...", className: "bg-primary text-primary-foreground" });
      resetCreationProgress(); 
      router.push("/play");

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
      setCreationStep('error'); // Keep user on current step or 'generate' if error occurs here
      toast({ variant: "destructive", title: "Game Generation Failed", description: errorMessage, duration: 7000 });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTryAgainOnError = () => {
    setError(null);
    // Attempt to go back to the previous logical step based on where the error might have occurred.
    // This is a simple heuristic. A more robust solution might store the last successful step.
    if (narrativeOutline) { // If outline exists, error likely in final generation
        setCreationStep('generate');
    } else if (analysisResult) { // If analysis exists, error likely in outline generation
        setCreationStep('character');
    } else { // Otherwise, error likely in story analysis
        setCreationStep('story');
    }
  };

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
            <Button onClick={handleTryAgainOnError} variant="outline" className="w-full">
                <RefreshCcw className="mr-2 h-4 w-4" /> Try Again from Previous Step
            </Button>
            <Button onClick={() => { resetCreationProgress(); setCreationStep('story');}} variant="destructive" className="w-full">
                Start Over
            </Button>
          </div>
        </Alert>
      )}

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
                onChange={(e) => setStoryText(e.target.value)}
                rows={15}
                className="text-base leading-relaxed"
                disabled={isLoading}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !storyText || storyText.trim().length < 50} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="charName">Character Name</Label>
                <Input id="charName" value={charName} onChange={(e) => setCharNameLocal(e.target.value)} placeholder="e.g., Elara Meadowlight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charArchetype">Archetype/Class</Label>
                <Input id="charArchetype" value={charArchetype} onChange={(e) => setCharArchetypeLocal(e.target.value)} placeholder="e.g., Wandering Scholar, Cursed Knight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charBackground">Background Story</Label>
                <Textarea id="charBackground" value={charBackground} onChange={(e) => setCharBackgroundLocal(e.target.value)} placeholder="A brief history of your character..." rows={3} disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charGoals">Personal Goals</Label>
                <Textarea id="charGoals" value={charGoals} onChange={(e) => setCharGoalsLocal(e.target.value)} placeholder="What does your character hope to achieve?" rows={3} disabled={isLoading} />
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
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCreationStep("story")} disabled={isLoading}>Back to Story</Button>
              <Button type="submit" disabled={isLoading || !charName || !charArchetype || !charBackground || !charGoals } className="w-1/2">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {USE_MOCK_GENERATION ? "Craft Character & Get Mock Outline" : "Craft Character & Get Outline"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {creationStep === "generate" && narrativeOutline && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><CheckCircle className="text-green-500" /> Step 3: Weave Your RPG</CardTitle>
            <CardDescription>
              {USE_MOCK_GENERATION 
                ? "The mock narrative outline is ready. Click below to generate the mock RPG data." 
                : "Your story and character are ready. The AI has generated a narrative outline. Click below to generate the full RPG data."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">
              {USE_MOCK_GENERATION ? "Mock Narrative Outline Snippet:" : "Generated Narrative Outline Snippet:"}
            </h4>
            <Textarea value={narrativeOutline.substring(0, 300) + (narrativeOutline.length > 300 ? "..." : "")} readOnly rows={5} className="bg-muted/50" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCreationStep("character")} disabled={isLoading}>Back to Character</Button>
            <Button onClick={handleGenerateGame} disabled={isLoading} className="w-1/2">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {USE_MOCK_GENERATION ? "Weave Mock RPG!" : "Weave Your RPG!"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

