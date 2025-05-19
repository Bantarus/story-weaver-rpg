
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 px-6 border-b border-border/50 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <BookOpenText size={28} />
          <span>Story Weaver RPG</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/create" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Create New RPG
          </Link>
          {/* Add other navigation links if needed */}
        </nav>
      </div>
    </header>
  );
}
