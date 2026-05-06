import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-6">
      <form className="w-full max-w-sm rounded bg-white p-6 shadow-shelf" onSubmit={handleSubmit}>
        <h1 className="mb-6 text-2xl font-semibold">管理员登录</h1>
        <label className="mb-4 block text-sm font-medium">
          用户名
          <input className="mt-2 w-full rounded border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="mb-4 block text-sm font-medium">
          密码
          <input className="mt-2 w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
        <button className="w-full rounded bg-[#2f5d50] px-4 py-2 font-medium text-white" type="submit">
          登录
        </button>
      </form>
    </main>
  );
}
