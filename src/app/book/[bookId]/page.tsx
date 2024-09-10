import { fetchBibleBooks } from "@/lib/api";
import { ChapterList } from "@/components/ChapterList";

export default async function BookPage({
  params,
}: {
  params: { bookId: string };
}) {
  const books = await fetchBibleBooks();
  const book = books.find((b: { id: string }) => b.id === params.bookId);
  return <ChapterList bookId={params.bookId} name={book?.name} />;
}
