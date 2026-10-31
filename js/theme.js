

const THEME_KEY = "vibeshopping_theme";

// Read the saved theme, or fall back to the operating system.
function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

// Apply a theme by setting data-theme on <html>.
// All colors come from CSS variables, so one attribute flips
// the whole design (see the [data-theme="dark"] block in CSS).
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const buttons = document.querySelectorAll("[data-theme-btn]");
  for (const button of buttons) {
    const isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

// Switch to the other theme and remember the choice.
// Also notifies the page (vibe:theme) so icon files can switch
// to their light/dark variant immediately.
function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (error) {
    // Storage blocked — the theme still changes for this visit.
  }
  applyTheme(next);
  document.dispatchEvent(new CustomEvent("vibe:theme", { detail: next }));
  return next;
}

// Start listening for clicks on any theme button.
// Uses event delegation, so buttons added later still work.
function initTheme() {
  applyTheme(getTheme());

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-btn]");
    if (!button) {
      return;
    }
    event.preventDefault();
    toggleTheme();
  });
}

const Theme = { getTheme, applyTheme, toggleTheme, init: initTheme };
window.Theme = Theme;
