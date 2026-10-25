import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDarkMode, type ThemePreference } from "@/contexts/DarkModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Her yerde (site, panel, admin) kullanılabilir tema değiştirici.
 * Üç seçenek sunar: Sistem (tarayıcı tercihine uyar), Açık, Koyu.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useDarkMode();
  const { t } = useLanguage();

  const labels: Record<ThemePreference, string> = {
    system: t("theme.system"),
    light: t("theme.light"),
    dark: t("theme.dark"),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("shrink-0 border-border/70", className)}
          aria-label={resolvedTheme === "dark" ? t("theme.toggleToLight") : t("theme.toggleToDark")}
          title={labels[theme]}
        >
          {theme === "system" ? (
            <Monitor className="h-4 w-4" />
          ) : resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {(["system", "light", "dark"] as ThemePreference[]).map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setTheme(option)}
            className={cn("gap-2", theme === option && "font-semibold bg-accent/50")}
          >
            {option === "system" ? <Monitor className="h-4 w-4" /> : option === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {labels[option]}
            {theme === option && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
