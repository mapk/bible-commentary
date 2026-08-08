import { fetchBibleBooks } from "@/lib/api";
import { ChapterList } from "@/components/ChapterList";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  name: string;
}

export default async function BookPage({
  params,
}: {
  params: { bookId: string };
}) {
  const books: Book[] = await fetchBibleBooks();
  const currentBookIndex = books.findIndex((b: Book) => b.id === params.bookId);
  const book = books[currentBookIndex];

  const prevLink =
    currentBookIndex > 0 ? `/book/${books[currentBookIndex - 1].id}` : null;
  const nextLink =
    currentBookIndex < books.length - 1
      ? `/book/${books[currentBookIndex + 1].id}`
      : null;

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="flex-grow flex">
        {prevLink ? (
          <Button
            variant="outline"
            size="icon"
            asChild
            className="fixed left-8 py-12 top-1/2 transform -translate-y-1/2"
          >
            <Link href={prevLink}>
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled
            className="fixed left-8 py-12 top-1/2 transform -translate-y-1/2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div className="w-full">
          <ChapterList bookId={params.bookId} name={book?.name} />
        </div>

        {nextLink ? (
          <Button
            variant="outline"
            size="icon"
            asChild
            className="fixed right-8 py-12 top-1/2 transform -translate-y-1/2"
          >
            <Link href={nextLink}>
              <ChevronRight className="h-6 w-6" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled
            className="fixed right-8 py-12 top-1/2 transform -translate-y-1/2"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
