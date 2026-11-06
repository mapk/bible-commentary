import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  name: string;
  testament: string;
}

interface BookListProps {
  books: Book[];
}

const CARD_STAGGER_MS = 100;
const BOOKS_START_AFTER_CARD_MS = 250;
const BOOK_STAGGER_MS = 20;

function TestamentCard({
  title,
  books,
  row,
}: {
  title: string;
  books: Book[];
  row: number;
}) {
  const cardDelay = row * CARD_STAGGER_MS;

  return (
    <Card
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: `${cardDelay}ms` }}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {books.map((book, index) => (
            <Link
              key={book.id}
              href={`/book/${encodeURIComponent(book.id)}`}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300"
              style={{
                animationDelay: `${
                  cardDelay + BOOKS_START_AFTER_CARD_MS + index * BOOK_STAGGER_MS
                }ms`,
              }}
            >
              <Button variant="secondary" className="w-full justify-start">
                {book.name}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BookList({ books }: BookListProps) {
  const torahBooks = books.slice(0, 5);
  const prophetBooks = books.filter((book, index) =>
    [
      5, 6, 8, 9, 10, 11, 22, 23, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
      37, 38,
    ].includes(index)
  );
  const writingsBooks = books
    .slice(5, 39)
    .filter((book) => !prophetBooks.includes(book));
  const gospelBooks = books.slice(39, 43);
  const actsBook = books.slice(43, 44);
  const epistlesBooks = books.slice(44, 65);
  const apocalypseBook = books.slice(65, 66);

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex-1 space-y-8">
        <TestamentCard title="Torah" books={torahBooks} row={0} />
        <TestamentCard title="Prophets" books={prophetBooks} row={1} />
        <TestamentCard title="Writings" books={writingsBooks} row={2} />
      </div>
      <div className="flex-1 space-y-8">
        <TestamentCard title="Gospels" books={gospelBooks} row={0} />
        <TestamentCard title="Acts of the Apostles" books={actsBook} row={1} />
        <TestamentCard title="Epistles" books={epistlesBooks} row={2} />
        <TestamentCard title="Apocalypse" books={apocalypseBook} row={3} />
      </div>
    </div>
  );
}
