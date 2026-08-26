/* ==========================================================================
   gukeeee — Prueba de Verbos page logic
   Ties together auth.js (admin gate), verbStore.js (gist-backed data) and
   conjugator.js (form generation) into: admin CRUD, a lookup table, a
   Conjuguemos-style practice drill, and a timed 2-verb test simulation.

   UI text is in English (this is instructional chrome); anything that IS
   the Spanish practice content — pronouns (yo, tú, él...), the mandato
   pronoun targets (Tú, Ud., Nosotros), and of course the conjugated verb
   forms themselves — stays in Spanish, since that's what's being tested.
   ========================================================================== */

let verbs = [];
let userIsAdmin = false;

const MANDATO_SLOTS = ["tuAff", "tuNeg", "ud", "nosotros"];
const PRONOUNS = [
  { label: "yo", bucket: "yo" },
  { label: "tú", bucket: "tu" },
  { label: "él", bucket: "el" },
  { label: "ella", bucket: "el" },
  { label: "usted", bucket: "el" },
  { label: "nosotros", bucket: "nosotros" },
  { label: "nosotras", bucket: "nosotros" },
  { label: "ellos", bucket: "ellos" },
  { label: "ellas", bucket: "ellos" },
  { label: "ustedes", bucket: "ellos" },
];
const QUESTION_POOL = [...Conjugator.TENSES.map((t) => t.key), "mandato"];

function tenseLabelParts(key) {
  if (key === "mandato") return { en: "Command", es: "Mandato" };
  const t = Conjugator.TENSES.find((x) => x.key === key);
  return t ? { en: t.label, es: t.labelEs } : { en: key, es: "" };
}

// English on its own line, Spanish below it in a distinct style — used
// anywhere a tense name is rendered as HTML (table headers/cells, the
// drill's tense line).
function tenseLabelHtml(key) {
  const { en, es } = tenseLabelParts(key);
  return `<span class="tense-en">${en}</span>${es ? `<span class="tense-es">${es}</span>` : ""}`;
}

function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Merge a verb record's admin overrides on top of the rule-generated forms.
// Overridden slots are always flagged irregular, since the admin chose to
// correct them by hand.
function getVerbForms(record) {
  const base = Conjugator.conjugate(record.infinitive);
  const overrides = record.overrides || {};
  const forms = {};
  Conjugator.TENSES.forEach((t) => {
    forms[t.key] = {};
    Conjugator.PERSONS.forEach((p) => {
      const key = `${t.key}.${p}`;
      forms[t.key][p] = overrides[key] !== undefined
        ? { value: overrides[key], irregular: true }
        : base.forms[t.key][p];
    });
  });
  const imperative = {};
  MANDATO_SLOTS.forEach((slot) => {
    const key = `imperative.${slot}`;
    imperative[slot] = overrides[key] !== undefined
      ? { value: overrides[key], irregular: true }
      : base.imperative[slot];
  });
  return { forms, imperative, imperfectoSubjuntivoAlt: base.imperfectoSubjuntivoAlt, infinitive: record.infinitive, meaning: record.meaning };
}

function isAnswerCorrect(userValue, correct, alt) {
  const u = normalize(userValue);
  if (!u) return false;
  if (u === normalize(correct)) return true;
  if (alt && u === normalize(alt)) return true;
  return false;
}

/* ---------------------------------- sound effects ---------------------------------- */
/* Short synthesized tones via Web Audio — no audio files to host. */

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(freq, duration, delay = 0, type = "sine", volume = 0.18) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const startTime = ctx.currentTime + delay;
    osc.start(startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.stop(startTime + duration + 0.02);
  } catch (err) {
    // Audio can fail to init in some contexts (autoplay policy, etc.) — silent no-op.
  }
}

function playFeedbackSound(correct) {
  if (correct) {
    beep(660, 0.12, 0);
    beep(880, 0.16, 0.09);
  } else {
    beep(200, 0.28, 0, "sawtooth", 0.12);
  }
}

/* ---------------------------------- celebration ---------------------------------- */
/* A lightweight CSS confetti burst — no library, cleans up after itself. */

const CONFETTI_COLORS = ["#ff5e7e", "#ffd166", "#06d6a0", "#4cc9f0", "#a56bff"];

function celebrate(pieceCount = 40) {
  const container = document.createElement("div");
  container.className = "confetti-burst";
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3200);
}

/* ---------------------------------- boot ---------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  if (!VerbStore.isConfigured()) {
    document.getElementById("config-warning").style.display = "block";
  }

  document.getElementById("print-lookup-btn").onclick = () => window.print();
  document.getElementById("random-verb-btn").onclick = () => {
    if (!verbs.length) return;
    selectLookupVerb(verbs[Math.floor(Math.random() * verbs.length)]);
  };

  Auth.onChange((user) => {
    userIsAdmin = Auth.isAdmin();
    document.getElementById("admin-section").style.display = userIsAdmin ? "block" : "none";
    if (userIsAdmin) renderAdminSection();
  });

  await refreshVerbs();
});

async function refreshVerbs({ forceRefresh = false } = {}) {
  verbs = await VerbStore.getVerbs({ forceRefresh });
  applyVerbs(verbs);
}

// Used right after a save/delete/toggle: the mutation functions already
// return the up-to-date list, so render with that directly instead of
// re-fetching the public raw URL, which can briefly lag behind a commit
// that was just made (CDN caching) and would otherwise look like the
// change "didn't happen".
function applyVerbs(newVerbs) {
  verbs = newVerbs;
  renderWeekBanner();
  if (userIsAdmin) renderAdminSection();
  renderLookup();
  renderPracticeSetup();
  renderTestSetup();
}

// "Week of ..." is derived from the earliest addedAt among verbs currently
// marked current — i.e. whenever this batch was first added — rather than
// needing the admin to separately track/set a date.
function renderWeekBanner() {
  const banner = document.getElementById("week-banner");
  const current = verbs.filter((v) => v.isCurrent && v.addedAt);
  if (!current.length) { banner.style.display = "none"; return; }
  const earliest = Math.min(...current.map((v) => v.addedAt));
  const dateStr = new Date(earliest).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  banner.textContent = `📅 Week of ${dateStr}`;
  banner.style.display = "block";
}

/* ---------------------------------- admin ---------------------------------- */

// Persisted across re-renders — renderAdminSection() rebuilds the whole
// section's DOM after every admin action (save/delete/toggle/archive), so
// without this the panel would snap shut every time.
let adminPanelOpen = false;

function adminCollapseHtml(bodyHtml) {
  return `
    <div class="admin-panel${adminPanelOpen ? " is-open" : ""}">
      <button type="button" class="admin-panel__toggle" id="admin-toggle">
        <span>⚙️ Admin panel</span>
        <span class="admin-panel__chevron" aria-hidden="true">▾</span>
      </button>
      <div class="admin-collapse">
        <div class="admin-collapse__inner">${bodyHtml}</div>
      </div>
    </div>
  `;
}

function bindAdminToggle(el) {
  el.querySelector("#admin-toggle").addEventListener("click", () => {
    adminPanelOpen = !adminPanelOpen;
    el.querySelector(".admin-panel").classList.toggle("is-open", adminPanelOpen);
  });
}

function renderAdminSection() {
  const el = document.getElementById("admin-section");
  el.style.display = "block";

  if (!VerbStore.isConfigured()) {
    el.innerHTML = adminCollapseHtml(`
      <p style="color:var(--color-text-muted);">
        The verbs Gist isn't configured yet. Create a Gist with a file containing <code>{"verbs": []}</code>,
        then put its ID and its "Raw" URL into <code>GIST_ID</code> / <code>RAW_URL</code> in
        <code>verbStore.js</code>.
      </p>
    `);
    bindAdminToggle(el);
    return;
  }

  const hasToken = VerbStore.hasToken();
  const current = verbs.filter((v) => v.isCurrent);
  const past = verbs.filter((v) => !v.isCurrent);

  el.innerHTML = adminCollapseHtml(`
      <div class="stack" style="margin-top: var(--space-3);">
        <div class="card" style="background:var(--color-surface-alt); border:none;">
          <strong>GitHub token (yours only)</strong>
          <p style="color:var(--color-text-muted); font-size:0.82rem; margin:6px 0 10px;">
            Used only in your browser to save changes to the Gist. Generate one at
            github.com/settings/tokens with the <code>gist</code> scope only.
          </p>
          <div class="row">
            <input type="password" id="admin-token-input" class="input" style="max-width:320px;"
              placeholder="${hasToken ? "Token already set — paste a new one to replace it" : "ghp_..."}">
            <button class="btn btn-secondary btn-sm" id="admin-token-save">Save token</button>
          </div>
        </div>

        <div class="card" id="admin-add-card" style="border:none; background:var(--color-surface-alt);">
          <strong id="admin-add-title">Add verb</strong>
          <div class="row" style="margin:10px 0;">
            <div class="field" style="margin:0;">
              <label>Infinitive</label>
              <input type="text" id="admin-infinitive" class="input" placeholder="hablar" style="width:160px;">
            </div>
            <div class="field" style="margin:0; flex:1;">
              <label>Meaning</label>
              <input type="text" id="admin-meaning" class="input" placeholder="to speak">
            </div>
            <button class="btn btn-primary btn-sm" id="admin-generate" style="align-self:flex-end;">Generate conjugation</button>
          </div>
          <div id="admin-override-wrap"></div>
          <div class="row" id="admin-save-row" style="display:none; margin-top:var(--space-3);">
            <button class="btn btn-primary" id="admin-save-verb">Save verb</button>
            <button class="btn btn-ghost" id="admin-cancel-edit">Cancel</button>
          </div>
        </div>

        <div>
          <div class="row between">
            <strong>Current verbs (${current.length})</strong>
            <button class="btn btn-secondary btn-sm" id="admin-archive-btn" ${current.length ? "" : "disabled"}>
              Archive current week → past
            </button>
          </div>
          <div id="admin-current-list">${renderAdminVerbList(current)}</div>
          <strong style="display:block; margin-top:var(--space-4);">Past-week verbs (${past.length})</strong>
          <div id="admin-past-list">${renderAdminVerbList(past)}</div>
        </div>
      </div>
  `);

  bindAdminToggle(el);

  el.querySelector("#admin-token-save").addEventListener("click", () => {
    const val = el.querySelector("#admin-token-input").value;
    if (val.trim()) { VerbStore.setToken(val); alert("Token saved in this browser."); renderAdminSection(); }
  });

  el.querySelector("#admin-generate").addEventListener("click", () => generateAdminPreview());
  el.querySelectorAll(".admin-edit-btn").forEach((b) => b.addEventListener("click", () => editVerb(b.dataset.id)));
  el.querySelectorAll(".admin-delete-btn").forEach((b) => b.addEventListener("click", () => deleteVerbConfirm(b.dataset.id)));
  el.querySelectorAll(".admin-toggle-current-btn").forEach((b) =>
    b.addEventListener("click", () => toggleCurrent(b.dataset.id, b.dataset.next === "true"))
  );
  el.querySelector("#admin-archive-btn").addEventListener("click", archiveWeek);
}

function renderAdminVerbList(list) {
  if (!list.length) return `<p class="empty-state" style="padding:var(--space-3);">No verbs yet.</p>`;
  return list.map((v) => `
    <div class="admin-verb-row">
      <span class="infinitive">${v.infinitive}</span>
      <span class="meaning">${v.meaning || ""}</span>
      <span class="badge ${v.isCurrent ? "badge-accent" : "badge-muted"}">${v.isCurrent ? "Current" : "Past"}</span>
      <div class="row" style="gap:6px;">
        <button class="btn btn-sm btn-secondary admin-toggle-current-btn" data-id="${v.id}" data-next="${!v.isCurrent}">
          ${v.isCurrent ? "Mark past" : "Mark current"}
        </button>
        <button class="btn btn-sm btn-secondary admin-edit-btn" data-id="${v.id}">Edit</button>
        <button class="btn btn-sm btn-danger admin-delete-btn" data-id="${v.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

function generateAdminPreview(existingRecord) {
  const infinitiveInput = document.getElementById("admin-infinitive");
  const meaningInput = document.getElementById("admin-meaning");
  const infinitive = (existingRecord ? existingRecord.infinitive : infinitiveInput.value).trim().toLowerCase();

  if (!/^[a-záéíóúñ]*(ar|er|ir)$/.test(infinitive)) {
    alert("Enter a valid infinitive ending in -ar, -er, or -ir.");
    return;
  }
  infinitiveInput.value = infinitive;
  if (existingRecord) meaningInput.value = existingRecord.meaning || "";

  let conjugated;
  try {
    conjugated = Conjugator.conjugate(infinitive);
  } catch (err) {
    alert("Couldn't conjugate that verb: " + err.message);
    return;
  }

  const overrides = existingRecord ? existingRecord.overrides || {} : {};
  const wrap = document.getElementById("admin-override-wrap");

  function cellInput(key, generatedValue) {
    const val = overrides[key] !== undefined ? overrides[key] : generatedValue;
    return `<input class="admin-table-input" data-key="${key}" data-generated="${generatedValue}" value="${val}">`;
  }

  const rows = Conjugator.TENSES.map((t) => `
    <tr>
      <td>${tenseLabelHtml(t.key)}</td>
      ${Conjugator.PERSONS.map((p) => `<td>${cellInput(`${t.key}.${p}`, conjugated.forms[t.key][p].value)}</td>`).join("")}
    </tr>
  `).join("");

  const mandatoCells = MANDATO_SLOTS.map((slot) =>
    `<td>${cellInput(`imperative.${slot}`, conjugated.imperative[slot].value)}</td>`
  ).join("");

  wrap.innerHTML = `
    <p style="font-size:0.8rem; color:var(--color-text-muted); margin:10px 0 4px;">
      Review the generated table below. Fix anything that's wrong — a changed cell is marked red and is saved as
      a hand-edited irregular form.
    </p>
    <div class="table-scroll">
      <table class="data-table admin-conjugation-table">
        <thead><tr><th>Tense</th><th>Yo</th><th>Tú</th><th>Él/Ella/Ud.</th><th>Nosotros</th><th>Ellos/Ellas/Uds.</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <h4 style="margin: var(--space-3) 0 var(--space-2);">Commands (Mandatos)</h4>
    <div class="table-scroll">
      <table class="data-table admin-conjugation-table">
        <thead><tr><th>Tú (affirmative)</th><th>Tú (negative)</th><th>Ud.</th><th>Nosotros</th></tr></thead>
        <tbody><tr>${mandatoCells}</tr></tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll("input[data-key]").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.toggle("was-changed", input.value !== input.dataset.generated);
    });
    if (input.value !== input.dataset.generated) input.classList.add("was-changed");
  });

  document.getElementById("admin-save-row").style.display = "flex";
  document.getElementById("admin-add-title").textContent = existingRecord ? `Editing "${infinitive}"` : "Add verb";

  document.getElementById("admin-save-verb").onclick = () => saveVerbFromForm(existingRecord);
  document.getElementById("admin-cancel-edit").onclick = resetAdminForm;
}

function resetAdminForm() {
  document.getElementById("admin-infinitive").value = "";
  document.getElementById("admin-meaning").value = "";
  document.getElementById("admin-override-wrap").innerHTML = "";
  document.getElementById("admin-save-row").style.display = "none";
  document.getElementById("admin-add-title").textContent = "Add verb";
}

async function saveVerbFromForm(existingRecord) {
  const infinitive = document.getElementById("admin-infinitive").value.trim().toLowerCase();
  const meaning = document.getElementById("admin-meaning").value.trim();

  const isDuplicate = verbs.some((v) => v.infinitive === infinitive && v.id !== (existingRecord && existingRecord.id));
  if (isDuplicate && !confirm(`"${infinitive}" is already in the list. Add it again anyway?`)) return;

  const overrides = {};
  document.querySelectorAll("#admin-override-wrap input[data-key]").forEach((input) => {
    if (input.value !== input.dataset.generated) overrides[input.dataset.key] = input.value;
  });

  const record = {
    id: existingRecord ? existingRecord.id : undefined,
    infinitive,
    meaning,
    isCurrent: existingRecord ? existingRecord.isCurrent : true,
    overrides,
  };

  try {
    const updated = await VerbStore.saveVerb(record, Date.now());
    resetAdminForm();
    applyVerbs(updated);
  } catch (err) {
    alert(err.message);
  }
}

function editVerb(id) {
  const record = verbs.find((v) => v.id === id);
  if (!record) return;
  generateAdminPreview(record);
  document.getElementById("admin-add-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function deleteVerbConfirm(id) {
  const record = verbs.find((v) => v.id === id);
  if (!record) return;
  if (!confirm(`Delete "${record.infinitive}"? This can't be undone.`)) return;
  try {
    const updated = await VerbStore.deleteVerb(id);
    applyVerbs(updated);
  } catch (err) {
    alert(err.message);
  }
}

async function toggleCurrent(id, next) {
  try {
    const updated = await VerbStore.setCurrent(id, next);
    applyVerbs(updated);
  } catch (err) {
    alert(err.message);
  }
}

async function archiveWeek() {
  if (!confirm('This marks every current verb as "past". Continue?')) return;
  try {
    const updated = await VerbStore.archiveCurrentToPast();
    applyVerbs(updated);
  } catch (err) {
    alert(err.message);
  }
}

/* ---------------------------------- lookup ---------------------------------- */

let currentLookupId = null;

function selectLookupVerb(record) {
  if (!record) return;
  currentLookupId = record.id;
  const searchInput = document.getElementById("lookup-search");
  if (searchInput) searchInput.value = record.infinitive;
  renderLookupTable(record);
}

function renderLookup() {
  const searchInput = document.getElementById("lookup-search");
  const resultsEl = document.getElementById("lookup-results");

  if (!verbs.length) {
    searchInput.value = "";
    resultsEl.innerHTML = "";
    resultsEl.style.display = "none";
    document.getElementById("lookup-table-wrap").innerHTML = `<div class="empty-state">No verbs added yet.</div>`;
    return;
  }

  const sorted = [...verbs].sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  selectLookupVerb(verbs.find((v) => v.id === currentLookupId) || sorted[0]);

  function showResults(query) {
    const q = query.trim().toLowerCase();
    const matches = (q
      ? sorted.filter((v) => v.infinitive.includes(q) || (v.meaning || "").toLowerCase().includes(q))
      : sorted
    ).slice(0, 8);
    resultsEl.innerHTML = matches.length
      ? matches.map((v) => `
          <div class="lookup-result-item" data-id="${v.id}">
            ${v.infinitive}${v.meaning ? ` <span style="color:var(--color-text-faint);">— ${v.meaning}</span>` : ""}
            ${v.isCurrent ? "" : ' <span style="color:var(--color-text-faint);">(past)</span>'}
          </div>
        `).join("")
      : `<div class="lookup-result-empty">No matches</div>`;
    resultsEl.querySelectorAll(".lookup-result-item").forEach((el) => {
      // mousedown (not click) so this fires before the input's blur hides the dropdown first.
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectLookupVerb(verbs.find((v) => v.id === el.dataset.id));
        resultsEl.style.display = "none";
      });
    });
    resultsEl.style.display = "block";
  }

  searchInput.oninput = () => showResults(searchInput.value);
  searchInput.onfocus = () => showResults(searchInput.value);
  searchInput.onblur = () => { resultsEl.style.display = "none"; };
  searchInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      const first = resultsEl.querySelector(".lookup-result-item");
      if (first) {
        selectLookupVerb(verbs.find((v) => v.id === first.dataset.id));
        resultsEl.style.display = "none";
        searchInput.blur();
      }
    } else if (e.key === "Escape") {
      resultsEl.style.display = "none";
      searchInput.blur();
    }
  };
}

function renderLookupTable(record) {
  const wrap = document.getElementById("lookup-table-wrap");
  if (!record) { wrap.innerHTML = ""; return; }
  const data = getVerbForms(record);

  const rows = Conjugator.TENSES.map((t) => `
    <tr>
      <td>${tenseLabelHtml(t.key)}</td>
      ${Conjugator.PERSONS.map((p) => {
        const cell = data.forms[t.key][p];
        return `<td class="${cell.irregular ? "is-irregular" : ""}">${cell.value}</td>`;
      }).join("")}
    </tr>
  `).join("");

  const mandatoCells = MANDATO_SLOTS.map((slot) => {
    const cell = data.imperative[slot];
    return `<td class="${cell.irregular ? "is-irregular" : ""}">${cell.value}</td>`;
  }).join("");

  wrap.innerHTML = `
    <h3 class="print-only">${record.infinitive}${record.meaning ? ` (${record.meaning})` : ""} — Conjugations</h3>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>Tense</th><th>Yo</th><th>Tú</th><th>Él/Ella/Ud.</th><th>Nosotros</th><th>Ellos/Ellas/Uds.</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <h4 style="margin-top: var(--space-4);">Commands (Mandatos)</h4>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>Tú (affirmative)</th><th>Tú (negative)</th><th>Ud.</th><th>Nosotros</th></tr></thead>
        <tbody><tr>${mandatoCells}</tr></tbody>
      </table>
    </div>
  `;
}

/* ---------------------------------- practice ---------------------------------- */

function renderPracticeSetup() {
  const setup = document.getElementById("practice-setup");
  document.getElementById("practice-drill").style.display = "none";
  setup.style.display = "block";
  stopDrillTimer();

  if (!verbs.length) {
    setup.innerHTML = `<div class="empty-state">No verbs to practice yet.</div>`;
    return;
  }

  setup.innerHTML = `
    <div class="row" style="margin-bottom: var(--space-2);">
      <button class="btn btn-sm btn-secondary" id="pick-current">This week</button>
      <button class="btn btn-sm btn-secondary" id="pick-past">Past weeks</button>
      <button class="btn btn-sm btn-secondary" id="pick-all">Both</button>
      <button class="btn btn-sm btn-ghost" id="pick-none">None</button>
    </div>
    <div class="verb-picker" id="practice-verb-picker">
      ${verbs.map((v) => `
        <label class="verb-chip">
          <input type="checkbox" value="${v.id}" checked>
          ${v.infinitive} ${v.isCurrent ? "" : "<span style=\"color:var(--color-text-faint);\">(past)</span>"}
        </label>
      `).join("")}
    </div>

    <div class="row between" style="margin: var(--space-4) 0 var(--space-2);">
      <strong style="font-size:0.85rem;">Tenses</strong>
      <div class="row" style="gap:6px;">
        <button class="btn btn-sm btn-ghost" id="tense-pick-all">All</button>
        <button class="btn btn-sm btn-ghost" id="tense-pick-none">None</button>
      </div>
    </div>
    <div class="verb-picker" id="practice-tense-picker">
      ${QUESTION_POOL.map((key) => {
        const { en, es } = tenseLabelParts(key);
        return `
          <label class="verb-chip">
            <input type="checkbox" value="${key}" checked>
            ${en} <span style="color:var(--color-text-faint); font-style:italic;">(${es})</span>
          </label>
        `;
      }).join("")}
    </div>

    <button class="btn btn-primary" id="start-practice" style="margin-top: var(--space-3);">Start practice</button>
  `;

  const verbCheckboxes = () => Array.from(setup.querySelectorAll('#practice-verb-picker input[type="checkbox"]'));
  const tenseCheckboxes = () => Array.from(setup.querySelectorAll('#practice-tense-picker input[type="checkbox"]'));

  setup.querySelector("#pick-current").onclick = () => verbCheckboxes().forEach((cb) => {
    cb.checked = verbs.find((v) => v.id === cb.value).isCurrent;
  });
  setup.querySelector("#pick-past").onclick = () => verbCheckboxes().forEach((cb) => {
    cb.checked = !verbs.find((v) => v.id === cb.value).isCurrent;
  });
  setup.querySelector("#pick-all").onclick = () => verbCheckboxes().forEach((cb) => { cb.checked = true; });
  setup.querySelector("#pick-none").onclick = () => verbCheckboxes().forEach((cb) => { cb.checked = false; });

  setup.querySelector("#tense-pick-all").onclick = () => tenseCheckboxes().forEach((cb) => { cb.checked = true; });
  setup.querySelector("#tense-pick-none").onclick = () => tenseCheckboxes().forEach((cb) => { cb.checked = false; });

  setup.querySelector("#start-practice").onclick = () => {
    const selectedIds = verbCheckboxes().filter((cb) => cb.checked).map((cb) => cb.value);
    const selectedVerbs = verbs.filter((v) => selectedIds.includes(v.id));
    const selectedTenses = tenseCheckboxes().filter((cb) => cb.checked).map((cb) => cb.value);
    if (!selectedVerbs.length) { alert("Select at least one verb."); return; }
    if (!selectedTenses.length) { alert("Select at least one tense."); return; }
    startPracticeDrill(selectedVerbs, selectedTenses);
  };
}

let drillState = null;

function stopDrillTimer() {
  if (drillState && drillState.timerHandle) clearInterval(drillState.timerHandle);
}

function startPracticeDrill(selectedVerbs, selectedTenses) {
  document.getElementById("practice-setup").style.display = "none";
  const drill = document.getElementById("practice-drill");
  drill.style.display = "block";
  drillState = { verbs: selectedVerbs, tenses: selectedTenses, correct: 0, total: 0, streak: 0, startTime: Date.now(), timerHandle: null };

  drill.innerHTML = `
    <button class="btn btn-ghost btn-sm drill-back-btn" id="drill-back">← Change selection</button>
    <div class="drill-layout">
      <aside class="drill-sidebar">
        <div class="drill-stat">
          <span class="drill-stat__icon" aria-hidden="true">⏱️</span>
          <span class="drill-stat__value" id="drill-timer">00:00</span>
        </div>
        <div class="drill-stat">
          <span class="drill-stat__label">Streak</span>
          <span class="drill-stat__value" id="drill-streak">0</span>
        </div>
        <div class="drill-stat">
          <span class="drill-stat__label">Accuracy</span>
          <span class="drill-stat__value" id="drill-accuracy">—</span>
        </div>
        <div class="drill-progress"><div class="drill-progress__bar" id="drill-progress-bar" style="width:0%"></div></div>
        <div class="drill-stat__label" style="text-align:center;">Score: <strong id="drill-score-text">0 / 0</strong></div>
      </aside>
      <div class="drill-main" id="drill-card"></div>
    </div>
  `;
  drill.querySelector("#drill-back").onclick = () => { stopDrillTimer(); renderPracticeSetup(); };

  drillState.timerHandle = setInterval(updateDrillTimer, 1000);
  nextDrillQuestion();
}

function updateDrillTimer() {
  const el = document.getElementById("drill-timer");
  if (!el || !drillState) return;
  const elapsed = Math.floor((Date.now() - drillState.startTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  el.textContent = `${m}:${s}`;
}

function updateDrillStats() {
  document.getElementById("drill-streak").textContent = drillState.streak;
  const acc = drillState.total ? Math.round((drillState.correct / drillState.total) * 100) : 0;
  document.getElementById("drill-accuracy").textContent = drillState.total ? `${acc}%` : "—";
  document.getElementById("drill-progress-bar").style.width = `${acc}%`;
  document.getElementById("drill-score-text").textContent = `${drillState.correct} / ${drillState.total}`;
}

function pickDrillQuestion() {
  const verb = drillState.verbs[Math.floor(Math.random() * drillState.verbs.length)];
  const data = getVerbForms(verb);
  const pool = drillState.tenses;
  const tenseKey = pool[Math.floor(Math.random() * pool.length)];

  if (tenseKey === "mandato") {
    const slot = MANDATO_SLOTS[Math.floor(Math.random() * MANDATO_SLOTS.length)];
    const cell = data.imperative[slot];
    return {
      pronounLabel: Conjugator.IMPERATIVE_LABELS[slot],
      infinitive: verb.infinitive,
      meaning: verb.meaning,
      tenseKey,
      answer: cell.value,
      alt: null,
    };
  }

  const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
  const cell = data.forms[tenseKey][pronoun.bucket];
  const alt = tenseKey === "imperfectoSubjuntivo" ? data.imperfectoSubjuntivoAlt[pronoun.bucket] : null;
  return {
    pronounLabel: pronoun.label,
    infinitive: verb.infinitive,
    meaning: verb.meaning,
    tenseKey,
    answer: cell.value,
    alt,
  };
}

function nextDrillQuestion() {
  const q = pickDrillQuestion();
  drillState.current = q;
  const card = document.getElementById("drill-card");
  card.innerHTML = `
    <div class="drill-focus">
      <div class="drill-focus__prompt">${q.pronounLabel} <strong>${q.infinitive}</strong>${q.meaning ? ` <span class="drill-focus__meaning">(${q.meaning})</span>` : ""}</div>
      <div class="drill-focus__tense">${tenseLabelHtml(q.tenseKey)}</div>
      <input type="text" class="drill-focus__input" id="drill-input" autocomplete="off" spellcheck="false">
      <button class="btn drill-focus__check" id="drill-check">Check Answer <span aria-hidden="true">→</span></button>
      <div class="drill-feedback" id="drill-feedback"></div>
    </div>
  `;
  const input = card.querySelector("#drill-input");
  input.focus();
  const check = () => checkDrillAnswer();
  card.querySelector("#drill-check").onclick = check;
  input.addEventListener("keyup", (e) => { if (e.key === "Enter") check(); });
}

function checkDrillAnswer() {
  const input = document.getElementById("drill-input");
  if (input.disabled) return;
  const feedback = document.getElementById("drill-feedback");
  const q = drillState.current;
  const ok = isAnswerCorrect(input.value, q.answer, q.alt);

  drillState.total++;
  if (ok) {
    drillState.correct++;
    drillState.streak++;
    if (drillState.streak % 5 === 0) celebrate(24);
  } else {
    drillState.streak = 0;
  }

  input.classList.add(ok ? "is-correct" : "is-incorrect");
  input.disabled = true;
  document.getElementById("drill-check").disabled = true;

  feedback.className = "drill-feedback " + (ok ? "correct" : "incorrect");
  feedback.textContent = ok ? "Correct!" : `Incorrect — answer: ${q.answer}`;

  playFeedbackSound(ok);
  updateDrillStats();

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-secondary btn-sm";
  nextBtn.style.marginTop = "10px";
  nextBtn.textContent = "Next →";
  nextBtn.onclick = nextDrillQuestion;
  document.getElementById("drill-card").querySelector(".drill-focus").appendChild(nextBtn);
}

/* ---------------------------------- test simulation ---------------------------------- */

const TEST_DURATION_SECONDS = 7 * 60;
let testState = null;
let testTimerHandle = null;

function renderTestSetup() {
  const setup = document.getElementById("test-setup");
  document.getElementById("test-runner").style.display = "none";
  setup.style.display = "block";
  if (testTimerHandle) clearInterval(testTimerHandle);

  const current = verbs.filter((v) => v.isCurrent);
  const past = verbs.filter((v) => !v.isCurrent);

  if (!current.length) {
    setup.innerHTML = `<div class="empty-state">You need at least one verb marked "current" to generate a test.</div>`;
    return;
  }

  setup.innerHTML = `
    <p style="color:var(--color-text-muted);">
      The test picks one verb from this week and one from past weeks (or two current verbs if there aren't any
      past ones yet), asks for each verb's meaning, then covers all 14 tenses — each verb gets one randomly
      picked subject, used across every tense — plus every command form. 7 minutes to fill it all in.
    </p>
    <button class="btn btn-primary" id="start-test">Start test</button>
  `;
  setup.querySelector("#start-test").onclick = () => startTest(current, past.length ? past : current);
}

function startTest(currentPool, pastPool) {
  const verbA = currentPool[Math.floor(Math.random() * currentPool.length)];
  let verbB = pastPool[Math.floor(Math.random() * pastPool.length)];
  if (pastPool === currentPool && currentPool.length > 1) {
    do { verbB = pastPool[Math.floor(Math.random() * pastPool.length)]; } while (verbB.id === verbA.id);
  }

  // All 14 tenses are tested, but each verb column only asks for one
  // randomly picked subject — the same subject for that verb across every
  // tense row — instead of all 5. Mandato is unaffected: always all 4 slots.
  const subjects = [
    PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)],
    PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)],
  ];

  testState = {
    verbs: [verbA, verbB],
    forms: [getVerbForms(verbA), getVerbForms(verbB)],
    subjects,
    secondsLeft: TEST_DURATION_SECONDS,
    graded: false,
  };

  document.getElementById("test-setup").style.display = "none";
  const runner = document.getElementById("test-runner");
  runner.style.display = "block";
  runner.innerHTML = buildTestGridHtml(testState);
  runner.querySelector("#test-submit").onclick = () => gradeTest();
  runner.querySelector("#test-restart").onclick = renderTestSetup;

  const testInputs = Array.from(runner.querySelectorAll("input[data-verb]"));
  testInputs.forEach((input, i) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const next = testInputs[i + 1];
      if (next) next.focus();
    });
  });

  testTimerHandle = setInterval(tickTestTimer, 1000);
  updateTimerDisplay();
}

function buildTestGridHtml(state) {
  const tenseRows = Conjugator.TENSES.map((t) => {
    const verbCells = [0, 1].map((vi) => `
      <td>
        <input type="text" class="test-single-input" autocomplete="off"
          data-verb="${vi}" data-tense="${t.key}" data-slot="${state.subjects[vi].bucket}">
      </td>
    `).join("");

    return `<tr><td class="tense-label">${tenseLabelHtml(t.key)}</td>${verbCells}</tr>`;
  }).join("");

  const mandatoInputs = (vi) => MANDATO_SLOTS.map((slot) => `
    <div>
      <span class="person-tag">${Conjugator.IMPERATIVE_LABELS[slot]}</span>
      <input type="text" autocomplete="off" data-verb="${vi}" data-tense="mandato" data-slot="${slot}">
    </div>
  `).join("");

  const mandatoRow = `
    <tr>
      <td class="tense-label">${tenseLabelHtml("mandato")}</td>
      <td><div class="test-cell-group test-cell-group--mandato">${mandatoInputs(0)}</div></td>
      <td><div class="test-cell-group test-cell-group--mandato">${mandatoInputs(1)}</div></td>
    </tr>
  `;

  const rows = tenseRows + mandatoRow;

  const meaningFields = [0, 1].map((vi) => `
    <div class="field" style="margin:0; flex:1; min-width:180px;">
      <label>${state.verbs[vi].infinitive} — meaning</label>
      <input type="text" class="input" autocomplete="off" data-verb="${vi}" data-field="meaning" placeholder="e.g. to speak">
    </div>
  `).join("");

  return `
    <div class="test-timer" id="test-timer">07:00</div>
    <div class="row" style="margin-bottom: var(--space-4);">${meaningFields}</div>
    <div class="table-scroll">
      <table class="test-grid">
        <thead>
          <tr>
            <th></th>
            ${[0, 1].map((vi) => `
              <th class="test-verb-header">
                <span class="test-verb-header__name">${state.verbs[vi].infinitive}</span>
                <span class="tense-subject">${state.subjects[vi].label}</span>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="row" style="justify-content:center; margin-top: var(--space-4);">
      <button class="btn btn-primary" id="test-submit">Submit</button>
      <button class="btn btn-ghost" id="test-restart">New test</button>
    </div>
    <div class="test-summary" id="test-summary"></div>
  `;
}

function updateTimerDisplay() {
  const el = document.getElementById("test-timer");
  if (!el) return;
  const m = Math.floor(testState.secondsLeft / 60).toString().padStart(2, "0");
  const s = (testState.secondsLeft % 60).toString().padStart(2, "0");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("is-low", testState.secondsLeft <= 60);
}

function tickTestTimer() {
  testState.secondsLeft--;
  updateTimerDisplay();
  if (testState.secondsLeft <= 0) {
    clearInterval(testTimerHandle);
    gradeTest();
  }
}

function gradeTest() {
  if (testState.graded) return;
  testState.graded = true;
  clearInterval(testTimerHandle);

  let correct = 0;
  let total = 0;
  const missedTenseKeys = new Set();
  const missedVerbIndices = new Set();

  document.querySelectorAll('#test-runner input[data-verb]').forEach((input) => {
    const vi = Number(input.dataset.verb);

    if (input.dataset.field === "meaning") {
      const expected = testState.verbs[vi].meaning;
      if (!expected) return; // nothing to grade if this verb has no meaning on file
      const ok = isAnswerCorrect(input.value, expected, null);
      input.classList.add(ok ? "correct" : "incorrect");
      input.disabled = true;
      if (ok) correct++; else missedVerbIndices.add(vi);
      total++;
      return;
    }

    const tenseKey = input.dataset.tense;
    const slot = input.dataset.slot;
    const cellSource = tenseKey === "mandato" ? testState.forms[vi].imperative[slot] : testState.forms[vi].forms[tenseKey][slot];
    const alt = tenseKey === "imperfectoSubjuntivo" ? testState.forms[vi].imperfectoSubjuntivoAlt[slot] : null;
    const ok = isAnswerCorrect(input.value, cellSource.value, alt);
    input.classList.add(ok ? "correct" : "incorrect");
    input.disabled = true;
    if (ok) { correct++; } else { missedTenseKeys.add(tenseKey); missedVerbIndices.add(vi); }
    total++;
  });

  document.getElementById("test-submit").disabled = true;
  const summary = document.getElementById("test-summary");
  const pct = ((correct / total) * 100).toFixed(1);

  if (correct === total) {
    summary.innerHTML = `Result: ${correct} / ${total} (${pct}%) — perfect! 🎉`;
    celebrate();
  } else if (missedTenseKeys.size > 0) {
    const reviewVerbs = testState.verbs.filter((_, i) => missedVerbIndices.has(i));
    const reviewTenses = Array.from(missedTenseKeys);
    summary.innerHTML = `
      <div>Result: ${correct} / ${total} (${pct}%)</div>
      <button class="btn btn-primary btn-sm" id="review-mistakes-btn" style="margin-top: var(--space-3);">
        🔁 Review mistakes (${total - correct})
      </button>
    `;
    document.getElementById("review-mistakes-btn").onclick = () => {
      document.getElementById("practice-section").scrollIntoView({ behavior: "smooth", block: "start" });
      startPracticeDrill(reviewVerbs, reviewTenses);
    };
  } else {
    // Only the meaning fields were missed — nothing conjugation-related to send to practice.
    summary.innerHTML = `Result: ${correct} / ${total} (${pct}%)`;
  }
}
