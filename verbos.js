/* ==========================================================================
   gukeeee — Prueba de Verbos page logic
   Ties together auth.js (admin gate), verbStore.js (gist-backed data) and
   conjugator.js (form generation) into: admin CRUD, a lookup table, a
   Conjuguemos-style practice drill, and a timed 2-verb test simulation.
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

function tenseLabel(key) {
  if (key === "mandato") return "Mandato";
  const t = Conjugator.TENSES.find((x) => x.key === key);
  return t ? t.label : key;
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

/* ---------------------------------- boot ---------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  if (!VerbStore.isConfigured()) {
    document.getElementById("config-warning").style.display = "block";
  }

  Auth.onChange((user) => {
    userIsAdmin = Auth.isAdmin();
    document.getElementById("admin-section").style.display = userIsAdmin ? "block" : "none";
    if (userIsAdmin) renderAdminSection();
  });

  await refreshVerbs();
});

async function refreshVerbs({ forceRefresh = false } = {}) {
  verbs = await VerbStore.getVerbs({ forceRefresh });
  if (userIsAdmin) renderAdminSection();
  renderLookup();
  renderPracticeSetup();
  renderTestSetup();
}

/* ---------------------------------- admin ---------------------------------- */

function renderAdminSection() {
  const el = document.getElementById("admin-section");
  el.style.display = "block";

  if (!VerbStore.isConfigured()) {
    el.innerHTML = `
      <details open>
        <summary>⚙️ Panel de administrador</summary>
        <p style="color:var(--color-text-muted);">
          Todavía no configuraste el Gist de verbos. Crea un Gist con un archivo <code>verbs.json</code>
          conteniendo <code>{"verbs": []}</code>, y pon su ID y su URL "Raw" en <code>GIST_ID</code> /
          <code>RAW_URL</code> dentro de <code>verbStore.js</code>.
        </p>
      </details>
    `;
    return;
  }

  const hasToken = VerbStore.hasToken();
  const current = verbs.filter((v) => v.isCurrent);
  const past = verbs.filter((v) => !v.isCurrent);

  el.innerHTML = `
    <details>
      <summary>⚙️ Panel de administrador</summary>
      <div class="stack" style="margin-top: var(--space-3);">
        <div class="card" style="background:var(--color-surface-alt); border:none;">
          <strong>Token de GitHub (solo para ti)</strong>
          <p style="color:var(--color-text-muted); font-size:0.82rem; margin:6px 0 10px;">
            Se usa solo en tu navegador para guardar cambios en el Gist. Generá uno en
            github.com/settings/tokens con permiso <code>gist</code> únicamente.
          </p>
          <div class="row">
            <input type="password" id="admin-token-input" class="input" style="max-width:320px;"
              placeholder="${hasToken ? "Token ya configurado — pegar uno nuevo para reemplazarlo" : "ghp_..."}">
            <button class="btn btn-secondary btn-sm" id="admin-token-save">Guardar token</button>
          </div>
        </div>

        <div class="card" id="admin-add-card" style="border:none; background:var(--color-surface-alt);">
          <strong id="admin-add-title">Agregar verbo</strong>
          <div class="row" style="margin:10px 0;">
            <div class="field" style="margin:0;">
              <label>Infinitivo</label>
              <input type="text" id="admin-infinitive" class="input" placeholder="hablar" style="width:160px;">
            </div>
            <div class="field" style="margin:0; flex:1;">
              <label>Significado</label>
              <input type="text" id="admin-meaning" class="input" placeholder="to speak">
            </div>
            <button class="btn btn-primary btn-sm" id="admin-generate" style="align-self:flex-end;">Generar conjugación</button>
          </div>
          <div id="admin-override-wrap"></div>
          <div class="row" id="admin-save-row" style="display:none; margin-top:var(--space-3);">
            <button class="btn btn-primary" id="admin-save-verb">Guardar verbo</button>
            <button class="btn btn-ghost" id="admin-cancel-edit">Cancelar</button>
          </div>
        </div>

        <div>
          <div class="row between">
            <strong>Verbos actuales (${current.length})</strong>
            <button class="btn btn-secondary btn-sm" id="admin-archive-btn" ${current.length ? "" : "disabled"}>
              Archivar semana actual → pasada
            </button>
          </div>
          <div id="admin-current-list">${renderAdminVerbList(current)}</div>
          <strong style="display:block; margin-top:var(--space-4);">Verbos de semanas pasadas (${past.length})</strong>
          <div id="admin-past-list">${renderAdminVerbList(past)}</div>
        </div>
      </div>
    </details>
  `;

  el.querySelector("#admin-token-save").addEventListener("click", () => {
    const val = el.querySelector("#admin-token-input").value;
    if (val.trim()) { VerbStore.setToken(val); alert("Token guardado en este navegador."); renderAdminSection(); }
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
  if (!list.length) return `<p class="empty-state" style="padding:var(--space-3);">Ningún verbo todavía.</p>`;
  return list.map((v) => `
    <div class="admin-verb-row">
      <span class="infinitive">${v.infinitive}</span>
      <span class="meaning">${v.meaning || ""}</span>
      <span class="badge ${v.isCurrent ? "badge-accent" : "badge-muted"}">${v.isCurrent ? "Actual" : "Pasado"}</span>
      <div class="row" style="gap:6px;">
        <button class="btn btn-sm btn-secondary admin-toggle-current-btn" data-id="${v.id}" data-next="${!v.isCurrent}">
          ${v.isCurrent ? "Marcar pasado" : "Marcar actual"}
        </button>
        <button class="btn btn-sm btn-secondary admin-edit-btn" data-id="${v.id}">Editar</button>
        <button class="btn btn-sm btn-danger admin-delete-btn" data-id="${v.id}">Eliminar</button>
      </div>
    </div>
  `).join("");
}

function generateAdminPreview(existingRecord) {
  const infinitiveInput = document.getElementById("admin-infinitive");
  const meaningInput = document.getElementById("admin-meaning");
  const infinitive = (existingRecord ? existingRecord.infinitive : infinitiveInput.value).trim().toLowerCase();

  if (!/^[a-záéíóúñ]+(ar|er|ir)$/.test(infinitive)) {
    alert("Escribe un infinitivo válido terminado en -ar, -er o -ir.");
    return;
  }
  infinitiveInput.value = infinitive;
  if (existingRecord) meaningInput.value = existingRecord.meaning || "";

  let conjugated;
  try {
    conjugated = Conjugator.conjugate(infinitive);
  } catch (err) {
    alert("No se pudo conjugar ese verbo: " + err.message);
    return;
  }

  const overrides = existingRecord ? existingRecord.overrides || {} : {};
  const wrap = document.getElementById("admin-override-wrap");

  const rows = Conjugator.TENSES.map((t) => {
    const cells = Conjugator.PERSONS.map((p) => {
      const key = `${t.key}.${p}`;
      const val = overrides[key] !== undefined ? overrides[key] : conjugated.forms[t.key][p].value;
      return `
        <div class="field">
          <label>${t.label} · ${p}</label>
          <input class="input" data-key="${key}" data-generated="${conjugated.forms[t.key][p].value}" value="${val}">
        </div>
      `;
    }).join("");
    return cells;
  }).join("");

  const mandatoCells = MANDATO_SLOTS.map((slot) => {
    const key = `imperative.${slot}`;
    const val = overrides[key] !== undefined ? overrides[key] : conjugated.imperative[slot].value;
    return `
      <div class="field">
        <label>Mandato · ${Conjugator.IMPERATIVE_LABELS[slot]}</label>
        <input class="input" data-key="${key}" data-generated="${conjugated.imperative[slot].value}" value="${val}">
      </div>
    `;
  }).join("");

  wrap.innerHTML = `
    <p style="font-size:0.8rem; color:var(--color-text-muted); margin:10px 0 4px;">
      Revisa las formas generadas. Corrige lo que haga falta — un campo cambiado queda marcado en rojo y se
      guarda como una forma irregular editada a mano.
    </p>
    <div class="admin-override-grid">${rows}${mandatoCells}</div>
  `;

  wrap.querySelectorAll("input[data-key]").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.toggle("was-changed", input.value !== input.dataset.generated);
    });
    if (input.value !== input.dataset.generated) input.classList.add("was-changed");
  });

  document.getElementById("admin-save-row").style.display = "flex";
  document.getElementById("admin-add-title").textContent = existingRecord ? `Editando "${infinitive}"` : "Agregar verbo";

  document.getElementById("admin-save-verb").onclick = () => saveVerbFromForm(existingRecord);
  document.getElementById("admin-cancel-edit").onclick = resetAdminForm;
}

function resetAdminForm() {
  document.getElementById("admin-infinitive").value = "";
  document.getElementById("admin-meaning").value = "";
  document.getElementById("admin-override-wrap").innerHTML = "";
  document.getElementById("admin-save-row").style.display = "none";
  document.getElementById("admin-add-title").textContent = "Agregar verbo";
}

async function saveVerbFromForm(existingRecord) {
  const infinitive = document.getElementById("admin-infinitive").value.trim().toLowerCase();
  const meaning = document.getElementById("admin-meaning").value.trim();
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
    await VerbStore.saveVerb(record, Date.now());
    resetAdminForm();
    await refreshVerbs({ forceRefresh: true });
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
  if (!confirm(`¿Eliminar "${record.infinitive}"? Esta acción no se puede deshacer.`)) return;
  try {
    await VerbStore.deleteVerb(id);
    await refreshVerbs({ forceRefresh: true });
  } catch (err) {
    alert(err.message);
  }
}

async function toggleCurrent(id, next) {
  try {
    await VerbStore.setCurrent(id, next);
    await refreshVerbs({ forceRefresh: true });
  } catch (err) {
    alert(err.message);
  }
}

async function archiveWeek() {
  if (!confirm("Esto marca todos los verbos actuales como \"pasados\". ¿Continuar?")) return;
  try {
    await VerbStore.archiveCurrentToPast();
    await refreshVerbs({ forceRefresh: true });
  } catch (err) {
    alert(err.message);
  }
}

/* ---------------------------------- lookup ---------------------------------- */

function renderLookup() {
  const select = document.getElementById("lookup-select");
  if (!verbs.length) {
    select.innerHTML = `<option value="">No hay verbos todavía</option>`;
    document.getElementById("lookup-table-wrap").innerHTML = `<div class="empty-state">Todavía no hay verbos agregados.</div>`;
    return;
  }
  const sorted = [...verbs].sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  select.innerHTML = sorted.map((v) => `<option value="${v.id}">${v.infinitive}${v.meaning ? " — " + v.meaning : ""}</option>`).join("");
  select.onchange = () => renderLookupTable(verbs.find((v) => v.id === select.value));
  renderLookupTable(sorted[0]);
}

function renderLookupTable(record) {
  const wrap = document.getElementById("lookup-table-wrap");
  if (!record) { wrap.innerHTML = ""; return; }
  const data = getVerbForms(record);

  const rows = Conjugator.TENSES.map((t) => `
    <tr>
      <td>${t.label}</td>
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
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>Tiempo</th><th>Yo</th><th>Tú</th><th>Él/Ella/Ud.</th><th>Nosotros</th><th>Ellos/Ellas/Uds.</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <h4 style="margin-top: var(--space-4);">Mandatos</h4>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>Tú (afirmativo)</th><th>Tú (negativo)</th><th>Ud.</th><th>Nosotros</th></tr></thead>
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

  if (!verbs.length) {
    setup.innerHTML = `<div class="empty-state">Todavía no hay verbos para practicar.</div>`;
    return;
  }

  setup.innerHTML = `
    <div class="row" style="margin-bottom: var(--space-2);">
      <button class="btn btn-sm btn-secondary" id="pick-current">Esta semana</button>
      <button class="btn btn-sm btn-secondary" id="pick-past">Semanas pasadas</button>
      <button class="btn btn-sm btn-secondary" id="pick-all">Ambas</button>
      <button class="btn btn-sm btn-ghost" id="pick-none">Ninguno</button>
    </div>
    <div class="verb-picker" id="practice-verb-picker">
      ${verbs.map((v) => `
        <label class="verb-chip">
          <input type="checkbox" value="${v.id}" checked>
          ${v.infinitive} ${v.isCurrent ? "" : "<span style=\"color:var(--color-text-faint);\">(pasado)</span>"}
        </label>
      `).join("")}
    </div>
    <button class="btn btn-primary" id="start-practice">Empezar práctica</button>
  `;

  const checkboxes = () => Array.from(setup.querySelectorAll('input[type="checkbox"]'));
  setup.querySelector("#pick-current").onclick = () => checkboxes().forEach((cb) => {
    cb.checked = verbs.find((v) => v.id === cb.value).isCurrent;
  });
  setup.querySelector("#pick-past").onclick = () => checkboxes().forEach((cb) => {
    cb.checked = !verbs.find((v) => v.id === cb.value).isCurrent;
  });
  setup.querySelector("#pick-all").onclick = () => checkboxes().forEach((cb) => { cb.checked = true; });
  setup.querySelector("#pick-none").onclick = () => checkboxes().forEach((cb) => { cb.checked = false; });

  setup.querySelector("#start-practice").onclick = () => {
    const selectedIds = checkboxes().filter((cb) => cb.checked).map((cb) => cb.value);
    const selected = verbs.filter((v) => selectedIds.includes(v.id));
    if (!selected.length) { alert("Selecciona al menos un verbo."); return; }
    startPracticeDrill(selected);
  };
}

let drillState = null;

function startPracticeDrill(selectedVerbs) {
  document.getElementById("practice-setup").style.display = "none";
  const drill = document.getElementById("practice-drill");
  drill.style.display = "block";
  drillState = { verbs: selectedVerbs, correct: 0, total: 0 };
  drill.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="drill-back">← Cambiar selección</button>
    <div id="drill-card"></div>
  `;
  drill.querySelector("#drill-back").onclick = renderPracticeSetup;
  nextDrillQuestion();
}

function pickDrillQuestion() {
  const verb = drillState.verbs[Math.floor(Math.random() * drillState.verbs.length)];
  const data = getVerbForms(verb);
  const tenseKey = QUESTION_POOL[Math.floor(Math.random() * QUESTION_POOL.length)];

  if (tenseKey === "mandato") {
    const slot = MANDATO_SLOTS[Math.floor(Math.random() * MANDATO_SLOTS.length)];
    const cell = data.imperative[slot];
    return {
      prompt: `${verb.infinitive}${verb.meaning ? " (" + verb.meaning + ")" : ""}`,
      meta: `Mandato — ${Conjugator.IMPERATIVE_LABELS[slot]}`,
      answer: cell.value,
      alt: null,
    };
  }

  const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
  const cell = data.forms[tenseKey][pronoun.bucket];
  const alt = tenseKey === "imperfectoSubjuntivo" ? data.imperfectoSubjuntivoAlt[pronoun.bucket] : null;
  return {
    prompt: `${verb.infinitive}${verb.meaning ? " (" + verb.meaning + ")" : ""}`,
    meta: `${pronoun.label} — ${tenseLabel(tenseKey)}`,
    answer: cell.value,
    alt,
  };
}

function nextDrillQuestion() {
  const q = pickDrillQuestion();
  drillState.current = q;
  const card = document.getElementById("drill-card");
  card.innerHTML = `
    <div class="drill-card">
      <div class="drill-card__prompt">${q.prompt}</div>
      <div class="drill-card__meta">${q.meta}</div>
      <input type="text" class="input" id="drill-input" autocomplete="off">
      <div class="row" style="justify-content:center; margin-top: var(--space-3);">
        <button class="btn btn-primary btn-sm" id="drill-check">Comprobar</button>
        <button class="btn btn-secondary btn-sm" id="drill-next" disabled>Siguiente</button>
      </div>
      <div class="drill-feedback" id="drill-feedback"></div>
      <div class="drill-score">Puntaje: ${drillState.correct} / ${drillState.total}</div>
    </div>
  `;
  const input = card.querySelector("#drill-input");
  input.focus();
  const check = () => checkDrillAnswer();
  card.querySelector("#drill-check").onclick = check;
  input.addEventListener("keyup", (e) => { if (e.key === "Enter") check(); });
  card.querySelector("#drill-next").onclick = nextDrillQuestion;
}

function checkDrillAnswer() {
  const input = document.getElementById("drill-input");
  const feedback = document.getElementById("drill-feedback");
  const q = drillState.current;
  const ok = isAnswerCorrect(input.value, q.answer, q.alt);

  drillState.total++;
  if (ok) drillState.correct++;

  input.classList.add(ok ? "is-correct" : "is-incorrect");
  input.disabled = true;
  feedback.className = "drill-feedback " + (ok ? "correct" : "incorrect");
  feedback.textContent = ok ? "¡Correcto!" : `Incorrecto — respuesta: ${q.answer}`;
  document.getElementById("drill-check").disabled = true;
  document.getElementById("drill-next").disabled = false;
  document.querySelector(".drill-score").textContent = `Puntaje: ${drillState.correct} / ${drillState.total}`;
}

/* ---------------------------------- test simulation ---------------------------------- */

const TEST_DURATION_SECONDS = 7 * 60;
let testState = null;
let testTimerHandle = null;

function renderTestSetup() {
  const setup = document.getElementById("test-setup");
  document.getElementById("test-runner").style.display = "none";
  setup.style.display = "block";

  const current = verbs.filter((v) => v.isCurrent);
  const past = verbs.filter((v) => !v.isCurrent);

  if (!current.length) {
    setup.innerHTML = `<div class="empty-state">Necesitas al menos un verbo marcado como "actual" para generar el examen.</div>`;
    return;
  }

  setup.innerHTML = `
    <p style="color:var(--color-text-muted);">
      El examen elige un verbo de esta semana y uno de semanas pasadas (o dos actuales si aún no hay pasados) y
      te da 7 minutos para completar todas las formas.
    </p>
    <button class="btn btn-primary" id="start-test">Empezar examen</button>
  `;
  setup.querySelector("#start-test").onclick = () => startTest(current, past.length ? past : current);
}

function startTest(currentPool, pastPool) {
  const verbA = currentPool[Math.floor(Math.random() * currentPool.length)];
  let verbB = pastPool[Math.floor(Math.random() * pastPool.length)];
  if (pastPool === currentPool && currentPool.length > 1) {
    do { verbB = pastPool[Math.floor(Math.random() * pastPool.length)]; } while (verbB.id === verbA.id);
  }

  testState = {
    verbs: [verbA, verbB],
    forms: [getVerbForms(verbA), getVerbForms(verbB)],
    secondsLeft: TEST_DURATION_SECONDS,
    graded: false,
  };

  document.getElementById("test-setup").style.display = "none";
  const runner = document.getElementById("test-runner");
  runner.style.display = "block";
  runner.innerHTML = buildTestGridHtml(testState);
  runner.querySelector("#test-submit").onclick = () => gradeTest();
  runner.querySelector("#test-restart").onclick = renderTestSetup;

  testTimerHandle = setInterval(tickTestTimer, 1000);
  updateTimerDisplay();
}

function buildTestGridHtml(state) {
  const rows = [...Conjugator.TENSES.map((t) => t.key), "mandato"].map((tenseKey) => {
    const isMandato = tenseKey === "mandato";
    const slots = isMandato ? MANDATO_SLOTS : Conjugator.PERSONS;
    const labels = isMandato ? MANDATO_SLOTS.map((s) => Conjugator.IMPERATIVE_LABELS[s]) : ["yo", "tú", "él", "nos.", "ellos"];

    const verbCells = [0, 1].map((vi) => {
      const inputs = slots.map((slot, si) => `
        <div>
          <span class="person-tag">${labels[si]}</span>
          <input type="text" autocomplete="off" data-verb="${vi}" data-tense="${tenseKey}" data-slot="${slot}">
        </div>
      `).join("");
      return `<td><div class="test-cell-group">${inputs}</div></td>`;
    }).join("");

    return `<tr><td class="tense-label">${tenseLabel(tenseKey)}</td>${verbCells}</tr>`;
  }).join("");

  return `
    <div class="test-timer" id="test-timer">07:00</div>
    <div class="table-scroll">
      <table class="test-grid">
        <thead>
          <tr><th></th><th>${state.verbs[0].infinitive}${state.verbs[0].meaning ? " (" + state.verbs[0].meaning + ")" : ""}</th><th>${state.verbs[1].infinitive}${state.verbs[1].meaning ? " (" + state.verbs[1].meaning + ")" : ""}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="row" style="justify-content:center; margin-top: var(--space-4);">
      <button class="btn btn-primary" id="test-submit">Enviar</button>
      <button class="btn btn-ghost" id="test-restart">Nuevo examen</button>
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
  document.querySelectorAll('#test-runner input[data-verb]').forEach((input) => {
    const vi = Number(input.dataset.verb);
    const tenseKey = input.dataset.tense;
    const slot = input.dataset.slot;
    const cellSource = tenseKey === "mandato" ? testState.forms[vi].imperative[slot] : testState.forms[vi].forms[tenseKey][slot];
    const alt = tenseKey === "imperfectoSubjuntivo" ? testState.forms[vi].imperfectoSubjuntivoAlt[slot] : null;
    const ok = isAnswerCorrect(input.value, cellSource.value, alt);
    input.classList.add(ok ? "correct" : "incorrect");
    input.disabled = true;
    if (ok) correct++;
    total++;
  });

  document.getElementById("test-submit").disabled = true;
  document.getElementById("test-summary").textContent = `Resultado: ${correct} / ${total} (${((correct / total) * 100).toFixed(1)}%)`;
}
