
# User Workflow Implementation

This document maps the defined user workflow to the actual implementation in the application's pages and components.

## Phase 1: Adventure Setup & Generation

### 1. Landing on the Application
-   **Implementation:** `src/app/page.tsx`
-   **Details:** Displays a welcome message and "Start Weaving Your Tale" button (`<Link href="/create">`).
-   **Continuation:** `GameContext` loads state from `localStorage`. If a previous session exists (creation inputs or active game), the user can resume from where they left off.

### 2. Starting a New Adventure - Input Phase (`/create` page)
-   **Implementation:** `src/app/create/page.tsx`
-   **Details:**
    -   Presents a multi-step form driven by `creationStep` from `GameContext`.
    -   **Import Adventure:** User can import a `GameData` JSON file (which may include language info), bypassing subsequent generation steps.
    -   **Step 1 ('story'):**
        -   `Select` dropdown for "Adventure Language."
        -   `Textarea` for `storyText`.
    -   **Step 2 ('character'):**
        -   Input fields for character name, archetype, background, and goals (combined into `characterDescription`).
        -   **Character Library:** User can load a character profile from their library or save the current character to the library.
        -   **Advanced Generation Parameters:** Optional inputs for "Desired Tone," "Desired Length," and "Key Themes to Emphasize."
    -   Inputs are stored in `GameContext` and persisted to `localStorage`.

### 3. Initiating Adventure Generation (`/create` page)
-   **Implementation:** Buttons trigger AI flow calls based on `aiProvider` settings from `SettingsContext` and `adventureLanguage` from `GameContext`.
    -   **"Analyze Story" button:** Calls `analyzeSourceMaterial` flow (passes language).
    -   **"Craft Character & Get Outline" button:** Calls `generateNarrativeOutline` flow (passes advanced parameters and language).
    -   **"Weave Your RPG!" button:** Calls `formatGameDataJson` flow (passes language).
    -   If `USE_MOCK_GENERATION` is `true`, AI calls are bypassed, and mock data is used (mock data also includes a language field).
-   **Post-Generation Options:** After `gameData` is ready (and includes language):
    -   User can "Save to Library" (prompts for a name).
    -   User can "Export Game Data" as JSON (includes language).
    -   User can "Play Now."

### 4. Generation In Progress - User Feedback (`/create` page)
-   **Implementation:**
    -   `Progress` component shows overall progress.
    -   `Loader2` (spinner) shown on buttons during AI calls.
    -   Toast notifications announce completion of each stage or errors.

## Phase 2: Gameplay (`/play` page)

### 5. Adventure Ready - Game Start
-   **Implementation:** Navigation from `/create` to `src/app/play/page.tsx`.
-   **Details:**
    -   `GameContext` holds the `gameData` (including its language).
    -   `/play` page uses `gameData.startSceneId` to display the initial scene.
    -   Scene title, narrative text, choices, visual/sound hints are rendered.
    -   Effects defined for the starting scene (if any) are applied (inventory, status).

### 6. Gameplay Loop - Interaction & Progression
-   **Implementation:** `src/app/play/page.tsx`
-   **Details:**
    -   User reads scene text.
    -   Choices are rendered as `Button` components.
    -   Clicking a choice:
        -   Applies any `effects` defined for that choice (inventory, status).
        -   Applies any `alignmentEffect` defined for that choice, updating `playerAlignment`.
        -   Updates `currentSceneId` in `GameContext`.
    -   `GameContext` updates `gameHistory` with the new scene ID.
    -   The page re-renders to display the new scene.
    -   Player inventory, status effects, and alignment are displayed.

### 7. Game State & Persistence
-   **Implementation:** `src/context/GameContext.tsx`
-   **Details:** All relevant states (`gameData` (including language), `currentSceneId`, `gameHistory`, creation inputs (including `adventureLanguage`), `playerInventory`, `playerStatusEffects`, `playerAlignment`, `savedAdventures`, `savedCharacters`) are persisted to `localStorage`.

## Phase 3: Ending the Adventure & Replay

### 8. Reaching an Ending (`/play` page)
-   **Implementation:**
    -   Checks `currentScene.isEnding` or if `currentScene.choices` is empty.
    -   Displays ending message, including `currentScene.endingType`.
    -   Displays final player inventory, status effects, and alignment.
    -   `GameHistoryDisplay` component shows the path taken.

### 9. Post-Adventure Options (`/play` page, on ending screen)
-   **Implementation:**
    -   **"Generate My Story" button:** Calls `generatePlaythroughStory` AI flow (passes `adventureLanguage` from context). The generated story is shown in a dialog and can be downloaded as a `.txt` file.
    -   **"Restart Adventure" button:** Calls `restartCurrentAdventure()` from `GameContext`.
    -   **"Weave a New Adventure" button:** Calls `resetFullGame()` and navigates to `/create`.

### 10. Starting Over Mid-Game (User Choice)
-   **Implementation:**
    -   `src/components/Header.tsx`: "Create New RPG" link calls `resetFullGame()` and navigates to `/create`.
    -   The "Restart Adventure" button on the end screen of `/play` page.

## Phase 4: Library Management (`/library` page)

### 11. Accessing the Library
-   **Implementation:** User navigates to `/library` via the `Header`.
-   **Details:**
    -   **Saved Adventures Tab:**
        -   Lists all adventures saved by the user.
        -   Each adventure card shows title/name and snippet.
        -   Options: "Play" (loads into `GameContext`, including its language, and navigates to `/play`), "Delete," "Export Game Data."
    -   **Saved Characters Tab:**
        -   Lists all character profiles saved by the user.
        -   Each character card shows name, archetype, background, goals.
        -   Options: "Edit" (allows in-place modification of character details), "Delete."

## Phase 5: AI Settings (`/settings` page)

### 12. Configuring AI Provider
-   **Implementation:** User navigates to `/settings` via the `Header`.
-   **Details:**
    -   User can select AI Provider (`Google AI` or `Ollama`).
    -   If Ollama is selected, user can input Ollama model name and base URL.
    -   Settings are persisted in `localStorage` via `SettingsContext`.
