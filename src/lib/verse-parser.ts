/**
 * Verse Reference Parser
 * Handles various verse reference formats:
 * - Genesis 1:1
 * - Genesis 1:1-3
 * - Genesis 1:1;1:3;1:7 (multiple discrete verses)
 * - John 1:1-5
 * - Genesis 50:24 - Exodus 1:3 (cross-book ranges)
 */

export interface ParsedVerseReference {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  endChapter?: number;
  endBook?: string;
}

export interface VerseReference {
  book: string;
  bookId: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  endChapter?: number;
  endBook?: string;
  endBookId?: string;
}

/**
 * Parse a single verse reference string into structured data
 * Examples:
 * - "Genesis 1:1" -> { book: "Genesis", chapter: 1, verse: 1 }
 * - "Genesis 1:1-3" -> { book: "Genesis", chapter: 1, verse: 1, endVerse: 3 }
 * - "Genesis 50:24 - Exodus 1:3" -> { book: "Genesis", chapter: 50, verse: 24, endBook: "Exodus", endChapter: 1, endVerse: 3 }
 */
export function parseVerseReference(
  reference: string,
  bookList: { id: string; name: string }[]
): ParsedVerseReference | null {
  if (!reference || !reference.trim()) return null;

  const trimmed = reference.trim();

  // Pattern for single verse: "Book Chapter:Verse"
  // Pattern for verse range: "Book Chapter:Verse-Verse"
  // Pattern for cross-book: "Book Chapter:Verse - Book Chapter:Verse"
  const singleVersePattern =
    /^([\w\s]+?)\s+(\d+):(\d+)(?:\s*-\s*([\w\s]+?)\s+(\d+):(\d+))?$/i;
  const verseRangePattern = /^([\w\s]+?)\s+(\d+):(\d+)-(\d+)$/i;
  const multipleVersesPattern = /^([\w\s]+?)\s+(\d+):(\d+)(?:;(\d+):(\d+))+/i;

  // Try cross-book range first
  const crossBookMatch = trimmed.match(singleVersePattern);
  if (crossBookMatch && crossBookMatch[4]) {
    const startBook = findBookByName(crossBookMatch[1], bookList);
    const endBook = findBookByName(crossBookMatch[4], bookList);

    if (startBook && endBook) {
      return {
        book: startBook.name,
        chapter: parseInt(crossBookMatch[2]),
        verse: parseInt(crossBookMatch[3]),
        endBook: endBook.name,
        endChapter: parseInt(crossBookMatch[5]),
        endVerse: parseInt(crossBookMatch[6]),
      };
    }
  }

  // Try verse range
  const rangeMatch = trimmed.match(verseRangePattern);
  if (rangeMatch) {
    const book = findBookByName(rangeMatch[1], bookList);
    if (book) {
      return {
        book: book.name,
        chapter: parseInt(rangeMatch[2]),
        verse: parseInt(rangeMatch[3]),
        endVerse: parseInt(rangeMatch[4]),
      };
    }
  }

  // Try single verse
  const singleMatch = trimmed.match(/^([\w\s]+?)\s+(\d+):(\d+)$/i);
  if (singleMatch) {
    const book = findBookByName(singleMatch[1], bookList);
    if (book) {
      return {
        book: book.name,
        chapter: parseInt(singleMatch[2]),
        verse: parseInt(singleMatch[3]),
      };
    }
  }

  // Try multiple discrete verses (e.g., "Genesis 1:1;1:3;1:7")
  const multipleMatch = trimmed.match(/^([\w\s]+?)\s+((?:\d+:\d+;?)+)$/i);
  if (multipleMatch) {
    // For now, we'll parse the first verse and note it's a multiple verse reference
    // The full parsing of multiple verses would require more complex logic
    const book = findBookByName(multipleMatch[1], bookList);
    const firstVerse = multipleMatch[2].split(";")[0];
    const [chapter, verse] = firstVerse.split(":");

    if (book && chapter && verse) {
      return {
        book: book.name,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        // Note: For multiple discrete verses, we'd need to store them differently
        // This is a simplified version
      };
    }
  }

  return null;
}

/**
 * Find a book by name (case-insensitive, partial match)
 */
function findBookByName(
  name: string,
  bookList: { id: string; name: string }[]
): { id: string; name: string } | null {
  const normalized = name.trim().toLowerCase();

  // Try exact match first
  let book = bookList.find(
    (b) => b.name.toLowerCase() === normalized
  );

  // Try partial match
  if (!book) {
    book = bookList.find((b) =>
      b.name.toLowerCase().startsWith(normalized)
    );
  }

  // Try matching without numbers (e.g., "1 Samuel" matches "Samuel")
  if (!book) {
    const nameWithoutNumbers = normalized.replace(/^\d+\s+/, "");
    book = bookList.find((b) =>
      b.name.toLowerCase().replace(/^\d+\s+/, "").startsWith(nameWithoutNumbers)
    );
  }

  return book || null;
}

/**
 * Parse multiple verse references (semicolon-separated)
 */
export function parseMultipleVerseReferences(
  references: string,
  bookList: { id: string; name: string }[]
): ParsedVerseReference[] {
  if (!references || !references.trim()) return [];

  // Split by semicolon and parse each
  const parts = references.split(";").map((p) => p.trim()).filter(Boolean);
  const parsed: ParsedVerseReference[] = [];

  for (const part of parts) {
    const parsedRef = parseVerseReference(part, bookList);
    if (parsedRef) {
      parsed.push(parsedRef);
    }
  }

  return parsed;
}

/**
 * Convert parsed reference to normalized format with book IDs
 */
export async function normalizeVerseReference(
  parsed: ParsedVerseReference,
  bookList: { id: string; name: string }[]
): Promise<VerseReference | null> {
  const startBook = bookList.find(
    (b) => b.name.toLowerCase() === parsed.book.toLowerCase()
  );
  if (!startBook) return null;

  const result: VerseReference = {
    book: parsed.book,
    bookId: startBook.id,
    chapter: parsed.chapter,
    verse: parsed.verse,
  };

  if (parsed.endVerse) {
    result.endVerse = parsed.endVerse;
  }

  if (parsed.endChapter) {
    result.endChapter = parsed.endChapter;
  }

  if (parsed.endBook) {
    const endBook = bookList.find(
      (b) => b.name.toLowerCase() === parsed.endBook!.toLowerCase()
    );
    if (endBook) {
      result.endBook = parsed.endBook;
      result.endBookId = endBook.id;
    }
  }

  return result;
}

/**
 * Check if a verse (book, chapter, verse) is included in a verse reference
 */
export function isVerseInReference(
  bookId: string,
  chapter: number,
  verse: number,
  reference: VerseReference
): boolean {
  // Single verse reference (same book, same chapter)
  if (!reference.endVerse && !reference.endChapter && !reference.endBook) {
    return (
      reference.bookId === bookId &&
      reference.chapter === chapter &&
      reference.verse === verse
    );
  }

  // Verse range within same chapter
  if (
    reference.bookId === bookId &&
    !reference.endBookId &&
    reference.chapter === chapter &&
    reference.endVerse &&
    !reference.endChapter
  ) {
    return verse >= reference.verse && verse <= reference.endVerse;
  }

  // Cross-chapter range (same book)
  if (
    reference.bookId === bookId &&
    reference.endBookId === bookId &&
    reference.endChapter
  ) {
    // Start chapter
    if (chapter === reference.chapter) {
      return verse >= reference.verse;
    }
    // End chapter
    if (chapter === reference.endChapter) {
      return verse <= (reference.endVerse || 1);
    }
    // Middle chapters (all verses included)
    if (
      chapter > reference.chapter &&
      chapter < reference.endChapter
    ) {
      return true;
    }
  }

  // Cross-book range
  if (reference.endBookId && reference.endBookId !== reference.bookId) {
    // Start book
    if (bookId === reference.bookId && chapter === reference.chapter) {
      return verse >= reference.verse;
    }
    // End book
    if (
      reference.endBookId === bookId &&
      reference.endChapter === chapter
    ) {
      return verse <= (reference.endVerse || 1);
    }
    // If the book is between start and end books, we'd need book order
    // For now, we'll be conservative and only match exact book/chapter/verse
  }

  return false;
}

