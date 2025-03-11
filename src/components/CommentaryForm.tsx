"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBibleBooks, fetchChapters } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";

interface CommentaryFormProps {
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  onCommentaryAdded: () => void;
}

export function CommentaryForm({
  currentBook,
  currentChapter,
  currentVerse,
  onCommentaryAdded,
}: CommentaryFormProps) {
  const [books, setBooks] = useState<{ id: string; name: string }[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    commentary_author: "",
    book: currentBook,
    chapter: isNaN(currentChapter) ? 1 : currentChapter,
    verse_range: currentVerse.toString(),
    commentary_text: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from("commentary")
        .insert([formData]);

      if (supabaseError) {
        console.error("Database error:", supabaseError);
        setError(supabaseError.message);
        return;
      }

      // Reset form
      setFormData({
        commentary_author: "",
        book: currentBook,
        chapter: isNaN(currentChapter) ? 1 : currentChapter,
        verse_range: currentVerse.toString(),
        commentary_text: "",
      });

      // Refresh commentary list
      onCommentaryAdded();
    } catch (error) {
      console.error("Failed to add commentary:", error);
      setError("Failed to add commentary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <Input
          id="author"
          placeholder="Your Name"
          value={formData.commentary_author}
          onChange={(e) =>
            setFormData({ ...formData, commentary_author: e.target.value })
          }
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Book</Label>
          <Select
            value={formData.book}
            onValueChange={(value) => setFormData({ ...formData, book: value })}
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
      <div>
        <Textarea
          placeholder="Your Commentary"
          value={formData.commentary_text}
          onChange={(e) =>
            setFormData({ ...formData, commentary_text: e.target.value })
          }
          required
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Commentary"}
      </Button>
    </form>
  );
}
