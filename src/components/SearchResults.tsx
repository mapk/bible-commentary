"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSearchResults } from "@/lib/api";

interface SearchResultsProps {
  query: string;
}

interface SearchResult {
  reference: string;
  text: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query) {
      const loadSearchResults = async () => {
        const searchResults = await fetchSearchResults(query);
        setResults(searchResults);
      };
      loadSearchResults();
    }
  }, [query]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for &quot;{query}&quot;
      </h1>
      {results.map((result, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-bold mb-2">{result.reference}</h2>
            <p>{result.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
