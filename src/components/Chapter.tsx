"use client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchCommentary } from "@/lib/api";

function extractBibleVerses(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const verses: { number: number; verse: string }[] = [];
  let verse: { number: number; verse: string } = { number: 0, verse: "" };
  const p = doc.getElementsByTagName("p");
  for (let paraNode = 0; paraNode < p.length; paraNode++) {
    const para = p.item(paraNode);
    para?.childNodes.forEach((node) => {
      if (node.nodeName === "SPAN") {
        const el = node as Element;
        const verseNumber = el.getAttribute("data-number");
        if (verseNumber) {
          verse = {
            number: parseInt(verseNumber),
            verse: "",
          };
          verses.push(verse);
        } else {
          const text = node.textContent?.trim();
          if (text) {
            verse.verse = (verse.verse || "") + text;
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        verse.verse = (verse.verse || "") + node.textContent;
      }
    });
  }
  return verses;
}

function Verse({
  children,
  number,
  onClick,
  selected,
}: {
  children: React.ReactNode;
  number: number;
  onClick: (number: number) => void;
  selected: boolean;
}) {
  return (
    <div
      onClick={() => onClick(number)}
      className={`p-2 rounded-lg transition-colors ${
        selected ? "bg-slate-100" : "hover:bg-slate-50"
      } cursor-pointer`}
    >
      <sup className="mr-2 text-slate-500">{number}</sup>
      {children}
    </div>
  );
}

interface Commentary {
  id: number;
  book: string;
  chapter: number;
  verse_range: string;
  commentary_author: string;
  commentary_text: string;
  created_at: string;
}

const isVerseInRange = (verse: number, range: string): boolean => {
  if (!range) return false;

  // Handle single verse case
  if (!range.includes("-")) {
    return verse === parseInt(range);
  }

  // Handle verse range
  const [start, end] = range.split("-").map((num) => parseInt(num));
  return verse >= start && verse <= end;
};

export default function Chapter({
  html,
  bookId,
}: {
  html: string;
  bookId: string;
}) {
  const [verses, setVerses] = useState<{ number: number; verse: string }[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [commentary, setCommentary] = useState<Commentary[]>([]);

  useEffect(() => {
    const verses = extractBibleVerses(html);
    setVerses(verses);
  }, [html]);

  const onClick = async (number: number) => {
    setSelectedVerse(number);
    setIsSheetOpen(true);

    const chapterMatch = window.location.pathname.match(/chapter\/(\d+)/);
    const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;

    const commentaryData = await fetchCommentary(bookId, chapter);
    // Filter commentary to only show entries where the verse is in range
    const relevantCommentary = commentaryData.filter((comment) =>
      isVerseInRange(number, comment.verse_range)
    );
    setCommentary(relevantCommentary);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedVerse(null);
    setCommentary([]);
  };

  // Add this function to format the book ID for display
  const formatBookName = (bookId: string) => {
    return bookId
      .split(".")[0]
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col">
      {verses.map((verse) => (
        <Verse
          key={verse.number}
          number={verse.number}
          onClick={onClick}
          selected={verse.number === selectedVerse}
        >
          {verse.verse}
        </Verse>
      ))}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="flex flex-col gap-4">
          <SheetHeader className="mb-4">
            <SheetTitle>Commentary</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto">
            <Card className="border-none shadow-none pt-6 bg-slate-100">
              <CardTitle className="text-base text-slate-900 px-6">
                {selectedVerse !== null && (
                  <span className="font-semibold">
                    {formatBookName(bookId)}{" "}
                    {window.location.pathname.match(/chapter\/(\d+)/)?.[1]}:
                    {selectedVerse}
                  </span>
                )}
              </CardTitle>
              <CardContent>
                {selectedVerse !== null && (
                  <p className="text-sm text-slate-600">
                    {verses.find((v) => v.number === selectedVerse)?.verse}
                  </p>
                )}
              </CardContent>
            </Card>
            {commentary.map((comment) => (
              <Card key={comment.id} className="text-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">
                    {comment.commentary_author}
                    {comment.verse_range &&
                      comment.verse_range !== selectedVerse?.toString() && (
                        <span className="text-sm font-normal text-slate-500 ml-2">
                          (verses {comment.verse_range})
                        </span>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm/5 whitespace-pre-wrap">
                    {comment.commentary_text}
                  </p>
                </CardContent>
              </Card>
            ))}
            {commentary.length === 0 && (
              <p className="text-center text-slate-500">
                No commentary available for this verse.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
