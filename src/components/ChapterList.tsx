"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchChapters } from "@/lib/api";

interface ChapterListProps {
  bookId: string;
  name: string;
}

export function ChapterList({ bookId, name }: ChapterListProps) {
  const [chapters, setChapters] = useState<number[]>([]);

  useEffect(() => {
    const loadChapters = async () => {
      const chapterList = await fetchChapters(bookId);
      setChapters(chapterList);
    };
    loadChapters();
  }, [bookId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>
      <div className="grid grid-cols-5 gap-4">
        {chapters.map((chapter) => (
          <Link
            key={chapter}
            href={`/book/${encodeURIComponent(bookId)}/chapter/${chapter}`}
          >
            <Button variant="secondary" className="w-full">
              Chapter {chapter}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
