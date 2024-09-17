import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-xl mx-auto p-4 flex h-20 items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Molokan Commentary
        </Link>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-[200px] md:w-[300px]"
            />
          </div>
          <Button variant="outline" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
