/* ==========================================================================
   gukeeee — verb data store
   Verbs live as JSON in a GitHub Gist so every student reads the same list
   from any device with no backend. Reads are public (raw gist URL) and
   cached in localStorage (stale-while-revalidate). Writes are admin-only and
   go through the GitHub Gist API using a Personal Access Token the admin
   pastes in once — stored only in that browser's localStorage, never in
   source code and never sent anywhere but api.github.com.
   ========================================================================== */

const VerbStore = (function () {
  const GIST_ID = "c3b6e0babed8fee02455f9036fe8cde7";
  const RAW_URL = "https://gist.githubusercontent.com/gukeeee/c3b6e0babed8fee02455f9036fe8cde7/raw/verbs";
  const GIST_FILENAME = "verbs"; // the file inside the gist is named "verbs", not "verbs.json"

  const API_URL = GIST_ID ? `https://api.github.com/gists/${GIST_ID}` : null;

  const CACHE_KEY = "verbsCache";
  const CACHE_TIME_KEY = "verbsCacheTime";
  const TOKEN_KEY = "githubGistToken";
  const CACHE_TTL_MS = 5 * 60 * 1000;

  function isConfigured() {
    return !!(GIST_ID && RAW_URL);
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCache(verbs) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(verbs));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  }

  async function fetchFromGist() {
    const res = await fetch(`${RAW_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar la lista de verbos");
    const data = await res.json();
    return Array.isArray(data.verbs) ? data.verbs : [];
  }

  // Stale-while-revalidate: return the cache instantly (if any), then hand
  // back a promise that resolves with fresh data once the background fetch
  // completes (only when the cache is missing/stale).
  async function getVerbs({ forceRefresh = false } = {}) {
    if (!isConfigured()) return [];
    const cached = readCache();
    const cacheAge = Date.now() - Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    if (cached && !forceRefresh && cacheAge < CACHE_TTL_MS) return cached;
    try {
      const fresh = await fetchFromGist();
      writeCache(fresh);
      return fresh;
    } catch (err) {
      console.error("VerbStore: fetch failed, falling back to cache", err);
      return cached || [];
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token.trim());
  }

  function hasToken() {
    return !!getToken();
  }

  async function persist(verbs) {
    const token = getToken();
    if (!token) throw new Error("Falta el token de administrador. Configúralo primero.");
    const res = await fetch(API_URL, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify({ verbs }, null, 2) } } }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Error al guardar (${res.status}): ${body.slice(0, 200)}`);
    }
    writeCache(verbs);
    return verbs;
  }

  function makeId() {
    return `v_${Math.random().toString(36).slice(2, 10)}`;
  }

  async function saveVerb(verb, timestamp) {
    const verbs = await getVerbs({ forceRefresh: true });
    const idx = verbs.findIndex((v) => v.id === verb.id);
    if (idx >= 0) {
      verbs[idx] = verb;
    } else {
      verb.id = verb.id || makeId();
      verb.addedAt = verb.addedAt || timestamp;
      verbs.push(verb);
    }
    return persist(verbs);
  }

  async function deleteVerb(id) {
    const verbs = await getVerbs({ forceRefresh: true });
    return persist(verbs.filter((v) => v.id !== id));
  }

  async function setCurrent(id, isCurrent) {
    const verbs = await getVerbs({ forceRefresh: true });
    const verb = verbs.find((v) => v.id === id);
    if (verb) verb.isCurrent = isCurrent;
    return persist(verbs);
  }

  async function archiveCurrentToPast() {
    const verbs = await getVerbs({ forceRefresh: true });
    verbs.forEach((v) => { v.isCurrent = false; });
    return persist(verbs);
  }

  return {
    isConfigured, getVerbs, saveVerb, deleteVerb, setCurrent, archiveCurrentToPast,
    getToken, setToken, hasToken,
  };
})();
