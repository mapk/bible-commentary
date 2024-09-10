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

export function BookList({ books }: BookListProps) {
  const torahBooks = books.slice(0, 5);
  const prophetBooks = books.filter((book, index) =>
    [
      5, 6, 10, 11, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
    ].includes(index)
  );
  const writingsBooks = books
    .slice(5, 39)
    .filter((book) => !prophetBooks.includes(book));
  const gospelBooks = books.slice(39, 43);
  const actsBook = books.slice(43, 44);
  const epistlesBooks = books.slice(44, 65);
  const apocalypseBook = books.slice(65, 66);

  const TestamentCard = ({
    title,
    books,
  }: {
    title: string;
    books: Book[];
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {books.map((book) => (
            <Link key={book.id} href={`/book/${encodeURIComponent(book.id)}`}>
              <Button variant="secondary" className="w-full justify-start">
                {book.name}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
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
  );
}
