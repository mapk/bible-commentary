"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchChapters, fetchChiasmsForBook } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useChiasm } from "@/contexts/ChiasmContext";
import { AlignRight } from "lucide-react";

interface ChapterListProps {
  bookId: string;
  name: string;
}

interface ChapterWithCount {
  number: number;
  commentaryCount: number;
  hasChiasm: boolean;
}

export function ChapterList({ bookId, name }: ChapterListProps) {
  const { showChiasms } = useChiasm();
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

      // Get chapters with chiasms if enabled
      let chaptersWithChiasms: string[] = [];
      if (showChiasms) {
        chaptersWithChiasms = await fetchChiasmsForBook(bookId);
      }

      // Combine chapters with their counts
      const chaptersWithCounts = chapterList
        .filter((chapter) => !isNaN(Number(chapter)))
        .map((chapter) => ({
          number: Number(chapter),
          commentaryCount: countMap.get(Number(chapter)) || 0,
          hasChiasm: chaptersWithChiasms.includes(String(chapter)),
        }));

      setChapters(chaptersWithCounts);
    };

    loadChaptersWithCommentary();
  }, [bookId, showChiasms]);

  return (
    <div className="">
      <h1 className="text-2xl font-bold my-8">{name}</h1>
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
              <div className="absolute right-3 flex items-center gap-1">
                {showChiasms && chapter.hasChiasm && (
                  <AlignRight className="h-4 w-4 text-purple-500" />
                )}
                {chapter.commentaryCount > 0 && (
                  <span className="text-xs text-white bg-slate-300 rounded-full px-2 py-0.5">
                    {chapter.commentaryCount}
                  </span>
                )}
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
