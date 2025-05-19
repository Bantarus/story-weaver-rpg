
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

// Defines the structure of the game data JSON
export interface GameData {
  title?: string;
  startSceneId: string;
  scenes: Record<string, SceneNode>;
}

export interface SceneNode {
  id: string;
  title?: string;
  text: string;
  choices: SceneChoice[];
  visualHint?: string;
  soundEffect?: string;
  isEnding?: boolean; // Added based on user workflow and AI schema
  endingType?: string; // Added based on user workflow and AI schema
}

export interface SceneChoice {
  text: string;
  nextNodeId: string;
  // effects?: string[]; // Future enhancement
}

interface GameContextType {
  // Story and character data
  storyText: string | null;
  setStoryText: (text: string | null) => void;
  characterDescription: string | null;
  setCharacterDescription: (desc: string | null) => void;
  analysisResult: any | null; // Consider defining a type for AnalyzeSourceMaterialOutput
  setAnalysisResult: (result: any | null) => void;
  narrativeOutline: string | null;
  setNarrativeOutline: (outline: string | null) => void;

  // Game data and state
  gameData: GameData | null;
  setGameData: (data: GameData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  currentStep: 'story' | 'character' | 'generate' | 'error'; // currentStep on create page
  setCurrentStep: (step: 'story' | 'character' | 'generate' | 'error') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [storyText, setStoryText] = useState<string | null>(null);
  const [characterDescription, setCharacterDescription] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [narrativeOutline, setNarrativeOutline] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'story' | 'character' | 'generate' | 'error'>('story');


  return (
    <GameContext.Provider value={{ 
      storyText, setStoryText,
      characterDescription, setCharacterDescription,
      analysisResult, setAnalysisResult,
      narrativeOutline, setNarrativeOutline,
      gameData, setGameData, 
      isLoading, setIsLoading, 
      error, setError,
      currentStep, setCurrentStep
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
