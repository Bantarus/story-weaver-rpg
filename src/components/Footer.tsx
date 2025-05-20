
// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/50 shadow-sm bg-background/70 backdrop-blur-md">
      <div className="container mx-auto px-6 py-8 text-center text-muted-foreground">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-4">
          <Link href="/terms-of-service" className="text-sm hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          {/* Add other links like Contact, FAQ, etc. here if needed */}
        </div>
        <p className="text-sm">
          &copy; {currentYear} Story Weaver RPG. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Create your own personalized text-based RPG adventures!
        </p>
      </div>
    </footer>
  );
}
