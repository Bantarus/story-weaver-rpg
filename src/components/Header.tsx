
"use client"; 

import Link from 'next/link';
import { BookOpenText, Library } from 'lucide-react';
import { useGame } from '@/context/GameContext'; 
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // For consistent styling if needed

export function Header() {
  const { resetFullGame } = useGame();
  const router = useRouter();

  const handleCreateNewRPG = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); 
    resetFullGame();    
    router.push('/create'); 
  };

  return (
    <header className="py-4 px-6 border-b border-border/50 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <BookOpenText size={28} />
          <span>Story Weaver RPG</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/library" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-muted/50 flex items-center gap-1.5"
          >
            <Library size={16} /> My Library
          </Link>
          <Link 
            href="/create" 
            onClick={handleCreateNewRPG} 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
          >
            Create New RPG
          </Link>
        </nav>
      </div>
    </header>
  );
}
