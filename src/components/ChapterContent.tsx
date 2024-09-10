"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchChapterContent } from "@/lib/api";

interface ChapterContentProps {
  bookName: string;
  chapterNumber: number;
}

interface Verse {
  id: string;
  reference: string;
  text: string;
}

export function ChapterContent({
  bookName,
  chapterNumber,
}: ChapterContentProps) {
  const [verses, setVerses] = useState<Verse[]>([]);

  useEffect(() => {
    const loadChapterContent = async () => {
      const content = await fetchChapterContent(bookName, chapterNumber);
      setVerses(content);
    };
    loadChapterContent();
  }, [bookName, chapterNumber]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {bookName} - Chapter {chapterNumber}
      </h1>
      <Card>
        <CardContent className="p-4">
          {verses.map((verse) => (
            <div key={verse.id} className="mb-4">
              <span className="font-bold mr-2">{verse.reference}</span>
              <span>{verse.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
