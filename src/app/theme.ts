import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#F3F6FA" : "#0B1220");
    document
      .querySelector('link[rel="icon"]')
      ?.setAttribute(
        "href",
        theme === "light" ? "/astergraph-light.svg" : "/astergraph.svg",
      );
    try {
      localStorage.setItem("astergraph-theme", theme);
    } catch {
      // A blocked/full storage area must not prevent in-session switching.
    }
  }, [theme]);

  return {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
