/* ==========================================================================
   gukeeee — Spanish conjugation engine
   Rule-based conjugator for regular verbs + a curated irregular/stem-changing
   dictionary layered on top. Best-effort: covers the high-frequency verbs a
   Spanish class actually uses. Anything it gets wrong for a rarer verb can be
   corrected by hand in the admin "add verb" screen — every generated form is
   editable there, and admin-edited forms are always flagged irregular (red).

   Persons (vosotros excluded, per spec): yo, tu, el (él/ella/Ud.),
   nosotros (nosotros/nosotras), ellos (ellos/ellas/Uds.)
   ========================================================================== */

const Conjugator = (function () {
  const PERSONS = ["yo", "tu", "el", "nosotros", "ellos"];

  const TENSES = [
    { key: "presente", label: "Present" },
    { key: "presenteProgresivo", label: "Present Progressive" },
    { key: "preterito", label: "Preterite" },
    { key: "imperfecto", label: "Imperfect" },
    { key: "futuro", label: "Future" },
    { key: "condicional", label: "Conditional" },
    { key: "presenteSubjuntivo", label: "Present Subjunctive" },
    { key: "imperfectoSubjuntivo", label: "Imperfect Subjunctive" },
    { key: "preteritoPerfecto", label: "Present Perfect" },
    { key: "pluscuamperfecto", label: "Past Perfect" },
    { key: "futuroPerfecto", label: "Future Perfect" },
    { key: "condicionalPerfecto", label: "Conditional Perfect" },
    { key: "preteritoPerfectoSubjuntivo", label: "Present Perfect Subjunctive" },
    { key: "pluscuamperfectoSubjuntivo", label: "Past Perfect Subjunctive" },
  ];

  const IMPERATIVE_LABELS = { tuAff: "Tú (affirmative)", tuNeg: "Tú (negative)", ud: "Ud.", nosotros: "Nosotros" };

  const isVowelChar = (ch) => "aeiou".includes(ch);
  const endsWithDigraphGuQu = (stem) => stem.endsWith("gu") || stem.endsWith("qu");
  const isUirStem = (stem, group) => group === "ir" && stem.endsWith("u") && !endsWithDigraphGuQu(stem);
  const isHiatusVowelStem = (stem, group) => group !== "ar" && isVowelChar(stem[stem.length - 1]) && stem[stem.length - 1] !== "u";

  function accentVowel(ch) {
    return { a: "á", e: "é", i: "í", o: "ó", u: "ú" }[ch] || ch;
  }

  function accentFirstChar(str) {
    return accentVowel(str[0]) + str.slice(1);
  }

  function accentLastVowel(str) {
    for (let i = str.length - 1; i >= 0; i--) {
      if ("aeiou".includes(str[i])) return str.slice(0, i) + accentVowel(str[i]) + str.slice(i + 1);
    }
    return str;
  }

  // Fix the stem/ending boundary for predictable consonant spelling changes.
  function fixBoundary(stem, group, ending) {
    const first = ending[0];
    if (group === "ar") {
      if (first === "e" || first === "é") {
        if (stem.endsWith("c")) return stem.slice(0, -1) + "qu" + ending;
        if (stem.endsWith("g")) return stem.slice(0, -1) + "gu" + ending;
        if (stem.endsWith("z")) return stem.slice(0, -1) + "c" + ending;
      }
    } else if (first === "a" || first === "o") {
      if (stem.endsWith("gu")) return stem.slice(0, -2) + "g" + ending;
      if (stem.endsWith("g")) return stem.slice(0, -1) + "j" + ending;
      if (stem.length >= 2 && stem.endsWith("c")) {
        const prev = stem[stem.length - 2];
        return isVowelChar(prev) ? stem.slice(0, -1) + "zc" + ending : stem.slice(0, -1) + "z" + ending;
      }
    }
    return stem + ending;
  }

  // Unstressed "i" between two true vowels becomes "y" (leer -> leyó). The "u"
  // in a gu/qu digraph is silent, not a true vowel, so seguir is excluded.
  function fixVowelBoundary(stem, group, ending) {
    if (endsWithDigraphGuQu(stem)) return stem + ending;
    if (isVowelChar(stem[stem.length - 1]) && ending[0] === "i") return stem + "y" + ending.slice(1);
    return stem + ending;
  }

  function changeVowel(stem, pattern) {
    const targetChar = pattern === "ue" ? "o" : "e";
    for (let i = stem.length - 1; i >= 0; i--) {
      if (stem[i] === targetChar) {
        const replacement = pattern === "ie" ? "ie" : pattern === "ue" ? "ue" : "i";
        return stem.slice(0, i) + replacement + stem.slice(i + 1);
      }
    }
    return stem;
  }

  function reduceSecondary(changedStem, pattern) {
    if (pattern === "ie") return changedStem.replace("ie", "i");
    if (pattern === "ue") return changedStem.replace("ue", "u");
    return changedStem; // pattern 'i' is already the reduced form
  }

  const ENDINGS = {
    presente: { ar: ["o", "as", "a", "amos", "an"], er: ["o", "es", "e", "emos", "en"], ir: ["o", "es", "e", "imos", "en"] },
    preterito: { ar: ["é", "aste", "ó", "amos", "aron"], er: ["í", "iste", "ió", "imos", "ieron"], ir: ["í", "iste", "ió", "imos", "ieron"] },
    imperfecto: { ar: ["aba", "abas", "aba", "ábamos", "aban"], er: ["ía", "ías", "ía", "íamos", "ían"], ir: ["ía", "ías", "ía", "íamos", "ían"] },
    futuro: ["é", "ás", "á", "emos", "án"],
    condicional: ["ía", "ías", "ía", "íamos", "ían"],
    presenteSubjuntivo: { ar: ["e", "es", "e", "emos", "en"], er: ["a", "as", "a", "amos", "an"], ir: ["a", "as", "a", "amos", "an"] },
  };

  const AUX_HABER = {
    preteritoPerfecto: ["he", "has", "ha", "hemos", "han"],
    pluscuamperfecto: ["había", "habías", "había", "habíamos", "habían"],
    futuroPerfecto: ["habré", "habrás", "habrá", "habremos", "habrán"],
    condicionalPerfecto: ["habría", "habrías", "habría", "habríamos", "habrían"],
    preteritoPerfectoSubjuntivo: ["haya", "hayas", "haya", "hayamos", "hayan"],
    pluscuamperfectoSubjuntivo: ["hubiera", "hubieras", "hubiera", "hubiéramos", "hubieran"],
  };

  const IRREGULAR_PARTICIPLES = {
    decir: "dicho", hacer: "hecho", ver: "visto", poner: "puesto", volver: "vuelto",
    escribir: "escrito", romper: "roto", morir: "muerto", abrir: "abierto",
    cubrir: "cubierto", resolver: "resuelto", freir: "frito",
  };

  // Curated irregular / stem-changing dictionary. Anything not listed here is
  // conjugated with the plain regular rules above.
  const IRREGULAR = {
    tener: { pattern: "ie", irregularYo: "tengo", preteriteStem: "tuv", futureStem: "tendr", imperativeTuAff: "ten" },
    venir: { pattern: "ie", irregularYo: "vengo", preteriteStem: "vin", futureStem: "vendr", imperativeTuAff: "ven" },
    poner: { irregularYo: "pongo", preteriteStem: "pus", futureStem: "pondr", imperativeTuAff: "pon" },
    salir: { irregularYo: "salgo", futureStem: "saldr", imperativeTuAff: "sal" },
    valer: { irregularYo: "valgo", futureStem: "valdr" },
    hacer: { irregularYo: "hago", preteriteStem: "hic", preteriteElOverride: "hizo", futureStem: "har", imperativeTuAff: "haz" },
    decir: { pattern: "i", irregularYo: "digo", preteriteStem: "dij", futureStem: "dir", imperativeTuAff: "di" },
    poder: { pattern: "ue", preteriteStem: "pud", futureStem: "podr", gerund: "pudiendo" },
    querer: { pattern: "ie", preteriteStem: "quis", futureStem: "querr" },
    saber: { irregularYo: "sé", subjStem: "sep", preteriteStem: "sup", futureStem: "sabr" },
    caber: { irregularYo: "quepo", preteriteStem: "cup", futureStem: "cabr" },
    traer: { irregularYo: "traigo", preteriteStem: "traj" },
    caer: { irregularYo: "caigo" },
    oir: { irregularYo: "oigo", presenteOverride: { tu: "oyes", el: "oye", nosotros: "oímos", ellos: "oyen" } },
    conducir: { preteriteStem: "conduj" },
    traducir: { preteriteStem: "traduj" },
    andar: { preteriteStem: "anduv" },
    estar: {
      presenteOverride: { yo: "estoy", tu: "estás", el: "está", nosotros: "estamos", ellos: "están" },
      subjOverrideAll: ["esté", "estés", "esté", "estemos", "estén"],
      preteriteStem: "estuv",
    },
    pensar: { pattern: "ie" },
    cerrar: { pattern: "ie" },
    empezar: { pattern: "ie" },
    comenzar: { pattern: "ie" },
    entender: { pattern: "ie" },
    perder: { pattern: "ie" },
    sentir: { pattern: "ie" },
    mentir: { pattern: "ie" },
    preferir: { pattern: "ie" },
    divertir: { pattern: "ie" },
    volver: { pattern: "ue" },
    mover: { pattern: "ue" },
    contar: { pattern: "ue" },
    encontrar: { pattern: "ue" },
    mostrar: { pattern: "ue" },
    recordar: { pattern: "ue" },
    dormir: { pattern: "ue" },
    morir: { pattern: "ue" },
    pedir: { pattern: "i" },
    servir: { pattern: "i" },
    seguir: { pattern: "i" },
    repetir: { pattern: "i" },
    vestir: { pattern: "i" },
    conseguir: { pattern: "i" },
    jugar: {
      presenteOverride: { yo: "juego", tu: "juegas", el: "juega", nosotros: "jugamos", ellos: "juegan" },
      subjOverrideAll: ["juegue", "juegues", "juegue", "juguemos", "jueguen"],
    },
    ser: {
      fullOverride: {
        presente: ["soy", "eres", "es", "somos", "son"],
        preterito: ["fui", "fuiste", "fue", "fuimos", "fueron"],
        imperfecto: ["era", "eras", "era", "éramos", "eran"],
        presenteSubjuntivo: ["sea", "seas", "sea", "seamos", "sean"],
      },
      imperativeTuAff: "sé",
      gerund: "siendo",
    },
    ir: {
      fullOverride: {
        presente: ["voy", "vas", "va", "vamos", "van"],
        preterito: ["fui", "fuiste", "fue", "fuimos", "fueron"],
        imperfecto: ["iba", "ibas", "iba", "íbamos", "iban"],
        presenteSubjuntivo: ["vaya", "vayas", "vaya", "vayamos", "vayan"],
      },
      imperativeTuAff: "ve",
      nosotrosMandato: "vamos",
      gerund: "yendo",
    },
    haber: {
      fullOverride: {
        presente: ["he", "has", "ha", "hemos", "han"],
        preterito: ["hube", "hubiste", "hubo", "hubimos", "hubieron"],
        imperfecto: ["había", "habías", "había", "habíamos", "habían"],
        presenteSubjuntivo: ["haya", "hayas", "haya", "hayamos", "hayan"],
      },
      futureStem: "habr",
      gerund: "habiendo",
    },
    dar: {
      fullOverride: {
        presente: ["doy", "das", "da", "damos", "dan"],
        preterito: ["di", "diste", "dio", "dimos", "dieron"],
        presenteSubjuntivo: ["dé", "des", "dé", "demos", "den"],
      },
    },
    ver: {
      irregularYo: "veo",
      fullOverride: {
        imperfecto: ["veía", "veías", "veía", "veíamos", "veían"],
        preterito: ["vi", "viste", "vio", "vimos", "vieron"],
      },
    },
  };

  function splitInfinitive(infinitive) {
    const inf = infinitive.trim().toLowerCase();
    return { stem: inf.slice(0, -2), group: inf.slice(-2), inf };
  }

  function toObj(arr) {
    const o = {};
    PERSONS.forEach((p, i) => { o[p] = arr[i]; });
    return o;
  }

  // Builds every simple (non-compound) tense for a verb given its stem/group
  // and an optional stem-change pattern ('ie' | 'ue' | 'i' | null). Called
  // once with pattern=null to get the pure-regular baseline (for the
  // irregular-flag diff) and once with the verb's real pattern.
  function buildSimpleTenses(stem, group, pattern) {
    const changedStem = pattern ? changeVowel(stem, pattern) : stem;
    const secondaryStem = group === "ir" && pattern ? reduceSecondary(changedStem, pattern) : stem;
    const uir = isUirStem(stem, group);
    const hiatus = isHiatusVowelStem(stem, group);

    const presente = ENDINGS.presente[group].map((e, i) => {
      const s = i === 3 ? stem : changedStem;
      if (uir && i !== 3) return s + "y" + e;
      return fixBoundary(s, group, e);
    });

    const presenteSubjuntivo = ENDINGS.presenteSubjuntivo[group].map((e, i) => {
      const s = i === 3 ? (group === "ir" ? secondaryStem : stem) : changedStem;
      if (uir) return s + "y" + e;
      return fixBoundary(s, group, e);
    });

    const preterito = ENDINGS.preterito[group].map((e, i) => {
      if (i === 2 || i === 4) return fixVowelBoundary(secondaryStem, group, e);
      if (hiatus && (i === 1 || i === 3)) return stem + accentFirstChar(e);
      return fixBoundary(stem, group, e);
    });

    const imperfecto = ENDINGS.imperfecto[group].map((e) => stem + e);
    const gerundio = uir ? stem + "yendo" : fixVowelBoundary(secondaryStem, group, group === "ar" ? "ando" : "iendo");
    const participio = hiatus ? stem + "ído" : stem + (group === "ar" ? "ado" : "ido");

    return { presente, preterito, imperfecto, presenteSubjuntivo, gerundio, participio };
  }

  // The literal, no-exceptions baseline used only to decide what counts as
  // "irregular": plain stem + ending, with none of buildSimpleTenses' spelling
  // fixes (car/gar/zar, cer/cir, gu/qu, vowel-hiatus y-insertion, accents).
  // Those fixes are real Spanish spelling rules, but a language class still
  // treats verbs that trigger them (buscar, conocer, leer...) as irregular —
  // comparing against this naive form is what makes that show up as red.
  function buildNaiveBaseline(stem, group) {
    return {
      presente: ENDINGS.presente[group].map((e) => stem + e),
      preterito: ENDINGS.preterito[group].map((e) => stem + e),
      imperfecto: ENDINGS.imperfecto[group].map((e) => stem + e),
      presenteSubjuntivo: ENDINGS.presenteSubjuntivo[group].map((e) => stem + e),
      gerundio: stem + (group === "ar" ? "ando" : "iendo"),
      participio: stem + (group === "ar" ? "ado" : "ido"),
    };
  }

  function conjugate(infinitive) {
    const { stem, group, inf } = splitInfinitive(infinitive);
    const irr = IRREGULAR[inf] || {};

    const baseline = buildNaiveBaseline(stem, group);
    const built = buildSimpleTenses(stem, group, irr.pattern || null);

    let forms = {
      presente: built.presente.slice(),
      preterito: built.preterito.slice(),
      imperfecto: built.imperfecto.slice(),
      presenteSubjuntivo: built.presenteSubjuntivo.slice(),
    };
    let gerundio = built.gerundio;
    let participio = IRREGULAR_PARTICIPLES[inf] || built.participio;

    let futBase = irr.futureStem || stem + group;
    forms.futuro = ENDINGS.futuro.map((e) => futBase + e);
    forms.condicional = ENDINGS.condicional.map((e) => futBase + e);

    // Dictionary overrides layered on top of the rule-based forms.
    if (irr.presenteOverride) {
      PERSONS.forEach((p, i) => { if (irr.presenteOverride[p]) forms.presente[i] = irr.presenteOverride[p]; });
    }
    if (irr.irregularYo) {
      forms.presente[0] = irr.irregularYo;
      const subjStem = irr.subjStem || irr.irregularYo.replace(/o$/, "");
      forms.presenteSubjuntivo = ["a", "as", "a", "amos", "an"].map((e) => subjStem + e);
    }
    if (irr.subjOverrideAll) forms.presenteSubjuntivo = irr.subjOverrideAll.slice();
    if (irr.preteriteStem) {
      const s = irr.preteriteStem;
      const endsInJ = s.endsWith("j");
      forms.preterito = [s + "e", s + "iste", s + "o", s + "imos", s + (endsInJ ? "eron" : "ieron")];
    }
    if (irr.preteriteElOverride) forms.preterito[2] = irr.preteriteElOverride;
    if (irr.gerund) gerundio = irr.gerund;
    if (irr.fullOverride) {
      Object.keys(irr.fullOverride).forEach((tenseKey) => { forms[tenseKey] = irr.fullOverride[tenseKey].slice(); });
    }

    // Imperfect subjunctive, derived mechanically from preterito[ellos] for every verb.
    function imperfectSubjFrom(preteritoEllos, endings) {
      const raBase = preteritoEllos.endsWith("ron") ? preteritoEllos.slice(0, -3) : preteritoEllos;
      return endings.map((e, i) => (i === 3 ? accentLastVowel(raBase) + e : raBase + e));
    }
    const imperfectoSubjuntivo = imperfectSubjFrom(forms.preterito[4], ["ra", "ras", "ra", "ramos", "ran"]);
    const imperfectoSubjuntivoAlt = imperfectSubjFrom(forms.preterito[4], ["se", "ses", "se", "semos", "sen"]);

    // Compound tenses built from the haber auxiliary + participle.
    const compound = {};
    Object.keys(AUX_HABER).forEach((tenseKey) => {
      compound[tenseKey] = AUX_HABER[tenseKey].map((aux) => `${aux} ${participio}`);
    });

    // Presente progresivo = estar (present) + gerundio.
    const estarPresente = inf === "estar" ? forms.presente : ["estoy", "estás", "está", "estamos", "están"];
    const presenteProgresivo = estarPresente.map((e) => `${e} ${gerundio}`);

    // Mandatos (tú+, tú-, Ud., nosotros) — derived from already-computed tenses.
    const imperative = {
      tuAff: irr.imperativeTuAff || forms.presente[2],
      tuNeg: "no " + forms.presenteSubjuntivo[1],
      ud: forms.presenteSubjuntivo[2],
      nosotros: irr.nosotrosMandato || forms.presenteSubjuntivo[3],
    };

    // Baseline equivalents, used only to compute the irregular-flag diff.
    const baselineImperfectoSubjuntivo = imperfectSubjFrom(baseline.preterito[4], ["ra", "ras", "ra", "ramos", "ran"]);
    const baselineEstarPresente = ["estoy", "estás", "está", "estamos", "están"];
    const baselinePresenteProgresivo = baselineEstarPresente.map((e) => `${e} ${baseline.gerundio}`);
    const baselineCompound = {};
    Object.keys(AUX_HABER).forEach((tenseKey) => {
      baselineCompound[tenseKey] = AUX_HABER[tenseKey].map((aux) => `${aux} ${baseline.participio}`);
    });
    const baselineImperative = {
      tuAff: baseline.presente[2],
      tuNeg: "no " + baseline.presenteSubjuntivo[1],
      ud: baseline.presenteSubjuntivo[2],
      nosotros: baseline.presenteSubjuntivo[3],
    };

    function markIrregular(finalArr, baseArr) {
      return toObj(finalArr.map((v, i) => ({ value: v, irregular: v !== baseArr[i] })));
    }

    const result = { infinitive: inf, group, forms: {}, imperative: {}, gerundio, participio };

    result.forms.presente = markIrregular(forms.presente, baseline.presente);
    result.forms.presenteProgresivo = markIrregular(presenteProgresivo, baselinePresenteProgresivo);
    result.forms.preterito = markIrregular(forms.preterito, baseline.preterito);
    result.forms.imperfecto = markIrregular(forms.imperfecto, baseline.imperfecto);
    result.forms.futuro = markIrregular(forms.futuro, ENDINGS.futuro.map((e) => stem + group + e));
    result.forms.condicional = markIrregular(forms.condicional, ENDINGS.condicional.map((e) => stem + group + e));
    result.forms.presenteSubjuntivo = markIrregular(forms.presenteSubjuntivo, baseline.presenteSubjuntivo);
    result.forms.imperfectoSubjuntivo = markIrregular(imperfectoSubjuntivo, baselineImperfectoSubjuntivo);
    Object.keys(AUX_HABER).forEach((tenseKey) => {
      result.forms[tenseKey] = markIrregular(compound[tenseKey], baselineCompound[tenseKey]);
    });

    result.imperative = {
      tuAff: { value: imperative.tuAff, irregular: imperative.tuAff !== baselineImperative.tuAff },
      tuNeg: { value: imperative.tuNeg, irregular: imperative.tuNeg !== baselineImperative.tuNeg },
      ud: { value: imperative.ud, irregular: imperative.ud !== baselineImperative.ud },
      nosotros: { value: imperative.nosotros, irregular: imperative.nosotros !== baselineImperative.nosotros },
    };

    result.imperfectoSubjuntivoAlt = toObj(imperfectoSubjuntivoAlt);

    return result;
  }

  return { conjugate, TENSES, PERSONS, IMPERATIVE_LABELS };
})();
