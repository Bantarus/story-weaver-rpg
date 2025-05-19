
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// LocalStorage Keys
const STORY_TEXT_KEY = 'storyWeaver_storyText';
const CHARACTER_DESC_KEY = 'storyWeaver_characterDescription';
const ANALYSIS_RESULT_KEY = 'storyWeaver_analysisResult';
const NARRATIVE_OUTLINE_KEY = 'storyWeaver_narrativeOutline';
const GAME_DATA_KEY = 'storyWeaver_gameData';
const CURRENT_SCENE_ID_KEY = 'storyWeaver_currentSceneId';
const CREATION_STEP_KEY = 'storyWeaver_creationStep';
const GAME_HISTORY_KEY = 'storyWeaver_gameHistory'; // New key for game history

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
  isEnding?: boolean;
  endingType?: string;
}

export interface SceneChoice {
  text: string;
  nextNodeId: string;
}

type CreationStep = 'story' | 'character' | 'generate' | 'error';

interface GameContextType {
  // Story and character data
  storyText: string | null;
  setStoryText: (text: string | null) => void;
  characterDescription: string | null;
  setCharacterDescription: (desc: string | null) => void;
  analysisResult: any | null; 
  setAnalysisResult: (result: any | null) => void;
  narrativeOutline: string | null;
  setNarrativeOutline: (outline: string | null) => void;

  // Game data and state
  gameData: GameData | null;
  setGameData: (data: GameData | null) => void;
  currentSceneId: string | null;
  setCurrentSceneId: (id: string | null) => void;
  gameHistory: string[]; // Added gameHistory
  
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  creationStep: CreationStep; 
  setCreationStep: (step: CreationStep) => void;

  // Persistence functions
  resetCreationProgress: () => void;
  resetFullGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [storyText, setStoryTextState] = useState<string | null>(null);
  const [characterDescription, setCharacterDescriptionState] = useState<string | null>(null);
  const [analysisResult, setAnalysisResultState] = useState<any | null>(null);
  const [narrativeOutline, setNarrativeOutlineState] = useState<string | null>(null);
  const [gameData, setGameDataState] = useState<GameData | null>(null);
  const [currentSceneId, setCurrentSceneIdState] = useState<string | null>(null);
  const [gameHistory, setGameHistoryState] = useState<string[]>([]); // Game history state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationStep, setCreationStepState] = useState<CreationStep>('story');
  const [isLoaded, setIsLoaded] = useState(false);


  // Load state from localStorage on initial mount
  useEffect(() => {
    const storedStoryText = localStorage.getItem(STORY_TEXT_KEY);
    if (storedStoryText) setStoryTextState(storedStoryText);

    const storedCharDesc = localStorage.getItem(CHARACTER_DESC_KEY);
    if (storedCharDesc) setCharacterDescriptionState(storedCharDesc);

    const storedAnalysis = localStorage.getItem(ANALYSIS_RESULT_KEY);
    if (storedAnalysis) setAnalysisResultState(JSON.parse(storedAnalysis));
    
    const storedOutline = localStorage.getItem(NARRATIVE_OUTLINE_KEY);
    if (storedOutline) setNarrativeOutlineState(storedOutline);

    const storedGameData = localStorage.getItem(GAME_DATA_KEY);
    if (storedGameData) setGameDataState(JSON.parse(storedGameData));

    const storedSceneId = localStorage.getItem(CURRENT_SCENE_ID_KEY);
    if (storedSceneId) setCurrentSceneIdState(storedSceneId);

    const storedCreationStep = localStorage.getItem(CREATION_STEP_KEY);
    if (storedCreationStep) setCreationStepState(storedCreationStep as CreationStep);

    const storedGameHistory = localStorage.getItem(GAME_HISTORY_KEY);
    if (storedGameHistory) setGameHistoryState(JSON.parse(storedGameHistory));
    
    setIsLoaded(true);
  }, []);

  // Initialize history when gameData is first available and no history exists yet (for a new game)
  // Or if gameData is loaded and currentSceneId is startSceneId, but history is still empty (resuming a fresh game)
  useEffect(() => {
    if (isLoaded && gameData && gameData.startSceneId) {
      if (currentSceneId === gameData.startSceneId && gameHistory.length === 0) {
        setGameHistoryState([gameData.startSceneId]);
      }
    }
  }, [gameData, currentSceneId, gameHistory.length, isLoaded]);


  // Save states to localStorage when they change
  useEffect(() => { if (isLoaded) storyText ? localStorage.setItem(STORY_TEXT_KEY, storyText) : localStorage.removeItem(STORY_TEXT_KEY); }, [storyText, isLoaded]);
  useEffect(() => { if (isLoaded) characterDescription ? localStorage.setItem(CHARACTER_DESC_KEY, characterDescription) : localStorage.removeItem(CHARACTER_DESC_KEY); }, [characterDescription, isLoaded]);
  useEffect(() => { if (isLoaded) analysisResult ? localStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(analysisResult)) : localStorage.removeItem(ANALYSIS_RESULT_KEY); }, [analysisResult, isLoaded]);
  useEffect(() => { if (isLoaded) narrativeOutline ? localStorage.setItem(NARRATIVE_OUTLINE_KEY, narrativeOutline) : localStorage.removeItem(NARRATIVE_OUTLINE_KEY); }, [narrativeOutline, isLoaded]);
  useEffect(() => { if (isLoaded) gameData ? localStorage.setItem(GAME_DATA_KEY, JSON.stringify(gameData)) : localStorage.removeItem(GAME_DATA_KEY); }, [gameData, isLoaded]);
  useEffect(() => { if (isLoaded) currentSceneId ? localStorage.setItem(CURRENT_SCENE_ID_KEY, currentSceneId) : localStorage.removeItem(CURRENT_SCENE_ID_KEY); }, [currentSceneId, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CREATION_STEP_KEY, creationStep); }, [creationStep, isLoaded]);
  useEffect(() => { if (isLoaded) gameHistory.length > 0 ? localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory)) : localStorage.removeItem(GAME_HISTORY_KEY); }, [gameHistory, isLoaded]);


  // Wrapped setters
  const setStoryText = (text: string | null) => setStoryTextState(text);
  const setCharacterDescription = (desc: string | null) => setCharacterDescriptionState(desc);
  const setAnalysisResult = (result: any | null) => setAnalysisResultState(result);
  const setNarrativeOutline = (outline: string | null) => setNarrativeOutlineState(outline);
  const setGameData = (data: GameData | null) => {
    setGameDataState(data);
    // If setting new game data, reset history and initialize with start scene
    if (data && data.startSceneId) {
      setCurrentSceneIdState(data.startSceneId); // Also set current scene to start
      setGameHistoryState([data.startSceneId]);
    } else if (!data) {
      setGameHistoryState([]); // Clear history if game data is removed
    }
  };

  const setCurrentSceneId = (id: string | null) => {
    setCurrentSceneIdState(id);
    if (id) { // Only add to history if it's a valid scene ID
      setGameHistoryState(prevHistory => {
        // Ensure history is initialized if it's somehow empty (e.g., first load or after reset)
        if (prevHistory.length === 0 && gameData && id === gameData.startSceneId) {
          return [id];
        }
        // Add to history if it's a new scene ID and different from the last one
        if (prevHistory.length > 0 && prevHistory[prevHistory.length - 1] !== id) {
          return [...prevHistory, id];
        }
        // If history is empty and it's not the start scene, or if ID is same as last, return current history
        return prevHistory;
      });
    }
  };
  const setCreationStep = (step: CreationStep) => setCreationStepState(step);

  const resetCreationProgress = useCallback(() => {
    setStoryTextState(null);
    setCharacterDescriptionState(null);
    setAnalysisResultState(null);
    setNarrativeOutlineState(null);
    setCreationStepState('story');
    localStorage.removeItem(STORY_TEXT_KEY);
    localStorage.removeItem(CHARACTER_DESC_KEY);
    localStorage.removeItem(ANALYSIS_RESULT_KEY);
    localStorage.removeItem(NARRATIVE_OUTLINE_KEY);
    localStorage.setItem(CREATION_STEP_KEY, 'story'); 
    setError(null); 
  }, []);

  const resetFullGame = useCallback(() => {
    resetCreationProgress();
    setGameDataState(null);
    setCurrentSceneIdState(null);
    setGameHistoryState([]); // Clear history state
    localStorage.removeItem(GAME_DATA_KEY);
    localStorage.removeItem(CURRENT_SCENE_ID_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY); // Clear history from localStorage
    setError(null); 
  }, [resetCreationProgress]);

  if (!isLoaded) {
    return null; 
  }

  return (
    <GameContext.Provider value={{ 
      storyText, setStoryText,
      characterDescription, setCharacterDescription,
      analysisResult, setAnalysisResult,
      narrativeOutline, setNarrativeOutline,
      gameData, setGameData, 
      currentSceneId, setCurrentSceneId,
      gameHistory, // Expose gameHistory
      isLoading, setIsLoading, 
      error, setError,
      creationStep, setCreationStep,
      resetCreationProgress,
      resetFullGame
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
