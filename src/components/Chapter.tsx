"use client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  fetchCommentary,
  requestCommentary,
  fetchCommentaryRequests,
  updateCommentary,
  deleteCommentary,
  getUserProfile,
  type UserProfile,
} from "@/lib/api";
import { CommentaryForm } from "@/components/CommentaryForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  hasCommentary,
}: {
  children: React.ReactNode;
  number: number;
  onClick: (number: number) => void;
  selected: boolean;
  hasCommentary: boolean;
}) {
  return (
    <div
      onClick={() => onClick(number)}
      className={`p-2 rounded-lg transition-colors ${
        selected ? "bg-slate-100" : "hover:bg-slate-50 hover:text-slate-900"
      } cursor-pointer ${hasCommentary ? "text-slate-900" : "text-slate-500"}`}
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

// Add this helper function outside the component
const getChapterFromPath = (path: string | null) => {
  if (!path) return 1;
  const match = path?.match(/chapter\/(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

export default function Chapter({
  html,
  bookId,
}: {
  html: string;
  bookId: string;
}) {
  const { user } = useAuth();
  const [verses, setVerses] = useState<{ number: number; verse: string }[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [versesWithCommentary, setVersesWithCommentary] = useState<Set<number>>(
    new Set()
  );
  const [requestedVerses, setRequestedVerses] = useState<Set<number>>(
    new Set()
  );
  const [editingCommentary, setEditingCommentary] = useState<Commentary | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const path = window.location.pathname;
    const chapterNum = getChapterFromPath(path);
    setCurrentChapter(chapterNum);
  }, []);

  useEffect(() => {
    const verses = extractBibleVerses(html);
    setVerses(verses);

    // Reset verses with commentary when html changes
    setVersesWithCommentary(new Set());

    // Load commentary for the new chapter
    const loadCommentary = async () => {
      const path = window.location.pathname;
      const chapterNum = getChapterFromPath(path);
      const allCommentary = await fetchCommentary(bookId, chapterNum);
      const versesWithComments = new Set<number>();

      allCommentary.forEach((comment) => {
        if (!comment.verse_range) return;

        if (comment.verse_range.includes("-")) {
          const [start, end] = comment.verse_range.split("-").map(Number);
          for (let verse = start; verse <= end; verse++) {
            versesWithComments.add(verse);
          }
        } else {
          versesWithComments.add(Number(comment.verse_range));
        }
      });

      setVersesWithCommentary(versesWithComments);
    };

    loadCommentary();
  }, [html, bookId]); // Add html and bookId as dependencies

  // Load existing commentary requests
  useEffect(() => {
    const loadRequests = async () => {
      const requests = await fetchCommentaryRequests();
      const requestedVerseSet = new Set(
        requests
          .filter(
            (req) => req.book === bookId && req.chapter === currentChapter
          )
          .map((req) => req.verse)
      );
      setRequestedVerses(requestedVerseSet);
    };

    loadRequests();
  }, [bookId, currentChapter]);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [user]);

  const onClick = async (number: number) => {
    setSelectedVerse(number);
    setIsSheetOpen(true);

    const commentaryData = await fetchCommentary(bookId, currentChapter);
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

  const handleRequestCommentary = async (verse: number) => {
    try {
      await requestCommentary(bookId, currentChapter, verse);
      // Add the verse to the requested set
      setRequestedVerses((prev) => new Set([...Array.from(prev), verse]));
      toast({
        title: "Commentary Requested",
        description: "Your request has been submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit commentary request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCommentary = (comment: Commentary) => {
    setEditingCommentary(comment);
  };

  const handleCancelEdit = () => {
    setEditingCommentary(null);
  };

  const handleSaveEdit = async (commentaryText: string) => {
    if (!editingCommentary) return;

    try {
      await updateCommentary(editingCommentary.id, commentaryText);

      // Refresh commentary data
      const commentaryData = await fetchCommentary(bookId, currentChapter);
      const relevantCommentary = commentaryData.filter((comment) =>
        isVerseInRange(selectedVerse || 1, comment.verse_range)
      );
      setCommentary(relevantCommentary);

      setEditingCommentary(null);
      toast({
        title: "Commentary Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update commentary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCommentary = async (commentaryId: number) => {
    if (!window.confirm("Are you sure you want to delete this commentary?")) {
      return;
    }

    try {
      // Delete from database
      await deleteCommentary(commentaryId);

      // Close the edit form
      setEditingCommentary(null);

      // Close the sheet
      setIsSheetOpen(false);

      // Refresh the commentary list for the current verse
      const commentaryData = await fetchCommentary(bookId, currentChapter);
      const relevantCommentary = commentaryData.filter((comment) =>
        isVerseInRange(selectedVerse || 1, comment.verse_range)
      );
      setCommentary(relevantCommentary);

      // Update the verses with commentary set
      const versesWithComments = new Set<number>();
      commentaryData.forEach((comment) => {
        if (!comment.verse_range) return;
        if (comment.verse_range.includes("-")) {
          const [start, end] = comment.verse_range.split("-").map(Number);
          for (let verse = start; verse <= end; verse++) {
            versesWithComments.add(verse);
          }
        } else {
          versesWithComments.add(Number(comment.verse_range));
        }
      });
      setVersesWithCommentary(versesWithComments);

      toast({
        title: "Commentary Deleted",
        description: "Your commentary has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting commentary:", error);
      toast({
        title: "Error",
        description: "Failed to delete commentary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderCommentaryContent = () => {
    if (!selectedVerse) return null;

    if (!commentary || commentary.length === 0) {
      // Check if this verse has already been requested
      if (requestedVerses.has(selectedVerse)) {
        return (
          <Alert className="bg-yellow-50 border-yellow-200">
            <InfoIcon className="h-4 w-4 text-yellow-900" />
            <AlertTitle className="mt-1 text-yellow-900">
              Commentary has been requested!
            </AlertTitle>
            <AlertDescription className="text-yellow-900 text-sm">
              The commentators have been notified. Someone will respond soon.
            </AlertDescription>
          </Alert>
        );
      }

      return (
        <div className="text-center py-4">
          <p className="text-slate-400 mb-4">
            No commentary available for this verse.
          </p>
          <Button
            variant="link"
            className="text-blue-600"
            onClick={() => handleRequestCommentary(selectedVerse)}
          >
            Request Commentary
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {commentary.map((comment) => (
          <Card key={comment.id} className="text-slate-600 group relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base text-slate-900">
                  {comment.commentary_author}
                  {comment.verse_range &&
                    comment.verse_range !== selectedVerse?.toString() && (
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        (verses {comment.verse_range})
                      </span>
                    )}
                </CardTitle>
                {userProfile?.username === comment.commentary_author && (
                  <Button
                    variant="link"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0 h-auto text-blue-600 hover:text-blue-800 hover:no-underline"
                    onClick={() => handleEditCommentary(comment)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingCommentary?.id === comment.id ? (
                <div className="space-y-4">
                  <CommentaryForm
                    currentBook={bookId}
                    currentChapter={currentChapter}
                    currentVerse={selectedVerse}
                    initialText={comment.commentary_text}
                    onCancel={handleCancelEdit}
                    onSubmit={handleSaveEdit}
                    submitLabel="Save"
                    cancelLabel="Cancel"
                    isEditing={true}
                    commentaryAuthor={comment.commentary_author}
                    verseRange={comment.verse_range}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDeleteCommentary(comment.id)}
                    className="mt-2 text-red-500"
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <p className="text-sm/5 whitespace-pre-wrap">
                  {comment.commentary_text}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {verses.map((verse) => (
        <Verse
          key={verse.number}
          number={verse.number}
          onClick={onClick}
          selected={verse.number === selectedVerse}
          hasCommentary={versesWithCommentary.has(verse.number)}
        >
          {verse.verse}
        </Verse>
      ))}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="flex flex-col gap-4">
          <SheetHeader className="mb-4 sticky top-0 z-10">
            <SheetTitle>Commentary</SheetTitle>
            <SheetDescription className="hidden">
              Commentary on specific Bible verses.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto">
            <Card className="border-none shadow-none pt-6 bg-slate-100">
              <CardTitle className="text-base text-slate-900 px-6">
                {selectedVerse !== null && (
                  <span className="font-semibold">
                    {formatBookName(bookId)} {currentChapter}
                    {selectedVerse ? `:${selectedVerse}` : ""}
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

            <CommentaryForm
              currentBook={bookId}
              currentChapter={currentChapter}
              currentVerse={selectedVerse || 1}
              onCommentaryAdded={() => {
                const fetchLatestCommentary = async () => {
                  const commentaryData = await fetchCommentary(
                    bookId,
                    currentChapter
                  );
                  const relevantCommentary = commentaryData.filter((comment) =>
                    isVerseInRange(selectedVerse || 1, comment.verse_range)
                  );
                  setCommentary(relevantCommentary);
                };
                fetchLatestCommentary();
              }}
            />

            {renderCommentaryContent()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
