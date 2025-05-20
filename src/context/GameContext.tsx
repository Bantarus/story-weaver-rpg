
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
const ADVENTURE_LANGUAGE_KEY = 'storyWeaver_adventureLanguage'; // New key

const GAME_DATA_KEY = 'storyWeaver_gameData';
const CURRENT_SCENE_ID_KEY = 'storyWeaver_currentSceneId';
const CREATION_STEP_KEY = 'storyWeaver_creationStep';
const GAME_HISTORY_KEY = 'storyWeaver_gameHistory';
const PLAYER_INVENTORY_KEY = 'storyWeaver_playerInventory';
const PLAYER_STATUS_EFFECTS_KEY = 'storyWeaver_playerStatusEffects';
const PLAYER_ALIGNMENT_KEY = 'storyWeaver_playerAlignment'; 

const SAVED_ADVENTURES_KEY = 'storyWeaver_savedAdventures';
const SAVED_CHARACTERS_KEY = 'storyWeaver_savedCharacters';

// Character Profile Definition
export interface CharacterProfile {
  id: string;
  name: string;
  archetype: string;
  background: string;
  goals: string;
}

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
  language?: string; // New field
  // Optional fields that might come from an imported GameData file
  storyText?: string;
  characterDescription?: string;
  analysisResult?: AnalyzeSourceMaterialOutput | null;
  narrativeOutline?: string | null;
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
// Define common languages - expand as needed
export type AdventureLanguage = "en-US" | "es-ES" | "fr-FR" | "de-DE" | string;


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
  analysisResult: AnalyzeSourceMaterialOutput | null; 
  setAnalysisResult: (result: AnalyzeSourceMaterialOutput | null) => void;
  narrativeOutline: string | null;
  setNarrativeOutline: (outline: string | null) => void;

  desiredTone: DesiredTone;
  setDesiredTone: (tone: DesiredTone) => void;
  desiredLength: DesiredLength;
  setDesiredLength: (length: DesiredLength) => void;
  keyThemes: string | null;
  setKeyThemes: (themes: string | null) => void;
  adventureLanguage: AdventureLanguage; // New state
  setAdventureLanguage: (lang: AdventureLanguage) => void; // New setter

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

  // Character Library
  savedCharacters: CharacterProfile[];
  saveCharacterProfile: (characterData: Omit<CharacterProfile, 'id'> & { id?: string }) => CharacterProfile;
  deleteCharacterProfile: (characterId: string) => void;
  getCharacterProfileById: (characterId: string) => CharacterProfile | undefined;


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
  const [adventureLanguage, setAdventureLanguageState] = useState<AdventureLanguage>("en-US"); // New state default
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
  const [savedCharacters, setSavedCharactersState] = useState<CharacterProfile[]>([]);

  const resetCreationProgress = useCallback(() => {
    setStoryTextState(null);
    setCharacterDescriptionState(null); 
    setAnalysisResultState(null);
    setNarrativeOutlineState(null);
    setDesiredToneState("Default");
    setDesiredLengthState("Default");
    setKeyThemesState(null);
    setAdventureLanguageState("en-US"); // Reset language
    localStorage.removeItem(STORY_TEXT_KEY);
    localStorage.removeItem(CHARACTER_DESC_KEY);
    localStorage.removeItem(ANALYSIS_RESULT_KEY);
    localStorage.removeItem(NARRATIVE_OUTLINE_KEY);
    localStorage.removeItem(DESIRED_TONE_KEY);
    localStorage.removeItem(DESIRED_LENGTH_KEY);
    localStorage.removeItem(KEY_THEMES_KEY);
    localStorage.removeItem(ADVENTURE_LANGUAGE_KEY); // Remove language
    setErrorState(null);
  }, []);


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
    const storedAdventureLanguage = localStorage.getItem(ADVENTURE_LANGUAGE_KEY); // Load language
    if (storedAdventureLanguage) setAdventureLanguageState(storedAdventureLanguage as AdventureLanguage);
    
    const storedGameData = localStorage.getItem(GAME_DATA_KEY);
    if (storedGameData) setGameDataState(JSON.parse(storedGameData));
    
    const storedSceneId = localStorage.getItem(CURRENT_SCENE_ID_KEY);
    if (storedSceneId) setCurrentSceneIdState(storedSceneId);
    
    const storedGameHistory = localStorage.getItem(GAME_HISTORY_KEY);
    if (storedGameHistory) setGameHistoryState(JSON.parse(storedGameHistory));

    const storedCreationStep = localStorage.getItem(CREATION_STEP_KEY);
    if (storedGameData && storedCreationStep && (storedCreationStep === 'story' || storedCreationStep === 'character')) {
      setCreationStepState('generate');
    } else if (storedCreationStep) {
      setCreationStepState(storedCreationStep as CreationStep);
    } else {
      setCreationStepState('story'); 
    }

    const storedPlayerInventory = localStorage.getItem(PLAYER_INVENTORY_KEY);
    if (storedPlayerInventory) setPlayerInventoryState(JSON.parse(storedPlayerInventory));
    const storedPlayerStatusEffects = localStorage.getItem(PLAYER_STATUS_EFFECTS_KEY);
    if (storedPlayerStatusEffects) setPlayerStatusEffectsState(JSON.parse(storedPlayerStatusEffects));
    const storedPlayerAlignment = localStorage.getItem(PLAYER_ALIGNMENT_KEY); 
    if (storedPlayerAlignment) setPlayerAlignmentState(JSON.parse(storedPlayerAlignment));

    const storedSavedAdventures = localStorage.getItem(SAVED_ADVENTURES_KEY);
    if (storedSavedAdventures) setSavedAdventuresState(JSON.parse(storedSavedAdventures));
    
    const storedSavedCharacters = localStorage.getItem(SAVED_CHARACTERS_KEY);
    if (storedSavedCharacters) setSavedCharactersState(JSON.parse(storedSavedCharacters));

    setIsLoaded(true);
  }, []);


  useEffect(() => {
    if (isLoaded && gameData && gameData.startSceneId && gameData.scenes[gameData.startSceneId]) {
        if (gameHistory.length === 0 || (currentSceneId && !gameHistory.includes(currentSceneId))) {
            if (!currentSceneId || !gameData.scenes[currentSceneId]) {
                setCurrentSceneIdState(gameData.startSceneId);
                setGameHistoryState([gameData.startSceneId]);
            } else {
                setGameHistoryState(prevHistory => {
                    if (!prevHistory.includes(currentSceneId)) return [currentSceneId];
                    return prevHistory; 
                });
            }
        }
         // Set adventureLanguage from loaded gameData if available
        if (gameData.language) {
          setAdventureLanguageState(gameData.language as AdventureLanguage);
        }
    } else if (isLoaded && gameData && (!gameData.startSceneId || !gameData.scenes[gameData.startSceneId])) {
        console.error("Loaded gameData has an invalid startSceneId. Clearing game data.");
        setGameDataState(null); 
    }
  }, [gameData, currentSceneId, gameHistory.length, isLoaded]);


  useEffect(() => { if (isLoaded) storyText ? localStorage.setItem(STORY_TEXT_KEY, storyText) : localStorage.removeItem(STORY_TEXT_KEY); }, [storyText, isLoaded]);
  useEffect(() => { if (isLoaded) characterDescription ? localStorage.setItem(CHARACTER_DESC_KEY, characterDescription) : localStorage.removeItem(CHARACTER_DESC_KEY); }, [characterDescription, isLoaded]);
  useEffect(() => { if (isLoaded) analysisResult ? localStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(analysisResult)) : localStorage.removeItem(ANALYSIS_RESULT_KEY); }, [analysisResult, isLoaded]);
  useEffect(() => { if (isLoaded) narrativeOutline ? localStorage.setItem(NARRATIVE_OUTLINE_KEY, narrativeOutline) : localStorage.removeItem(NARRATIVE_OUTLINE_KEY); }, [narrativeOutline, isLoaded]);
  useEffect(() => { if (isLoaded) desiredTone ? localStorage.setItem(DESIRED_TONE_KEY, desiredTone) : localStorage.removeItem(DESIRED_TONE_KEY); }, [desiredTone, isLoaded]);
  useEffect(() => { if (isLoaded) desiredLength ? localStorage.setItem(DESIRED_LENGTH_KEY, desiredLength) : localStorage.removeItem(DESIRED_LENGTH_KEY); }, [desiredLength, isLoaded]);
  useEffect(() => { if (isLoaded) keyThemes ? localStorage.setItem(KEY_THEMES_KEY, keyThemes) : localStorage.removeItem(KEY_THEMES_KEY); }, [keyThemes, isLoaded]);
  useEffect(() => { if (isLoaded) adventureLanguage ? localStorage.setItem(ADVENTURE_LANGUAGE_KEY, adventureLanguage) : localStorage.removeItem(ADVENTURE_LANGUAGE_KEY); }, [adventureLanguage, isLoaded]); // Save language
  useEffect(() => { if (isLoaded) localStorage.setItem(CREATION_STEP_KEY, creationStep); }, [creationStep, isLoaded]);

  useEffect(() => { if (isLoaded) gameData ? localStorage.setItem(GAME_DATA_KEY, JSON.stringify(gameData)) : localStorage.removeItem(GAME_DATA_KEY); }, [gameData, isLoaded]);
  useEffect(() => { if (isLoaded) currentSceneId ? localStorage.setItem(CURRENT_SCENE_ID_KEY, currentSceneId) : localStorage.removeItem(CURRENT_SCENE_ID_KEY); }, [currentSceneId, isLoaded]);
  useEffect(() => { if (isLoaded) gameHistory.length > 0 ? localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(gameHistory)) : localStorage.removeItem(GAME_HISTORY_KEY); }, [gameHistory, isLoaded]);

  useEffect(() => { if (isLoaded) playerInventory.length > 0 ? localStorage.setItem(PLAYER_INVENTORY_KEY, JSON.stringify(playerInventory)) : localStorage.removeItem(PLAYER_INVENTORY_KEY); }, [playerInventory, isLoaded]);
  useEffect(() => { if (isLoaded) playerStatusEffects.length > 0 ? localStorage.setItem(PLAYER_STATUS_EFFECTS_KEY, JSON.stringify(playerStatusEffects)) : localStorage.removeItem(PLAYER_STATUS_EFFECTS_KEY); }, [playerStatusEffects, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(PLAYER_ALIGNMENT_KEY, JSON.stringify(playerAlignment)); }, [playerAlignment, isLoaded]); 

  useEffect(() => { if (isLoaded) localStorage.setItem(SAVED_ADVENTURES_KEY, JSON.stringify(savedAdventures)); }, [savedAdventures, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(SAVED_CHARACTERS_KEY, JSON.stringify(savedCharacters)); }, [savedCharacters, isLoaded]);

  const setStoryText = useCallback((text: string | null) => setStoryTextState(text), []);
  const setCharacterDescription = useCallback((desc: string | null) => setCharacterDescriptionState(desc), []);
  const setAnalysisResult = useCallback((result: AnalyzeSourceMaterialOutput | null) => setAnalysisResultState(result), []);
  const setNarrativeOutline = useCallback((outline: string | null) => setNarrativeOutlineState(outline), []);
  const setDesiredTone = useCallback((tone: DesiredTone) => setDesiredToneState(tone), []);
  const setDesiredLength = useCallback((length: DesiredLength) => setDesiredLengthState(length), []);
  const setKeyThemes = useCallback((themes: string | null) => setKeyThemesState(themes), []);
  const setAdventureLanguage = useCallback((lang: AdventureLanguage) => setAdventureLanguageState(lang), []); // New setter
  
  const setCreationStep = useCallback((step: CreationStep) => setCreationStepState(step), []);
  const setIsLoading = useCallback((loading: boolean) => setIsLoadingState(loading), []);
  const setError = useCallback((error: string | null) => setErrorState(error), []);

  const setCurrentSceneId = useCallback((id: string | null) => {
    setCurrentSceneIdState(id);
    if (id) {
      setGameHistoryState(prevHistory => {
        if (prevHistory[prevHistory.length - 1] !== id) {
            return [...prevHistory, id];
        }
        return prevHistory;
      });
    }
  }, []);

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
        setTimeout(() => {
          toast({ title: "Effect Triggered!", description: effect.description, className: "bg-accent text-accent-foreground" });
        }, 0);
      }
    });
  }, [addItemToInventory, removeItemFromInventory, addPlayerStatus, removePlayerStatus, toast]);

  const applyAlignmentShift = useCallback((shift?: number) => {
    if (typeof shift === 'number' && shift !== 0) {
      setPlayerAlignmentState(prev => {
        const newAlignment = prev + shift;
        setTimeout(() => {
         toast({ title: "Alignment Shift", description: `Your alignment shifted by ${shift}. New alignment: ${newAlignment}` });
        },0);
        return newAlignment;
      });
    }
  }, [toast]);

  const resetFullGame = useCallback(() => {
    resetCreationProgress(); // This now also resets adventureLanguage
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
    if (data && data.startSceneId && data.scenes[data.startSceneId]) {
      setCurrentSceneIdState(data.startSceneId);
      setGameHistoryState([data.startSceneId]);
      setPlayerInventoryState([]); 
      setPlayerStatusEffectsState([]); 
      setPlayerAlignmentState(0); 
      
      if (data.storyText) setStoryTextState(data.storyText);
      if (data.characterDescription) setCharacterDescriptionState(data.characterDescription);
      if (data.analysisResult) setAnalysisResultState(data.analysisResult);
      if (data.narrativeOutline) setNarrativeOutlineState(data.narrativeOutline);
      if (data.language) setAdventureLanguageState(data.language as AdventureLanguage); // Set language from imported gameData

    } else if (!data) { 
      setCurrentSceneIdState(null);
      setGameHistoryState([]);
      setPlayerInventoryState([]);
      setPlayerStatusEffectsState([]);
      setPlayerAlignmentState(0);
    } else if (data && (!data.startSceneId || !data.scenes[data.startSceneId])) {
      console.error("setGameDataInternal: Provided gameData has an invalid startSceneId. Clearing active game.");
      setGameDataState(null);
      setCurrentSceneIdState(null);
      setGameHistoryState([]);
      setPlayerInventoryState([]);
      setPlayerStatusEffectsState([]);
      setPlayerAlignmentState(0);
      setErrorState("Loaded adventure data is corrupted (invalid start scene). Please import again or create a new adventure.");
      setCreationStepState('error'); 
    }
  }, []);


  const saveAdventureToLibrary = useCallback((name: string): boolean => {
    if (!gameData) return false;

    const adventureToSave: GameData = {
      ...gameData,
      id: gameData.id || crypto.randomUUID(),
      adventureName: name,
      language: adventureLanguage, // Ensure language is saved with the adventure
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
    if (!gameData.id || gameData.adventureName !== adventureToSave.adventureName || gameData.language !== adventureToSave.language) {
        setGameDataState(prevGameData => ({
            ...prevGameData!, 
            id: adventureToSave.id, 
            adventureName: adventureToSave.adventureName,
            language: adventureToSave.language
        }));
    }
    return true;
  }, [gameData, adventureLanguage]);

  const loadAdventureFromLibrary = useCallback((adventureId: string): boolean => {
    const adventureToLoad = savedAdventures.find(adv => adv.id === adventureId);
    if (adventureToLoad) {
      setGameDataInternal(adventureToLoad); 
      if (adventureToLoad.language) { // Also set context language if present
        setAdventureLanguageState(adventureToLoad.language as AdventureLanguage);
      }
      setCreationStepState('generate'); 
      return true;
    }
    return false;
  }, [savedAdventures, setGameDataInternal, setAdventureLanguageState]);

  const deleteAdventureFromLibrary = useCallback((adventureId: string) => {
    setSavedAdventuresState(prevAdventures => prevAdventures.filter(adv => adv.id !== adventureId));
    if (gameData && gameData.id === adventureId) {
        setGameDataState(null);
        setCurrentSceneIdState(null);
        setGameHistoryState([]);
        setPlayerInventoryState([]);
        setPlayerStatusEffectsState([]);
        setPlayerAlignmentState(0);
        setCreationStepState('story'); 
    }
  }, [gameData]);

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

  const saveCharacterProfile = useCallback((characterData: Omit<CharacterProfile, 'id'> & { id?: string }): CharacterProfile => {
    const charId = characterData.id || crypto.randomUUID();
    const profileToSave: CharacterProfile = { ...characterData, id: charId } as CharacterProfile;

    setSavedCharactersState(prev => {
      const existingIndex = prev.findIndex(p => p.id === charId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = profileToSave;
        return updated;
      }
      return [...prev, profileToSave];
    });
    return profileToSave;
  }, []);

  const deleteCharacterProfile = useCallback((characterId: string) => {
    setSavedCharactersState(prev => prev.filter(p => p.id !== characterId));
  }, []);

  const getCharacterProfileById = useCallback((characterId: string): CharacterProfile | undefined => {
    return savedCharacters.find(p => p.id === characterId);
  }, [savedCharacters]);


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
      adventureLanguage, setAdventureLanguage, // Expose language

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

      savedCharacters,
      saveCharacterProfile,
      deleteCharacterProfile,
      getCharacterProfileById,

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

    