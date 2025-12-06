"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { fetchCommentaryRequests, getUserProfile, type UserProfile } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  showChiasms?: boolean;
  onToggleChiasms?: (show: boolean) => void;
  onCreateChiasm?: () => void;
}

export default function Header({
  showChiasms = false,
  onToggleChiasms,
  onCreateChiasm,
}: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [requestCount, setRequestCount] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    const loadRequestCount = async () => {
      if (user) {
        const requests = await fetchCommentaryRequests();
        setRequestCount(requests.length);
      }
    };
    loadRequestCount();
  }, [user]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
        // Extract first name from username or email
        if (profile?.username) {
          const nameParts = profile.username.split(" ");
          setFirstName(nameParts[0] || profile.username);
        } else if (user.user_metadata?.full_name) {
          const nameParts = user.user_metadata.full_name.split(" ");
          setFirstName(nameParts[0] || user.user_metadata.full_name);
        } else if (user.email) {
          setFirstName(user.email.split("@")[0]);
        }
      }
    };
    loadUserProfile();
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
          {user && onToggleChiasms && (
            <div className="flex items-center space-x-2">
              <Switch
                id="show-chiasms"
                checked={showChiasms}
                onCheckedChange={onToggleChiasms}
              />
              <Label htmlFor="show-chiasms" className="cursor-pointer">
                Show Chiasms
              </Label>
            </div>
          )}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="capitalize">
                    {firstName || "User"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="flex flex-col space-y-2">
                    {onCreateChiasm && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={onCreateChiasm}
                      >
                        Create a Chiasm
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      Sign out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
