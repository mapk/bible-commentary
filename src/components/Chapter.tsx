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
  number,
  children,
  onClick,
  selected,
}: {
  number: number;
  children: string;
  onClick: (number: number, verse: string) => void;
  selected: boolean;
}) {
  return (
    <div className="flex flex-row gap-x-2">
      <div className="text-sm text-gray-500 w-0">{number}</div>
      <div className="pl-4" onClick={() => onClick(number, children)}>
        <span className={selected ? "bg-yellow-100" : undefined}>
          {children}
        </span>
      </div>
    </div>
  );
}

interface Commentary {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  commentary_author: string;
  commentary_text: string;
  created_at: string;
}

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

    // Get the chapter number from the URL or pass it as a prop
    const chapterMatch = window.location.pathname.match(/chapter\/(\d+)/);
    const chapter = chapterMatch ? parseInt(chapterMatch[1]) : 1;

    // Fetch commentary for this verse
    const commentaryData = await fetchCommentary(bookId, chapter, number);
    setCommentary(commentaryData);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedVerse(null);
    setCommentary([]);
  };

  return (
    <div className="flex flex-col gap-2">
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
          <Card className="pt-6 bg-slate-100">
            <CardContent>
              {selectedVerse !== null && (
                <p className="text-sm text-slate-600">
                  {verses.find((v) => v.number === selectedVerse)?.verse}
                </p>
              )}
            </CardContent>
          </Card>
          {commentary.map((comment) => (
            <Card key={comment.id} className=" text-slate-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900">
                  {comment.commentary_author}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{comment.commentary_text}</p>
              </CardContent>
            </Card>
          ))}
          {commentary.length === 0 && (
            <p className="text-center text-slate-500">
              No commentary available for this verse.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
