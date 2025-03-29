"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchChapters } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface ChapterListProps {
  bookId: string;
  name: string;
}

interface ChapterWithCount {
  number: number;
  commentaryCount: number;
}

export function ChapterList({ bookId, name }: ChapterListProps) {
  const [chapters, setChapters] = useState<ChapterWithCount[]>([]);

  useEffect(() => {
    const loadChaptersWithCommentary = async () => {
      // Fetch chapters
      const chapterList = await fetchChapters(bookId);

      // Get commentary counts for each chapter
      const { data: commentaryCounts } = await supabase
        .from("commentary")
        .select("chapter", { count: "exact" })
        .eq("book", bookId);

      // Create a map of chapter to count
      const countMap =
        commentaryCounts?.reduce((acc, curr) => {
          acc.set(curr.chapter, (acc.get(curr.chapter) || 0) + 1);
          return acc;
        }, new Map<number, number>()) || new Map<number, number>();

      // Combine chapters with their counts
      const chaptersWithCounts = chapterList
        .filter((chapter) => !isNaN(Number(chapter)))
        .map((chapter) => ({
          number: Number(chapter),
          commentaryCount: countMap.get(Number(chapter)) || 0,
        }));

      setChapters(chaptersWithCounts);
    };

    loadChaptersWithCommentary();
  }, [bookId]);

  return (
    <div className="">
      <h1 className="text-3xl font-bold my-8">{name}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {chapters.map((chapter) => (
          <Link
            key={chapter.number}
            href={`/book/${encodeURIComponent(bookId)}/chapter/${
              chapter.number
            }`}
          >
            <Button variant="secondary" className="w-full relative">
              <span>Chapter {chapter.number}</span>
              {chapter.commentaryCount > 0 && (
                <span className="absolute right-3 text-xs text-white bg-slate-300 rounded-full px-2 py-0.5">
                  {chapter.commentaryCount}
                </span>
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
