
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BookText, UserPlus, Wand2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { analyzeSourceMaterial } from "@/ai/flows/analyze-source-material";
import { generateNarrativeOutline } from "@/ai/flows/generate-narrative-outline";
import { formatGameDataJson } from "@/ai/flows/format-game-data-json";

type CreateStep = "story" | "character" | "generate" | "review";

export default function CreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    storyText, setStoryText,
    characterDescription, setCharacterDescription, // We'll build this from form fields
    analysisResult, setAnalysisResult,
    narrativeOutline, setNarrativeOutline,
    setGameData,
    isLoading, setIsLoading,
    error, setError,
  } = useGame();

  const [currentLocalStep, setCurrentLocalStep] = useState<CreateStep>("story");
  const [charName, setCharName] = useState("");
  const [charArchetype, setCharArchetype] = useState("");
  const [charBackground, setCharBackground] = useState("");
  const [charGoals, setCharGoals] = useState("");

  const progressValue = {
    story: 0,
    character: 33,
    generate: 66,
    review: 100,
  }[currentLocalStep];

  useEffect(() => {
    // Reset error on step change
    setError(null);
  }, [currentLocalStep, setError]);

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText || storyText.trim().length < 50) {
      setError("Please provide a story text of at least 50 characters.");
      toast({ variant: "destructive", title: "Error", description: "Story text is too short." });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSourceMaterial({ storyText });
      setAnalysisResult(result);
      toast({ title: "Story Analysis Complete", description: "Proceed to character creation.", className: "bg-green-500 text-white" });
      setCurrentLocalStep("character");
    } catch (err) {
      console.error("Error analyzing source material:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during story analysis.";
      setError(errorMessage);
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
      return;
    }
    const fullCharacterDescription = `Name: ${charName}\nArchetype: ${charArchetype}\nBackground: ${charBackground}\nGoals: ${charGoals}`;
    setCharacterDescription(fullCharacterDescription); // Store combined description in context

    setIsLoading(true);
    setError(null);
    try {
      if (!storyText) { // Should not happen if flow is correct
        throw new Error("Story text not found.");
      }
      const result = await generateNarrativeOutline({ storyText, characterDescription: fullCharacterDescription });
      setNarrativeOutline(result.narrativeOutline);
      toast({ title: "Narrative Outline Generated", description: "Ready to generate the full game data.", className: "bg-green-500 text-white" });
      setCurrentLocalStep("generate");
    } catch (err) {
      console.error("Error generating narrative outline:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during outline generation.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Outline Generation Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!narrativeOutline) { // Should not happen
        throw new Error("Narrative outline not found.");
      }
      const result = await formatGameDataJson({ narrativeOutline });
      const parsedGameData = JSON.parse(result.gameDataJson);
      setGameData(parsedGameData);
      toast({ title: "RPG Weaved!", description: "Your adventure is ready. Redirecting to game...", className: "bg-green-500 text-white" });
      router.push("/play");
    } catch (err) {
      console.error("Error formatting game data or parsing JSON:", err);
      let errorMessage = "An unknown error occurred during game generation.";
      if (err instanceof SyntaxError) {
        errorMessage = "Failed to parse the game data from AI. The format might be incorrect.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({ variant: "destructive", title: "Game Generation Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-center text-primary">Create Your RPG Adventure</h2>
      <Progress value={progressValue} className="w-full" />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentLocalStep === "story" && (
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
                Analyze Story
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {currentLocalStep === "character" && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><UserPlus /> Step 2: Define Your Character</CardTitle>
            <CardDescription>Create your protagonist. Their background and goals will shape their journey within the story.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCharacterSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="charName">Character Name</Label>
                <Input id="charName" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="e.g., Elara Meadowlight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charArchetype">Archetype/Class</Label>
                <Input id="charArchetype" value={charArchetype} onChange={(e) => setCharArchetype(e.target.value)} placeholder="e.g., Wandering Scholar, Cursed Knight" disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charBackground">Background Story</Label>
                <Textarea id="charBackground" value={charBackground} onChange={(e) => setCharBackground(e.target.value)} placeholder="A brief history of your character..." rows={3} disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="charGoals">Personal Goals</Label>
                <Textarea id="charGoals" value={charGoals} onChange={(e) => setCharGoals(e.target.value)} placeholder="What does your character hope to achieve?" rows={3} disabled={isLoading} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentLocalStep("story")} disabled={isLoading}>Back to Story</Button>
              <Button type="submit" disabled={isLoading || !charName || !charArchetype || !charBackground || !charGoals } className="w-1/2">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Craft Character & Get Outline
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {currentLocalStep === "generate" && narrativeOutline && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><CheckCircle className="text-green-500" /> Step 3: Weave Your RPG</CardTitle>
            <CardDescription>Your story and character are ready. The AI has generated a narrative outline. Click below to generate the full RPG data.</CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">Generated Narrative Outline Snippet:</h4>
            <Textarea value={narrativeOutline.substring(0, 300) + (narrativeOutline.length > 300 ? "..." : "")} readOnly rows={5} className="bg-muted/50" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentLocalStep("character")} disabled={isLoading}>Back to Character</Button>
            <Button onClick={handleGenerateGame} disabled={isLoading} className="w-1/2">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Weave Your RPG!
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
