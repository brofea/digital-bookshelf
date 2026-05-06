import type { Book } from "../lib/api";
import { Link } from "react-router-dom";

type BookshelfProps = {
  books: Book[];
};

export function Bookshelf({ books }: BookshelfProps) {
  return (
    <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
      {books.map((book) => (
        <Link
          className="group relative block"
          key={book.id}
          to={`/books/${book.id}/read`}
        >
          <div className="absolute left-1/2 top-[calc(100%-2.7rem)] h-9 w-[132%] -translate-x-1/2 rounded-b bg-[linear-gradient(180deg,#9a6a43,#624128)] shadow-[0_10px_18px_rgba(64,39,21,0.22)]" />
          <div className="absolute left-1/2 top-[calc(100%-2.92rem)] h-2 w-[138%] -translate-x-1/2 rounded bg-[linear-gradient(90deg,#5d3823,#b78251_18%,#6f472d_50%,#c19360_76%,#52311f)]" />
          <div className="relative mx-auto aspect-[3/4] w-full max-w-56 overflow-hidden rounded-[4px] bg-[#d8c5a4] shadow-[0_18px_30px_rgba(44,28,18,0.24),inset_10px_0_16px_rgba(255,255,255,0.12)] transition duration-200 group-hover:-translate-y-1">
            {book.coverPath ? (
              <img className="h-full w-full object-cover" src={book.coverPath} alt={book.title} />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-lg font-semibold">
                {book.title}
              </div>
            )}
            <div className="absolute inset-y-0 left-0 w-5 bg-[linear-gradient(90deg,rgba(0,0,0,0.28),rgba(255,255,255,0.08),rgba(0,0,0,0.06))]" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.22),transparent_35%,rgba(0,0,0,0.18))] opacity-80" />
          </div>
          <p className="relative mt-7 line-clamp-2 text-center text-sm font-medium text-[#35271d]">{book.title}</p>
        </Link>
      ))}
    </div>
  );
}
