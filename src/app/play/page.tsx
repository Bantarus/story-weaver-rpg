
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, SceneNode, SceneChoice } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

export default function PlayPage() {
  const router = useRouter();
  const { gameData, isLoading: contextIsLoading, error: contextError } = useGame();
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<SceneNode | null>(null);
  const [showText, setShowText] = useState(false); // For fade-in animation

  useEffect(() => {
    if (!contextIsLoading && !gameData) {
      // If game data is not loaded and we are not in a loading state from context,
      // redirect to create page. This might happen if user navigates directly.
      router.replace("/create");
    } else if (gameData && !currentSceneId) {
      setCurrentSceneId(gameData.startSceneId);
    }
  }, [gameData, contextIsLoading, currentSceneId, router]);

  useEffect(() => {
    if (gameData && currentSceneId && gameData.scenes[currentSceneId]) {
      setShowText(false); // Reset animation trigger
      const timer = setTimeout(() => {
        setCurrentScene(gameData.scenes[currentSceneId]);
        setShowText(true); // Trigger animation after a short delay for content update
      }, 50); // Small delay to ensure content update before animation
      return () => clearTimeout(timer);
    } else if (gameData && currentSceneId && !gameData.scenes[currentSceneId]) {
      // Scene ID is invalid or not found
      setCurrentScene(null); // Clear current scene
      console.error(`Scene with ID "${currentSceneId}" not found in game data.`);
      // Optionally, set an error state or redirect
    }
  }, [gameData, currentSceneId]);

  const handleChoice = (choice: SceneChoice) => {
    setCurrentSceneId(choice.nextNodeId);
  };

  if (contextIsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading your adventure...</p>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Game</AlertTitle>
          <AlertDescription>
            {contextError}
            <br />
            <Link href="/create">
              <Button variant="link" className="mt-2 p-0 h-auto">Try creating a new game</Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!gameData || !currentScene) {
     // This case handles if gameData is present but currentSceneId is invalid
     // or if gameData itself is null (which should be caught by redirect earlier)
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
         <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Game Error</AlertTitle>
          <AlertDescription>
            The game data is missing or the current scene could not be loaded.
            <br />
            <Link href="/create">
              <Button variant="link" className="mt-2 p-0 h-auto">Please start a new game.</Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl overflow-hidden">
        {gameData.title && (
           <CardHeader>
             <CardTitle className="text-3xl font-bold text-primary text-center">{gameData.title}</CardTitle>
             {currentScene.title && <CardDescription className="text-center text-lg">{currentScene.title}</CardDescription>}
           </CardHeader>
        )}
        <CardContent className="p-6 md:p-8 space-y-6">
          <div 
            key={currentScene.id} // Ensure re-render for animation
            className={`prose prose-lg max-w-none text-foreground leading-relaxed scene-text-enter ${showText ? 'scene-text-enter-active' : ''}`}
            style={{ whiteSpace: 'pre-line' }} // Preserve line breaks from AI
          >
            {currentScene.text}
          </div>
          
          {currentScene.visualHint && (
            <div className="p-3 bg-muted/50 rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground italic">Visual Hint: {currentScene.visualHint}</p>
            </div>
          )}

          {currentScene.soundEffect && (
            <div className="p-3 bg-muted/50 rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground italic">Sound Effect: {currentScene.soundEffect}</p>
            </div>
          )}

        </CardContent>
      </Card>

      {currentScene.choices && currentScene.choices.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Compass /> What do you do?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentScene.choices.map((choice, index) => (
              <Button
                key={index}
                onClick={() => handleChoice(choice)}
                variant="outline"
                className="text-left justify-start p-4 h-auto hover:bg-accent hover:text-accent-foreground transition-colors duration-150 shadow-sm hover:shadow-md"
                aria-label={`Choose: ${choice.text}`}
              >
                {choice.text}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
       {(!currentScene.choices || currentScene.choices.length === 0) && (
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-lg">The story concludes here for now.</p>
            <Link href="/create">
              <Button variant="default" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Create a New Adventure
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
