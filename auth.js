/* ==========================================================================
   gukeeee — shared auth module
   Single source of truth for the USERS gist login system, used by chequeo.js,
   header.js and verbos.js. Session lives in localStorage under "currentUser".
   ========================================================================== */

const Auth = (function () {
  const USERS_URL = "https://gist.githubusercontent.com/gukeeee/76c792fec2bb289e73fd05cc6a93159c/raw";

  let users = [];
  let usersLoaded = false;
  let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const listeners = [];

  async function loadUsers() {
    if (usersLoaded) return users;
    try {
      const res = await fetch(USERS_URL, { cache: "no-store" });
      const data = await res.json();
      users = data.USERS || [];
      usersLoaded = true;
    } catch (err) {
      console.error("Auth: error fetching USERS", err);
    }
    return users;
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(currentUser); } catch (err) { console.error(err); }
    });
  }

  function onChange(fn) {
    listeners.push(fn);
    fn(currentUser);
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  function isAdmin() {
    return !!(currentUser && currentUser.isAdmin);
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    notify();
  }

  async function attemptLogin(username, password) {
    await loadUsers();
    const match = users.find((u) => u.username === username && u.password === password);
    if (!match) return false;
    currentUser = {
      username: match.username,
      displayName: match.displayName || match.username,
      isAdmin: !!match.isAdmin,
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    notify();
    return true;
  }

  function closeOverlay(overlay) {
    overlay.classList.add("closing");
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 250);
  }

  function openLoginModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h2>Iniciar sesión</h2>
        <div class="field">
          <label for="auth-username">Usuario</label>
          <input type="text" id="auth-username" class="input" autocomplete="username">
        </div>
        <div class="field">
          <label for="auth-password">Contraseña</label>
          <input type="password" id="auth-password" class="input" autocomplete="current-password">
        </div>
        <p id="auth-error" style="display:none;color:var(--color-danger);font-size:0.82rem;margin:-8px 0 12px;">Usuario o contraseña incorrectos</p>
        <div class="row between">
          <button type="button" class="btn btn-ghost" id="auth-cancel">Cancelar</button>
          <button type="button" class="btn btn-primary" id="auth-submit">Ingresar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("visible"));

    const usernameInput = overlay.querySelector("#auth-username");
    const passwordInput = overlay.querySelector("#auth-password");
    const errorEl = overlay.querySelector("#auth-error");

    async function submit() {
      const ok = await attemptLogin(usernameInput.value.trim(), passwordInput.value);
      if (ok) {
        closeOverlay(overlay);
      } else {
        errorEl.style.display = "block";
      }
    }

    overlay.querySelector("#auth-submit").addEventListener("click", submit);
    overlay.querySelector("#auth-cancel").addEventListener("click", () => closeOverlay(overlay));
    passwordInput.addEventListener("keyup", (e) => { if (e.key === "Enter") submit(); });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(overlay); });
    usernameInput.focus();
  }

  loadUsers();

  return { loadUsers, getCurrentUser, isLoggedIn, isAdmin, logout, openLoginModal, onChange };
})();
