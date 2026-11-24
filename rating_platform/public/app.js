(function () {
  "use strict";

  const STATE_KEY = "v2_study_state";
  const PENDING_KEY = "v2_study_pending";
  const POST_KEY = "v2_study_post_pending";
  const LANG_KEY = "v2_study_lang";

  const appEl = document.getElementById("app");
  const state = {
    lang: "en",
    config: { study_open: true, ethics_approval_no: "_", contact_email: "_", needs_access_code: false },
    raterId: null,
    trials: [],
    currentIndex: 0,
    breakSeen: false,
    startedArena: false,
    screen: "loading",
    pairShownAt: 0,
    tapLocked: true,
    choosing: false,
    flushing: false,
    lockTimer: null,
    preloaded: new Set(),
  };

  function detectLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && window.I18N[saved]) return saved;
    const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (const raw of list) {
      const code = String(raw).toLowerCase();
      if (code.startsWith("zh")) return "zh";
      if (code.startsWith("ar")) return "ar";
      if (code.startsWith("en")) return "en";
    }
    return "en";
  }

  function setLang(lang) {
    if (!window.I18N[lang]) return;
    state.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = window.I18N[lang].dir;
  }

  function t() {
    return window.I18N[state.lang] || window.I18N.en;
  }

  function detectDevice() {
    const w = Math.min(window.screen.width || window.innerWidth, window.screen.height || window.innerHeight);
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent) || w < 600) return "mobile";
    if (/iPad|Tablet/i.test(navigator.userAgent) || w < 1024) return "tablet";
    return "desktop";
  }

  function getLinkSource() {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src") || params.get("source") || params.get("utm_source");
    if (src) localStorage.setItem("v2_study_source", src.slice(0, 64));
    return localStorage.getItem("v2_study_source") || "direct";
  }

  function saveLocalState() {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        raterId: state.raterId,
        breakSeen: state.breakSeen,
        startedArena: state.startedArena,
      })
    );
  }

  function loadPending() {
    try {
      const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function savePending(arr) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  }

  async function api(path, method = "GET", body = null) {
    const opts = { method, headers: {} };
    if (body !== null) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const resp = await fetch(path, opts);
    let data = {};
    try {
      data = await resp.json();
    } catch {
      data = {};
    }
    return { status: resp.status, ok: resp.ok, data };
  }

  async function flushQueue() {
    if (state.flushing) return;
    state.flushing = true;
    try {
      let queue = loadPending();
      while (queue.length > 0) {
        const item = queue[0];
        try {
          const res = await api("/api/answer", "POST", item);
          if (res.ok || res.status === 400 || res.status === 404) {
            queue.shift();
            savePending(queue);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      // Also flush pending post-task completion if saved offline
      const pendingPost = localStorage.getItem(POST_KEY);
      if (pendingPost && queue.length === 0) {
        try {
          const res = await api("/api/complete", "POST", JSON.parse(pendingPost));
          if (res.ok || res.status === 400 || res.status === 404) {
            localStorage.removeItem(POST_KEY);
          }
        } catch {
          // keep for next retry
        }
      }
    } finally {
      state.flushing = false;
      updateSyncBanner();
    }
  }

  function updateSyncBanner() {
    const el = document.getElementById("sync-banner");
    if (!el) return;
    const n = loadPending().length + (localStorage.getItem(POST_KEY) ? 1 : 0);
    if (n > 0) {
      el.hidden = false;
      el.textContent = navigator.onLine ? t().syncing_note : t().offline_note;
    } else {
      el.hidden = true;
    }
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c !== null && c !== undefined) {
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function applyPendingToTrials() {
    const pending = loadPending();
    if (!pending.length || !state.trials.length) return;
    const doneKeys = new Set(pending.map((p) => `${p.part}:${p.idx}`));
    for (const tr of state.trials) {
      if (doneKeys.has(`${tr.part}:${tr.idx}`)) tr.answered = true;
    }
  }

  function firstUnansweredIndex() {
    for (let i = 0; i < state.trials.length; i++) {
      if (!state.trials[i].answered) return i;
    }
    return state.trials.length;
  }

  function renderWelcome() {
    state.screen = "welcome";
    const s = t();
    const langBar = el(
      "div",
      { class: "lang-bar" },
      ["zh", "en", "ar"].map((code) =>
        el("button", {
          type: "button",
          class: "lang-btn" + (state.lang === code ? " active" : ""),
          text: window.I18N[code].lang_name,
          onclick: () => {
            setLang(code);
            renderWelcome();
          },
        })
      )
    );

    if (!state.config.study_open) {
      appEl.replaceChildren(
        el("div", { class: "page" }, [
          el("div", { class: "panel" }, [
            langBar,
            el("h1", { text: s.study_title }),
            el("p", { text: s.study_closed }),
          ]),
        ])
      );
      return;
    }

    const consentParagraphs = s.consent_body.map((txt) => el("p", { text: txt }));
    const metaBox = el("div", { class: "meta-box" }, [
      el("div", { text: `${s.ethics_label} ${state.config.ethics_approval_no || "_"}` }),
      el("div", { text: `${s.contact_label} ${state.config.contact_email || "_"}` }),
    ]);

    let codeInput = null;
    const codeBlock = state.config.needs_access_code
      ? el("div", { class: "q-block", style: "margin-top:14px;" }, [
          el("label", { class: "q-label", for: "access-code", text: s.access_code_label }),
          (codeInput = el("input", {
            id: "access-code",
            type: "text",
            class: "input-text",
            placeholder: s.access_code_placeholder,
          })),
        ])
      : null;

    const checkbox = el("input", { type: "checkbox", id: "consent-chk" });
    const errBox = el("div", { class: "error-msg", hidden: "" });
    const btn = el("button", { type: "button", class: "btn", text: s.btn_continue, disabled: "" });

    checkbox.addEventListener("change", () => {
      btn.disabled = !checkbox.checked;
    });

    btn.addEventListener("click", async () => {
      if (!checkbox.checked) return;
      btn.disabled = true;
      errBox.hidden = true;
      try {
        const res = await api("/api/rater", "POST", {
          lang: state.lang,
          access_code: codeInput ? codeInput.value.trim() : "",
          device: detectDevice(),
          source: getLinkSource(),
        });
        if (!res.ok) {
          errBox.textContent = res.status === 403 ? s.err_access_code : s.err_server;
          errBox.hidden = false;
          btn.disabled = false;
          return;
        }
        state.raterId = res.data.rater_id;
        state.breakSeen = false;
        state.startedArena = false;
        saveLocalState();
        renderDemographics();
      } catch {
        errBox.textContent = s.err_server;
        errBox.hidden = false;
        btn.disabled = false;
      }
    });

    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          langBar,
          el("h1", { text: s.study_title }),
          el("div", { class: "meta-pill", text: s.study_meta }),
          el("h2", { text: s.info_heading }),
          ...consentParagraphs,
          metaBox,
          codeBlock,
          el("label", { class: "consent-check", for: "consent-chk" }, [
            checkbox,
            el("span", { text: s.consent_check }),
          ]),
          errBox,
          btn,
        ]),
      ])
    );
  }

  function makeTapGroup(options, onSelect, layout = "grid") {
    let selected = null;
    const container = el("div", { class: layout === "grid" ? "tap-grid" : "tap-list" });
    const buttons = options.map((opt) => {
      const b = el("button", {
        type: "button",
        class: "tap-opt",
        text: opt.label,
        onclick: () => {
          selected = opt.value;
          buttons.forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          onSelect(selected);
        },
      });
      container.appendChild(b);
      return b;
    });
    return { el: container, getValue: () => selected };
  }

  function renderDemographics() {
    state.screen = "demographics";
    const s = t();
    const answers = {
      sex: null,
      population: null,
      residence: null,
      contact_east_asia: null,
      contact_mideast: null,
      expert: null,
      repeat_participant: null,
    };

    const ageInput = el("input", {
      type: "number",
      min: "18",
      max: "105",
      inputmode: "numeric",
      class: "input-num",
      placeholder: s.q_age_placeholder,
    });
    const ycInput = el("input", {
      type: "number",
      min: "0",
      max: "105",
      step: "0.5",
      inputmode: "decimal",
      class: "input-num",
      value: "0",
    });
    const ymInput = el("input", {
      type: "number",
      min: "0",
      max: "105",
      step: "0.5",
      inputmode: "decimal",
      class: "input-num",
      value: "0",
    });

    const sexGrp = makeTapGroup(
      [
        { value: "female", label: s.sex_female },
        { value: "male", label: s.sex_male },
      ],
      (v) => (answers.sex = v)
    );
    const popGrp = makeTapGroup(
      [
        { value: "han", label: s.pop_han },
        { value: "chinese_other", label: s.pop_chinese_other },
        { value: "arab", label: s.pop_arab },
        { value: "persian", label: s.pop_persian },
        { value: "turkish", label: s.pop_turkish },
        { value: "kurdish", label: s.pop_kurdish },
        { value: "mideast_other", label: s.pop_mideast_other },
        { value: "other", label: s.pop_other },
      ],
      (v) => (answers.population = v),
      "list"
    );
    const resGrp = makeTapGroup(
      [
        { value: "china_region", label: s.res_china },
        { value: "mideast_region", label: s.res_mideast },
        { value: "other", label: s.res_other },
      ],
      (v) => (answers.residence = v),
      "list"
    );

    const freqOpts = [
      { value: "never", label: s.freq_never },
      { value: "rarely", label: s.freq_rarely },
      { value: "sometimes", label: s.freq_sometimes },
      { value: "often", label: s.freq_often },
      { value: "daily", label: s.freq_daily },
    ];
    const ceaGrp = makeTapGroup(freqOpts, (v) => (answers.contact_east_asia = v));
    const cmeGrp = makeTapGroup(freqOpts, (v) => (answers.contact_mideast = v));
    const expGrp = makeTapGroup(
      [
        { value: "yes", label: s.yes },
        { value: "no", label: s.no },
      ],
      (v) => (answers.expert = v)
    );
    const repGrp = makeTapGroup(
      [
        { value: "yes", label: s.yes },
        { value: "no", label: s.no },
      ],
      (v) => (answers.repeat_participant = v)
    );

    const errBox = el("div", { class: "error-msg", hidden: "" });
    const btn = el("button", { type: "button", class: "btn", text: s.btn_continue });

    btn.addEventListener("click", async () => {
      errBox.hidden = true;
      const age = parseInt(ageInput.value, 10);
      const yc = parseFloat(ycInput.value === "" ? "0" : ycInput.value);
      const ym = parseFloat(ymInput.value === "" ? "0" : ymInput.value);

      if (!Number.isInteger(age) || age < 18 || age > 105) {
        errBox.textContent = s.err_age;
        errBox.hidden = false;
        return;
      }
      if (
        Object.values(answers).some((v) => !v) ||
        Number.isNaN(yc) || yc < 0 || yc > 105 ||
        Number.isNaN(ym) || ym < 0 || ym > 105
      ) {
        errBox.textContent = s.err_required;
        errBox.hidden = false;
        return;
      }

      btn.disabled = true;
      try {
        const res = await api("/api/demographics", "POST", {
          rater_id: state.raterId,
          age,
          sex: answers.sex,
          population: answers.population,
          residence: answers.residence,
          years_china: yc,
          years_mideast: ym,
          contact_east_asia: answers.contact_east_asia,
          contact_mideast: answers.contact_mideast,
          expert: answers.expert,
          repeat_participant: answers.repeat_participant,
          device: detectDevice(),
          source: getLinkSource(),
        });
        if (!res.ok) {
          errBox.textContent = res.status === 503 ? s.err_not_enough_faces : s.err_server;
          errBox.hidden = false;
          btn.disabled = false;
          return;
        }
        const trRes = await api(`/api/trials?rid=${encodeURIComponent(state.raterId)}`);
        if (!trRes.ok || !Array.isArray(trRes.data.trials)) {
          errBox.textContent = s.err_server;
          errBox.hidden = false;
          btn.disabled = false;
          return;
        }
        state.trials = trRes.data.trials;
        state.currentIndex = firstUnansweredIndex();
        renderInstructions();
      } catch {
        errBox.textContent = s.err_server;
        errBox.hidden = false;
        btn.disabled = false;
      }
    });

    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          el("h1", { text: s.demo_title }),
          el("p", { text: s.demo_intro }),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_age }), ageInput]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_sex }), sexGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_pop }), popGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_res }), resGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_yc }), ycInput]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_ym }), ymInput]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_cea }), ceaGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_cme }), cmeGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_expert }), expGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_repeat }), repGrp.el]),
          errBox,
          btn,
        ]),
      ])
    );
  }

  function renderInstructions() {
    state.screen = "instructions";
    const s = t();
    const list = el(
      "ol",
      { class: "steps-list" },
      s.inst_steps.map((step) => el("li", { text: step }))
    );
    const btn = el("button", {
      type: "button",
      class: "btn",
      text: s.btn_start,
      onclick: () => {
        state.startedArena = true;
        saveLocalState();
        renderArenaOrBreak();
      },
    });
    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          el("h1", { text: s.inst_title }),
          el("p", { text: s.inst_lead }),
          list,
          btn,
        ]),
      ])
    );
  }

  function preloadNext(startIdx, count) {
    for (let i = startIdx + 1; i <= startIdx + count && i < state.trials.length; i++) {
      for (const code of [state.trials[i].left, state.trials[i].right]) {
        if (!state.preloaded.has(code)) {
          state.preloaded.add(code);
          const img = new Image();
          img.src = `/faces/${code}.jpg`;
        }
      }
    }
  }

  function renderArenaOrBreak() {
    if (state.currentIndex >= state.trials.length) {
      renderPostQuestions();
      return;
    }
    const tr = state.trials[state.currentIndex];
    if (tr.part === 2 && !state.breakSeen) {
      renderBreak(tr.sex);
      return;
    }
    renderArena(tr);
  }

  function renderBreak(nextSex) {
    state.screen = "break";
    const s = t();
    const btn = el("button", {
      type: "button",
      class: "btn",
      text: s.btn_next_part,
      onclick: () => {
        state.breakSeen = true;
        saveLocalState();
        renderArenaOrBreak();
      },
    });
    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          el("h1", { text: s.break_title }),
          el("p", { text: s.break_body(nextSex) }),
          btn,
        ]),
      ])
    );
  }

  function renderArena(tr) {
    state.screen = "arena";
    state.choosing = false;
    state.tapLocked = true;
    if (state.lockTimer) {
      clearTimeout(state.lockTimer);
      state.lockTimer = null;
    }

    const s = t();
    const partTrials = state.trials.filter((x) => x.part === tr.part);
    const totalInPart = partTrials.length;
    const pct = Math.round(((tr.idx - 1) / totalInPart) * 100);

    const head = el("div", { class: "arena-head" }, [
      el("div", { class: "progress-meta" }, [
        el("span", { text: s.part_progress(tr.part, tr.idx, totalInPart) }),
        el("span", { text: `${pct}%` }),
      ]),
      el("div", { class: "progress-track" }, [
        el("div", { class: "progress-fill", style: `width:${pct}%` }),
      ]),
    ]);

    const imgA = el("img", { alt: s.opt_a, draggable: "false" });
    const imgB = el("img", { alt: s.opt_b, draggable: "false" });

    const btnA = el("button", { type: "button", class: "cand-btn locked" }, [imgA]);
    const btnB = el("button", { type: "button", class: "cand-btn locked" }, [imgB]);
    const stack = el("div", { class: "pair-stack loading-pair" }, [btnA, btnB]);
    const syncBanner = el("div", { id: "sync-banner", class: "sync-banner", hidden: "" });

    const blockSave = (e) => e.preventDefault();
    [btnA, btnB, imgA, imgB].forEach((node) => {
      node.addEventListener("contextmenu", blockSave);
      node.addEventListener("dragstart", blockSave);
    });

    const handleChoice = (side) => {
      if (state.tapLocked || state.choosing) return;
      state.choosing = true;
      const rtMs = Math.max(0, Math.min(600000, Math.round(performance.now() - state.pairShownAt)));

      tr.answered = true;
      const queue = loadPending();
      queue.push({ rater_id: state.raterId, part: tr.part, idx: tr.idx, winner: side, rt_ms: rtMs });
      savePending(queue);
      flushQueue();

      state.currentIndex = firstUnansweredIndex();
      renderArenaOrBreak();
    };

    btnA.addEventListener("click", () => handleChoice("left"));
    btnB.addEventListener("click", () => handleChoice("right"));

    appEl.replaceChildren(
      el("div", { class: "arena" }, [
        head,
        el("div", { class: "arena-prompt", text: s.task_prompt }),
        stack,
        syncBanner,
      ])
    );
    updateSyncBanner();

    let loadedA = false;
    let loadedB = false;
    const onBothLoaded = () => {
      if (!loadedA || !loadedB) return;
      stack.classList.remove("loading-pair");
      state.pairShownAt = performance.now();
      state.lockTimer = setTimeout(() => {
        state.tapLocked = false;
        btnA.classList.remove("locked");
        btnB.classList.remove("locked");
      }, 250);
      preloadNext(state.currentIndex, 4);
    };

    imgA.addEventListener("load", () => { loadedA = true; onBothLoaded(); });
    imgB.addEventListener("load", () => { loadedB = true; onBothLoaded(); });
    imgA.addEventListener("error", () => { loadedA = true; onBothLoaded(); });
    imgB.addEventListener("error", () => { loadedB = true; onBothLoaded(); });

    imgA.src = `/faces/${tr.left}.jpg`;
    imgB.src = `/faces/${tr.right}.jpg`;
    if (imgA.complete) { loadedA = true; }
    if (imgB.complete) { loadedB = true; }
    if (loadedA && loadedB) onBothLoaded();
  }

  function renderPostQuestions() {
    state.screen = "post";
    const s = t();
    let chosenRegions = [];
    let chosenAngle = null;
    let chosenConf = null;

    const regionOpts = [
      { value: "eyes_brows", label: s.reg_eyes },
      { value: "nose", label: s.reg_nose },
      { value: "lips_mouth", label: s.reg_lips },
      { value: "jaw_chin", label: s.reg_jaw },
      { value: "face_shape", label: s.reg_shape },
      { value: "skin", label: s.reg_skin },
      { value: "hair_other", label: s.reg_hair },
    ];
    const regList = el("div", { class: "tap-list" });
    const regBtns = regionOpts.map((opt) => {
      const b = el("button", {
        type: "button",
        class: "tap-opt",
        text: opt.label,
        onclick: () => {
          const i = chosenRegions.indexOf(opt.value);
          if (i >= 0) {
            chosenRegions.splice(i, 1);
            b.classList.remove("selected");
          } else if (chosenRegions.length < 2) {
            chosenRegions.push(opt.value);
            b.classList.add("selected");
          }
        },
      });
      regList.appendChild(b);
      return b;
    });

    const angGrp = makeTapGroup(
      [
        { value: "front", label: s.ang_front },
        { value: "side", label: s.ang_side },
        { value: "equal", label: s.ang_equal },
      ],
      (v) => (chosenAngle = v),
      "list"
    );

    const confGrp = makeTapGroup(
      [
        { value: "not_at_all", label: s.conf_1 },
        { value: "slightly", label: s.conf_2 },
        { value: "moderate", label: s.conf_3 },
        { value: "confident", label: s.conf_4 },
        { value: "very_confident", label: s.conf_5 },
      ],
      (v) => (chosenConf = v),
      "list"
    );

    const errBox = el("div", { class: "error-msg", hidden: "" });
    const btn = el("button", { type: "button", class: "btn", text: s.btn_finish });

    btn.addEventListener("click", async () => {
      errBox.hidden = true;
      if (chosenRegions.length === 0 || !chosenAngle || !chosenConf) {
        errBox.textContent = s.err_required;
        errBox.hidden = false;
        return;
      }
      btn.disabled = true;
      const payload = {
        rater_id: state.raterId,
        post_regions: chosenRegions,
        post_angle: chosenAngle,
        post_confidence: chosenConf,
      };
      localStorage.setItem(POST_KEY, JSON.stringify(payload));
      await flushQueue();
      renderDone();
    });

    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          el("h1", { text: s.post_title }),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_post_regions }), regList]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_post_angle }), angGrp.el]),
          el("div", { class: "q-block" }, [el("label", { class: "q-label", text: s.q_post_conf }), confGrp.el]),
          errBox,
          btn,
        ]),
      ])
    );
  }

  function renderDone() {
    state.screen = "done";
    const s = t();
    const syncBanner = el("div", { id: "sync-banner", class: "sync-banner", hidden: "" });
    appEl.replaceChildren(
      el("div", { class: "page" }, [
        el("div", { class: "panel" }, [
          el("h1", { text: s.done_title }),
          el("p", { text: s.done_body }),
          el("p", { text: s.done_share }),
          syncBanner,
        ]),
      ])
    );
    updateSyncBanner();
  }

  async function init() {
    setLang(detectLang());
    getLinkSource();

    window.addEventListener("online", () => flushQueue());
    setInterval(() => {
      if (loadPending().length > 0 || localStorage.getItem(POST_KEY)) {
        flushQueue();
      }
    }, 5000);

    try {
      const cfgRes = await api("/api/config");
      if (cfgRes.ok) state.config = cfgRes.data;
    } catch {
      // proceed with defaults
    }

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    } catch {
      saved = null;
    }

    if (saved && saved.raterId) {
      try {
        const res = await api(`/api/resume?rid=${encodeURIComponent(saved.raterId)}`);
        if (res.ok) {
          state.raterId = saved.raterId;
          state.breakSeen = Boolean(saved.breakSeen);
          state.startedArena = Boolean(saved.startedArena);
          await flushQueue();
          if (res.data.completed || localStorage.getItem(POST_KEY)) {
            renderDone();
            return;
          }
          if (res.data.has_demographics) {
            const trRes = await api(`/api/trials?rid=${encodeURIComponent(state.raterId)}`);
            if (trRes.ok && Array.isArray(trRes.data.trials)) {
              state.trials = trRes.data.trials;
              applyPendingToTrials();
              state.currentIndex = firstUnansweredIndex();
              if (state.currentIndex >= state.trials.length) {
                renderPostQuestions();
              } else if (state.currentIndex === 0 && !state.startedArena) {
                renderInstructions();
              } else {
                renderArenaOrBreak();
              }
              return;
            }
          }
          renderDemographics();
          return;
        } else if (res.status === 404) {
          localStorage.removeItem(STATE_KEY);
          localStorage.removeItem(PENDING_KEY);
          localStorage.removeItem(POST_KEY);
        }
      } catch {
        // fall through to welcome if unreachable
      }
    }

    renderWelcome();
  }

  init();
})();

