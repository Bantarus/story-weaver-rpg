
"use client";

import { useGame, type CharacterProfile } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Trash2, BookOpenText, PlusCircle, Frown, LibraryBig, Users, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LibraryPage() {
  const { 
    savedAdventures, loadAdventureFromLibrary, deleteAdventureFromLibrary,
    savedCharacters, deleteCharacterProfile
  } = useGame();
  const router = useRouter();
  const { toast } = useToast();

  const handlePlayAdventure = (adventureId: string) => {
    if (loadAdventureFromLibrary(adventureId)) {
      toast({
        title: "Adventure Loaded!",
        description: "Get ready to embark on your journey.",
        className: "bg-primary text-primary-foreground",
      });
      router.push('/play');
    } else {
      toast({
        variant: "destructive",
        title: "Error Loading Adventure",
        description: "Could not find or load the selected adventure. It might have been deleted.",
      });
    }
  };

  const handleDeleteAdventure = (adventureId: string) => {
    deleteAdventureFromLibrary(adventureId);
    toast({
      title: "Adventure Deleted",
      description: "The adventure has been removed from your library.",
    });
  };

  const handleDeleteCharacter = (characterId: string) => {
    deleteCharacterProfile(characterId);
    toast({
      title: "Character Deleted",
      description: "The character profile has been removed from your library.",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <LibraryBig size={36} /> Your Library
        </h2>
        <Link href="/create">
          <Button variant="outline" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Adventure
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="adventures" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adventures" className="text-base py-2.5">
            <BookOpenText className="mr-2 h-5 w-5" /> Saved Adventures
          </TabsTrigger>
          <TabsTrigger value="characters" className="text-base py-2.5">
            <Users className="mr-2 h-5 w-5" /> Saved Characters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adventures" className="mt-6">
          {savedAdventures.length === 0 ? (
            <Card className="text-center py-12 shadow-lg">
              <CardHeader>
                <Frown className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-2xl">Your Adventure Library is Empty</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg">
                  You haven&apos;t saved any adventures yet.
                </CardDescription>
                <p className="mt-2 text-muted-foreground">
                  Why not{" "}
                  <Link href="/create" className="font-semibold text-primary hover:underline">
                    weave a new tale
                  </Link>{" "}
                  and save it for later?
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedAdventures.map((adventure) => (
                <Card key={adventure.id} className="shadow-lg flex flex-col hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{adventure.adventureName || adventure.title || "Untitled Adventure"}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      ID: {adventure.id?.substring(0,8)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground line-clamp-4 h-[80px] overflow-hidden">
                        {adventure.scenes && adventure.startSceneId && adventure.scenes[adventure.startSceneId]
                          ? adventure.scenes[adventure.startSceneId].text
                          : "No preview available."}
                     </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAdventure(adventure.id!)} 
                      disabled={!adventure.id}
                      aria-label={`Delete ${adventure.adventureName || "adventure"}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5" size={16} /> Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePlayAdventure(adventure.id!)} 
                      disabled={!adventure.id}
                      aria-label={`Play ${adventure.adventureName || "adventure"}`}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Play className="mr-1.5" size={16} /> Play
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="characters" className="mt-6">
          {savedCharacters.length === 0 ? (
            <Card className="text-center py-12 shadow-lg">
              <CardHeader>
                <UserCog className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-2xl">Your Character Library is Empty</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg">
                  You haven&apos;t saved any characters yet.
                </CardDescription>
                <p className="mt-2 text-muted-foreground">
                  Go to the{" "}
                  <Link href="/create" className="font-semibold text-primary hover:underline">
                    adventure creation page
                  </Link>{" "}
                  to craft and save your protagonists!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCharacters.map((character: CharacterProfile) => (
                <Card key={character.id} className="shadow-lg flex flex-col hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{character.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{character.archetype}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground line-clamp-3 h-[60px] overflow-hidden">
                        {character.background || "No background provided."}
                     </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCharacter(character.id)}
                      aria-label={`Delete character ${character.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5" size={16} /> Delete
                    </Button>
                    {/* Future: Could add an "Edit" button here, or "Use for New Adventure" */}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    