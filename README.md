# Story Weaver RPG

Turn any piece of writing into a playable, branching text RPG.

Paste in source material — a short story, a scene, a premise — describe a character,
and a multi-stage AI pipeline turns it into a structured adventure you can actually
play: scenes, choices, items, status effects and a moral alignment that shifts with
your decisions. When you reach an ending, it writes the story of *your* particular
playthrough back to you.

## Features

- **Adventure generation** from arbitrary user-supplied text
- **Character creation** with archetypes, background and goals
- **Advanced generation controls** — tone, length and themes
- **Branching gameplay** with in-game effects: items gained and lost, status effects, and moral alignment tracking
- **Multi-language adventures** — English, Spanish, French and German (`en-US`, `es-ES`, `fr-FR`, `de-DE`)
- **Adventure library** — save, load and delete generated adventures
- **Character library** — save, load, edit and reuse character profiles
- **Playthrough story** — at the end of a run, generate a prose narrative of the choices you actually made
- **JSON import/export** of game data
- **Pluggable AI backend** — Google Gemini, or a fully local model via [Ollama](https://ollama.com)

Everything persists to `localStorage`. There is no backend database and no account system.

## How it works

Generation runs as four Genkit flows, in sequence:

| Stage | Flow | Does |
|---|---|---|
| 1 | `analyzeSourceMaterial` | Extracts plot points, characters, settings, themes and tone from your text |
| 2 | `generateNarrativeOutline` | Weaves your character into that material — challenges, encounters, climax, resolution |
| 3 | `formatGameDataJson` | Turns the outline into a structured `GameData` object: scenes, choices, transitions, effects |
| 4 | `generatePlaythroughStory` | *(after play)* Renders your run's history as a narrative |

Flows live in [`src/ai/flows/`](src/ai/flows/) and run as Next.js server actions.

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · ShadCN UI · Genkit · Zod

## Getting started

**Prerequisites:** Node.js 20+, and a [Google AI API key](https://aistudio.google.com/apikey) (or a running Ollama instance).

```bash
npm install
```

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_key_here
```

`.env*` is gitignored — never commit your key.

Run the app and the Genkit dev server in two terminals:

```bash
npm run dev          # app on http://localhost:9002
npm run genkit:dev   # Genkit developer UI
```

### Using Ollama instead

No API key needed. Point the app at a local model in **Settings** → AI provider → Ollama,
where you can set the model name and base URL (defaults to `http://127.0.0.1:11434`).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server with Turbopack, port 9002 |
| `npm run genkit:dev` | Genkit dev server for inspecting flows |
| `npm run genkit:watch` | Genkit dev server, watch mode |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js lint |

## Project structure

```
src/
  app/          Next.js App Router pages — /, /create, /play, /library, /settings
  ai/
    flows/      Genkit generation flows (server actions)
    genkit.ts   Genkit init: Google AI + Ollama plugins
  components/   React components (ui/ is ShadCN)
  context/      GameContext (game state) · SettingsContext (AI provider)
  lib/          Utilities and mock game data
docs/           Architecture and implementation notes
```

## Deploying

⚠️ The four AI flows are **unauthenticated Next.js server actions**. If you deploy this
publicly with a server-side `GEMINI_API_KEY`, anyone who finds the site can invoke
generation and spend your API quota. Before hosting it for real, add authentication,
rate limiting, or both — or run it locally against Ollama.

## Documentation

Deeper notes live in [`docs/`](docs/):

- [Architecture](docs/architecture.md)
- [AI flows](docs/ai_flows.md)
- [Game data structure](docs/game_data_structure.md)
- [Game & settings context](docs/game_context.md)
- [User workflow](docs/user_workflow.md)

## License

Apache License 2.0 — see [LICENSE](LICENSE).
