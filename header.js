/* ==========================================================================
   gukeeee — shared site header
   Renders into <div id="site-header" data-active="home|chequeo|sports|verbos">
   Requires auth.js to be loaded first.
   ========================================================================== */

(function () {
  // The site is always served from its domain root (CNAME / Cloudflare Pages
  // root deploy), so plain root-relative paths are correct everywhere and
  // never need a computed "base path" prefix.
  function navigateTo(path) {
    window.location.href = path;
  }
  window.navigateTo = navigateTo;

  // Chequeo and Sports stay live at their URLs and are still linked from the
  // homepage — just not in the global nav, to keep it focused.
  const NAV_LINKS = [
    { key: "home", label: "Home", path: "/" },
    { key: "verbos", label: "Prueba de Verbos", path: "/verbos.html" },
  ];

  function renderSwatches() {
    const current = Settings.get();
    const defaultBtn = `<button type="button" class="settings-swatch settings-swatch--default${current ? "" : " is-selected"}" data-color="" title="Default"></button>`;
    const presetBtns = Object.keys(Settings.PRESETS).map((key) => {
      const preset = Settings.PRESETS[key];
      return `<button type="button" class="settings-swatch${current === key ? " is-selected" : ""}" data-color="${key}" style="background:${preset.colors[0]}" title="${preset.label}"></button>`;
    }).join("");
    return defaultBtn + presetBtns;
  }

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const active = mount.dataset.active || "";

    mount.innerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a class="site-header__logo" href="/">
            <img src="/logo.png" alt="Gukeeee">
            <span>gukeeee</span>
          </a>
          <button type="button" class="site-header__menu-toggle" id="nav-toggle" aria-label="Menu">&#9776;</button>
          <nav class="site-nav" id="site-nav">
            ${NAV_LINKS.map(
              (link) => `<a class="site-nav__link${link.key === active ? " is-active" : ""}" data-path="${link.path}">${link.label}</a>`
            ).join("")}
            <div class="settings-wrap" id="settings-wrap">
              <button type="button" class="site-header__icon-btn" id="settings-toggle" aria-label="Color settings">🎨</button>
              <div class="settings-popover" id="settings-popover">
                ${renderSwatches()}
              </div>
            </div>
            <span class="site-nav__user" id="nav-user" style="display:none;"></span>
            <button type="button" class="btn btn-sm btn-secondary" id="nav-auth-btn">Sign in</button>
          </nav>
        </div>
      </header>
    `;

    mount.querySelectorAll(".site-nav__link").forEach((el) => {
      el.addEventListener("click", () => navigateTo(el.dataset.path));
    });

    mount.querySelector("#nav-toggle").addEventListener("click", () => {
      mount.querySelector("#site-nav").classList.toggle("is-open");
    });

    const settingsWrap = mount.querySelector("#settings-wrap");
    const settingsPopover = mount.querySelector("#settings-popover");
    mount.querySelector("#settings-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      settingsPopover.classList.toggle("is-open");
    });
    settingsPopover.querySelectorAll(".settings-swatch").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        Settings.set(swatch.dataset.color);
        settingsPopover.querySelectorAll(".settings-swatch").forEach((s) => s.classList.remove("is-selected"));
        swatch.classList.add("is-selected");
        settingsPopover.classList.remove("is-open");
      });
    });
    document.addEventListener("click", (e) => {
      if (!settingsWrap.contains(e.target)) settingsPopover.classList.remove("is-open");
    });

    const authBtn = mount.querySelector("#nav-auth-btn");
    const userEl = mount.querySelector("#nav-user");

    authBtn.addEventListener("click", () => {
      if (Auth.isLoggedIn()) {
        Auth.logout();
      } else {
        Auth.openLoginModal();
      }
    });

    Auth.onChange((user) => {
      if (user) {
        userEl.style.display = "inline";
        userEl.textContent = user.displayName;
        authBtn.textContent = "Sign out";
      } else {
        userEl.style.display = "none";
        authBtn.textContent = "Sign in";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", renderHeader);
})();
