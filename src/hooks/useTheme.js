import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "flux-theme";

function getPreferredTheme() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useTheme() {
  const [theme, setTheme] = useState(() => (typeof window === "undefined" ? "dark" : getPreferredTheme()));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event) => {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setTheme(event.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((value) => (value === "dark" ? "light" : "dark")),
    }),
    [theme],
  );
}

export default useTheme;
