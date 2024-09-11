"use client";

import React, { useState, useEffect } from "react";
import { BookList } from "./BookList";
import { fetchBibleBooks } from "@/lib/api";

export function EnhancedBibleComparisonApp() {
  const [bibleBooks, setBibleBooks] = useState<
    { id: string; name: string; testament: string }[]
  >([]);

  useEffect(() => {
    const loadBooks = async () => {
      const books = await fetchBibleBooks();
      setBibleBooks(books);
    };
    loadBooks();
  }, []);

  return (
    <div className="my-8">
      <BookList books={bibleBooks} />
    </div>
  );
}
