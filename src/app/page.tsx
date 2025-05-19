
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookHeart, Wand2, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12">
      <section className="space-y-4 max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-amber-500 to-accent text-transparent bg-clip-text">
          Welcome to Story Weaver RPG
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Transform your favorite stories into personalized, text-based role-playing adventures.
          Provide a narrative, define your character, and let our AI weave a unique RPG experience just for you.
        </p>
        <Link href="/create">
          <Button size="lg" className="mt-6 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
            <Wand2 className="mr-2 h-6 w-6" />
            Start Weaving Your Tale
          </Button>
        </Link>
      </section>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <FeatureCard
          icon={<BookHeart className="h-10 w-10 text-primary" />}
          title="Your Story, Your World"
          description="Import any book, short story, or narrative text to serve as the foundation for your adventure."
        />
        <FeatureCard
          icon={<Users className="h-10 w-10 text-primary" />}
          title="Craft Your Hero"
          description="Define a unique character with their own archetype, background, and personal goals to embark on the journey."
        />
        <FeatureCard
          icon={<Wand2 className="h-10 w-10 text-primary" />}
          title="AI-Powered Adventure"
          description="Our intelligent system analyzes your story and character to generate a structured, branching narrative full of choices."
        />
      </section>
      
      <section className="w-full max-w-3xl pt-8">
        <Card className="shadow-xl overflow-hidden">
            <Image 
              src="https://placehold.co/800x400" 
              alt="Stylized image of an open book with glowing runes"
              data-ai-hint="fantasy book story"
              width={800} 
              height={400}
              className="w-full h-auto object-cover"
            />
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold mb-2">Ready to Begin?</h3>
            <p className="text-muted-foreground">
              Click the button above and let your imagination take the lead. The adventure of a lifetime, uniquely yours, awaits!
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-left shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {icon}
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
