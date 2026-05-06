import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookshelf } from "../components/Bookshelf";
import { Book, listBooks } from "../lib/api";

export function BookshelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listBooks().then(setBooks).catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f2e8,#ead9c0)] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Digital Bookshelf</h1>
            <p className="mt-2 text-sm text-[#6f5a46]">选择一本书，像翻实体书一样阅读。</p>
          </div>
          <Link className="rounded bg-[#2f5d50] px-4 py-2 text-sm font-medium text-white" to="/admin">
            登录
          </Link>
        </header>
        {error ? <p className="text-sm text-red-700">{error}</p> : <Bookshelf books={books} />}
      </div>
    </main>
  );
}
