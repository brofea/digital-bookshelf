import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Book, deleteBook, listBooks, updateBook, uploadBook, uploadCover } from "../lib/api";

export function AdminPage() {
  const token = localStorage.getItem("token");
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingTitles, setEditingTitles] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    void refreshBooks();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  async function refreshBooks() {
    const items = await listBooks();
    setBooks(items);
    setEditingTitles(Object.fromEntries(items.map((book) => [book.id, book.title])));
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError("");
    setMessage("");
    try {
      await uploadBook(title, file);
      setTitle("");
      setFile(null);
      setMessage("书籍已添加");
      await refreshBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    }
  }

  async function handleRename(book: Book) {
    setError("");
    const nextTitle = editingTitles[book.id]?.trim();
    if (!nextTitle) return;
    try {
      await updateBook(book.id, { title: nextTitle });
      setMessage("书名已更新");
      await refreshBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  }

  async function handleCover(book: Book, cover?: File) {
    if (!cover) return;
    setError("");
    try {
      await uploadCover(book.id, cover);
      setMessage("封面已更新");
      await refreshBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "封面更新失败");
    }
  }

  async function handleDelete(book: Book) {
    setError("");
    try {
      await deleteBook(book.id);
      setMessage("书籍已删除");
      await refreshBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">管理书籍</h1>
          <Link className="rounded border border-[#2f5d50] px-4 py-2 text-sm font-medium text-[#2f5d50]" to="/">
            返回书架
          </Link>
        </header>

        <form className="mb-8 grid gap-4 rounded bg-white p-5 shadow-shelf md:grid-cols-[1fr_1fr_auto]" onSubmit={handleUpload}>
          <label className="text-sm font-medium">
            新书书名
            <input className="mt-2 w-full rounded border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            PDF 文件
            <input className="mt-2 w-full rounded border bg-white px-3 py-2" accept="application/pdf" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <button className="self-end rounded bg-[#2f5d50] px-5 py-2 font-medium text-white" type="submit">
            添加书籍
          </button>
        </form>

        {message ? <p className="mb-4 text-sm text-[#2f5d50]">{message}</p> : null}
        {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-hidden rounded bg-white shadow-shelf">
          {books.map((book) => (
            <div className="grid gap-4 border-b border-black/10 p-4 last:border-b-0 md:grid-cols-[88px_1fr_auto]" key={book.id}>
              <div className="aspect-[3/4] overflow-hidden rounded bg-[#d8c5a4]">
                {book.coverPath ? <img className="h-full w-full object-cover" src={book.coverPath} alt={book.title} /> : null}
              </div>
              <div className="min-w-0">
                <input
                  className="mb-3 w-full rounded border px-3 py-2 font-medium"
                  value={editingTitles[book.id] ?? ""}
                  onChange={(event) => setEditingTitles((current) => ({ ...current, [book.id]: event.target.value }))}
                />
                <input
                  className="block w-full text-sm"
                  accept="image/png,image/jpeg,image/webp"
                  type="file"
                  onChange={(event) => void handleCover(book, event.target.files?.[0])}
                />
              </div>
              <div className="flex items-start gap-2">
                <button className="rounded bg-[#2f5d50] px-3 py-2 text-sm font-medium text-white" type="button" onClick={() => void handleRename(book)}>
                  保存
                </button>
                <button className="rounded bg-[#9f3a38] px-3 py-2 text-sm font-medium text-white" type="button" onClick={() => void handleDelete(book)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
