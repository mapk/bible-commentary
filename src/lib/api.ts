import axios from "axios";
import { supabase } from "./supabase";
import type { VerseReference } from "./verse-parser";

const API_KEY = "d5b6cacdee5ceb38161e26a0777dc4d1";
const API_URL = "https://api.scripture.api.bible/v1";
const BIBLE_ID = "de4e12af7f28f599-02"; // KJV Bible ID

const api = axios.create({
  baseURL: API_URL,
  headers: { "api-key": API_KEY },
});

// The KJV source text from api.bible marks paragraph breaks with a literal
// pilcrow (¶) inline with the verse text — strip it, it's not meant to render.
export function stripParagraphMarkers(text: string): string {
  return text.replace(/¶\s*/g, "");
}

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  bookId: string;
}

interface BibleBook {
  id: string;
  name: string;
  number: number;
  order: number;
}

interface Verse {
  number: number;
  text: string;
}

interface ChapterData {
  verses: Verse[];
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  updated_at?: string;
}

export async function fetchBibleBooks() {
  try {
    const response = await api.get("/bibles/de4e12af7f28f599-02/books");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Bible books:", error);
    return [];
  }
}

export async function fetchChapters(bookId: string): Promise<number[]> {
  try {
    const response = await api.get(
      `/bibles/de4e12af7f28f599-02/books/${bookId}/chapters`
    );

    // Skip the first item if it's an intro chapter
    const chaptersData =
      response.data.data[0]?.number === "intro"
        ? response.data.data.slice(1)
        : response.data.data;

    return chaptersData
      .map((chapter: { number: string }) => parseInt(chapter.number))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}

export async function fetchChapterContent(
  bookId: string,
  chapterNumber: number
) {
  try {
    const response = await api.get(
      `/bibles/de4e12af7f28f599-02/chapters/${bookId}.${chapterNumber}`
    );
    return response.data.data.content;
  } catch (error) {
    console.error("Error fetching chapter content:", error);
    return "";
  }
}

export async function fetchChapter(
  bookId: string,
  chapter: number
): Promise<ChapterData> {
  try {
    const html = await fetchChapterContent(bookId, chapter);

    if (!html || typeof DOMParser === "undefined") {
      throw new Error("No chapter content returned from API");
    }

    // Parse verses out of the chapter HTML (same shape as Chapter.tsx's client-side parsing)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const verses: Verse[] = [];
    let current: Verse | null = null;

    doc.querySelectorAll("p").forEach((para) => {
      para.childNodes.forEach((node) => {
        if (node.nodeName === "SPAN") {
          const el = node as Element;
          const verseNumber = el.getAttribute("data-number");
          if (verseNumber) {
            current = { number: parseInt(verseNumber), text: "" };
            verses.push(current);
          } else if (current) {
            current.text += stripParagraphMarkers(
              node.textContent?.trim() || ""
            );
          }
        } else if (node.nodeType === Node.TEXT_NODE && current) {
          current.text += stripParagraphMarkers(node.textContent || "");
        }
      });
    });

    if (verses.length === 0) {
      throw new Error("No verses parsed from chapter content");
    }

    return { verses };
  } catch (error) {
    console.error("Error fetching chapter:", error);
    throw error;
  }
}

export async function getBookId(bookName: string): Promise<string | null> {
  try {
    const books = await fetchBibleBooks();
    const matchingBook = books.find((b: BibleBook) =>
      b.name.toLowerCase().startsWith(bookName.toLowerCase())
    );
    return matchingBook?.id || null;
  } catch (error) {
    console.error("Error getting book ID:", error);
    return null;
  }
}

function highlightKeywords(text: string, query: string): string {
  // Split query into individual words and escape special characters
  const keywords = query
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter((word) => word.length > 0);

  // Create a regex pattern that matches any of the keywords
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");

  // Replace matches with bold tags
  return text.replace(pattern, "<strong>$1</strong>");
}

export async function fetchSearchResults(
  query: string
): Promise<SearchResult[]> {
  try {
    // Check if it's a book search (e.g., "genesis 1" or "gen 1")
    const bookMatch = query.match(/^(\w+)(?:\s+(\d+))?$/i);
    if (bookMatch) {
      const [, bookName, chapter] = bookMatch;
      const books = await fetchBibleBooks();
      const matchingBook = books.find((b: BibleBook) =>
        b.name.toLowerCase().startsWith(bookName.toLowerCase())
      );

      if (matchingBook) {
        if (chapter) {
          // If chapter is specified, return that chapter
          const chapterData = await fetchChapter(
            matchingBook.id,
            parseInt(chapter)
          );
          return [
            {
              book: matchingBook.name,
              chapter: parseInt(chapter),
              verse: 1,
              text: chapterData.verses[0].text,
              bookId: matchingBook.id,
            },
          ];
        } else {
          // If only book is specified, return first chapter
          const chapterData = await fetchChapter(matchingBook.id, 1);
          return [
            {
              book: matchingBook.name,
              chapter: 1,
              verse: 1,
              text: chapterData.verses[0].text,
              bookId: matchingBook.id,
            },
          ];
        }
      }
    }

    // Check if it's a verse search (e.g., "gen 1:2" or "1 cor 3:1-4")
    const verseMatch = query.match(/^(\w+)\s+(\d+):(\d+)(?:-(\d+))?$/i);
    if (verseMatch) {
      const [, bookName, chapter, verse, endVerse] = verseMatch;
      const books = await fetchBibleBooks();
      const matchingBook = books.find((b: BibleBook) =>
        b.name.toLowerCase().startsWith(bookName.toLowerCase())
      );

      if (matchingBook) {
        const chapterData = await fetchChapter(
          matchingBook.id,
          parseInt(chapter)
        );
        const startVerse = parseInt(verse);
        const end = endVerse ? parseInt(endVerse) : startVerse;

        return chapterData.verses
          .slice(startVerse - 1, end)
          .map((v: Verse) => ({
            book: matchingBook.name,
            chapter: parseInt(chapter),
            verse: v.number,
            text: v.text,
            bookId: matchingBook.id,
          }));
      }
    }

    // For keyword searches, use the API.bible search endpoint
    const allResults: SearchResult[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(
          query
        )}&limit=${limit}&offset=${offset}&sort=canonical&fuzziness=1`,
        {
          headers: {
            "api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json();
      const books = await fetchBibleBooks();

      // Transform the API response into our SearchResult format
      const results = data.data.verses.map(
        (verse: { reference: string; text: string }) => {
          // Extract book name and reference parts
          const parts = verse.reference.split(" ");
          // Handle books with numbers (e.g., "1 Samuel", "2 Kings")
          const bookName =
            parts.length > 2 ? `${parts[0]} ${parts[1]}` : parts[0];
          const reference = parts.length > 2 ? parts[2] : parts[1];
          const [chapter, verseNum] = reference.split(":");

          // Find the full book name from the books list
          const fullBook = books.find(
            (b: BibleBook) => b.name.toLowerCase() === bookName.toLowerCase()
          );

          return {
            book: fullBook?.name || bookName,
            chapter: parseInt(chapter),
            verse: parseInt(verseNum),
            text: highlightKeywords(stripParagraphMarkers(verse.text), query),
            bookId: fullBook?.id || bookName.toLowerCase(),
          };
        }
      );

      allResults.push(...results);

      // Check if there are more results
      hasMore = results.length === limit;
      offset += limit;
    }

    return allResults;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

export async function fetchCommentary(book: string, chapter: number) {
  try {
    const { data, error } = await supabase
      .from("commentary")
      .select("*")
      .eq("book", book)
      .eq("chapter", chapter);

    if (error) {
      console.error("Error fetching commentary:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching commentary:", error);
    return [];
  }
}

export async function requestCommentary(
  book: string,
  chapter: number,
  verse: number
) {
  try {
    const { data, error } = await supabase
      .from("commentary_requests")
      .insert([
        {
          book,
          chapter,
          verse,
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error requesting commentary:", error);
    throw error;
  }
}

export async function fetchCommentaryRequests() {
  try {
    const { data, error } = await supabase
      .from("commentary_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching commentary requests:", error);
    return [];
  }
}

export async function updateCommentary(
  commentaryId: number,
  commentaryText: string
) {
  try {
    console.log("Attempting to update commentary:", {
      commentaryId,
      commentaryText,
    });

    const { data, error } = await supabase
      .from("commentary")
      .update({ commentary_text: commentaryText })
      .eq("id", commentaryId)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    console.log("Update operation result:", { data, error });
    return data;
  } catch (error) {
    console.error("Error updating commentary:", error);
    throw error;
  }
}

export async function deleteCommentary(commentaryId: number) {
  try {
    const { error } = await supabase
      .from("commentary")
      .delete()
      .eq("id", commentaryId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting commentary:", error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, userName: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username: userName,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Chiasm types
export interface Chiasm {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color_scheme: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ChiasmUnit {
  id: string;
  chiasm_id: string;
  unit_order: number;
  verse_references: VerseReference | VerseReference[]; // JSONB - can be single or array
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChiasmWithUnits extends Chiasm {
  units: ChiasmUnit[];
}

// Chiasm API functions
export async function createChiasm(
  name: string,
  description: string | null,
  units: {
    unit_order: number;
    verse_references: VerseReference | VerseReference[];
    description?: string | null;
  }[]
): Promise<ChiasmWithUnits | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Create chiasm
    const { data: chiasm, error: chiasmError } = await supabase
      .from("chiasms")
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (chiasmError) throw chiasmError;

    // Create units
    const unitsToInsert = units.map((unit) => ({
      chiasm_id: chiasm.id,
      unit_order: unit.unit_order,
      verse_references: unit.verse_references,
      description: unit.description || null,
    }));

    const { data: createdUnits, error: unitsError } = await supabase
      .from("chiasm_units")
      .insert(unitsToInsert)
      .select();

    if (unitsError) throw unitsError;

    return {
      ...chiasm,
      units: createdUnits || [],
    };
  } catch (error) {
    console.error("Error creating chiasm:", error);
    throw error;
  }
}

export async function fetchChiasms(): Promise<ChiasmWithUnits[]> {
  try {
    const { data: chiasms, error: chiasmsError } = await supabase
      .from("chiasms")
      .select("*")
      .order("created_at", { ascending: false });

    if (chiasmsError) throw chiasmsError;

    // Fetch units for each chiasm
    const chiasmsWithUnits = await Promise.all(
      (chiasms || []).map(async (chiasm) => {
        const { data: units, error: unitsError } = await supabase
          .from("chiasm_units")
          .select("*")
          .eq("chiasm_id", chiasm.id)
          .order("unit_order", { ascending: true });

        if (unitsError) throw unitsError;

        return {
          ...chiasm,
          units: units || [],
        };
      })
    );

    return chiasmsWithUnits;
  } catch (error) {
    console.error("Error fetching chiasms:", error);
    return [];
  }
}

export async function fetchChiasmsForChapter(
  bookId: string,
  chapter: number
): Promise<ChiasmWithUnits[]> {
  try {
    const allChiasms = await fetchChiasms();

    // Filter chiasms that have units referencing this chapter
    const relevantChiasms = allChiasms.filter((chiasm) => {
      return chiasm.units.some((unit) => {
        const refs = Array.isArray(unit.verse_references)
          ? unit.verse_references
          : [unit.verse_references];

        return refs.some((ref: VerseReference) => {
          // Check if reference includes this book and chapter
          if (ref.bookId === bookId && ref.chapter === chapter) {
            return true;
          }
          // Check cross-book ranges
          if (ref.endBookId === bookId && ref.endChapter === chapter) {
            return true;
          }
          return false;
        });
      });
    });

    return relevantChiasms;
  } catch (error) {
    console.error("Error fetching chiasms for chapter:", error);
    return [];
  }
}

export async function fetchChiasmsForBook(bookId: string): Promise<string[]> {
  try {
    const allChiasms = await fetchChiasms();
    const chaptersWithChiasms = new Set<number>();

    allChiasms.forEach((chiasm) => {
      chiasm.units.forEach((unit) => {
        const refs = Array.isArray(unit.verse_references)
          ? unit.verse_references
          : [unit.verse_references];

        refs.forEach((ref: VerseReference) => {
          if (ref.bookId === bookId) {
            chaptersWithChiasms.add(ref.chapter);
          }
          if (ref.endBookId === bookId && ref.endChapter) {
            chaptersWithChiasms.add(ref.endChapter);
          }
        });
      });
    });

    return Array.from(chaptersWithChiasms).map(String);
  } catch (error) {
    console.error("Error fetching chiasms for book:", error);
    return [];
  }
}

export async function updateChiasm(
  chiasmId: string,
  name: string,
  description: string | null,
  units: {
    id?: string;
    unit_order: number;
    verse_references: VerseReference | VerseReference[];
    description?: string | null;
  }[]
): Promise<ChiasmWithUnits | null> {
  try {
    // Update chiasm
    const { data: chiasm, error: chiasmError } = await supabase
      .from("chiasms")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chiasmId)
      .select()
      .single();

    if (chiasmError) throw chiasmError;

    // Delete existing units
    await supabase.from("chiasm_units").delete().eq("chiasm_id", chiasmId);

    // Insert new units
    const unitsToInsert = units.map((unit) => ({
      chiasm_id: chiasmId,
      unit_order: unit.unit_order,
      verse_references: unit.verse_references,
      description: unit.description || null,
    }));

    const { data: createdUnits, error: unitsError } = await supabase
      .from("chiasm_units")
      .insert(unitsToInsert)
      .select();

    if (unitsError) throw unitsError;

    return {
      ...chiasm,
      units: createdUnits || [],
    };
  } catch (error) {
    console.error("Error updating chiasm:", error);
    throw error;
  }
}

export async function deleteChiasm(chiasmId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("chiasms")
      .delete()
      .eq("id", chiasmId);
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting chiasm:", error);
    throw error;
  }
}
