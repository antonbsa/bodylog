export type ThemePreference = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

// Keep in sync with the inline script in apps/web/index.html.
export const THEME_STORAGE_KEY = "bodylog-theme"

const DARK_QUERY = "(prefers-color-scheme: dark)"

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light"
  }

  return preference
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    return isThemePreference(stored) ? stored : "system"
  } catch {
    return getAppliedTheme()
  }
}

/** The theme currently on <html> ("system" when no data-theme is set). */
function getAppliedTheme(): ThemePreference {
  const applied = document.documentElement.dataset.theme

  return applied === "light" || applied === "dark" ? applied : "system"
}

/** Persists the preference and applies it to <html>; "system" removes data-theme so the CSS media query decides. */
export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    }
  } catch {
    // Storage can be blocked; the preference still applies for this page view.
  }

  if (preference === "system") {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = preference
  }

  notifyListeners()
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

/** Subscribes to preference changes and to OS theme changes. */
export function subscribeToTheme(listener: () => void) {
  const mediaQuery = window.matchMedia(DARK_QUERY)

  listeners.add(listener)
  mediaQuery.addEventListener("change", listener)

  return () => {
    listeners.delete(listener)
    mediaQuery.removeEventListener("change", listener)
  }
}

/** Reads data-theme (set by the inline script and setThemePreference) so it stays right when storage is blocked. */
export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getAppliedTheme(), window.matchMedia(DARK_QUERY).matches)
}
