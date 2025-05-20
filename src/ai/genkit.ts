
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama'; // Corrected import

// Note: For Ollama to work, the OLLAMA_HOST environment variable should be set
// if it's not running on the default http://127.0.0.1:11434.
// The specific Ollama model to use by default with the plugin can also be set via OLLAMA_MODEL.
// However, we will aim to specify the model dynamically in flow calls based on user settings.

export const ai = genkit({
  plugins: [
    googleAI(), // GOOGLE_API_KEY or GEMINI_API_KEY env var will be used
    ollama({
      // Default model and base URL for the plugin instance.
      // Flows can override the model with 'ollama/model-name'.
      // model: process.env.OLLAMA_DEFAULT_MODEL || 'llama2', // Example: if you want to make it env-configurable
      // baseUrl: process.env.OLLAMA_BASE_URL, // Example
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for ai.generate if not specified
});
