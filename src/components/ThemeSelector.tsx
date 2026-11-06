"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/**
 * Light, dark, or follow the system setting. Rendered inside a popover, so it
 * only mounts on the client, after next-themes has read the stored choice.
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <fieldset className="rounded-md border p-1">
      <legend className="sr-only">Theme</legend>
      <div className="grid grid-cols-3 gap-1">
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <label key={value} className="relative cursor-pointer">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              className="peer sr-only"
            />
            <span className="flex flex-col items-center gap-1 rounded-sm py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
