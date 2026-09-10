/* ==========================================================================
   gukeeee — accent color settings
   Lets a visitor override the page's default accent color (--color-accent /
   --color-accent-dark / --color-accent-light), persisted per-browser. Applied
   directly on <body> (not <html>) because each page's own
   body[data-theme="..."] rule in theme.css sets those same custom properties
   on <body> — an override on <html> would just get shadowed by it.
   ========================================================================== */

const Settings = (function () {
  const KEY = "accentColorOverride";

  const PRESETS = {
    violet: { label: "Violet", colors: ["#a56bff", "#8b46f5", "rgba(165,107,255,0.16)"] },
    blue: { label: "Blue", colors: ["#4a8cff", "#2f6fe0", "rgba(74,140,255,0.16)"] },
    green: { label: "Green", colors: ["#34d17a", "#1fae61", "rgba(52,209,122,0.16)"] },
    teal: { label: "Teal", colors: ["#2dd4c8", "#17b0a5", "rgba(45,212,200,0.16)"] },
    red: { label: "Red", colors: ["#ff5e6a", "#e0394b", "rgba(255,94,106,0.16)"] },
    orange: { label: "Orange", colors: ["#ff9142", "#e0731f", "rgba(255,145,66,0.16)"] },
    yellow: { label: "Yellow", colors: ["#e8c93d", "#c9a81f", "rgba(232,201,61,0.16)"] },
    pink: { label: "Pink", colors: ["#ff6fb0", "#e0478f", "rgba(255,111,176,0.16)"] },
  };

  function get() {
    return localStorage.getItem(KEY) || "";
  }

  function apply(name) {
    const body = document.body;
    if (!body) return;
    const preset = PRESETS[name];
    if (!preset) {
      body.style.removeProperty("--color-accent");
      body.style.removeProperty("--color-accent-dark");
      body.style.removeProperty("--color-accent-light");
      return;
    }
    body.style.setProperty("--color-accent", preset.colors[0]);
    body.style.setProperty("--color-accent-dark", preset.colors[1]);
    body.style.setProperty("--color-accent-light", preset.colors[2]);
  }

  function set(name) {
    if (name) localStorage.setItem(KEY, name);
    else localStorage.removeItem(KEY);
    apply(name);
  }

  // Called right after <body> opens, before the rest of the page renders,
  // so a returning visitor's choice doesn't flash the page's own default
  // accent first.
  function initEarly() {
    apply(get());
  }

  return { PRESETS, get, set, apply, initEarly };
})();
