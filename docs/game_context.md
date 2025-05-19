# Game Context & State Management (`GameContext.tsx`)

The `GameContext` (defined in `src/context/GameContext.tsx`) is the central hub for managing global application state related to game creation and gameplay. It uses React's Context API and `useState` / `useEffect` hooks for state management and `localStorage` for persistence.

## Purpose

-   To provide a single source of truth for data shared across different components and pages (e.g., `/create`, `/play`, `Header`).
-   To persist user progress (both in adventure creation and gameplay) across browser sessions.

## Key States Managed

-   **Creation Inputs:**
    -   `storyText`: The source story text provided by the user.
    -   `characterDescription`: The combined description of the player character.
    -   `analysisResult`: The output from the `analyzeSourceMaterial` AI flow.
    -   `narrativeOutline`: The output from the `generateNarrativeOutline` AI flow.
    -   `creationStep`: The current step in the adventure creation process (`story`, `character`, `generate`, `error`).
-   **Game Data & Gameplay State:**
    -   `gameData`: The structured `GameData` object for the current adventure (either from AI generation or mock data).
    -   `currentSceneId`: The ID of the scene currently being displayed to the player.
    -   `gameHistory`: An array of scene IDs, tracking the player's path through the adventure.
-   **UI State:**
    -   `isLoading`: Boolean flag to indicate if an AI operation is in progress.
    -   `error`: String to store any error messages from AI operations.

## Persistence with `localStorage`

-   Each key piece of state (e.g., `storyText`, `gameData`, `currentSceneId`, `gameHistory`) is associated with a unique `localStorage` key.
-   **Loading:** On initial mount of the `GameProvider`, `useEffect` hooks attempt to load these states from `localStorage`.
-   **Saving:** `useEffect` hooks also monitor changes to these state variables. When a state variable changes, its new value is saved to `localStorage`.
-   **Clearing:**
    -   `resetCreationProgress()`: Clears `localStorage` entries related to the adventure creation inputs.
    -   `resetFullGame()`: Clears all game-related `localStorage` entries, allowing the user to start completely fresh.
    -   `restartCurrentAdventure()`: Resets `currentSceneId` and `gameHistory` for the *current* adventure, and their `localStorage` entries are updated accordingly.

## Key Functions Provided by the Context

-   **State Setters:** Standard setter functions for all managed states (e.g., `setStoryText`, `setGameData`, `setCurrentSceneId`). These are memoized with `useCallback` to prevent unnecessary re-renders of consumer components.
-   **Reset Functions:**
    -   `resetCreationProgress()`: Resets state related to the initial setup stages.
    -   `resetFullGame()`: Resets all game and creation state.
    -   `restartCurrentAdventure()`: Resets the current game to its starting scene.

## Usage

Components that need access to or need to modify this global state can use the `useGame()` hook.

```typescript
import { useGame } from '@/context/GameContext';

function MyComponent() {
  const { gameData, currentSceneId, setCurrentSceneId, error } = useGame();
  // ... component logic
}
```

The entire application is wrapped in `<GameProvider>` in `src/app/layout.tsx` to make the context available to all pages and components.
