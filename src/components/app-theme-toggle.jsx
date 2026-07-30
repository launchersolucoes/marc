"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("marc-theme", next);
    setTheme(next);
  }

  return (
    <button
      className="app-theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
