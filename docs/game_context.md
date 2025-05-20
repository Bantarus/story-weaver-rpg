
# Game Context & Settings Context

The application uses React Context for global state management.

## `GameContext.tsx`

The `GameContext` (defined in `src/context/GameContext.tsx`) is the central hub for managing global application state related to game creation and gameplay. It uses React's Context API and `useState` / `useEffect` hooks for state management and `localStorage` for persistence.

### Purpose

-   To provide a single source of truth for data shared across different components and pages.
-   To persist user progress (adventure creation, gameplay, saved libraries) across browser sessions.

### Key States Managed

-   **Creation Inputs & Parameters:**
    -   `storyText`: The source story text provided by the user.
    -   `characterDescription`: The combined description of the player character.
    -   `analysisResult`: The output from the `analyzeSourceMaterial` AI flow.
    -   `narrativeOutline`: The output from the `generateNarrativeOutline` AI flow.
    -   `creationStep`: The current step in the adventure creation process (`story`, `character`, `generate`, `error`).
    -   `desiredTone`: User's preference for narrative tone.
    -   `desiredLength`: User's preference for narrative length/complexity.
    -   `keyThemes`: User's preference for themes to emphasize.
    -   `adventureLanguage`: The language selected by the user for AI generation (e.g., "en-US", "es-ES").
-   **Game Data & Gameplay State:**
    -   `gameData`: The structured `GameData` object for the current adventure (includes the language it was generated in).
    -   `currentSceneId`: The ID of the scene currently being displayed.
    -   `gameHistory`: An array of scene IDs, tracking the player's path.
    -   `playerInventory`: An array of strings representing items the player possesses.
    -   `playerStatusEffects`: An array of strings representing active status effects on the player.
    -   `playerAlignment`: A number representing the player's moral alignment score.
-   **Library States:**
    -   `savedAdventures`: An array of `GameData` objects representing adventures saved by the user.
    -   `savedCharacters`: An array of `CharacterProfile` objects representing characters saved by the user.
-   **UI State:**
    -   `isLoading`: Boolean flag to indicate if an AI operation is in progress.
    -   `error`: String to store any error messages from AI operations.

### Persistence with `localStorage`

-   Each key piece of state is associated with a unique `localStorage` key.
-   **Loading:** On initial mount of `GameProvider`, `useEffect` hooks load these states from `localStorage`.
-   **Saving:** `useEffect` hooks monitor changes to these state variables and save them to `localStorage`.
-   **Clearing:**
    -   `resetCreationProgress()`: Clears `localStorage` entries related to adventure creation inputs, including `adventureLanguage`.
    -   `resetFullGame()`: Clears active game and creation state `localStorage` entries (but not the saved libraries).
    -   `restartCurrentAdventure()`: Resets `currentSceneId`, `gameHistory`, and player states for the *current* adventure.

### Key Functions Provided by the Context

-   **State Setters:** Standard setter functions for all managed states, including `setAdventureLanguage`.
-   **Effect & Alignment Application:**
    -   `applyEffects(effectsToApply?: Effect[])`: Processes an array of effects to update `playerInventory` and `playerStatusEffects`.
    -   `applyAlignmentShift(shift?: number)`: Updates `playerAlignment`.
-   **Library Management:**
    -   `saveAdventureToLibrary(name: string)`: Saves or updates the current `gameData` to the `savedAdventures` list. Ensures `adventureLanguage` is part of the saved `gameData`.
    -   `loadAdventureFromLibrary(adventureId: string)`: Loads an adventure from the library as the active game. Sets `adventureLanguage` from the loaded game.
    -   `deleteAdventureFromLibrary(adventureId: string)`: Removes an adventure from the library.
    -   `isAdventureInLibrary(adventureId?: string)`: Checks if an adventure is in the library.
    -   `saveCharacterProfile(...)`: Saves or updates a character profile in the `savedCharacters` list.
    -   `deleteCharacterProfile(characterId: string)`: Removes a character from the library.
    -   `getCharacterProfileById(characterId: string)`: Retrieves a character profile by ID.
-   **Reset Functions:**
    -   `resetCreationProgress()`: Resets state related to the initial setup stages.
    -   `resetFullGame()`: Resets all active game and creation state.
    -   `restartCurrentAdventure()`: Resets the current game to its starting scene, clearing player inventory, status, and alignment.

## `SettingsContext.tsx`

The `SettingsContext` (defined in `src/context/SettingsContext.tsx`) manages user preferences for AI provider selection.

### Purpose

-   To allow users to choose between different AI providers (Google AI, Ollama).
-   To store and persist Ollama-specific settings (model name, base URL).

### Key States Managed

-   `aiProvider`: The selected AI provider (`'googleAI'` or `'ollama'`).
-   `ollamaModel`: The name of the Ollama model to use.
-   `ollamaBaseUrl`: The base URL for the Ollama server.
-   `userGoogleApiKey`: User-inputted Google API key (primarily for reference/future client-side use).

### Persistence

-   These settings are saved to `localStorage` and loaded on application start.

### Usage

Components that need to know the AI settings (like `CreatePage` when calling AI flows) use the `useSettings()` hook. Configuration is done via the `/settings` page.

The entire application is wrapped in `<SettingsProvider>` and `<GameProvider>` in `src/app/layout.tsx`.
