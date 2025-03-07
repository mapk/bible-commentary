import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-xl mx-auto p-4 flex h-20 items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Bible Commentary
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/guide">Guide</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
