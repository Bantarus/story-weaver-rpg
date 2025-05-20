
# Application Architecture

The Story Weaver RPG is a web application built with a modern JavaScript stack designed for interactive and AI-powered experiences.

## Core Technologies

-   **Frontend Framework:** [Next.js](https://nextjs.org/) (with React)
    -   Utilizes the App Router for server components and client components.
    -   Handles routing, UI rendering, and client-side interactions.
-   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
    -   Provides a set of beautifully designed and accessible React components, built on top of Radix UI and Tailwind CSS.
    -   Customized via `globals.css` for theming.
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    -   A utility-first CSS framework for rapid UI development.
    -   Theme configuration is in `tailwind.config.ts` and `globals.css`.
-   **AI Integration:** [Genkit (Firebase Genkit)](https://firebase.google.com/docs/genkit)
    -   Used for defining and running AI flows that interact with generative models (e.g., Gemini, or local models via Ollama).
    *   Flows are defined as server actions in `src/ai/flows/`.
    *   Genkit configuration in `src/ai/genkit.ts` initializes Google AI and Ollama plugins.
    *   AI provider choice (Google AI / Ollama) and Ollama-specific settings (model, URL) are managed by `SettingsContext` and configurable on the `/settings` page.
    *   The language for AI-generated content is user-selectable and passed to AI flows.
-   **State Management:** React Context API
    -   `GameContext` (`src/context/GameContext.tsx`): Manages global game state, including user inputs for story/character creation, generated game data, current game progress (scene, history, inventory, status, alignment, adventure language), persistence to `localStorage`, and management of saved adventures and character profiles.
    -   `SettingsContext` (`src/context/SettingsContext.tsx`): Manages AI provider settings and persists them to `localStorage`.
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
    -   Provides static typing for improved code quality and maintainability.

## Project Structure Highlights

-   `src/app/`: Contains Next.js App Router pages (e.g., `/`, `/create`, `/play`, `/library`, `/settings`).
-   `src/components/`: Reusable React components.
    -   `src/components/ui/`: ShadCN UI components.
-   `src/ai/`: Genkit related code.
    -   `src/ai/flows/`: Definitions for individual AI generation flows.
    -   `src/ai/genkit.ts`: Genkit initialization and configuration.
-   `src/context/`: React Context providers (`GameContext.tsx`, `SettingsContext.tsx`).
-   `src/lib/`: Utility functions and shared libraries (e.g., `utils.ts`, `mock-game-data.ts`).
-   `public/`: Static assets.
-   `docs/`: (This folder) Application documentation.

## Data Flow for Adventure Generation

1.  **User Input (`/create` page):** The user provides story text, selects an adventure language, defines character details, and optionally sets advanced generation parameters (tone, length, themes). They can also load a saved character.
2.  **AI Provider Settings:** The application uses settings from `SettingsContext` (Google AI or Ollama) for AI calls.
3.  **AI Flow Invocation:**
    -   `analyzeSourceMaterial`: Analyzes the story text (considering the selected language).
    -   `generateNarrativeOutline`: Creates a narrative outline based on the story, character, language, and advanced parameters.
    -   `formatGameDataJson`: Transforms the narrative outline into a structured JSON `GameData` object, including scenes, choices, effects, alignment shifts, and generated in the selected language.
4.  **State Update:** The generated `GameData` (which includes the `language` used) is stored in `GameContext`. The user can save this adventure to their library or export it as JSON.
5.  **Gameplay (`/play` page):** The game loads the `GameData` from `GameContext` to drive the interactive narrative. Effects are applied, and alignment is tracked.
6.  **Persistence:** `GameContext` handles saving relevant creation and game state (including adventure language, inventory, status, alignment, game history, saved adventures, saved characters) to `localStorage`.
7.  **Playthrough Story Generation:** At the end of an adventure, the user can trigger the `generatePlaythroughStory` flow, which uses the game history, context, and selected language to create a narrative of their specific playthrough.

## Key Features

-   Personalized RPG generation from user-provided text.
-   Character creation with archetypes, background, and goals.
-   Advanced generation parameters (tone, length, themes).
-   Choice of AI providers (Google AI, Ollama) via settings.
-   **Multi-language support** for AI-generated content (user-selectable).
-   Interactive gameplay with branching narratives.
-   In-game effects (item acquisition/loss, status effects) and moral alignment tracking.
-   Persistence of current game progress and creation inputs using `localStorage`.
-   Adventure Library: Save, load, and delete generated adventures.
-   Character Library: Save, load, edit, and delete character profiles.
-   Export and Import of game data (JSON format, including language).
-   Generation of a narrative playthrough story at the end of an adventure.
