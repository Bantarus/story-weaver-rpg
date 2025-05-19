
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, type SceneNode, type SceneChoice } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, Compass, Eye, Ear, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GameHistoryDisplay } from "@/components/GameHistoryDisplay"; 

export default function PlayPage() {
  const router = useRouter();
  const { 
    gameData, 
    currentSceneId, setCurrentSceneId,
    gameHistory, 
    isLoading: contextIsLoading, 
    error: contextError,
    resetFullGame,
    restartCurrentAdventure 
  } = useGame();
  
  const [currentScene, setCurrentScene] = useState<SceneNode | null>(null);
  const [showText, setShowText] = useState(false); 

  useEffect(() => {
    if (!contextIsLoading && !gameData) {
      resetFullGame(); 
      router.replace("/create");
    } else if (gameData && !currentSceneId) {
      setCurrentSceneId(gameData.startSceneId);
    }
  }, [gameData, contextIsLoading, currentSceneId, router, setCurrentSceneId, resetFullGame]);

  useEffect(() => {
    if (gameData && currentSceneId && gameData.scenes[currentSceneId]) {
      setShowText(false); 
      const timer = setTimeout(() => {
        setCurrentScene(gameData.scenes[currentSceneId]);
        setShowText(true); 
      }, 50); 
      return () => clearTimeout(timer);
    } else if (gameData && currentSceneId && !gameData.scenes[currentSceneId]) {
      setCurrentScene(null); 
      // Changed to string concatenation to avoid parsing error
      console.error('Scene with ID "' + currentSceneId + '" not found in game data. Resetting to start scene.');
      // Attempt to restart or recover, if startSceneId is valid
      if (gameData.startSceneId && gameData.scenes[gameData.startSceneId]) {
        setCurrentSceneId(gameData.startSceneId);
      } else {
        // If start scene itself is invalid, then it's a critical error
        console.error("Start scene is also invalid. Resetting full game.");
        resetFullGame();
        router.replace("/create");
      }
    }
  }, [gameData, currentSceneId, setCurrentSceneId, resetFullGame, router]);

  const handleChoice = (choice: SceneChoice) => {
    if (gameData && gameData.scenes[choice.nextNodeId]) {
      setCurrentSceneId(choice.nextNodeId);
    } else {
      console.error('Next scene ID "' + choice.nextNodeId + '" not found. Staying in current scene or handling error.');
      // Potentially set an error state to inform the user
    }
  };

  const handleNewAdventure = () => {
    resetFullGame();
    router.push("/create");
  };

  if (contextIsLoading || !gameData && !contextError) { 
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
            <Button variant="link" className="mt-2 p-0 h-auto" onClick={handleNewAdventure}>
              Try creating a new game
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!gameData || !currentSceneId) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Initializing game...</p>
      </div>
    );
  }

  if (!currentScene) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
         <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Scene Error</AlertTitle>
          <AlertDescription>
            The current scene could not be loaded. This might be due to missing data or an invalid scene ID.
            <br />
            <Button variant="link" className="mt-2 p-0 h-auto" onClick={handleNewAdventure}>
              Please start a new game.
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const isGameEnd = currentScene.isEnding || !currentScene.choices || currentScene.choices.length === 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
        {(gameData.title || currentScene.title) && (
           <CardHeader className="pb-2">
             {gameData.title && <CardTitle className="text-3xl font-bold text-primary text-center">{gameData.title}</CardTitle>}
             {currentScene.title && <CardDescription className={`text-center text-lg ${gameData.title ? 'mt-1' : 'text-2xl font-semibold text-foreground'}`}>{currentScene.title}</CardDescription>}
           </CardHeader>
        )}
        <CardContent className="p-6 md:p-8 space-y-6">
          <div 
            key={currentScene.id} 
            className={`prose prose-xl max-w-none text-foreground leading-relaxed scene-text-enter ${showText ? 'scene-text-enter-active' : ''}`}
            style={{ whiteSpace: 'pre-line' }} 
          >
            {currentScene.text}
          </div>
          
          {(currentScene.visualHint || currentScene.soundEffect) && (
            <div className="space-y-3 pt-4 mt-4 border-t border-dashed">
              {currentScene.visualHint && (
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md border border-dashed border-border/50">
                  <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic"><span className="font-semibold">Visual:</span> {currentScene.visualHint}</p>
                </div>
              )}

              {currentScene.soundEffect && (
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md border border-dashed border-border/50">
                  <Ear className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic"><span className="font-semibold">Sound:</span> {currentScene.soundEffect}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        {/* Removed Restart button from here */}
      </Card>

      {!isGameEnd && currentScene.choices && currentScene.choices.length > 0 && (
        <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Compass /> What path will you tread?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentScene.choices.map((choice, index) => (
              <Button
                key={index}
                onClick={() => handleChoice(choice)}
                variant="outline"
                className="text-left justify-start p-4 h-auto hover:bg-primary/10 hover:border-primary transition-all duration-150 shadow-sm hover:shadow-md text-base"
                aria-label={`Choose: ${choice.text}`}
              >
                {choice.text}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

       {isGameEnd && (
        <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {currentScene.endingType ? `An Ending: ${currentScene.endingType.replace(/_/g, ' ')}` : "The Path Closes"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground text-lg">
              {currentScene.endingType ? "Your journey has reached a conclusion." : "The story pauses here, its next chapter unwritten."}
            </p>
            
            {gameData && gameData.scenes && gameHistory.length > 0 && (
              <GameHistoryDisplay 
                gameHistory={gameHistory} 
                scenes={gameData.scenes} 
                currentSceneId={currentSceneId}
              />
            )}
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={restartCurrentAdventure}
                disabled={!gameData || !gameData.startSceneId}
                className="shadow-md hover:shadow-lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Restart Adventure
              </Button>
              <Button variant="default" size="lg" className="shadow-md hover:shadow-lg" onClick={handleNewAdventure}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Weave a New Adventure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
