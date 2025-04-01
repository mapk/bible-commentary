"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSearchResults, SearchResult } from "@/lib/api";

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const searchResults = await fetchSearchResults(query);
        setResults(searchResults);
      } catch (err) {
        setError("Failed to perform search. Please try again.");
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, [query]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for &quot;{query}&quot;
      </h1>
      {results.map((result, index) => (
        <Card
          key={`${result.book}-${result.chapter}-${result.verse}-${index}`}
          className="mb-4"
        >
          <CardContent className="p-4">
            <h2 className="font-bold mb-2">
              {result.book} {result.chapter}:{result.verse}
            </h2>
            <div dangerouslySetInnerHTML={{ __html: result.text }} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
