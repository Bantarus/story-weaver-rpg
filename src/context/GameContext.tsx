
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// LocalStorage Keys
const STORY_TEXT_KEY = 'storyWeaver_storyText';
const CHARACTER_DESC_KEY = 'storyWeaver_characterDescription';
const ANALYSIS_RESULT_KEY = 'storyWeaver_analysisResult';
const NARRATIVE_OUTLINE_KEY = 'storyWeaver_narrativeOutline';
const DESIRED_TONE_KEY = 'storyWeaver_desiredTone';
const DESIRED_LENGTH_KEY = 'storyWeaver_desiredLength';
const KEY_THEMES_KEY = 'storyWeaver_keyThemes';

const GAME_DATA_KEY = 'storyWeaver_gameData';
const CURRENT_SCENE_ID_KEY = 'storyWeaver_currentSceneId';
const CREATION_STEP_KEY = 'storyWeaver_creationStep';
const GAME_HISTORY_KEY = 'storyWeaver_gameHistory';
const PLAYER_INVENTORY_KEY = 'storyWeaver_playerInventory';
const PLAYER_STATUS_EFFECTS_KEY = 'storyWeaver_playerStatusEffects';
const PLAYER_ALIGNMENT_KEY = 'storyWeaver_playerAlignment'; 

const SAVED_ADVENTURES_KEY = 'storyWeaver_savedAdventures';

// Effect Definitions
export type EffectType = "ADD_ITEM" | "REMOVE_ITEM" | "ADD_STATUS" | "REMOVE_STATUS";

export interface Effect {
  type: EffectType;
  value: string;
  description?: string;
}

export interface GameData {
  id?: string;
  adventureName?: string;
  title?: string;
  startSceneId: string;
  scenes: Record<string, SceneNode>;
}

export interface SceneNode {
  id: string;
  title?: string;
  text: string;
  choices: SceneChoice[];
  effects?: Effect[];
  visualHint?: string;
  soundEffect?: string;
  isEnding?: boolean;
  endingType?: string;
}

export interface SceneChoice {
  text: string;
  nextNodeId: string;
  effects?: Effect[];
  alignmentEffect?: number; 
}

export type CreationStep = 'story' | 'character' | 'generate' | 'error';
export type DesiredTone = "Default" | "Heroic" | "Mysterious" | "Comedic" | "Tragic" | "Dramatic" | string;
export type DesiredLength = "Default" | "Short" | "Medium" | "Long" | string;

export interface AnalyzeSourceMaterialOutput {
  plotPoints: string;
  characters: string;
  settings: string;
  themes: string;
  tone: string;
}


interface GameContextType {
  storyText: string | null;
  setStoryText: (text: string | null) => void;
  characterDescription: string | null;
  setCharacterDescription: (desc: string | null) => void;
  analysisResult: AnalyzeSourceMaterialOutput | null; // Typed
  setAnalysisResult: (result: AnalyzeSourceMaterialOutput | null) => void;
  narrativeOutline: string | null;
  setNarrativeOutline: (outline: string | null) => void;

  desiredTone: DesiredTone;
  setDesiredTone: (tone: DesiredTone) => void;
  desiredLength: DesiredLength;
  setDesiredLength: (length: DesiredLength) => void;
  keyThemes: string | null;
  setKeyThemes: (themes: string | null) => void;

  gameData: GameData | null;
  setGameData: (data: GameData | null) => void;
  currentSceneId: string | null;
  setCurrentSceneId: (id: string | null) => void;
  gameHistory: string[];

  playerInventory: string[];
  playerStatusEffects: string[];
  playerAlignment: number; 
  applyEffects: (effectsToApply?: Effect[]) => void;
  applyAlignmentShift: (shift?: number) => void; 

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  creationStep: CreationStep;
  setCreationStep: (step: CreationStep) => void;

  savedAdventures: GameData[];
  saveAdventureToLibrary: (name: string) => boolean;
  loadAdventureFromLibrary: (adventureId: string) => boolean;
  deleteAdventureFromLibrary: (adventureId: string) => void;
  isAdventureInLibrary: (adventureId?: string) => boolean;

  resetCreationProgress: () => void;
  resetFullGame: () => void;
  restartCurrentAdventure: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  const [storyText, setStoryTextState] = useState<string | null>(null);
  const [characterDescription, setCharacterDescriptionState] = useState<string | null>(null);
  const [analysisResult, setAnalysisResultState] = useState<AnalyzeSourceMaterialOutput | null>(null);
  const [narrativeOutline, setNarrativeOutlineState] = useState<string | null>(null);
  const [desiredTone, setDesiredToneState] = useState<DesiredTone>("Default");
  const [desiredLength, setDesiredLengthState] = useState<DesiredLength>("Default");
  const [keyThemes, setKeyThemesState] = useState<string | null>(null);
  const [creationStep, setCreationStepState] = useState<CreationStep>('story');

  const [gameData, setGameDataState] = useState<GameData | null>(null);
  const [currentSceneId, setCurrentSceneIdState] = useState<string | null>(null);
  const [gameHistory, setGameHistoryState] = useState<string[]>([]);

  const [playerInventory, setPlayerInventoryState] = useState<string[]>([]);
  const [playerStatusEffects, setPlayerStatusEffectsState] = useState<string[]>([]);
  const [playerAlignment, setPlayerAlignmentState] = useState<number>(0); 

  const [isLoading, setIsLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [savedAdventures, setSavedAdventuresState] = useState<GameData[]>([]);

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
    const storedCreationStep = localStorage.getItem(CREATION_STEP_KEY);
    if (storedCreationStep) setCreationStepState(storedCreationStep as CreationStep);

    const storedGameData = localStorage.getItem(GAME_DATA_KEY);
    if (storedGameData) setGameDataState(JSON.parse(storedGameData));
    const storedSceneId = localStorage.getItem(CURRENT_SCENE_ID_KEY);
    if (storedSceneId) setCurrentSceneIdState(storedSceneId);
    const storedGameHistory = localStorage.getItem(GAME_HISTORY_KEY);
    if (storedGameHistory) setGameHistoryState(JSON.parse(storedGameHistory));

    const storedPlayerInventory = localStorage.getItem(PLAYER_INVENTORY_KEY);
    if (storedPlayerInventory) setPlayerInventoryState(JSON.parse(storedPlayerInventory));
    const storedPlayerStatusEffects = localStorage.getItem(PLAYER_STATUS_EFFECTS_KEY);
    if (storedPlayerStatusEffects) setPlayerStatusEffectsState(JSON.parse(storedPlayerStatusEffects));
    const storedPlayerAlignment = localStorage.getItem(PLAYER_ALIGNMENT_KEY); 
    if (storedPlayerAlignment) setPlayerAlignmentState(JSON.parse(storedPlayerAlignment));


    const storedSavedAdventures = localStorage.getItem(SAVED_ADVENTURES_KEY);
    if (storedSavedAdventures) setSavedAdventuresState(JSON.parse(storedSavedAdventures));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && gameData && gameData.startSceneId) {
      if (currentSceneId === gameData.startSceneId && gameHistory.length === 0) {
        setGameHistoryState([gameData.startSceneId]);
      } else if (gameHistory.length === 0 && (!currentSceneId || (gameData.scenes && !gameData.scenes[currentSceneId!]))) {
         setGameHistoryState([gameData.startSceneId]);
         setCurrentSceneIdState(gameData.startSceneId);
      }
    }
  }, [gameData, currentSceneId, gameHistory.length, isLoaded]);

  useEffect(() => { if (isLoaded) storyText ? localStorage.setItem(STORY_TEXT_KEY, storyText) : localStorage.removeItem(STORY_TEXT_KEY); }, [storyText, isLoaded]);
  useEffect(() => { if (isLoaded) characterDescription ? localStorage.setItem(CHARACTER_DESC_KEY, characterDescription) : localStorage.removeItem(CHARACTER_DESC_KEY); }, [characterDescription, isLoaded]);
  useEffect(() => { if (isLoaded) analysisResult ? localStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(analysisResult)) : localStorage.removeItem(ANALYSIS_RESULT_KEY); }, [analysisResult, isLoaded]);
  useEffect(() => { if (isLoaded) narrativeOutline ? localStorage.setItem(NARRATIVE_OUTLINE_KEY, narrativeOutline) : localStorage.removeItem(NARRATIVE_OUTLINE_KEY); }, [narrativeOutline, isLoaded]);
  useEffect(() => { if (isLoaded) desiredTone ? localStorage.setItem(DESIRED_TONE_KEY, desiredTone) : localStorage.removeItem(DESIRED_TONE_KEY); }, [desiredTone, isLoaded]);
  useEffect(() => { if (isLoaded) desiredLength ? localStorage.setItem(DESIRED_LENGTH_KEY, desiredLength) : localStorage.removeItem(DESIRED_LENGTH_KEY); }, [desiredLength, isLoaded]);
  useEffect(() => { if (isLoaded) keyThemes ? localStorage.setItem(KEY_THEMES_KEY, keyThemes) : localStorage.removeItem(KEY_THEMES_KEY); }, [keyThemes, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CREATION_STEP_KEY, creationStep); }, [creationStep, isLoaded]);

  useEffect(() => { if (isLoaded) gameData ? localStorage.setItem(GAME_DATA_KEY, JSON.stringify(gameData)) : localStorage.removeItem(GAME_DATA_KEY); }, [gameData, isLoaded]);
  useEffect(() => { if (isLoaded) currentSceneId ? localStorage.setItem(CURRENT_SCENE_ID_KEY, currentSceneId) : localStorage.removeItem(CURRENT_SCENE_ID_KEY); }, [currentSceneId, isLoaded]);
  useEffect(() => { if (isLoaded) gameHistory.length > 0 ? localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory)) : localStorage.removeItem(GAME_HISTORY_KEY); }, [gameHistory, isLoaded]);

  useEffect(() => { if (isLoaded) playerInventory.length > 0 ? localStorage.setItem(PLAYER_INVENTORY_KEY, JSON.stringify(playerInventory)) : localStorage.removeItem(PLAYER_INVENTORY_KEY); }, [playerInventory, isLoaded]);
  useEffect(() => { if (isLoaded) playerStatusEffects.length > 0 ? localStorage.setItem(PLAYER_STATUS_EFFECTS_KEY, JSON.stringify(playerStatusEffects)) : localStorage.removeItem(PLAYER_STATUS_EFFECTS_KEY); }, [playerStatusEffects, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(PLAYER_ALIGNMENT_KEY, JSON.stringify(playerAlignment)); }, [playerAlignment, isLoaded]); 

  useEffect(() => { if (isLoaded) localStorage.setItem(SAVED_ADVENTURES_KEY, JSON.stringify(savedAdventures)); }, [savedAdventures, isLoaded]);

  const setStoryText = useCallback((text: string | null) => setStoryTextState(text), []);
  const setCharacterDescription = useCallback((desc: string | null) => setCharacterDescriptionState(desc), []);
  const setAnalysisResult = useCallback((result: AnalyzeSourceMaterialOutput | null) => setAnalysisResultState(result), []);
  const setNarrativeOutline = useCallback((outline: string | null) => setNarrativeOutlineState(outline), []);
  const setDesiredTone = useCallback((tone: DesiredTone) => setDesiredToneState(tone), []);
  const setDesiredLength = useCallback((length: DesiredLength) => setDesiredLengthState(length), []);
  const setKeyThemes = useCallback((themes: string | null) => setKeyThemesState(themes), []);

  const setCurrentSceneId = useCallback((id: string | null) => {
    setCurrentSceneIdState(id);
    if (id) {
      setGameHistoryState(prevHistory => {
        if (prevHistory.length === 0 && gameData && id === gameData.startSceneId) {
          return [id];
        }
        if (prevHistory.length > 0 && prevHistory[prevHistory.length - 1] !== id && gameData && gameData.scenes[id]) {
            return [...prevHistory, id];
        }
        return prevHistory;
      });
    }
  }, [gameData]);

  const setCreationStep = useCallback((step: CreationStep) => setCreationStepState(step), []);
  const setIsLoading = useCallback((loading: boolean) => setIsLoadingState(loading), []);
  const setError = useCallback((error: string | null) => setErrorState(error), []);

  const addItemToInventory = useCallback((itemValue: string) => {
    setPlayerInventoryState(prev => prev.includes(itemValue) ? prev : [...prev, itemValue]);
  }, []);

  const removeItemFromInventory = useCallback((itemValue: string) => {
    setPlayerInventoryState(prev => prev.filter(item => item !== itemValue));
  }, []);

  const addPlayerStatus = useCallback((statusValue: string) => {
    setPlayerStatusEffectsState(prev => prev.includes(statusValue) ? prev : [...prev, statusValue]);
  }, []);

  const removePlayerStatus = useCallback((statusValue: string) => {
    setPlayerStatusEffectsState(prev => prev.filter(status => status !== statusValue));
  }, []);

  const applyEffects = useCallback((effectsToApply?: Effect[]) => {
    if (!effectsToApply || effectsToApply.length === 0) return;

    effectsToApply.forEach(effect => {
      switch (effect.type) {
        case "ADD_ITEM":
          addItemToInventory(effect.value);
          break;
        case "REMOVE_ITEM":
          removeItemFromInventory(effect.value);
          break;
        case "ADD_STATUS":
          addPlayerStatus(effect.value);
          break;
        case "REMOVE_STATUS":
          removePlayerStatus(effect.value);
          break;
      }
      if (effect.description) {
        toast({ title: "Effect Triggered!", description: effect.description, className: "bg-accent text-accent-foreground" });
      }
    });
  }, [addItemToInventory, removeItemFromInventory, addPlayerStatus, removePlayerStatus, toast]);

  const applyAlignmentShift = useCallback((shift?: number) => {
    if (typeof shift === 'number' && shift !== 0) {
      setPlayerAlignmentState(prev => {
        const newAlignment = prev + shift;
        toast({ title: "Alignment Shift", description: `Your alignment shifted by ${shift}. New alignment: ${newAlignment}` });
        return newAlignment;
      });
    }
  }, [toast]);


  const resetCreationProgress = useCallback(() => {
    setStoryTextState(null);
    setCharacterDescriptionState(null);
    setAnalysisResultState(null);
    setNarrativeOutlineState(null);
    setDesiredToneState("Default");
    setDesiredLengthState("Default");
    setKeyThemesState(null);
    localStorage.removeItem(STORY_TEXT_KEY);
    localStorage.removeItem(CHARACTER_DESC_KEY);
    localStorage.removeItem(ANALYSIS_RESULT_KEY);
    localStorage.removeItem(NARRATIVE_OUTLINE_KEY);
    localStorage.removeItem(DESIRED_TONE_KEY);
    localStorage.removeItem(DESIRED_LENGTH_KEY);
    localStorage.removeItem(KEY_THEMES_KEY);
    setErrorState(null);
  }, []);

  const resetFullGame = useCallback(() => {
    resetCreationProgress();
    setGameDataState(null);
    setCurrentSceneIdState(null);
    setGameHistoryState([]);
    setPlayerInventoryState([]);
    setPlayerStatusEffectsState([]);
    setPlayerAlignmentState(0); 
    setCreationStepState('story');
    localStorage.removeItem(GAME_DATA_KEY);
    localStorage.removeItem(CURRENT_SCENE_ID_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY);
    localStorage.removeItem(PLAYER_INVENTORY_KEY);
    localStorage.removeItem(PLAYER_STATUS_EFFECTS_KEY);
    localStorage.removeItem(PLAYER_ALIGNMENT_KEY); 
    localStorage.setItem(CREATION_STEP_KEY, 'story');
    setErrorState(null);
  }, [resetCreationProgress]);

  const setGameDataInternal = useCallback((data: GameData | null) => {
    setGameDataState(data);
    if (data && data.startSceneId) {
      setCurrentSceneIdState(data.startSceneId);
      setGameHistoryState([data.startSceneId]);
      setPlayerInventoryState([]);
      setPlayerStatusEffectsState([]);
      setPlayerAlignmentState(0); 
    } else if (!data) {
      setCurrentSceneIdState(null);
      setGameHistoryState([]);
      setPlayerInventoryState([]);
      setPlayerStatusEffectsState([]);
      setPlayerAlignmentState(0); 
    }
  }, []);

  const saveAdventureToLibrary = useCallback((name: string): boolean => {
    if (!gameData) return false;

    const adventureToSave: GameData = {
      ...gameData,
      id: gameData.id || crypto.randomUUID(),
      adventureName: name,
    };

    setSavedAdventuresState(prevAdventures => {
      const existingIndex = prevAdventures.findIndex(adv => adv.id === adventureToSave.id);
      if (existingIndex > -1) {
        const updatedAdventures = [...prevAdventures];
        updatedAdventures[existingIndex] = adventureToSave;
        return updatedAdventures;
      } else {
        return [...prevAdventures, adventureToSave];
      }
    });
    if (!gameData.id) {
        setGameDataState(adventureToSave);
    }
    return true;
  }, [gameData]);

  const loadAdventureFromLibrary = useCallback((adventureId: string): boolean => {
    const adventureToLoad = savedAdventures.find(adv => adv.id === adventureId);
    if (adventureToLoad) {
      setGameDataInternal(adventureToLoad);
      resetCreationProgress(); // This will clear storyText, characterDescription, etc.
      setCreationStepState('generate'); // Or directly to play, depending on desired flow
      return true;
    }
    return false;
  }, [savedAdventures, setGameDataInternal, resetCreationProgress]);

  const deleteAdventureFromLibrary = useCallback((adventureId: string) => {
    setSavedAdventuresState(prevAdventures => prevAdventures.filter(adv => adv.id !== adventureId));
    if (gameData && gameData.id === adventureId) {
        resetFullGame();
    }
  }, [gameData, resetFullGame]);

  const isAdventureInLibrary = useCallback((adventureId?: string) => {
    if (!adventureId) return false;
    return savedAdventures.some(adv => adv.id === adventureId);
  }, [savedAdventures]);

  const restartCurrentAdventure = useCallback(() => {
    if (gameData && gameData.startSceneId && gameData.scenes && gameData.scenes[gameData.startSceneId]) {
      setCurrentSceneIdState(gameData.startSceneId);
      setGameHistoryState([gameData.startSceneId]);
      setPlayerInventoryState([]);
      setPlayerStatusEffectsState([]);
      setPlayerAlignmentState(0); 
      setErrorState(null);
    } else {
      console.warn("Cannot restart adventure: gameData, startSceneId, or start scene is missing/invalid.");
      resetFullGame();
    }
  }, [gameData, resetFullGame]);

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

      gameData, setGameData: setGameDataInternal,
      currentSceneId, setCurrentSceneId,
      gameHistory,

      playerInventory,
      playerStatusEffects,
      playerAlignment, 
      applyEffects,
      applyAlignmentShift, 

      isLoading, setIsLoading,
      error, setError,
      creationStep, setCreationStep,

      savedAdventures,
      saveAdventureToLibrary,
      loadAdventureFromLibrary,
      deleteAdventureFromLibrary,
      isAdventureInLibrary,

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

