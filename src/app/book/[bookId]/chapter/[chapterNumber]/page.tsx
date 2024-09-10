import { fetchChapterContent } from "@/lib/api";

export default async function ChapterPage({
  params,
}: {
  params: { bookId: string; chapterNumber: string };
}) {
  const content = await fetchChapterContent(
    params.bookId,
    parseInt(params.chapterNumber)
  );

  return (
    <div>
      <h1>
        {params.bookId} - Chapter {params.chapterNumber}
      </h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
