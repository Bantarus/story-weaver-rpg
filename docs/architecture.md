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
    -   Used for defining and running AI flows that interact with generative models (e.g., Gemini).
    -   Flows are defined as server actions in `src/ai/flows/`.
    -   Genkit configuration is in `src/ai/genkit.ts`.
-   **State Management:** React Context API (`src/context/GameContext.tsx`)
    -   Manages global game state, including user inputs for story/character creation, generated game data, current game progress, and persistence to `localStorage`.
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
    -   Provides static typing for improved code quality and maintainability.

## Project Structure Highlights

-   `src/app/`: Contains Next.js App Router pages (e.g., `/`, `/create`, `/play`).
-   `src/components/`: Reusable React components.
    -   `src/components/ui/`: ShadCN UI components.
-   `src/ai/`: Genkit related code.
    -   `src/ai/flows/`: Definitions for individual AI generation flows.
    -   `src/ai/genkit.ts`: Genkit initialization and configuration.
-   `src/context/`: React Context providers, primarily `GameContext.tsx`.
-   `src/lib/`: Utility functions and shared libraries (e.g., `utils.ts`, `mock-game-data.ts`).
-   `public/`: Static assets.
-   `docs/`: (This folder) Application documentation.

## Data Flow for Adventure Generation

1.  **User Input (`/create` page):** The user provides story text and character details.
2.  **AI Flow Invocation:**
    -   `analyzeSourceMaterial`: Analyzes the story text.
    -   `generateNarrativeOutline`: Creates a narrative outline based on the story and character.
    -   `formatGameDataJson`: Transforms the narrative outline into a structured JSON `GameData` object.
3.  **State Update:** The generated `GameData` is stored in `GameContext`.
4.  **Gameplay (`/play` page):** The game loads the `GameData` from `GameContext` to drive the interactive narrative.
5.  **Persistence:** `GameContext` handles saving relevant creation and game state to `localStorage`, allowing users to resume their session.
