"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchSearchResults, SearchResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const results = await fetchSearchResults(query);
        setResults(results);

        // If it's a single result and it's a book/chapter search, redirect to that chapter
        if (results.length === 1 && !query.includes(":")) {
          const result = results[0];
          router.push(
            `/book/${encodeURIComponent(result.bookId)}/chapter/${
              result.chapter
            }`
          );
        }
      } catch (err) {
        setError("Failed to perform search. Please try again.");
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, router]);

  if (loading) {
    return (
      <div className="max-w-prose mx-auto">
        <h1 className="text-2xl font-bold mb-4">Searching...</h1>
        <p>Please wait while we search for &quot;{query}&quot;</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-prose mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-prose mx-auto">
      <h1 className="text-2xl font-bold mb-8">
        Search Results for &quot;{query}&quot;
      </h1>
      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="space-y-6 md:space-y-4">
          {results.map((result, index) => (
            <Card
              className="border-0 shadow-none rounded-none"
              key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
            >
              <CardContent className="p-0 flex flex-col md:flex-row items-start gap-2">
                <div className="w-1/4">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-base text-blue-600"
                    asChild
                  >
                    <Link
                      href={`/book/${encodeURIComponent(
                        result.bookId
                      )}/chapter/${result.chapter}${
                        query.includes(":") ? `?verse=${result.verse}` : ""
                      }`}
                    >
                      <span className="font-medium">
                        {result.book} {result.chapter}:{result.verse}
                      </span>
                    </Link>
                  </Button>
                </div>
                <div className="w-full md:w-3/4">
                  <span
                    className=""
                    dangerouslySetInnerHTML={{ __html: result.text }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
