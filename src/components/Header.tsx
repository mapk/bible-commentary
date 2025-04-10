"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { fetchCommentaryRequests } from "@/lib/api";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const loadRequestCount = async () => {
      if (user) {
        const requests = await fetchCommentaryRequests();
        setRequestCount(requests.length);
      }
    };
    loadRequestCount();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-xl mx-auto p-4 flex h-20 items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Bible Commentary
        </Link>
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px]"
            />
          </form>
          <Button variant="outline" asChild>
            <Link href="/about">About</Link>
          </Button>
          {user ? (
            <>
              <Button variant="outline" asChild className="relative">
                <Link href="/requests">
                  Requests
                  {requestCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {requestCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="default" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
