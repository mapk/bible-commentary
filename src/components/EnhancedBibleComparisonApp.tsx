"use client";

import React, { useState, useEffect } from "react";
import { BookList } from "./BookList";
import { fetchBibleBooks } from "@/lib/api";

export function EnhancedBibleComparisonApp() {
  // null until the fetch settles, so the entry animation runs once on the full
  // layout rather than on empty cards that then jump in height.
  const [bibleBooks, setBibleBooks] = useState<
    { id: string; name: string; testament: string }[] | null
  >(null);

  useEffect(() => {
    const loadBooks = async () => {
      const books = await fetchBibleBooks();
      setBibleBooks(books);
    };
    loadBooks();
  }, []);

  return (
    <div className="my-8">
      {bibleBooks && <BookList books={bibleBooks} />}
    </div>
  );
}
