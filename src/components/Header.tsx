
"use client"; 

import Link from 'next/link';
import { BookOpenText, Library, Settings } from 'lucide-react'; // Added Settings
import { useGame } from '@/context/GameContext'; 
import { useRouter } from 'next/navigation';

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
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link 
            href="/library" 
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors px-2 sm:px-3 py-2 rounded-md hover:bg-muted/50 flex items-center gap-1.5"
          >
            <Library size={16} /> My Library
          </Link>
          <Link 
            href="/create" 
            onClick={handleCreateNewRPG} 
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors px-2 sm:px-3 py-2 rounded-md hover:bg-muted/50"
          >
            Create New RPG
          </Link>
          <Link 
            href="/settings" 
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors px-2 sm:px-3 py-2 rounded-md hover:bg-muted/50 flex items-center gap-1.5"
          >
            <Settings size={16} /> Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
