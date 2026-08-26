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

  const NAV_LINKS = [
    { key: "home", label: "Home", path: "/" },
    { key: "chequeo", label: "Chequeo", path: "/chequeo.html" },
    { key: "sports", label: "Sports", path: "/sports.html" },
    { key: "verbos", label: "Prueba de Verbos", path: "/verbos.html" },
  ];

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
            <span class="site-nav__user" id="nav-user" style="display:none;"></span>
            <button type="button" class="btn btn-sm btn-secondary" id="nav-auth-btn">Iniciar sesión</button>
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
        authBtn.textContent = "Cerrar sesión";
      } else {
        userEl.style.display = "none";
        authBtn.textContent = "Iniciar sesión";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", renderHeader);
})();
