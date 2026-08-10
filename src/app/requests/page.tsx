"use client";

import { useEffect, useState } from "react";
import {
  fetchCommentaryRequests,
  fetchBibleBooks,
  stripParagraphMarkers,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

const API_KEY = "d5b6cacdee5ceb38161e26a0777dc4d1";
const BIBLE_ID = "de4e12af7f28f599-02";

const api = axios.create({
  baseURL: "https://api.scripture.api.bible/v1",
  headers: { "api-key": API_KEY },
});

interface CommentaryRequest {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  created_at: string;
  status: string;
  verse_text?: string;
  book_name?: string;
}

interface BibleBook {
  id: string;
  name: string;
  number: number;
  order: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<CommentaryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Bible books first
        const booksData: BibleBook[] = await fetchBibleBooks();

        // Then fetch requests
        const requestsData = await fetchCommentaryRequests();

        // Process each request to get verse text and full book name
        const processedRequests = await Promise.all(
          requestsData.map(async (request) => {
            try {
              // Find the full book name
              const bookData = booksData.find(
                (b: BibleBook) => b.id === request.book
              );

              if (!bookData) {
                console.error(`Book not found for ID: ${request.book}`);
                return {
                  ...request,
                  verse_text: "Error loading verse text",
                  book_name: request.book,
                };
              }

              // Fetch verse using axios instance
              const response = await api.get(
                `/bibles/${BIBLE_ID}/verses/${request.book}.${request.chapter}.${request.verse}`,
                {
                  params: {
                    "content-type": "text",
                    "include-notes": false,
                    "include-titles": false,
                    "include-chapter-numbers": false,
                    "include-verse-numbers": false,
                    "include-verse-spans": false,
                  },
                }
              );

              return {
                ...request,
                verse_text: stripParagraphMarkers(response.data.data.content),
                book_name: bookData.name,
              };
            } catch (err) {
              console.error(`Error processing request ${request.id}:`, err);
              return {
                ...request,
                verse_text: "Error loading verse text",
                book_name: request.book,
              };
            }
          })
        );

        setRequests(processedRequests);
      } catch (err) {
        setError("Failed to load requests. Please try again.");
        console.error("Error loading requests:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-prose mx-auto">
        <h1 className="text-2xl font-bold mb-4">Loading requests...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-prose mx-auto">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-prose mx-auto">
      <h1 className="text-2xl font-bold mb-8">Commentary Requests</h1>
      <p className="mb-8">
        Below is a list of verses for which people have requested Molokan
        commentary.
      </p>
      {requests.length === 0 ? (
        <p className="text-slate-400">No requests found.</p>
      ) : (
        <div className="space-y-6 md:space-y-4">
          {requests.map((request) => (
            <Card
              className="border-0 shadow-none rounded-none"
              key={request.id}
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
                        request.book
                      )}/chapter/${request.chapter}?verse=${request.verse}`}
                    >
                      <span className="font-medium">
                        {request.book_name} {request.chapter}:{request.verse}
                      </span>
                    </Link>
                  </Button>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="w-full md:w-3/4">
                  <span>{request.verse_text}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
