
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame, type GameData } from "@/context/GameContext"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BookText, UserPlus, Wand2, AlertCircle, CheckCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { analyzeSourceMaterial } from "@/ai/flows/analyze-source-material";
import { generateNarrativeOutline } from "@/ai/flows/generate-narrative-outline";
import { formatGameDataJson, type FormatGameDataJsonOutput } from "@/ai/flows/format-game-data-json";
import { mockGameData } from "@/lib/mock-game-data"; 

// --- DEVELOPMENT FLAG ---
const USE_MOCK_GENERATION = true; 
// ------------------------

export default function CreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    storyText, setStoryText,
    characterDescription, setCharacterDescription, 
    analysisResult, setAnalysisResult, 
    narrativeOutline, setNarrativeOutline,
    setGameData,
    isLoading, setIsLoading,
    error, setError,
    creationStep, setCreationStep,
    resetCreationProgress
  } = useGame();

  // Local state for character form inputs, as these aren't directly in context until submitted
  const [charName, setCharNameLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Name: (.*)/);
    return match ? match[1] : "";
  });
  const [charArchetype, setCharArchetypeLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Archetype: (.*)/);
    return match ? match[1] : "";
  });
  const [charBackground, setCharBackgroundLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Background: (.*)/);
    return match ? match[1] : "";
  });
  const [charGoals, setCharGoalsLocal] = useState(() => {
    const cd = characterDescription;
    if (!cd) return "";
    const match = cd.match(/Goals: (.*)/);
    return match ? match[1] : "";
  });

  // Effect to re-populate local char fields if characterDescription changes in context
  // (e.g. loaded from localStorage after initial render but before local state init finishes)
  useEffect(() => {
    if (characterDescription) {
      const nameMatch = characterDescription.match(/Name: (.*)/);
      if (nameMatch) setCharNameLocal(nameMatch[1]);
      const archetypeMatch = characterDescription.match(/Archetype: (.*)/);
      if (archetypeMatch) setCharArchetypeLocal(archetypeMatch[1]);
      const backgroundMatch = characterDescription.match(/Background: (.*)/);
      if (backgroundMatch) setCharBackgroundLocal(backgroundMatch[1]);
      const goalsMatch = characterDescription.match(/Goals: (.*)/);
      if (goalsMatch) setCharGoalsLocal(goalsMatch[1]);
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
        toast({ title: "Mock Story Analysis Complete", description: "Proceed to character creation (using mock data).", className: "bg-blue-500 text-white" });
        setCreationStep("character");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSourceMaterial({ storyText });
      setAnalysisResult(result);
      toast({ title: "Story Analysis Complete", description: "Proceed to character creation.", className: "bg-green-500 text-white" });
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
        toast({ title: "Mock Narrative Outline Generated", description: "Ready to generate the mock game data.", className: "bg-blue-500 text-white" });
        setCreationStep("generate");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!storyText) {
        throw new Error("Story text not found. Please go back to the story step.");
      }
      const result = await generateNarrativeOutline({ storyText, characterDescription: fullCharacterDescription });
      setNarrativeOutline(result.narrativeOutline);
      toast({ title: "Narrative Outline Generated", description: "Ready to generate the full game data.", className: "bg-green-500 text-white" });
      setCreationStep("generate");
    } catch (err) {
      console.error("Error generating narrative outline:", err);
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
        toast({ title: "Mock RPG Weaved!", description: "Your mock adventure is ready. Redirecting to game...", className: "bg-blue-500 text-white" });
        resetCreationProgress(); // Clear creation inputs
        router.push("/play");
        return;
      }

      if (!narrativeOutline) { 
        throw new Error("Narrative outline not found. Please go back to the character step.");
      }
      const gameDataResult: FormatGameDataJsonOutput = await formatGameDataJson({ narrativeOutline });
      
      if (!gameDataResult || !gameDataResult.scenes || !gameDataResult.startSceneId || Object.keys(gameDataResult.scenes).length === 0) {
        throw new Error("Received incomplete or invalid game data from AI.");
      }
      
      setGameData(gameDataResult as GameData);
      toast({ title: "RPG Weaved!", description: "Your adventure is ready. Redirecting to game...", className: "bg-green-500 text-white" });
      resetCreationProgress(); // Clear creation inputs
      router.push("/play");
    } catch (err) {
      console.error("Error formatting/generating game data:", err);
      let errorMessage = "An unknown error occurred during game generation.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setCreationStep('error');
      toast({ variant: "destructive", title: "Game Generation Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-center text-primary">Create Your RPG Adventure</h2>
      <Progress value={progressValue} className="w-full" />

      {USE_MOCK_GENERATION && (
         <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-700">
          <Play className="h-4 w-4 !text-blue-700" />
          <AlertTitle>Development Mode</AlertTitle>
          <AlertDescription>Using mocked data for faster development. AI calls are currently bypassed.</AlertDescription>
        </Alert>
      )}

      {error && creationStep === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {creationStep === "story" && (
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

      {creationStep === "character" && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><UserPlus /> Step 2: Define Your Character</CardTitle>
            <CardDescription>Create your protagonist. Their background and goals will shape their journey within the story.</CardDescription>
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
      
      {creationStep === "generate" && narrativeOutline && (
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
