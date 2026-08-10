"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  fetchCommentary,
  requestCommentary,
  fetchCommentaryRequests,
  updateCommentary,
  deleteCommentary,
  getUserProfile,
  type UserProfile,
  fetchChiasmsForChapter,
  updateChiasm,
  deleteChiasm,
  type ChiasmWithUnits,
  type ChiasmUnit,
  stripParagraphMarkers,
} from "@/lib/api";
import { CommentaryForm } from "@/components/CommentaryForm";
import { ChiasmDetails } from "@/components/ChiasmDetails";
import { ChiasmForm } from "@/components/ChiasmForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChiasm } from "@/contexts/ChiasmContext";
import { MessageCircle } from "lucide-react";
import { isVerseInReference, type VerseReference } from "@/lib/verse-parser";
import {
  getChiasticLevel,
  getChiasticBackgroundColor,
} from "@/lib/chiasm-colors";

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
          const text = stripParagraphMarkers(node.textContent?.trim() || "");
          if (text) {
            verse.verse = (verse.verse || "") + text;
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        verse.verse =
          (verse.verse || "") + stripParagraphMarkers(node.textContent || "");
      }
    });
  }
  return verses;
}

interface VerseChiasmInfo {
  chiasm: ChiasmWithUnits;
  unit: ChiasmUnit;
  level: number;
  color: string;
}

function Verse({
  children,
  number,
  onClick,
  selected,
  commentaryCount,
  chiasmInfo,
  showChiasms,
  highlighted,
  registerRef,
}: {
  children: React.ReactNode;
  number: number;
  onClick: (number: number) => void;
  selected: boolean;
  commentaryCount: number;
  chiasmInfo?: VerseChiasmInfo[];
  showChiasms: boolean;
  highlighted?: boolean;
  registerRef?: (el: HTMLDivElement | null) => void;
}) {
  const hasCommentary = commentaryCount > 0;
  // Get the primary chiasm color (use the first one if multiple)
  const primaryChiasm =
    chiasmInfo && chiasmInfo.length > 0 ? chiasmInfo[0] : null;
  const hasChiasm = showChiasms && primaryChiasm !== null;

  // Calculate indentation level for chiastic structure
  const getIndentationLevel = (
    unitOrder: number,
    totalUnits: number
  ): number => {
    const center = Math.ceil(totalUnits / 2);
    const distanceFromCenter = Math.abs(unitOrder - center);
    return center - 1 - distanceFromCenter;
  };

  const indentLevel = hasChiasm
    ? getIndentationLevel(
        primaryChiasm.unit.unit_order,
        primaryChiasm.chiasm.units.length
      )
    : 0;

  return (
    <div
      ref={registerRef}
      onClick={() => onClick(number)}
      className={`p-2 rounded-lg transition-colors relative ${
        selected
          ? "bg-muted"
          : "hover:bg-accent hover:text-accent-foreground"
      } cursor-pointer ${
        hasCommentary ? "text-foreground" : "text-muted-foreground"
      } ${
        highlighted ? "animate-pulse bg-yellow-100 dark:bg-yellow-900/40" : ""
      }`}
      style={{
        ...(hasChiasm
          ? {
              backgroundColor: primaryChiasm.color,
            }
          : {}),
        marginLeft: hasChiasm ? `${indentLevel * 1.5}rem` : "0",
      }}
    >
      {hasCommentary && (
        <MessageCircle className="absolute -left-5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
      )}
      <sup className="mr-2 text-muted-foreground">{number}</sup>
      {children}
      {hasChiasm && chiasmInfo && chiasmInfo.length > 1 && (
        <span className="absolute top-1 right-1 text-xs bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center">
          {chiasmInfo.length}
        </span>
      )}
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
  prevLink,
  nextLink,
}: {
  html: string;
  bookId: string;
  prevLink?: string | null;
  nextLink?: string | null;
}) {
  const { user } = useAuth();
  const { showChiasms } = useChiasm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verseParam = searchParams.get("verse");
  const deepLinkAppliedRef = useRef<string | null>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [verses, setVerses] = useState<{ number: number; verse: string }[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    commentaryId: number;
  } | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [versesWithCommentary, setVersesWithCommentary] = useState<
    Map<number, number>
  >(
    new Map()
  );
  const [requestedVerses, setRequestedVerses] = useState<Set<number>>(
    new Set()
  );
  const [editingCommentary, setEditingCommentary] = useState<Commentary | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [verseChiasmMap, setVerseChiasmMap] = useState<
    Map<number, VerseChiasmInfo[]>
  >(new Map());
  const [selectedChiasm, setSelectedChiasm] = useState<ChiasmWithUnits | null>(
    null
  );
  const [isChiasmDetailsOpen, setIsChiasmDetailsOpen] = useState(false);
  const [editingChiasm, setEditingChiasm] = useState<ChiasmWithUnits | null>(
    null
  );
  const [isChiasmFormOpen, setIsChiasmFormOpen] = useState(false);
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
    setVersesWithCommentary(new Map());

    // Load commentary for the new chapter
    const loadCommentary = async () => {
      const path = window.location.pathname;
      const chapterNum = getChapterFromPath(path);
      const allCommentary = await fetchCommentary(bookId, chapterNum);
      const versesWithComments = new Map<number, number>();

      allCommentary.forEach((comment) => {
        if (!comment.verse_range) return;

        if (comment.verse_range.includes("-")) {
          const [start, end] = comment.verse_range.split("-").map(Number);
          for (let verse = start; verse <= end; verse++) {
            versesWithComments.set(verse, (versesWithComments.get(verse) || 0) + 1);
          }
        } else {
          const verse = Number(comment.verse_range);
          versesWithComments.set(verse, (versesWithComments.get(verse) || 0) + 1);
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

  // Deep-link to a specific verse via ?verse= (from search/requests pages)
  useEffect(() => {
    if (!verseParam || verses.length === 0) return;

    const verseNumber = parseInt(verseParam, 10);
    if (isNaN(verseNumber)) return;

    const linkKey = `${bookId}-${currentChapter}-${verseParam}`;
    if (deepLinkAppliedRef.current === linkKey) return;

    const exists = verses.some((v) => v.number === verseNumber);
    if (!exists) return;

    deepLinkAppliedRef.current = linkKey;
    onClick(verseNumber);
    setHighlightedVerse(verseNumber);
    verseRefs.current
      .get(verseNumber)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = setTimeout(() => setHighlightedVerse(null), 1500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseParam, verses, bookId, currentChapter]);

  // Load chiasms for current chapter
  useEffect(() => {
    const loadChiasms = async () => {
      if (!showChiasms || verses.length === 0) {
        setVerseChiasmMap(new Map());
        return;
      }

      try {
        const path = window.location.pathname;
        const chapterNum = getChapterFromPath(path);
        const chapterChiasms = await fetchChiasmsForChapter(bookId, chapterNum);

        // Build verse-to-chiasm mapping
        const verseMap = new Map<number, VerseChiasmInfo[]>();

        chapterChiasms.forEach((chiasm) => {
          const maxLevel = Math.floor(chiasm.units.length / 2);

          chiasm.units.forEach((unit) => {
            const level = getChiasticLevel(
              unit.unit_order,
              chiasm.units.length
            );
            const color = getChiasticBackgroundColor(level, maxLevel);

            const refs = Array.isArray(unit.verse_references)
              ? unit.verse_references
              : [unit.verse_references];

            refs.forEach((ref: VerseReference) => {
              // Check all verses in the current chapter that match this reference
              verses.forEach((verse) => {
                if (
                  isVerseInReference(bookId, currentChapter, verse.number, ref)
                ) {
                  const existing = verseMap.get(verse.number) || [];
                  existing.push({
                    chiasm,
                    unit,
                    level,
                    color,
                  });
                  verseMap.set(verse.number, existing);
                }
              });
            });
          });
        });

        setVerseChiasmMap(verseMap);
      } catch (error) {
        console.error("Error loading chiasms:", error);
      }
    };

    loadChiasms();
  }, [showChiasms, bookId, currentChapter, verses.length]);

  // Arrow-key chapter navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (isSheetOpen || isChiasmDetailsOpen || isChiasmFormOpen) return;

      const href = e.key === "ArrowLeft" ? prevLink : nextLink;
      if (href) router.push(href);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevLink, nextLink, isSheetOpen, isChiasmDetailsOpen, isChiasmFormOpen, router]);

  const onClick = async (number: number) => {
    // Always update selected verse so panel header/content can show the clicked verse
    setSelectedVerse(number);

    // Check if this verse has chiasms
    const verseChiasms = verseChiasmMap.get(number);
    if (showChiasms && verseChiasms && verseChiasms.length > 0) {
      // Show chiasm details for this verse
      setSelectedChiasm(verseChiasms[0].chiasm);
      setIsChiasmDetailsOpen(true);
      setIsSheetOpen(false);
      return;
    }

    // Show commentary for this verse
    setIsChiasmDetailsOpen(false);
    setIsSheetOpen(true);

    const commentaryData = await fetchCommentary(bookId, currentChapter);
    const relevantCommentary = commentaryData.filter((comment) =>
      isVerseInRange(number, comment.verse_range)
    );
    setCommentary(relevantCommentary);
  };

  const handleEditChiasm = (chiasm: ChiasmWithUnits) => {
    setEditingChiasm(chiasm);
    setIsChiasmDetailsOpen(false);
    setIsChiasmFormOpen(true);
  };

  const handleDeleteChiasm = async (chiasmId: string) => {
    try {
      await deleteChiasm(chiasmId);
      setIsChiasmDetailsOpen(false);
      setSelectedChiasm(null);

      // Reload chiasms
      const path = window.location.pathname;
      const chapterNum = getChapterFromPath(path);
      const chapterChiasms = await fetchChiasmsForChapter(bookId, chapterNum);

      // Rebuild verse map
      const verseMap = new Map<number, VerseChiasmInfo[]>();
      chapterChiasms.forEach((chiasm) => {
        const maxLevel = Math.floor(chiasm.units.length / 2);
        chiasm.units.forEach((unit) => {
          const level = getChiasticLevel(unit.unit_order, chiasm.units.length);
          const color = getChiasticBackgroundColor(level, maxLevel);
          const refs = Array.isArray(unit.verse_references)
            ? unit.verse_references
            : [unit.verse_references];
          refs.forEach((ref: VerseReference) => {
            verses.forEach((verse) => {
              if (
                isVerseInReference(bookId, currentChapter, verse.number, ref)
              ) {
                const existing = verseMap.get(verse.number) || [];
                existing.push({ chiasm, unit, level, color });
                verseMap.set(verse.number, existing);
              }
            });
          });
        });
      });
      setVerseChiasmMap(verseMap);

      toast({
        title: "Success",
        description: "Chiasm deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting chiasm:", error);
      toast({
        title: "Error",
        description: "Failed to delete chiasm. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChiasm = async (chiasmData: {
    id?: string;
    name: string;
    description: string | null;
    units: {
      unit_order: number;
      verse_references: VerseReference[];
      description?: string | null;
    }[];
  }) => {
    try {
      if (chiasmData.id) {
        // Update existing chiasm
        await updateChiasm(
          chiasmData.id,
          chiasmData.name,
          chiasmData.description,
          chiasmData.units
        );
      } else {
        // This shouldn't happen in edit mode, but handle it
        throw new Error("Cannot update chiasm without ID");
      }

      setIsChiasmFormOpen(false);
      setEditingChiasm(null);

      // Reload chiasms
      const path = window.location.pathname;
      const chapterNum = getChapterFromPath(path);
      const chapterChiasms = await fetchChiasmsForChapter(bookId, chapterNum);

      // Rebuild verse map
      const verseMap = new Map<number, VerseChiasmInfo[]>();
      chapterChiasms.forEach((chiasm) => {
        const maxLevel = Math.floor(chiasm.units.length / 2);
        chiasm.units.forEach((unit) => {
          const level = getChiasticLevel(unit.unit_order, chiasm.units.length);
          const color = getChiasticBackgroundColor(level, maxLevel);
          const refs = Array.isArray(unit.verse_references)
            ? unit.verse_references
            : [unit.verse_references];
          refs.forEach((ref: VerseReference) => {
            verses.forEach((verse) => {
              if (
                isVerseInReference(bookId, currentChapter, verse.number, ref)
              ) {
                const existing = verseMap.get(verse.number) || [];
                existing.push({ chiasm, unit, level, color });
                verseMap.set(verse.number, existing);
              }
            });
          });
        });
      });
      setVerseChiasmMap(verseMap);

      toast({
        title: "Success",
        description: "Chiasm updated successfully",
      });
    } catch (error) {
      console.error("Error saving chiasm:", error);
      toast({
        title: "Error",
        description: "Failed to save chiasm. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
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

  const handleDeleteCommentary = (commentaryId: number) => {
    setDeleteConfirm({ commentaryId });
  };

  const confirmDeleteCommentary = async () => {
    if (!deleteConfirm) return;
    const { commentaryId } = deleteConfirm;

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

      // Update the verses with commentary counts
      const versesWithComments = new Map<number, number>();
      commentaryData.forEach((comment) => {
        if (!comment.verse_range) return;
        if (comment.verse_range.includes("-")) {
          const [start, end] = comment.verse_range.split("-").map(Number);
          for (let verse = start; verse <= end; verse++) {
            versesWithComments.set(verse, (versesWithComments.get(verse) || 0) + 1);
          }
        } else {
          const verse = Number(comment.verse_range);
          versesWithComments.set(verse, (versesWithComments.get(verse) || 0) + 1);
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
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900">
            <InfoIcon className="h-4 w-4 text-yellow-900 dark:text-yellow-200" />
            <AlertTitle className="mt-1 text-yellow-900 dark:text-yellow-200">
              Commentary has been requested!
            </AlertTitle>
            <AlertDescription className="text-yellow-900 dark:text-yellow-200 text-sm">
              The commentators have been notified. Someone will respond soon.
            </AlertDescription>
          </Alert>
        );
      }

      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            No commentary available for this verse.
          </p>
          <Button
            variant="link"
            className="text-blue-600 dark:text-blue-400"
            onClick={() => handleRequestCommentary(selectedVerse)}
          >
            Request Commentary
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {commentary.map((comment, index) => (
          <Card
            key={comment.id}
            className="text-muted-foreground group relative animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-300"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base text-foreground">
                  {comment.commentary_author}
                  {comment.verse_range &&
                    comment.verse_range !== selectedVerse?.toString() && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (verses {comment.verse_range})
                      </span>
                    )}
                </CardTitle>
                {userProfile?.username === comment.commentary_author && (
                  <Button
                    variant="link"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:no-underline"
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
                    className="mt-2 text-destructive"
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
      <div
        key={html}
        className="flex flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      >
        {verses.map((verse) => (
          <Verse
            key={verse.number}
            number={verse.number}
            onClick={onClick}
            selected={verse.number === selectedVerse}
            commentaryCount={versesWithCommentary.get(verse.number) || 0}
            chiasmInfo={verseChiasmMap.get(verse.number)}
            showChiasms={showChiasms}
            highlighted={verse.number === highlightedVerse}
            registerRef={(el) => {
              if (el) {
                verseRefs.current.set(verse.number, el);
              } else {
                verseRefs.current.delete(verse.number);
              }
            }}
          >
            {verse.verse}
          </Verse>
        ))}
      </div>
      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="Delete commentary?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteCommentary}
      />
      <ChiasmDetails
        open={isChiasmDetailsOpen}
        onOpenChange={setIsChiasmDetailsOpen}
        chiasm={selectedChiasm}
        onEdit={handleEditChiasm}
        onDelete={handleDeleteChiasm}
      />
      <ChiasmForm
        open={isChiasmFormOpen}
        onOpenChange={(open) => {
          setIsChiasmFormOpen(open);
          if (!open) {
            setEditingChiasm(null);
          }
        }}
        onSave={handleSaveChiasm}
        editingChiasm={editingChiasm}
      />
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose} modal={false}>
        <SheetContent side="right" className="flex flex-col gap-4">
          <SheetHeader className="mb-4 sticky top-0 z-10">
            <SheetTitle>Commentary</SheetTitle>
            <SheetDescription className="hidden">
              Commentary on specific Bible verses.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto">
            <Card className="border-none shadow-none pt-6 bg-muted">
              <CardTitle className="text-base text-foreground px-6">
                {selectedVerse !== null && (
                  <span className="font-semibold">
                    {formatBookName(bookId)} {currentChapter}
                    {selectedVerse ? `:${selectedVerse}` : ""}
                  </span>
                )}
              </CardTitle>
              <CardContent>
                {selectedVerse !== null && (
                  <p className="text-sm text-muted-foreground">
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
