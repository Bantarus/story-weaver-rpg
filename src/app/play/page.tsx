
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGame, type SceneNode, type SceneChoice, type AnalyzeSourceMaterialOutput, type Effect } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, ArrowLeft, Compass, Eye, Ear, RefreshCw, Briefcase, ShieldAlert, Scale as ScaleIcon, Sparkles, FileText, Download } from "lucide-react"; 
import { GameHistoryDisplay } from "@/components/GameHistoryDisplay"; 
import { Badge } from "@/components/ui/badge";
import { generatePlaythroughStory, type GeneratePlaythroughStoryInput, type PlayedSceneInfo } from "@/ai/flows/generate-playthrough-story";
import { useToast } from "@/hooks/use-toast";

export default function PlayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    gameData, 
    currentSceneId, setCurrentSceneId,
    gameHistory, 
    characterDescription,
    storyText, 
    analysisResult,
    playerInventory,
    playerStatusEffects,
    playerAlignment, 
    applyEffects,
    applyAlignmentShift, 
    isLoading: contextIsLoading, 
    error: contextError,
    resetFullGame,
    restartCurrentAdventure 
  } = useGame();
  
  const [currentScene, setCurrentScene] = useState<SceneNode | null>(null);
  const [showText, setShowText] = useState(false); 
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [storyGenerationError, setStoryGenerationError] = useState<string | null>(null);
  const [showStoryDialog, setShowStoryDialog] = useState(false);

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
      const newSceneToLoad = gameData.scenes[currentSceneId];
      
      if(newSceneToLoad.effects && newSceneToLoad.effects.length > 0) {
        applyEffects(newSceneToLoad.effects);
      }

      const timer = setTimeout(() => {
        setCurrentScene(newSceneToLoad);
        setShowText(true); 
      }, 50); 
      return () => clearTimeout(timer);
    } else if (gameData && currentSceneId && !gameData.scenes[currentSceneId]) {
      setCurrentScene(null); 
      console.error('Scene with ID "' + currentSceneId + '" not found in game data. Resetting to start scene.');
      if (gameData.startSceneId && gameData.scenes[gameData.startSceneId]) {
        setCurrentSceneId(gameData.startSceneId);
      } else {
        console.error("Start scene is also invalid. Resetting full game.");
        resetFullGame();
        router.replace("/create");
      }
    }
  }, [gameData, currentSceneId, setCurrentSceneId, resetFullGame, router, applyEffects]);

  const handleChoice = (choice: SceneChoice) => {
    if(choice.effects && choice.effects.length > 0) {
      applyEffects(choice.effects);
    }
    if (typeof choice.alignmentEffect === 'number') { 
      applyAlignmentShift(choice.alignmentEffect);
    }

    if (gameData && gameData.scenes[choice.nextNodeId]) {
      setCurrentSceneId(choice.nextNodeId);
    } else {
      console.error('Next scene ID "' + choice.nextNodeId + '" not found. Staying in current scene or handling error.');
    }
  };

  const handleNewAdventure = () => {
    resetFullGame();
    router.push("/create");
  };

  const downloadStory = (storyTextToDownload: string, filename: string = "my-rpg-adventure.txt") => {
    const element = document.createElement("a");
    const file = new Blob([storyTextToDownload], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleGeneratePlaythroughStory = async () => {
    if (!gameData || !gameHistory || gameHistory.length === 0) {
      setStoryGenerationError("Cannot generate story: Missing game data or history.");
      toast({ variant: "destructive", title: "Story Generation Failed", description: "Missing game data or history." });
      return;
    }

    setIsGeneratingStory(true);
    setGeneratedStory(null);
    setStoryGenerationError(null);

    try {
      const playedPath: PlayedSceneInfo[] = [];
      for (let i = 0; i < gameHistory.length; i++) {
        const sceneId = gameHistory[i];
        const scene = gameData.scenes[sceneId];

        if (!scene) {
          console.warn(`Scene with ID ${sceneId} from history not found in gameData. Skipping.`);
          continue;
        }

        let chosenChoiceText: string | undefined = undefined;
        if (i < gameHistory.length - 1) {
          const nextSceneIdInHistory = gameHistory[i+1];
          const choiceMade = scene.choices.find(c => c.nextNodeId === nextSceneIdInHistory);
          if (choiceMade) {
            chosenChoiceText = choiceMade.text;
          } else {
             console.warn(`Could not find choice in scene ${sceneId} that leads to ${nextSceneIdInHistory}.`);
          }
        }
        
        playedPath.push({
          sceneId: scene.id,
          sceneTitle: scene.title,
          sceneText: scene.text,
          chosenChoiceText: chosenChoiceText,
          isEnding: scene.isEnding,
          endingType: scene.endingType,
        });
      }

      if (playedPath.length === 0) {
        throw new Error("Could not construct a valid played path from game history.");
      }

      const storyInput: GeneratePlaythroughStoryInput = {
        gameTitle: gameData.title,
        originalStoryText: storyText || undefined, 
        analysisResult: analysisResult || undefined,
        playedPath: playedPath,
        characterDescription: characterDescription || undefined,
        playerAlignment: playerAlignment,
        playerInventory: playerInventory.length > 0 ? playerInventory : undefined,
        playerStatusEffects: playerStatusEffects.length > 0 ? playerStatusEffects : undefined,
      };
      
      const result = await generatePlaythroughStory(storyInput);
      setGeneratedStory(result.playthroughStory);
      setShowStoryDialog(true);
      toast({ title: "Story Generated!", description: "Your adventure narrative is ready.", className: "bg-primary text-primary-foreground" });
    } catch (err) {
      console.error("Error generating playthrough story:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during story generation.";
      setStoryGenerationError(errorMessage);
      toast({ variant: "destructive", title: "Story Generation Failed", description: errorMessage });
    } finally {
      setIsGeneratingStory(false);
    }
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
  const alignmentText = playerAlignment > 0 ? `Good (${playerAlignment})` : playerAlignment < 0 ? `Evil (${playerAlignment})` : `Neutral (${playerAlignment})`;


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
         <CardFooter className="flex justify-center pt-0 pb-6">
           {/* Button moved to end screen, but footer kept for potential future use */}
        </CardFooter>
      </Card>

      {!isGameEnd && (playerInventory.length > 0 || playerStatusEffects.length > 0 || typeof playerAlignment === 'number') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {playerInventory.length > 0 && (
            <Card className="shadow-md bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Briefcase size={20} /> Inventory</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-2">
                {playerInventory.map(item => (
                  <Badge key={item} variant="secondary" className="text-sm">{item.replace(/_/g, ' ')}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
          {playerStatusEffects.length > 0 && (
             <Card className="shadow-md bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert size={20} /> Status Effects</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-2">
                {playerStatusEffects.map(status => (
                  <Badge key={status} variant={status === 'cursed' || status === 'poisoned' ? 'destructive' : 'outline'} className="text-sm">{status.replace(/_/g, ' ')}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
           {typeof playerAlignment === 'number' && (
            <Card className="shadow-md bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><ScaleIcon size={20} /> Alignment</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className={`text-md font-semibold text-center ${playerAlignment > 0 ? 'text-green-600' : playerAlignment < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {alignmentText}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}


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
            
            {playerInventory.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-md mb-1">Final Inventory:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {playerInventory.map(item => (
                    <Badge key={item} variant="secondary">{item.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            )}
            {playerStatusEffects.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-md mb-1">Final Status:</h4>
                 <div className="flex flex-wrap justify-center gap-2">
                  {playerStatusEffects.map(status => (
                     <Badge key={status} variant={status === 'cursed' || status === 'poisoned' ? 'destructive' : 'outline'}>{status.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            )}
            {typeof playerAlignment === 'number' && (
                 <div className="mt-3">
                    <h4 className="font-semibold text-md mb-1">Final Alignment:</h4>
                    <p className={`text-lg font-bold ${playerAlignment > 0 ? 'text-green-600' : playerAlignment < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {alignmentText}
                    </p>
                </div>
            )}

            {gameData && gameData.scenes && gameHistory.length > 0 && (
              <GameHistoryDisplay 
                gameHistory={gameHistory} 
                scenes={gameData.scenes} 
                currentSceneId={currentSceneId}
              />
            )}
             {storyGenerationError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Story Generation Error</AlertTitle>
                    <AlertDescription>{storyGenerationError}</AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
               <Button
                variant="outline"
                size="lg"
                onClick={handleGeneratePlaythroughStory}
                disabled={isGeneratingStory || contextIsLoading}
                className="shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                {isGeneratingStory ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
                Generate My Story
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={restartCurrentAdventure}
                disabled={!gameData || !gameData.startSceneId || isGeneratingStory || contextIsLoading}
                className="shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Restart Adventure
              </Button>
              <Button variant="default" size="lg" className="shadow-md hover:shadow-lg w-full sm:w-auto" onClick={handleNewAdventure}  disabled={isGeneratingStory || contextIsLoading}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Weave a New Adventure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showStoryDialog && generatedStory && (
        <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Your Adventure Story</DialogTitle>
                    <DialogDescription>
                        Here is the narrative of your unique journey. You can read it here or download it as a text file.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow p-1 pr-3 -mx-1 min-h-[200px]">
                    <Textarea
                        value={generatedStory}
                        readOnly
                        className="min-h-[300px] text-sm bg-muted/30 h-full"
                        rows={15} 
                    />
                </ScrollArea>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                     <Button variant="outline" onClick={() => downloadStory(generatedStory, `${gameData?.adventureName || gameData?.title || "My Adventure"}_playthrough.txt`)}>
                        <Download className="mr-2 h-4 w-4" /> Download Story (.txt)
                    </Button>
                    <Button onClick={() => setShowStoryDialog(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

