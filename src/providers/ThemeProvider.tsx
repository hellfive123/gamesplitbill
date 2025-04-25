import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: "light", 
  toggleTheme: () => {} 
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Load theme from localStorage first for immediate display
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Then try to load from Supabase if authenticated
    const loadThemePreference = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("theme")
          .single();
        
        if (preferences?.theme) {
          setTheme(preferences.theme as Theme);
          document.documentElement.classList.toggle("dark", preferences.theme === "dark");
        }
      }
    };

    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: session.user.id,
          theme: newTheme,
          updated_at: new Date().toISOString()
        });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
