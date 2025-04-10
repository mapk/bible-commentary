import axios from "axios";
import { supabase } from "./supabase";

const API_KEY = "d5b6cacdee5ceb38161e26a0777dc4d1";
const API_URL = "https://api.scripture.api.bible/v1";
const BIBLE_ID = "de4e12af7f28f599-02"; // KJV Bible ID

const api = axios.create({
  baseURL: API_URL,
  headers: { "api-key": API_KEY },
});

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
    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/verses?chapter.id=${bookId}.${chapter}`,
      {
        headers: {
          "api-key": API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chapter");
    }

    const data = await response.json();

    if (!data.data) {
      throw new Error("No data returned from API");
    }

    // Transform the API response into our verse format
    const verses = data.data.map(
      (verse: { id: string; reference: string; text: string }) => ({
        number: parseInt(verse.id.split(".").pop() || "0"),
        text: verse.text,
      })
    );

    return {
      verses: verses,
    };
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
            text: highlightKeywords(verse.text, query),
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
