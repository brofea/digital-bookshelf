export type Book = {
  id: number;
  title: string;
  coverPath: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = "";

export async function listBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE}/api/books`);
  if (!response.ok) throw new Error("Failed to load books");
  const data = (await response.json()) as { items: Book[] };
  return data.items;
}

export async function getBook(id: string | number): Promise<Book> {
  const response = await fetch(`${API_BASE}/api/books/${id}`);
  if (!response.ok) throw new Error("Failed to load book");
  return (await response.json()) as Book;
}

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) throw new Error("Invalid username or password");
  const data = (await response.json()) as { token: string };
  localStorage.setItem("token", data.token);
  return data.token;
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` };
}

export async function uploadBook(title: string, file: File): Promise<Book> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/books/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });
  if (!response.ok) throw new Error("Upload failed");
  return (await response.json()) as Book;
}

export async function updateBook(id: number, input: { title?: string; coverPath?: string }): Promise<Book> {
  const response = await fetch(`${API_BASE}/api/books/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error("Update failed");
  return (await response.json()) as Book;
}

export async function uploadCover(id: number, cover: File): Promise<Book> {
  const formData = new FormData();
  formData.append("cover", cover);

  const response = await fetch(`${API_BASE}/api/books/${id}/cover`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });
  if (!response.ok) throw new Error("Cover upload failed");
  return (await response.json()) as Book;
}

export async function deleteBook(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/books/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!response.ok) throw new Error("Delete failed");
}
