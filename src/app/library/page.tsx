
"use client";

import { useState, useCallback } from 'react'; // Added useCallback
import { useGame, type CharacterProfile, type GameData } from '@/context/GameContext'; // Added GameData
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Play, Trash2, BookOpenText, PlusCircle, Frown, LibraryBig, Users, UserCog, UserCircle2, Edit3, Save, XCircle, Download } from 'lucide-react'; // Added Download
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const commonArchetypes = [
  "Wandering Scholar",
  "Cursed Knight",
  "Resourceful Scoundrel",
  "Mystic Scribe",
  "Stealthy Rogue",
  "Noble Paladin",
  "Wise Hermit",
  "Dashing Swashbuckler",
  "Pragmatic Mercenary",
  "Inquisitive Investigator"
];

export default function LibraryPage() {
  const { 
    savedAdventures, loadAdventureFromLibrary, deleteAdventureFromLibrary,
    savedCharacters, saveCharacterProfile, deleteCharacterProfile
  } = useGame();
  const router = useRouter();
  const { toast } = useToast();

  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editableCharacterData, setEditableCharacterData] = useState<Partial<Omit<CharacterProfile, 'id'>>>({});

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

  const handleExportAdventureFromLibrary = useCallback((adventureId: string) => {
    const adventureToExport = savedAdventures.find(adv => adv.id === adventureId);
    if (!adventureToExport) {
      toast({ variant: "destructive", title: "Cannot Export", description: "Adventure not found in library." });
      return;
    }
    try {
      const fileNameBase = adventureToExport.adventureName || adventureToExport.title || "story-weaver-adventure";
      const safeFileNameBase = fileNameBase.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
      const fileName = `${safeFileNameBase}_gamedata.json`;

      const jsonString = JSON.stringify(adventureToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      toast({ title: "Game Data Exported", description: `Saved as ${fileName}`, className: "bg-primary text-primary-foreground" });
    } catch (exportError) {
      console.error("Error exporting game data from library:", exportError);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export game data." });
    }
  }, [savedAdventures, toast]);

  const handleStartEditCharacter = (character: CharacterProfile) => {
    setEditingCharacterId(character.id);
    setEditableCharacterData({
      name: character.name,
      archetype: character.archetype,
      background: character.background,
      goals: character.goals,
    });
  };

  const handleCancelEditCharacter = () => {
    setEditingCharacterId(null);
    setEditableCharacterData({});
  };

  const handleSaveCharacterChanges = () => {
    if (!editingCharacterId || !editableCharacterData.name?.trim() || !editableCharacterData.archetype?.trim() || !editableCharacterData.background?.trim() || !editableCharacterData.goals?.trim()) {
      toast({ variant: "destructive", title: "Save Error", description: "All character fields must be filled." });
      return;
    }
    saveCharacterProfile({
      id: editingCharacterId,
      name: editableCharacterData.name.trim(),
      archetype: editableCharacterData.archetype.trim(),
      background: editableCharacterData.background.trim(),
      goals: editableCharacterData.goals.trim(),
    });
    toast({ title: "Character Updated", description: `"${editableCharacterData.name.trim()}" has been updated.`, className: "bg-primary text-primary-foreground" });
    handleCancelEditCharacter();
  };
  
  const handleEditableDataChange = (field: keyof Omit<CharacterProfile, 'id'>, value: string) => {
    setEditableCharacterData(prev => ({ ...prev, [field]: value }));
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
                  <CardFooter className="grid grid-cols-3 gap-2 border-t pt-4 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportAdventureFromLibrary(adventure.id!)}
                      disabled={!adventure.id}
                      aria-label={`Export ${adventure.adventureName || "adventure"}`}
                      className="col-span-1"
                    >
                      <Download className="mr-1.5 hidden sm:inline" size={16} /> Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAdventure(adventure.id!)} 
                      disabled={!adventure.id}
                      aria-label={`Delete ${adventure.adventureName || "adventure"}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive col-span-1"
                    >
                      <Trash2 className="mr-1.5 hidden sm:inline" size={16} /> Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePlayAdventure(adventure.id!)} 
                      disabled={!adventure.id}
                      aria-label={`Play ${adventure.adventureName || "adventure"}`}
                      className="bg-primary hover:bg-primary/90 col-span-1"
                    >
                      <Play className="mr-1.5 hidden sm:inline" size={16} /> Play
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
                  {editingCharacterId === character.id ? (
                    // EDIT MODE
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <UserCircle2 className="h-10 w-10 text-primary flex-shrink-0" />
                          <div className="flex-grow">
                            <Label htmlFor={`edit-char-name-${character.id}`}>Name</Label>
                            <Input
                              id={`edit-char-name-${character.id}`}
                              value={editableCharacterData.name || ''}
                              onChange={(e) => handleEditableDataChange('name', e.target.value)}
                              placeholder="Character Name"
                              className="text-base"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`edit-char-archetype-${character.id}`}>Archetype/Class</Label>
                          <Select
                            value={editableCharacterData.archetype || ''}
                            onValueChange={(value) => handleEditableDataChange('archetype', value)}
                          >
                            <SelectTrigger id={`edit-char-archetype-${character.id}`} className="text-base">
                              <SelectValue placeholder="Select archetype..." />
                            </SelectTrigger>
                            <SelectContent>
                              {commonArchetypes.map(archetype => (
                                <SelectItem key={archetype} value={archetype} className="text-base">
                                  {archetype}
                                </SelectItem>
                              ))}
                               {editableCharacterData.archetype && !commonArchetypes.includes(editableCharacterData.archetype) && (
                                <SelectItem value={editableCharacterData.archetype} className="text-base">
                                  {editableCharacterData.archetype} (Custom)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow pt-2 space-y-3">
                        <div>
                          <Label htmlFor={`edit-char-background-${character.id}`}>Background</Label>
                          <Textarea
                            id={`edit-char-background-${character.id}`}
                            value={editableCharacterData.background || ''}
                            onChange={(e) => handleEditableDataChange('background', e.target.value)}
                            placeholder="Background story..."
                            rows={4}
                            className="text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-char-goals-${character.id}`}>Goals</Label>
                          <Textarea
                            id={`edit-char-goals-${character.id}`}
                            value={editableCharacterData.goals || ''}
                            onChange={(e) => handleEditableDataChange('goals', e.target.value)}
                            placeholder="Personal goals..."
                            rows={3}
                            className="text-base"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center gap-2 border-t pt-4 mt-auto">
                        <Button variant="ghost" size="sm" onClick={handleCancelEditCharacter}>
                          <XCircle className="mr-1.5" size={16}/> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveCharacterChanges} className="bg-green-600 hover:bg-green-700 text-white">
                          <Save className="mr-1.5" size={16}/> Save Changes
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    // DISPLAY MODE
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <UserCircle2 className="h-10 w-10 text-primary flex-shrink-0" />
                          <CardTitle className="line-clamp-2 text-xl">{character.name}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="w-fit text-sm py-1">{character.archetype}</Badge>
                      </CardHeader>
                      <CardContent className="flex-grow pt-0 space-y-3">
                         <div>
                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Background:</Label>
                            <p className="text-sm text-foreground line-clamp-3 max-h-[60px] overflow-hidden">
                                {character.background || "No background provided."}
                            </p>
                         </div>
                         <div>
                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Goals:</Label>
                            <p className="text-sm text-foreground line-clamp-2 max-h-[40px] overflow-hidden">
                                {character.goals || "No goals provided."}
                            </p>
                         </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEditCharacter(character)}
                          aria-label={`Edit character ${character.name}`}
                        >
                          <Edit3 className="mr-1.5" size={16} /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCharacter(character.id)}
                          aria-label={`Delete character ${character.name}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="mr-1.5" size={16} /> Delete
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
    

    