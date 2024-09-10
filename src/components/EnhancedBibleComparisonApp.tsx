"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { BookList } from "./BookList";
import { fetchBibleBooks } from "@/lib/api";

export function EnhancedBibleComparisonApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bibleBooks, setBibleBooks] = useState<
    { id: string; name: string; testament: string }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const loadBooks = async () => {
      const books = await fetchBibleBooks();
      setBibleBooks(books);
    };
    loadBooks();
  }, []);

  const handleSearch = () => {
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Molokan Commentary</h1>

      <div className="flex mb-8">
        <Input
          type="text"
          placeholder="Search the Bible..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      <BookList books={bibleBooks} />
    </div>
  );
}
