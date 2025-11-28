"use client";

import React, { useState } from "react";

export default function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setMessage(`User ${data.email} created.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: ".6rem" }}>
        <label style={{ display: "block", fontSize: ".85rem", marginBottom: 4 }}>
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: ".6rem" }}>
        <label style={{ display: "block", fontSize: ".85rem", marginBottom: 4 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: ".6rem" }}>
        <label style={{ display: "block", fontSize: ".85rem", marginBottom: 4 }}>
          Password
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: ".9rem" }}>
        <label style={{ display: "block", fontSize: ".85rem", marginBottom: 4 }}>
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
          style={{
            ...inputStyle,
            paddingRight: ".5rem",
          }}
        >
          <option value="USER">USER (normal driver / EMT)</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {error && (
        <p style={{ color: "#b91c1c", fontSize: ".8rem", marginBottom: ".4rem" }}>
          {error}
        </p>
      )}
      {message && (
        <p style={{ color: "#15803d", fontSize: ".8rem", marginBottom: ".4rem" }}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          borderRadius: 9999,
          padding: ".4rem 1rem",
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          fontSize: ".9rem",
          cursor: "pointer",
        }}
      >
        {loading ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: ".45rem .6rem",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: ".9rem",
};
