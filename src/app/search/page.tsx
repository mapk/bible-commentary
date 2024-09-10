import { SearchResults } from "@/components/SearchResults";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams.q as string;
  return <SearchResults query={query || ""} />;
}
