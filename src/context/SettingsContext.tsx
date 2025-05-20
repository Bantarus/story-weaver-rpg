
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AI_PROVIDER_KEY = 'storyWeaver_aiProvider';
const OLLAMA_MODEL_KEY = 'storyWeaver_ollamaModel';
const OLLAMA_BASE_URL_KEY = 'storyWeaver_ollamaBaseUrl';
const GOOGLE_API_KEY_USER_KEY = 'storyWeaver_googleApiKeyUser'; // For user-inputted key, not directly used by Genkit server config

export type AIProvider = 'googleAI' | 'ollama';

interface SettingsContextType {
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  ollamaBaseUrl: string;
  setOllamaBaseUrl: (url: string) => void;
  userGoogleApiKey: string; // Stored, but Genkit server uses env var
  setUserGoogleApiKey: (apiKey: string) => void;
  isSettingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [aiProvider, setAiProviderState] = useState<AIProvider>('googleAI');
  const [ollamaModel, setOllamaModelState] = useState<string>('llama2');
  const [ollamaBaseUrl, setOllamaBaseUrlState] = useState<string>('http://127.0.0.1:11434');
  const [userGoogleApiKey, setUserGoogleApiKeyState] = useState<string>('');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  useEffect(() => {
    const storedProvider = localStorage.getItem(AI_PROVIDER_KEY) as AIProvider | null;
    if (storedProvider) setAiProviderState(storedProvider);

    const storedOllamaModel = localStorage.getItem(OLLAMA_MODEL_KEY);
    if (storedOllamaModel) setOllamaModelState(storedOllamaModel);

    const storedOllamaBaseUrl = localStorage.getItem(OLLAMA_BASE_URL_KEY);
    if (storedOllamaBaseUrl) setOllamaBaseUrlState(storedOllamaBaseUrl);
    
    const storedUserGoogleApiKey = localStorage.getItem(GOOGLE_API_KEY_USER_KEY);
    if (storedUserGoogleApiKey) setUserGoogleApiKeyState(storedUserGoogleApiKey);

    setIsSettingsLoaded(true);
  }, []);

  useEffect(() => { if (isSettingsLoaded) localStorage.setItem(AI_PROVIDER_KEY, aiProvider); }, [aiProvider, isSettingsLoaded]);
  useEffect(() => { if (isSettingsLoaded) localStorage.setItem(OLLAMA_MODEL_KEY, ollamaModel); }, [ollamaModel, isSettingsLoaded]);
  useEffect(() => { if (isSettingsLoaded) localStorage.setItem(OLLAMA_BASE_URL_KEY, ollamaBaseUrl); }, [ollamaBaseUrl, isSettingsLoaded]);
  useEffect(() => { if (isSettingsLoaded) localStorage.setItem(GOOGLE_API_KEY_USER_KEY, userGoogleApiKey); }, [userGoogleApiKey, isSettingsLoaded]);


  const setAiProvider = useCallback((provider: AIProvider) => setAiProviderState(provider), []);
  const setOllamaModel = useCallback((model: string) => setOllamaModelState(model), []);
  const setOllamaBaseUrl = useCallback((url: string) => setOllamaBaseUrlState(url), []);
  const setUserGoogleApiKey = useCallback((apiKey: string) => setUserGoogleApiKeyState(apiKey), []);

  if (!isSettingsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <SettingsContext.Provider value={{
      aiProvider, setAiProvider,
      ollamaModel, setOllamaModel,
      ollamaBaseUrl, setOllamaBaseUrl,
      userGoogleApiKey, setUserGoogleApiKey,
      isSettingsLoaded,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
