"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: "IN_PROGRESS", tags: [], notes: "" }),
    });

    const data = await res.json();
    if (!data.error) {
      setProjects((prev) => [data, ...prev]);
      setTitle("");
    } else {
      alert(data.error);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Project Tracker</h1>

      <form onSubmit={addProject} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>

      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {projects.map((p) => (
          <li key={p.id}>
            <strong>{p.title}</strong> — {p.status}
          </li>
        ))}
        {projects.length === 0 && <li>No projects yet.</li>}
      </ul>
    </main>
  );
}
