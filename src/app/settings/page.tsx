
"use client";

import { useSettings, type AIProvider } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Save, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const {
    aiProvider, setAiProvider,
    ollamaModel, setOllamaModel,
    ollamaBaseUrl, setOllamaBaseUrl,
    userGoogleApiKey, setUserGoogleApiKey,
  } = useSettings();
  const { toast } = useToast();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Settings are saved to localStorage automatically by the context's useEffect hooks.
    // This function primarily serves to provide user feedback.
    toast({
      title: "Settings Saved",
      description: "Your AI provider settings have been updated.",
      className: "bg-primary text-primary-foreground",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <SlidersHorizontal size={36} className="text-primary" />
        <h2 className="text-3xl font-bold text-primary">AI Settings</h2>
      </div>

      <form onSubmit={handleSaveSettings}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configure AI Provider</CardTitle>
            <CardDescription>Choose your preferred AI model provider and configure its settings. Changes are saved automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="aiProvider">AI Provider</Label>
              <Select value={aiProvider} onValueChange={(value: AIProvider) => setAiProvider(value)}>
                <SelectTrigger id="aiProvider">
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="googleAI">Google AI (Gemini)</SelectItem>
                  <SelectItem value="ollama">Ollama (Local LLM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aiProvider === 'ollama' && (
              <>
                <div>
                  <Label htmlFor="ollamaModel">Ollama Model Name</Label>
                  <Input
                    id="ollamaModel"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="e.g., llama2, mistral, llama3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the name of the Ollama model you have pulled and want to use (e.g., "mistral:latest", "llama3:8b").
                  </p>
                </div>
                <div>
                  <Label htmlFor="ollamaBaseUrl">Ollama Base URL</Label>
                  <Input
                    id="ollamaBaseUrl"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="e.g., http://127.0.0.1:11434"
                  />
                   <p className="text-xs text-muted-foreground mt-1">
                    The URL where your Ollama server is running.
                  </p>
                </div>
              </>
            )}

            {aiProvider === 'googleAI' && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 !text-blue-700" />
                <AlertTitle className="text-blue-800">Using Google AI (Gemini)</AlertTitle>
                <AlertDescription className="text-blue-700 space-y-2">
                  <p>
                    This application will use Google's Gemini models. By default, it relies on an API key configured on the server (usually via the <code>GEMINI_API_KEY</code> or <code>GOOGLE_API_KEY</code> environment variable).
                  </p>
                  <p>
                    If you wish to use your own Google AI API key for server-side generation, you must set it as an environment variable before starting the application server.
                  </p>
                  <div>
                    <Label htmlFor="userGoogleApiKey" className="text-blue-800">Your Google API Key (for reference/client-side use if needed in future)</Label>
                    <Input
                        id="userGoogleApiKey"
                        type="password"
                        value={userGoogleApiKey}
                        onChange={(e) => setUserGoogleApiKey(e.target.value)}
                        placeholder="Paste your Google API Key here"
                        className="bg-white"
                    />
                    <p className="text-xs mt-1">
                        Note: For server-side AI flows, the environment variable method is primary. Storing it here is for potential future client-side features or reference.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save Settings & Show Confirmation
            </Button>
          </CardFooter>
        </Card>
      </form>
       <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ensure your selected Ollama model is downloaded and Ollama server is running if you choose Ollama.</li>
              <li>Changes to AI provider settings are saved locally in your browser.</li>
              <li>For Google AI, the server-side API key (set via environment variable) takes precedence for Genkit flows.</li>
            </ul>
          </AlertDescription>
        </Alert>
    </div>
  );
}
