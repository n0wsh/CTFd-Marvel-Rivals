"use strict";

/**
 * Get user preferred theme from their past choice or browser
 * @returns {String} User preferred theme
 */
function getPreferredTheme() {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }
  // Firefox with 'resistFingerprint' activated always returns light
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Update navbar icon to match given theme.
 * @param {String} theme - 'dark' or 'light'
 */
function showActiveTheme(theme) {
  document.querySelectorAll(".theme-switch i.fas").forEach(activeThemeIcon => {
    activeThemeIcon.classList.toggle("fa-moon", theme === "dark");
    activeThemeIcon.classList.toggle("fa-sun", theme !== "dark");
  });

  document.querySelectorAll(".theme-switch").forEach(themeSwitch => {
    themeSwitch.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  });
}

// Change body theme early to prevent flash
let currentTheme = getPreferredTheme();
document.documentElement.setAttribute("data-bs-theme", currentTheme);

// On browser color-scheme change, update
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const onSystemThemeChange = () => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    return;
  }

  currentTheme = getPreferredTheme();
  document.documentElement.setAttribute("data-bs-theme", currentTheme);
  showActiveTheme(currentTheme);
};

if (darkModeMediaQuery.addEventListener) {
  darkModeMediaQuery.addEventListener("change", onSystemThemeChange);
} else if (darkModeMediaQuery.addListener) {
  darkModeMediaQuery.addListener(onSystemThemeChange);
}

window.addEventListener("DOMContentLoaded", () => {
  showActiveTheme(currentTheme);

  // On button click, switch
  document.querySelectorAll(".theme-switch").forEach(themeSwitch => {
    themeSwitch.addEventListener("click", ev => {
      currentTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", currentTheme);
      localStorage.setItem("theme", currentTheme);
      showActiveTheme(currentTheme);
      ev.preventDefault();
    });
  });
});
