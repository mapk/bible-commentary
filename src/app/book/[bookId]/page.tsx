import { ChapterList } from "@/components/ChapterList";

export default function BookPage({ params }: { params: { bookId: string } }) {
  return <ChapterList bookId={params.bookId} />;
}
