import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Book, getBook } from "../lib/api";

const BookReader = lazy(() => import("../components/BookReader").then((module) => ({ default: module.BookReader })));

export function ReaderPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getBook(id).then(setBook).catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <main className="min-h-screen bg-[#151515]">
      <Link className="fixed left-5 top-5 z-50 rounded bg-white/90 px-4 py-2 text-sm font-medium text-[#1d1d1d] shadow" to="/">
        返回书架
      </Link>
      {error ? (
        <div className="flex min-h-screen items-center justify-center text-white">{error}</div>
      ) : book ? (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white/70">正在准备阅读器</div>}>
          <BookReader pdfUrl={book.filePath} title={book.title} />
        </Suspense>
      ) : (
        <div className="flex min-h-screen items-center justify-center text-white/70">正在载入书籍</div>
      )}
    </main>
  );
}
