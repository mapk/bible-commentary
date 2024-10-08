"use client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function Chapter({ html }: { html: string }) {
  const [verses, setVerses] = useState<{ number: number; verse: string }[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State to control Sheet visibility

  useEffect(() => {
    const verses = extractBibleVerses(html);
    setVerses(verses);
  }, [html]);

  const onClick = (number: number) => {
    // Removed 'verse' parameter
    setSelectedVerse(number);
    setIsSheetOpen(true); // Open the Sheet on verse click
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false); // Close the Sheet
    setSelectedVerse(null); // Deselect the verse
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
          {/* <Card className="pt-6">
            <CardContent>
              {selectedVerse !== null && (
                <p>{verses.find((v) => v.number === selectedVerse)?.verse}</p>
              )}
            </CardContent>
          </Card> */}
          <Card className="text-slate-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">
                Maxim Gavrilovich Rudometkin
                <br />
                Book 1, Article 12, Verse 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-light">
                God the Father together with His holy omnipotent Word had
                created this on the first day.
              </p>
            </CardContent>
          </Card>
          <Card className="text-slate-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">
                Mark Markeich Uraine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-light">
                In order for God to create space and time for not-God, He had to
                reduce Himself.
              </p>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
    </div>
  );
}
