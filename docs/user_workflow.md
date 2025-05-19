# User Workflow Implementation

This document maps the defined user workflow to the actual implementation in the application's pages and components.

## Phase 1: Adventure Setup & Generation

### 1. Landing on the Application
-   **Implementation:** `src/app/page.tsx`
-   **Details:** Displays a welcome message and a prominent "Start Weaving Your Tale" button (`<Link href="/create">`).
-   **Continuation:** Implicitly handled by `GameContext` loading state from `localStorage`. If `localStorage` contains data from a previous session, the user will resume from where they left off when navigating to `/create` or `/play`.

### 2. Starting a New Adventure - Input Phase
-   **Implementation:** `src/app/create/page.tsx`
-   **Details:**
    -   Presents a multi-step form driven by `creationStep` from `GameContext`.
    -   **Step 1 ('story'):** `Textarea` for `storyText`.
    -   **Step 2 ('character'):** `Input` fields for character name, archetype, background, and goals, which are combined into `characterDescription`.
    -   Inputs are stored in `GameContext` and persisted to `localStorage`.
-   **Missing Features from Workflow:** Generation Parameters (Tone, Length, Themes).

### 3. Initiating Adventure Generation
-   **Implementation:** `src/app/create/page.tsx` (buttons trigger AI flow calls)
-   **Details:**
    -   **"Analyze Story" button:** Calls `analyzeSourceMaterial` flow.
    -   **"Craft Character & Get Outline" button:** Calls `generateNarrativeOutline` flow.
    -   **"Weave Your RPG!" button:** Calls `formatGameDataJson` flow.
    -   Currently, if `USE_MOCK_GENERATION` is `true`, these calls are bypassed, and mock data/placeholders are used. After being set to `false`, actual Genkit server actions (AI flows) are invoked.
-   **Deviation from Workflow:** The workflow describes a single "Generate My Adventure!" button. The app uses a staged approach.

### 4. Generation In Progress - User Feedback
-   **Implementation:** `src/app/create/page.tsx`
-   **Details:**
    -   `Progress` component shows overall progress through the creation steps.
    -   `Loader2` (spinner) is shown on buttons during AI calls.
    -   Toast notifications (from `useToast`) announce completion of each stage.

## Phase 2: Gameplay

### 5. Adventure Ready - Game Start
-   **Implementation:** Navigation from `/create` to `src/app/play/page.tsx`
-   **Details:**
    -   `GameContext` holds the `gameData`.
    -   `/play` page uses `gameData.startSceneId` to display the initial scene.
    -   Scene title, narrative text, choices, visual/sound hints are rendered.

### 6. Gameplay Loop - Interaction & Progression
-   **Implementation:** `src/app/play/page.tsx`
-   **Details:**
    -   User reads scene text.
    -   Choices are rendered as `Button` components. Clicking a choice updates `currentSceneId` in `GameContext`.
    -   `GameContext` updates `gameHistory` with the new scene ID.
    -   The page re-renders to display the new scene.
-   **Missing Features from Workflow:** `effects` of choices (inventory, status).

### 7. Game State & Persistence
-   **Implementation:** `src/context/GameContext.tsx`
-   **Details:** All relevant game states (`gameData`, `currentSceneId`, `gameHistory`, creation inputs) are persisted to `localStorage`.

## Phase 3: Ending the Adventure & Replay

### 8. Reaching an Ending
-   **Implementation:** `src/app/play/page.tsx`
-   **Details:**
    -   Checks `currentScene.isEnding` or if `currentScene.choices` is empty.
    -   Displays ending message, including `currentScene.endingType`.

### 9. Post-Adventure Options
-   **Implementation:** `src/app/play/page.tsx` (on the ending screen)
-   **Details:**
    -   "Weave a New Adventure" button: Calls `resetFullGame()` and navigates to `/create`.
    -   "Restart Adventure" button: Calls `restartCurrentAdventure()` from `GameContext`.
    -   `GameHistoryDisplay` component: Shows the path taken.

### 10. Starting Over Mid-Game (User Choice)
-   **Implementation:**
    -   `src/components/Header.tsx`: "Create New RPG" link calls `resetFullGame()` and navigates to `/create`.
    -   The "Restart Adventure" button on the end screen of `/play` page.
