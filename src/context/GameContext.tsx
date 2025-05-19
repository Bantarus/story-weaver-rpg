
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
const GAME_HISTORY_KEY = 'storyWeaver_gameHistory';
const DESIRED_TONE_KEY = 'storyWeaver_desiredTone';
const DESIRED_LENGTH_KEY = 'storyWeaver_desiredLength';
const KEY_THEMES_KEY = 'storyWeaver_keyThemes';


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

export type CreationStep = 'story' | 'character' | 'generate' | 'error';
export type DesiredTone = "Default" | "Heroic" | "Mysterious" | "Comedic" | "Tragic" | "Dramatic" | string; // Allow string for custom
export type DesiredLength = "Default" | "Short" | "Medium" | "Long" | string;

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

  // Advanced Generation Parameters
  desiredTone: DesiredTone;
  setDesiredTone: (tone: DesiredTone) => void;
  desiredLength: DesiredLength;
  setDesiredLength: (length: DesiredLength) => void;
  keyThemes: string | null;
  setKeyThemes: (themes: string | null) => void;

  // Game data and state
  gameData: GameData | null;
  setGameData: (data: GameData | null) => void;
  currentSceneId: string | null;
  setCurrentSceneId: (id: string | null) => void;
  gameHistory: string[];
  
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  creationStep: CreationStep; 
  setCreationStep: (step: CreationStep) => void;

  // Persistence functions
  resetCreationProgress: () => void;
  resetFullGame: () => void;
  restartCurrentAdventure: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [storyText, setStoryTextState] = useState<string | null>(null);
  const [characterDescription, setCharacterDescriptionState] = useState<string | null>(null);
  const [analysisResult, setAnalysisResultState] = useState<any | null>(null);
  const [narrativeOutline, setNarrativeOutlineState] = useState<string | null>(null);
  
  const [desiredTone, setDesiredToneState] = useState<DesiredTone>("Default");
  const [desiredLength, setDesiredLengthState] = useState<DesiredLength>("Default");
  const [keyThemes, setKeyThemesState] = useState<string | null>(null);

  const [gameData, setGameDataState] = useState<GameData | null>(null);
  const [currentSceneId, setCurrentSceneIdState] = useState<string | null>(null);
  const [gameHistory, setGameHistoryState] = useState<string[]>([]);
  const [isLoading, setIsLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
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

    const storedDesiredTone = localStorage.getItem(DESIRED_TONE_KEY);
    if (storedDesiredTone) setDesiredToneState(storedDesiredTone as DesiredTone);

    const storedDesiredLength = localStorage.getItem(DESIRED_LENGTH_KEY);
    if (storedDesiredLength) setDesiredLengthState(storedDesiredLength as DesiredLength);

    const storedKeyThemes = localStorage.getItem(KEY_THEMES_KEY);
    if (storedKeyThemes) setKeyThemesState(storedKeyThemes);

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

  // Initialize history
  useEffect(() => {
    if (isLoaded && gameData && gameData.startSceneId) {
      if (currentSceneId === gameData.startSceneId && gameHistory.length === 0) {
        setGameHistoryState([gameData.startSceneId]);
      } else if (gameHistory.length === 0 && (!currentSceneId || (gameData.scenes && !gameData.scenes[currentSceneId]))) { 
         setGameHistoryState([gameData.startSceneId]);
         setCurrentSceneIdState(gameData.startSceneId);
      }
    }
  }, [gameData, currentSceneId, gameHistory.length, isLoaded]);


  // Save states to localStorage when they change
  useEffect(() => { if (isLoaded) storyText ? localStorage.setItem(STORY_TEXT_KEY, storyText) : localStorage.removeItem(STORY_TEXT_KEY); }, [storyText, isLoaded]);
  useEffect(() => { if (isLoaded) characterDescription ? localStorage.setItem(CHARACTER_DESC_KEY, characterDescription) : localStorage.removeItem(CHARACTER_DESC_KEY); }, [characterDescription, isLoaded]);
  useEffect(() => { if (isLoaded) analysisResult ? localStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(analysisResult)) : localStorage.removeItem(ANALYSIS_RESULT_KEY); }, [analysisResult, isLoaded]);
  useEffect(() => { if (isLoaded) narrativeOutline ? localStorage.setItem(NARRATIVE_OUTLINE_KEY, narrativeOutline) : localStorage.removeItem(NARRATIVE_OUTLINE_KEY); }, [narrativeOutline, isLoaded]);
  useEffect(() => { if (isLoaded) desiredTone ? localStorage.setItem(DESIRED_TONE_KEY, desiredTone) : localStorage.removeItem(DESIRED_TONE_KEY); }, [desiredTone, isLoaded]);
  useEffect(() => { if (isLoaded) desiredLength ? localStorage.setItem(DESIRED_LENGTH_KEY, desiredLength) : localStorage.removeItem(DESIRED_LENGTH_KEY); }, [desiredLength, isLoaded]);
  useEffect(() => { if (isLoaded) keyThemes ? localStorage.setItem(KEY_THEMES_KEY, keyThemes) : localStorage.removeItem(KEY_THEMES_KEY); }, [keyThemes, isLoaded]);
  useEffect(() => { if (isLoaded) gameData ? localStorage.setItem(GAME_DATA_KEY, JSON.stringify(gameData)) : localStorage.removeItem(GAME_DATA_KEY); }, [gameData, isLoaded]);
  useEffect(() => { if (isLoaded) currentSceneId ? localStorage.setItem(CURRENT_SCENE_ID_KEY, currentSceneId) : localStorage.removeItem(CURRENT_SCENE_ID_KEY); }, [currentSceneId, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CREATION_STEP_KEY, creationStep); }, [creationStep, isLoaded]);
  useEffect(() => { if (isLoaded) gameHistory.length > 0 ? localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory)) : localStorage.removeItem(GAME_HISTORY_KEY); }, [gameHistory, isLoaded]);


  // Wrapped and memoized setters
  const setStoryText = useCallback((text: string | null) => setStoryTextState(text), []);
  const setCharacterDescription = useCallback((desc: string | null) => setCharacterDescriptionState(desc), []);
  const setAnalysisResult = useCallback((result: any | null) => setAnalysisResultState(result), []);
  const setNarrativeOutline = useCallback((outline: string | null) => setNarrativeOutlineState(outline), []);
  const setDesiredTone = useCallback((tone: DesiredTone) => setDesiredToneState(tone), []);
  const setDesiredLength = useCallback((length: DesiredLength) => setDesiredLengthState(length), []);
  const setKeyThemes = useCallback((themes: string | null) => setKeyThemesState(themes), []);
  
  const setGameData = useCallback((data: GameData | null) => {
    setGameDataState(data);
    if (data && data.startSceneId) {
      setCurrentSceneIdState(data.startSceneId);
      setGameHistoryState([data.startSceneId]);
    } else if (!data) {
      setGameHistoryState([]);
    }
  }, []);

  const setCurrentSceneId = useCallback((id: string | null) => {
    setCurrentSceneIdState(id);
    if (id) {
      setGameHistoryState(prevHistory => {
        if (prevHistory.length === 0 && gameData && id === gameData.startSceneId) {
          return [id];
        }
        // Only add to history if it's a new scene
        if (prevHistory.length > 0 && prevHistory[prevHistory.length - 1] !== id) {
          // Check if the new scene is a valid scene in gameData
          if (gameData && gameData.scenes[id]) {
            return [...prevHistory, id];
          }
        }
        return prevHistory;
      });
    }
  }, [gameData]);

  const setCreationStep = useCallback((step: CreationStep) => setCreationStepState(step), []);
  const setIsLoading = useCallback((loading: boolean) => setIsLoadingState(loading), []);
  const setError = useCallback((error: string | null) => setErrorState(error), []);


  const resetCreationProgress = useCallback(() => {
    setStoryTextState(null);
    setCharacterDescriptionState(null);
    setAnalysisResultState(null);
    setNarrativeOutlineState(null);
    setDesiredToneState("Default");
    setDesiredLengthState("Default");
    setKeyThemesState(null);
    setCreationStepState('story');
    localStorage.removeItem(STORY_TEXT_KEY);
    localStorage.removeItem(CHARACTER_DESC_KEY);
    localStorage.removeItem(ANALYSIS_RESULT_KEY);
    localStorage.removeItem(NARRATIVE_OUTLINE_KEY);
    localStorage.removeItem(DESIRED_TONE_KEY);
    localStorage.removeItem(DESIRED_LENGTH_KEY);
    localStorage.removeItem(KEY_THEMES_KEY);
    localStorage.setItem(CREATION_STEP_KEY, 'story'); 
    setErrorState(null); 
  }, []);

  const resetFullGame = useCallback(() => {
    resetCreationProgress();
    setGameDataState(null);
    setCurrentSceneIdState(null);
    setGameHistoryState([]);
    localStorage.removeItem(GAME_DATA_KEY);
    localStorage.removeItem(CURRENT_SCENE_ID_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY);
    setErrorState(null); 
  }, [resetCreationProgress]);

  const restartCurrentAdventure = useCallback(() => {
    if (gameData && gameData.startSceneId && gameData.scenes && gameData.scenes[gameData.startSceneId]) {
      setCurrentSceneIdState(gameData.startSceneId);
      setGameHistoryState([gameData.startSceneId]);
      setErrorState(null); // Clear any errors
    } else {
      console.warn("Cannot restart adventure: gameData, startSceneId, or start scene is missing/invalid.");
    }
  }, [gameData]); 


  if (!isLoaded) {
    return null; 
  }

  return (
    <GameContext.Provider value={{ 
      storyText, setStoryText,
      characterDescription, setCharacterDescription,
      analysisResult, setAnalysisResult,
      narrativeOutline, setNarrativeOutline,
      desiredTone, setDesiredTone,
      desiredLength, setDesiredLength,
      keyThemes, setKeyThemes,
      gameData, setGameData, 
      currentSceneId, setCurrentSceneId,
      gameHistory,
      isLoading, setIsLoading, 
      error, setError,
      creationStep, setCreationStep,
      resetCreationProgress,
      resetFullGame,
      restartCurrentAdventure
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

