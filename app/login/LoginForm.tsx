"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        style={{
          display: "block",
          fontSize: ".85rem",
          marginBottom: ".25rem",
        }}
      >
        Email
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          width: "100%",
          padding: ".5rem .6rem",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: ".95rem",
          marginBottom: ".6rem",
        }}
      />

      <label
        style={{
          display: "block",
          fontSize: ".85rem",
          marginBottom: ".25rem",
        }}
      >
        Password
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{
          width: "100%",
          padding: ".5rem .6rem",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: ".95rem",
          marginBottom: ".75rem",
        }}
      />

      {error && (
        <p style={{ fontSize: ".8rem", color: "#b91c1c", marginBottom: ".5rem" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          borderRadius: 9999,
          padding: ".45rem 1rem",
          fontSize: ".9rem",
          background: "#3b82f6",
          color: "#ffffff",
          border: "none",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
