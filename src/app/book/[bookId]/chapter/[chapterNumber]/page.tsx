import { fetchBibleBooks, fetchChapterContent, fetchChapters } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { use } from "react";

interface Book {
  id: string;
  name: string;
}

// Create a component to handle client-side rendering
function ChapterContent({
  bookId,
  chapterNumber,
}: {
  bookId: string;
  chapterNumber: string;
}) {
  const content = use(fetchChapterContent(bookId, parseInt(chapterNumber)));

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

export default async function ChapterPage({
  params,
}: {
  params: { bookId: string; chapterNumber: string };
}) {
  const { bookId, chapterNumber } = params;
  const books: Book[] = await fetchBibleBooks();
  const currentBookIndex = books.findIndex((b: Book) => b.id === bookId);
  const book = books[currentBookIndex];
  const chapterNum = parseInt(chapterNumber);
  const chapters = await fetchChapters(bookId);
  const totalChapters = chapters.length;

  let prevLink: string | null = null;
  let nextLink: string | null = null;

  // Calculate nextLink
  if (chapterNum < totalChapters) {
    nextLink = `/book/${bookId}/chapter/${chapterNum + 1}`;
  } else if (currentBookIndex < books.length - 1) {
    const nextBook = books[currentBookIndex + 1];
    nextLink = `/book/${nextBook.id}/chapter/1`;
  }

  // Calculate prevLink
  if (chapterNum > 1) {
    prevLink = `/book/${bookId}/chapter/${chapterNum - 1}`;
  } else if (currentBookIndex > 0) {
    const prevBook = books[currentBookIndex - 1];
    const prevBookChapters = await fetchChapters(prevBook.id);
    prevLink = `/book/${prevBook.id}/chapter/${prevBookChapters.length}`;
  }

  return (
    <div className="max-w-prose mx-auto relative min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-8">
        <span className="text-slate-400 text-base font-normal block">
          {book?.name || bookId}
        </span>
        {!isNaN(chapterNum) && `Chapter ${chapterNumber}`}
      </h1>

      <div className="flex-grow flex">
        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={!prevLink}
          className="fixed left-8 py-12 top-1/2 transform -translate-y-1/2"
        >
          <Link href={prevLink || "#"}>
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>

        <div className="w-full">
          <ChapterContent bookId={bookId} chapterNumber={chapterNumber} />
        </div>

        <Button
          variant="outline"
          size="icon"
          asChild
          disabled={!nextLink}
          className="fixed right-8 py-12 top-1/2 transform -translate-y-1/2"
        >
          <Link href={nextLink || "#"}>
            <ChevronRight className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
