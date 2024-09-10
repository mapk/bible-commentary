"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import axios from "axios";

const API_KEY = "d5b6cacdee5ceb38161e26a0777dc4d1";
const API_URL = "https://api.scripture.api.bible/v1";

interface BibleContent {
  verses?: {
    id: string;
    reference: string;
    text: string;
  }[];
}

interface SearchResult {
  reference: string;
  text: string;
}

export function EnhancedBibleComparisonApp() {
  const [currentView, setCurrentView] = useState("index");
  const [currentBook, setCurrentBook] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [kjvContent, setKjvContent] = useState<BibleContent>({});
  const [totalChapters, setTotalChapters] = useState(1);
  const [bibleBooks, setBibleBooks] = useState<
    { id: string; name: string; testament: string }[]
  >([]);

  useEffect(() => {
    fetchBibleBooks();
    if (currentBook && currentChapter) {
      fetchBibleContent("de4e12af7f28f599-02", currentBook, currentChapter);
      fetchTotalChapters(currentBook);
    }
  }, [currentBook, currentChapter]);

  const fetchBibleBooks = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/bibles/de4e12af7f28f599-02/books`,
        {
          headers: { "api-key": API_KEY },
        }
      );
      setBibleBooks(response.data.data);
    } catch (error) {
      console.error("Error fetching Bible books:", error);
    }
  };

  const fetchBibleContent = async (
    version: string,
    book: string,
    chapter: number
  ) => {
    try {
      const response = await axios.get(
        `${API_URL}/bibles/${version}/passages/${book}.${chapter}`,
        {
          headers: {
            "api-key": API_KEY,
            Accept: "application/json",
          },
        }
      );
      console.log("API response:", response.data);
      setKjvContent(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `Error fetching ${version} content:`,
          error.response?.data || error.message
        );
      } else {
        console.error(`Error fetching ${version} content:`, error);
      }
    }
  };

  const fetchTotalChapters = async (book: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/bibles/de4e12af7f28f599-02/books/${book}/chapters`,
        {
          headers: { "api-key": API_KEY },
        }
      );
      setTotalChapters(response.data.data.length);
    } catch (error) {
      console.error("Error fetching total chapters:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/bibles/de4e12af7f28f599-02/search`,
        {
          headers: { "api-key": API_KEY },
          params: { query: searchTerm },
        }
      );
      setSearchResults(response.data.data.verses);
      setCurrentView("search");
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  const handleBookSelect = (book: string) => {
    setCurrentBook(book);
    setCurrentChapter(1);
    setCurrentView("chapter");
  };

  const handleChapterSelect = (chapter: string) => {
    setCurrentChapter(parseInt(chapter));
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else {
      const currentBookIndex = bibleBooks.findIndex(
        (book) => book.name === currentBook
      );
      if (currentBookIndex > 0) {
        setCurrentBook(bibleBooks[currentBookIndex - 1].name);
        setCurrentChapter(totalChapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < totalChapters) {
      setCurrentChapter(currentChapter + 1);
    } else {
      const currentBookIndex = bibleBooks.findIndex(
        (book) => book.name === currentBook
      );
      if (currentBookIndex < bibleBooks.length - 1) {
        setCurrentBook(bibleBooks[currentBookIndex + 1].name);
        setCurrentChapter(1);
      }
    }
  };

  const renderBookList = (books: { id: string; name: string }[]) => (
    <div className="flex flex-col flex-wrap h-full gap-x-4 overflow-x-auto">
      {books.map((book) => (
        <Button
          key={book.id}
          variant="secondary"
          className="justify-start h-auto py-2 mb-4 w-50"
          onClick={() => handleBookSelect(book.name)}
        >
          {book.name}
        </Button>
      ))}
    </div>
  );

  const torahBooks = bibleBooks.slice(0, 5);
  const prophetBooks =
    bibleBooks.length > 0
      ? [
          6, 7, 11, 12, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38,
        ]
          .map((index) => bibleBooks[index - 1])
          .filter(Boolean)
      : [];
  const writingsBooks =
    bibleBooks.length > 0
      ? bibleBooks.slice(5, 39).filter((book) => !prophetBooks.includes(book))
      : [];
  const gospelBooks = bibleBooks.slice(39, 43);
  const actsBook = bibleBooks.slice(43, 44);
  const epistlesBooks = bibleBooks.slice(44, 65);
  const apocalypseBook = bibleBooks.slice(65, 66);

  const renderChapterView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => setCurrentView("index")}>Back to Index</Button>
        <div className="flex items-center space-x-2">
          <Select value={currentBook} onValueChange={handleBookSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select book" />
            </SelectTrigger>
            <SelectContent>
              {bibleBooks.map((book) => (
                <SelectItem key={book.id} value={book.name}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentChapter.toString()}
            onValueChange={handleChapterSelect}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(totalChapters)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-2">
          <Button onClick={handlePrevChapter}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={handleNextChapter}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <ScrollArea className="h-[calc(100vh-300px)] border rounded-md p-4">
            {kjvContent.verses?.map((verse) => (
              <div key={verse.id} className="mb-4 p-4 bg-white shadow rounded">
                <span className="font-bold mr-2">{verse.reference}</span>
                <span>{verse.text}</span>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  const renderSearchResults = () => (
    <div className="space-y-4">
      <Button onClick={() => setCurrentView("index")}>Back to Index</Button>
      <h2 className="text-xl font-semibold">Search Results</h2>
      <ScrollArea className="h-[calc(100vh-200px)] border rounded-md p-4">
        {searchResults.map((result, index) => (
          <div key={index} className="mb-4">
            <h3 className="font-semibold">{result.reference}</h3>
            <p>{result.text}</p>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const TestamentCard = ({
    title,
    books,
    className = "",
    fullHeight = false,
  }: {
    title: string;
    books: { id: string; name: string }[];
    className?: string;
    fullHeight?: boolean;
  }) => (
    <Card className={`${fullHeight ? "h-full" : ""} ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`overflow-y-auto pr-4 ${
            fullHeight ? "h-[calc(100vh-200px)]" : ""
          }`}
        >
          {renderBookList(books)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Molokan Commentary</h1>

      <div className="flex mb-4">
        <Input
          type="text"
          placeholder="Search the Bible..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      {currentView === "index" && (
        <div className="flex gap-8">
          <div className="flex-1 space-y-8">
            <TestamentCard title="Torah" books={torahBooks} />
            <TestamentCard title="Prophets" books={prophetBooks} />
            <TestamentCard title="Writings" books={writingsBooks} />
          </div>
          <div className="flex-1 space-y-8">
            <TestamentCard title="Gospels" books={gospelBooks} />
            <TestamentCard title="Acts of the Apostles" books={actsBook} />
            <TestamentCard title="Epistles" books={epistlesBooks} />
            <TestamentCard title="Apocalypse" books={apocalypseBook} />
          </div>
        </div>
      )}

      {currentView === "chapter" && renderChapterView()}

      {currentView === "search" && renderSearchResults()}
    </div>
  );
}
