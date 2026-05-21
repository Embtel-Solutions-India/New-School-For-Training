import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext({ isDark: true, toggleTheme: () => {} });

export const DashboardThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved !== null) return saved === "dark";
    } catch {}
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {}
    return true;
  });

  useEffect(() => {
    try { localStorage.setItem("dashboardTheme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  return (
    <Ctx.Provider value={{ isDark, toggleTheme: () => setIsDark((v) => !v) }}>
      {children}
    </Ctx.Provider>
  );
};

export const useDashboardTheme = () => useContext(Ctx);
