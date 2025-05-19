
"use client";

import type { GameData, SceneNode } from '@/context/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Footprints, Flag, Award, ChevronsRight } from 'lucide-react';

interface GameHistoryDisplayProps {
  gameHistory: string[];
  scenes: Record<string, SceneNode>;
  currentSceneId: string | null; // To highlight the current scene if it's not an ending
}

export function GameHistoryDisplay({ gameHistory, scenes, currentSceneId }: GameHistoryDisplayProps) {
  if (!gameHistory || gameHistory.length === 0 || !scenes) {
    return (
      <Card className="shadow-md my-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Footprints className="h-5 w-5 text-primary" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No journey steps recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Footprints className="h-5 w-5 text-primary" />
          Your Journey So Far
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full pr-3"> {/* Added w-full and pr for scrollbar visibility */}
          <ol className="space-y-2">
            {gameHistory.map((sceneId, index) => {
              const scene = scenes[sceneId];
              if (!scene) {
                console.warn(`Scene with ID ${sceneId} not found in scenes data for history display.`);
                return (
                    <li key={`unknown-${sceneId}-${index}`} className="flex items-center gap-3 p-2 rounded-md border border-dashed">
                        <Footprints className="h-5 w-5 text-destructive flex-shrink-0" />
                        <p className="text-sm text-destructive">Unknown step in history</p>
                    </li>
                );
              }

              const isCurrentNonEnding = sceneId === currentSceneId && !scene.isEnding;
              const isFirstSceneInHistory = index === 0;
              const isLastSceneInHistory = index === gameHistory.length - 1;
              
              let IconComponent = Footprints;
              let iconColor = "text-muted-foreground";

              if (isFirstSceneInHistory) {
                IconComponent = Flag;
                iconColor = "text-green-500"; // Starting flag color
              } else if (scene.isEnding && isLastSceneInHistory) { // Only show award if it's the *actual* end of the displayed history path
                IconComponent = Award;
                iconColor = "text-amber-500"; // Award color
              }
              
              if (isCurrentNonEnding) {
                iconColor = "text-primary";
              }

              return (
                <li 
                  key={`${sceneId}-${index}`} 
                  className={`flex items-center gap-3 p-2.5 rounded-md transition-colors ${
                    isCurrentNonEnding ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-muted/50'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                  <div className="flex-grow min-w-0"> {/* Added min-w-0 for truncation */}
                    <p className={`font-medium truncate ${isCurrentNonEnding ? 'text-primary' : 'text-foreground'}`}>
                      {scene.title || `Step ${index + 1}`}
                    </p>
                    {isCurrentNonEnding && (
                      <span className="text-xs text-primary font-normal block">(Current Location)</span>
                    )}
                  </div>
                  {!isLastSceneInHistory && (
                    <ChevronsRight className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
                  )}
                </li>
              );
            })}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
