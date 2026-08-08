"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBibleBooks, fetchChapters, getUserProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CommentaryFormProps {
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  onCommentaryAdded?: () => void;
  initialText?: string;
  onSubmit?: (commentaryText: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isEditing?: boolean;
  commentaryAuthor?: string;
  verseRange?: string;
}

export function CommentaryForm({
  currentBook,
  currentChapter,
  currentVerse,
  onCommentaryAdded,
  initialText = "",
  onSubmit,
  onCancel,
  submitLabel = "Save Commentary",
  cancelLabel = "Cancel",
  isEditing = false,
  commentaryAuthor = "",
  verseRange,
}: CommentaryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = user?.email === "uraine@gmail.com";
  const [books, setBooks] = useState<{ id: string; name: string }[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    commentary_author: "",
    book: currentBook,
    chapter: isNaN(currentChapter) ? 1 : currentChapter,
    verse_range: isEditing
      ? verseRange || currentVerse.toString()
      : currentVerse.toString(),
    commentary_text: initialText,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      const booksData = await fetchBibleBooks();
      setBooks(booksData);
    };
    loadBooks();
  }, []);

  useEffect(() => {
    const loadChapters = async () => {
      if (formData.book) {
        const chaptersData = await fetchChapters(formData.book);
        setChapters(chaptersData);
      }
    };
    loadChapters();
  }, [formData.book]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setLoadingProfile(true);
      try {
        const profile = await getUserProfile(user.id);

        if (profile?.username) {
          setFormData((prev) => ({
            ...prev,
            commentary_author: profile.username,
          }));
        } else if (user.user_metadata?.full_name) {
          // Use full name from user metadata if available
          setFormData((prev) => ({
            ...prev,
            commentary_author: user.user_metadata.full_name,
          }));
        } else {
          // Use email as last resort
          setFormData((prev) => ({
            ...prev,
            commentary_author: user.email || "",
          }));
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        if (user.user_metadata?.full_name) {
          setFormData((prev) => ({
            ...prev,
            commentary_author: user.user_metadata.full_name,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            commentary_author: user.email || "",
          }));
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  // Update author when editing
  useEffect(() => {
    if (isEditing && commentaryAuthor) {
      setFormData((prev) => ({
        ...prev,
        commentary_author: commentaryAuthor,
      }));
    }
  }, [isEditing, commentaryAuthor]);

  // Sync book, chapter, verse when user clicks a different verse (panel stays open)
  useEffect(() => {
    if (!isEditing) {
      setFormData((prev) => ({
        ...prev,
        book: currentBook,
        chapter: isNaN(currentChapter) ? 1 : currentChapter,
        verse_range: currentVerse.toString(),
      }));
    }
  }, [currentBook, currentChapter, currentVerse, isEditing]);

  // If not authenticated, show login message
  if (!user) {
    return (
      <p className="text-muted-foreground hidden">Please sign in to add commentary</p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Edit mode
        await onSubmit?.(formData.commentary_text);
      } else {
        // Create mode
        const { error: supabaseError } = await supabase
          .from("commentary")
          .insert([formData]);

        if (supabaseError) {
          console.error("Database error:", supabaseError);
          setError(supabaseError.message);
          return;
        }

        // Reset form but keep the author name
        const currentAuthor = formData.commentary_author;
        setFormData({
          commentary_author: currentAuthor, // Keep the current author name
          book: currentBook,
          chapter: isNaN(currentChapter) ? 1 : currentChapter,
          verse_range: currentVerse.toString(),
          commentary_text: "",
        });

        toast({
          title: "Commentary Added",
          description: "Your commentary has been saved successfully.",
        });

        // Refresh commentary list
        onCommentaryAdded?.();
      }
    } catch (error) {
      console.error("Failed to save commentary:", error);
      setError("Failed to save commentary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none pt-6 bg-muted">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {!isEditing && (
            <>
              <div>
                <Input
                  id="author"
                  placeholder={loadingProfile ? "Loading..." : "Your Name"}
                  value={formData.commentary_author}
                  disabled={!isSuperAdmin}
                  className="bg-background"
                  onChange={
                    isSuperAdmin
                      ? (e) =>
                          setFormData({
                            ...formData,
                            commentary_author: e.target.value,
                          })
                      : undefined
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Book</Label>
                  <Select
                    value={formData.book}
                    onValueChange={(value) =>
                      setFormData({ ...formData, book: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Chapter</Label>
                  <Select
                    value={String(formData.chapter)}
                    onValueChange={(value) => {
                      const chapter = parseInt(value);
                      setFormData({
                        ...formData,
                        chapter: isNaN(chapter) ? 1 : chapter,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {(chapters.length > 0 ? chapters : [1]).map((chapter) => (
                        <SelectItem key={chapter} value={String(chapter)}>
                          {chapter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Verse</Label>
                  <Input
                    placeholder="e.g., 1 or 1-5"
                    value={formData.verse_range}
                    onChange={(e) =>
                      setFormData({ ...formData, verse_range: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </>
          )}
          {isEditing && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {books.find((b) => b.id === currentBook)?.name} {currentChapter}
                :{verseRange}
              </p>
            </div>
          )}
          <div>
            <Textarea
              placeholder="Your Commentary"
              value={formData.commentary_text}
              onChange={(e) =>
                setFormData({ ...formData, commentary_text: e.target.value })
              }
              required
              className="min-h-[200px]"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
