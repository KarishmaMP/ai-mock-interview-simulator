// app.js — Complete working script for the project
// Paste this file as app.js (overwrite existing). Assumes pages:
// index.html, admin.html, round.html, subject.html, exam.html, behavioral.html, result.html, dashboard.html
// and styles.css. Works without a backend (localStorage-based). Uses OpenAI key if provided in admin AI modal.

(() => {
  "use strict";

  // --------------- Config ----------------
  const DEFAULT_TECH_SUBJECTS = ["Python", "Java", "Web", "DBMS", "OS", "C"];
  const ADMIN_EMAILS = ["karishma@gmail.com"]; // admin emails (lowercase)
  const PAGE_DEFAULT_TIME_MIN = 10;

  // --------------- Small data helpers ----------------
  function q(topic, text, options, answerIndex) {
    return { topic, text, options, answerIndex };
  }

  // small built-in fallback bank (safe defaults)
  const DATA = {
    technical: {
      Python: [
        q("Python", "What is list comprehension in Python?", ["A way to write loops", "A syntax to create lists from iterables", "A decorator feature", "A threading model"], 1),
        q("Python", "Which keyword creates a generator?", ["yield", "gen", "return", "async"], 0)
      ],
      Java: [ q("Java", "Which keyword prevents inheritance?", ["static", "final", "private", "sealed"], 1) ],
      Web: [ q("Web", "Which tag links CSS?", ["<style>", "<link>", "<script>", "<css>"], 1) ],
      DBMS: [ q("DBMS", "Which is a primary key property?", ["Nullable", "Unique", "Composite only", "Text only"], 1) ],
      OS: [ q("OS", "Scheduling algorithm example:", ["Dijkstra", "Round Robin", "Kruskal", "DFS"], 1) ],
      C: [ q("C", "Which allocates memory?", ["malloc", "scanf", "sizeof", "typedef"], 0) ]
    },
    aptitude: {
      quant: [ q("Quant","What is 12% of 250?", ["25","30","28","35"], 1) ],
      reasoning: [ q("Reasoning","Series: 2,4,8,16,?", ["18","24","32","64"], 2) ],
      verbal: [ q("Verbal","Synonym of RAPID", ["slow","quick","late","dull"], 1) ]
    }
  };

  const BEHAVIORAL_QUESTIONS = [
    "Tell me about a time you handled a conflict within a team.",
    "Describe a situation where you had to work under pressure.",
    "Give an example of when you took initiative.",
    "Tell me about a failure and what you learned.",
    "Describe a time you influenced someone without authority."
  ];

  // --------------- RNG + hashing ----------------
  function cryptoRandomId() {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return Array.from(a).map(x => x.toString(16)).join("");
  }
  function seedFrom(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function hashText(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  // --------------- Local storage helpers ----------------
  function getUser() { const r = localStorage.getItem("aimis:user"); return r ? JSON.parse(r) : null; }
  function setUser(u) { localStorage.setItem("aimis:user", JSON.stringify(u)); }
  function clearUser() { localStorage.removeItem("aimis:user"); }
  function getUsersDB() { return JSON.parse(localStorage.getItem("aimis:users") || "{}"); }
  function setUsersDB(db) { localStorage.setItem("aimis:users", JSON.stringify(db)); }

  function getHistoryKey() { const u = getUser(); return `aimis:history:${u?.id || "guest"}`; }
  function appendHistory(rec) {
    // personal
    const key = getHistoryKey();
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(rec);
    localStorage.setItem(key, JSON.stringify(arr));
    // global
    const allKey = "aimis:history:all";
    const all = JSON.parse(localStorage.getItem(allKey) || "[]");
    all.unshift({
      ...rec,
      userId: getUser()?.id,
      userName: getUser()?.name,
      userEmail: (getUser()?.email || "").toLowerCase()
    });
    localStorage.setItem(allKey, JSON.stringify(all));
  }
  function readHistory() { return JSON.parse(localStorage.getItem(getHistoryKey()) || "[]"); }
  function readAllHistory() { return JSON.parse(localStorage.getItem("aimis:history:all") || "[]"); }

  function setCurrentExam(e) { localStorage.setItem("aimis:currentExam", JSON.stringify(e)); }
  function getCurrentExam() { const r = localStorage.getItem("aimis:currentExam"); return r ? JSON.parse(r) : null; }
  function clearCurrentExam() { localStorage.removeItem("aimis:currentExam"); }

  function setLastResult(r) { localStorage.setItem("aimis:lastResult", JSON.stringify(r)); }
  function getLastResult() { const r = localStorage.getItem("aimis:lastResult"); return r ? JSON.parse(r) : null; }

  function getBank() { return JSON.parse(localStorage.getItem("aimis:bank") || "{}"); }
  function setBank(b) { localStorage.setItem("aimis:bank", JSON.stringify(b)); }
  function bankSize(b) { return Object.values(b).reduce((sum, arr) => sum + (arr?.length || 0), 0); }

  function isAdmin() {
    const u = getUser();
    return !!(u && ADMIN_EMAILS.includes((u.email || "").trim().toLowerCase()));
  }

  // --------------- Page init dispatcher ----------------
  window.pageInit = function (page) {
    if (page === 'index') initIndex();
    if (page === 'round') { if (ensureAuth()) initRound(); }
    if (page === 'subject') { if (ensureAuth()) initSubject(); }
    if (page === 'exam') { if (ensureAuth()) initExam(); }
    if (page === 'result') { if (ensureAuth()) initResult(); }
    if (page === 'dashboard') { if (ensureAuth()) initDashboard(); }
    if (page === 'admin') { if (ensureAuth()) initAdminDashboard(); }
    if (page === 'behavioral') { if (ensureAuth()) initBehavioral(); }
  };

  function ensureAuth() {
    const u = getUser();
    if (!u) { window.location.href = "index.html"; return false; }
    return true;
  }

  // ---------------- Index (auth) ----------------
  function  initIndex(){
    // elements
    const tabBtns = Array.from(document.querySelectorAll('[data-auth-tab]'));
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const alertBox = document.getElementById('authAlert');

    // tab switching
    function switchTab(tab) {
      tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-auth-tab') === tab));
      if (signupForm) signupForm.classList.toggle('d-none', tab !== 'signup');
      if (loginForm) loginForm.classList.toggle('d-none', tab !== 'login');
      if (alertBox) alertBox.classList.add('d-none');
    }
    tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-auth-tab'))));
    switchTab('signup');

    // validation helpers
    const nameEl = document.getElementById('suName');
    const emailEl = document.getElementById('suEmail');
    const phoneEl = document.getElementById('suPhone');
    const collegeEl = document.getElementById('suCollege');
    const passEl = document.getElementById('suPassword');

    function emailOK(v) { return /^(?!.*\s)[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v || ""); }
    function phoneOK(v) { return /^(\+?\d{10,15})$/.test(v || ""); }
    function passOK(v) { return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}:;"'`~<>,.?/\\]{6,}$/.test(v || ""); }
    function nameOK(v) { return (v || "").trim().length >= 2; }
    function collegeOK(v) { return (v || "").trim().length >= 2; }
    function warn(id, show) { const el = document.getElementById(id); if (el) el.classList.toggle('d-none', !show); }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const su = {
          name: nameEl?.value.trim(),
          email: emailEl?.value.trim().toLowerCase(),
          phone: phoneEl?.value.trim(),
          college: collegeEl?.value.trim(),
          password: passEl?.value
        };
        const ok = emailOK(su.email) && phoneOK(su.phone) && passOK(su.password) && nameOK(su.name) && collegeOK(su.college);
        warn('suNameWarn', !nameOK(su.name));
        warn('suEmailWarn', !emailOK(su.email));
        warn('suPhoneWarn', !phoneOK(su.phone));
        warn('suCollegeWarn', !collegeOK(su.college));
        warn('suPassWarn', !passOK(su.password));
        if (!ok) { if (alertBox) { alertBox.textContent = "Please fix the highlighted fields."; alertBox.classList.remove('d-none'); } return; }

        const db = getUsersDB();
        if (db[su.email]) { if (alertBox) { alertBox.textContent = "Email already registered. Try Login."; alertBox.classList.remove('d-none'); } return; }
        const id = cryptoRandomId();
        db[su.email] = { ...su, id, createdAt: Date.now() };
        setUsersDB(db);
        setUser({ id, name: su.name, email: su.email, college: su.college });
        window.location.href = isAdmin() ? "admin.html" : "round.html";
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('liEmail')?.value.trim().toLowerCase();
        const password = document.getElementById('liPassword')?.value;
        const db = getUsersDB();
        const rec = db[email];
        if (!rec) { if (alertBox) { alertBox.textContent = "No account found. Please sign up."; alertBox.classList.remove('d-none'); } return; }
        if (rec.password !== password) { if (alertBox) { alertBox.textContent = "Incorrect password."; alertBox.classList.remove('d-none'); } return; }
        setUser({ id: rec.id, name: rec.name, email: rec.email.toLowerCase(), college: rec.college });
        window.location.href = isAdmin() ? "admin.html" : "round.html";
      });
    }
  }

  // ---------------- Round ----------------
  function initRound() {
    document.getElementById('btnTechnical')?.addEventListener('click', () => {
      localStorage.setItem('aimis:round', 'technical');
      window.location.href = "subject.html";
    });
    document.getElementById('btnAptitude')?.addEventListener('click', () => {
      localStorage.setItem('aimis:round', 'aptitude');
      startExam('aptitude', []);
    });
    document.getElementById('btnBehavioral')?.addEventListener('click', () => {
      window.location.href = "behavioral.html";
    });
  }

  // ---------------- Subject pick ----------------
  function initSubject() {
    const list = document.getElementById('subjectList');
    if (!list) return;
    list.innerHTML = "";
    const bank = getBank();
    const subjects = Object.keys(bank).length ? Object.keys(bank) : DEFAULT_TECH_SUBJECTS;
    const picked = new Set();
    subjects.forEach(sub => {
      const col = document.createElement('div');
      col.className = "col-6 col-md-4";
      col.innerHTML = `<button class="btn w-100 btn-outline-dark" data-sub="${sub}">${sub}</button>`;
      list.appendChild(col);
    });
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sub]');
      if (!btn) return;
      const sub = btn.getAttribute('data-sub');
      if (picked.has(sub)) { picked.delete(sub); btn.classList.remove('btn-dark'); btn.classList.add('btn-outline-dark'); }
      else { picked.add(sub); btn.classList.remove('btn-outline-dark'); btn.classList.add('btn-dark'); }
    });
    document.getElementById('startExam')?.addEventListener('click', () => startExam('technical', Array.from(picked)));
  }

  // ---------------- Exam ----------------
  function initExam() {
    const exam = getCurrentExam();
    if (!exam) { window.location.href = "round.html"; return; }
    const PAGE_SIZE = exam.pageSize || 10;
    const PAGE_DURATION_MIN = exam.pageDurationMin || PAGE_DEFAULT_TIME_MIN;
    const pool = exam.pool || [];
    const totalQ = pool.length;
    if (!totalQ) { alert("No questions available for this exam."); window.location.href = "round.html"; return; }

    const totalPages = Math.max(1, Math.ceil(totalQ / PAGE_SIZE));
    const body = document.getElementById("examBody");
    const prevBtn = document.getElementById("examPrev");
    const nextBtn = document.getElementById("examNext");
    const submitBtn = document.getElementById("submitExam");
    const pageInfo = document.getElementById("pageInfo");
    const timeEl = document.getElementById("timeLeft");

    if (!body || !submitBtn) { alert("Exam page elements missing."); return; }

    let pageIndex = Number(exam.pageIndex || 0);
    let answers = exam.answers || {};
    let timerId = null;

    function persist() {
      const e = getCurrentExam();
      if (!e) return;
      e.pageIndex = pageIndex;
      e.answers = answers;
      if (!e.pageEndsAt || e.pageEndsAt < Date.now()) e.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
      setCurrentExam(e);
    }

    function renderPage() {
      body.innerHTML = "";
      const start = pageIndex * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, totalQ);
      for (let i = start; i < end; i++) {
        const q = pool[i];
        const qnum = i + 1;
        const card = document.createElement("div");
        card.className = "card shadow-sm mb-3";

        const optsHtml = (q.options && Array.isArray(q.options) && q.options.length)
          ? q.options.map((opt, optIdx) => `
              <div class="form-check mb-1">
                <input class="form-check-input" type="radio"
                       name="q-${i}" id="q-${i}-${optIdx}" value="${optIdx}">
                <label class="form-check-label" for="q-${i}-${optIdx}">
                  ${opt}
                </label>
              </div>
            `).join("")
          : `<div class="small text-secondary">No options (invalid question).</div>`;

        card.innerHTML = `
          <div class="card-body">
            <div class="text-secondary text-uppercase small mb-1">${q.topic || ""}</div>
            <div class="fw-medium mb-2">${qnum}. ${q.text || ""}</div>
            <div class="options" data-pidx="${i}">
              ${optsHtml}
            </div>
          </div>
        `;
        body.appendChild(card);

        const prevAns = answers[i];
        if (typeof prevAns === "number") {
          const el = body.querySelector(`input[name="q-${i}"][value="${prevAns}"]`);
          if (el) el.checked = true;
        }
      }

      body.querySelectorAll(".options").forEach(div => {
        div.addEventListener("change", () => {
          const pidx = Number(div.getAttribute("data-pidx"));
          const chosen = div.querySelector('input[type="radio"]:checked');
          answers[pidx] = chosen ? Number(chosen.value) : null;
          persist();
        });
      });

      if (prevBtn) prevBtn.disabled = pageIndex === 0;
      if (nextBtn) nextBtn.disabled = pageIndex >= totalPages - 1;
      if (submitBtn) submitBtn.disabled = pageIndex < totalPages - 1;

      if (pageInfo) {
        const startQ = start + 1;
        const endQ = end;
        pageInfo.textContent = `Page ${pageIndex + 1} of ${totalPages} • Showing ${startQ}-${endQ} of ${totalQ} questions`;
      }

      persist();
    }

    function startTimer() {
      const e = getCurrentExam();
      if (!e) return;
      let endsAt = e.pageEndsAt;
      if (!endsAt || endsAt < Date.now()) {
        endsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
        e.pageEndsAt = endsAt;
        setCurrentExam(e);
      }
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        const now = Date.now();
        const msLeft = Math.max(0, endsAt - now);
        const m = Math.floor(msLeft / 60000);
        const s = Math.floor((msLeft % 60000) / 1000);

        if (timeEl) {
          timeEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }

        if (msLeft <= 0) {
          persist();
          if (pageIndex < totalPages - 1) {
            pageIndex++;
            const e2 = getCurrentExam();
            if (e2) {
              e2.pageIndex = pageIndex;
              e2.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
              setCurrentExam(e2);
            }
            renderPage();
            startTimer();
          } else {
            if (submitBtn) submitBtn.click();
          }
        }
      }, 500);
    }

    function finishExam() {
      persist();
      let correct = 0;
      const perTopic = {};
      const review = [];
      for (let i = 0; i < pool.length; i++) {
        const q = pool[i];
        const chosen = (typeof answers[i] === "number") ? answers[i] : null;
        const ok = (typeof q.answerIndex === "number") && (chosen === q.answerIndex);
        if (ok) correct++;
        const topic = q.topic || "General";
        if (!perTopic[topic]) perTopic[topic] = { total: 0, correct: 0 };
        perTopic[topic].total++;
        if (ok) perTopic[topic].correct++;
        review.push({
          topic,
          question: q.text,
          options: q.options,
          correctIndex: q.answerIndex,
          chosenIndex: chosen
        });
      }
      const pct = pool.length ? Math.round((correct / pool.length) * 100) : 0;
      const res = {
        userId: getUser()?.id,
        userName: getUser()?.name,
        round: exam.round,
        subjects: exam.subjects,
        total: pool.length,
        correct,
        percentage: pct,
        perTopic,
        startedAt: exam.startedAt,
        finishedAt: Date.now(),
        elapsedMs: Date.now() - exam.startedAt,
        review
      };
      appendHistory(res);
      setLastResult(res);
      clearCurrentExam();
      window.location.href = "result.html";
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (pageIndex === 0) return;
        persist();
        pageIndex--;
        const e2 = getCurrentExam();
        if (e2) {
          e2.pageIndex = pageIndex;
          e2.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
          setCurrentExam(e2);
        }
        renderPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
        startTimer();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (pageIndex >= totalPages - 1) return;
        persist();
        pageIndex++;
        const e2 = getCurrentExam();
        if (e2) {
          e2.pageIndex = pageIndex;
          e2.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
          setCurrentExam(e2);
        }
        renderPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
        startTimer();
      });
    }
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        finishExam();
      });
    }

    renderPage();
    startTimer();
  }

  // ---------------- Result page ----------------
  function initResult() {
    const r = getLastResult();
    if (!r) { window.location.href = "round.html"; return; }
    const scoreEl = document.getElementById("scoreBadge");

    // Behavioral branch
    if (r.type === "behavioral") {
      if (scoreEl) {
        scoreEl.textContent = `Behavioral Score • ${r.overall?.total || 0}/10`;
      }
      const wrap = document.getElementById("behavioralResult") || document.createElement("div");
      wrap.classList.remove("d-none");
      if (!wrap.parentElement) { wrap.id = "behavioralResult"; document.querySelector("main.container")?.appendChild(wrap); }
      wrap.innerHTML = "";
      const header = document.createElement("div");
      header.className = "card shadow-sm";
      header.innerHTML = `<div class="card-body"><div class="fw-semibold mb-1">Overall Behavioral Summary</div>
        <div class="small-note mb-1">Structure ${r.overall?.structure || 0}/10 • Clarity ${r.overall?.clarity || 0}/10 • Delivery ${r.overall?.delivery || 0}/10 • Positivity ${r.overall?.positivity || 0}/10 • Ownership ${r.overall?.ownership || 0}/10 • Evidence ${r.overall?.evidence || 0}/10</div>
        <div class="small-note">Avg duration: ${Math.round(r.overall?.avgDurationSec || 0)}s • Total words: ${r.overall?.totalWords || 0}</div></div>`;
      wrap.appendChild(header);
      (r.items || []).forEach((it, idx) => {
        if (!it || !it.analysis) return;
        const a = it.analysis;
        const card = document.createElement("div");
        card.className = "card shadow-sm mb-2";
        card.innerHTML = `<div class="card-body">
          <div class="small text-secondary mb-1">Question ${idx + 1}: ${it.question}</div>
          <div class="mb-2"><strong>Your answer (transcript):</strong><br><span class="small-note">${(it.transcript || "").replace(/</g, "&lt;")}</span></div>
          <div class="mb-2"><strong>Scores:</strong><br>Structure ${a.scores.structure}/10 • Clarity ${a.scores.clarity}/10 • Delivery ${a.scores.delivery}/10 • Positivity ${a.scores.positivity}/10 • Ownership ${a.scores.ownership}/10 • Evidence ${a.scores.evidence}/10 • <strong>Total ${a.scores.total}/10</strong></div>
          <div class="mb-2"><strong>Suggestions for improvement:</strong><ul class="mb-0">${(a.tips && a.tips.length) ? a.tips.map(t => `<li>${t}</li>`).join("") : "<li>Good job — keep practicing.</li>"}</ul></div>
          <div><strong>STAR template you can follow next time:</strong><pre class="small mt-2" style="white-space:pre-wrap;">${a.improvedTemplate}</pre></div>
        </div>`;
        wrap.appendChild(card);
      });
      const mcqSection = document.getElementById("mcqResult");
      if (mcqSection) mcqSection.classList.add("d-none");
      return;
    }

    // MCQ branch
    if (scoreEl) {
      scoreEl.textContent = `Score ${r.correct}/${r.total} • ${r.percentage}%`;
    }
    const grid = document.getElementById("topicGrid");
    if (grid) {
      grid.innerHTML = "";
      Object.entries(r.perTopic || {}).forEach(([topic, stats]) => {
        const pct = Math.round((stats.correct / stats.total) * 100);
        const col = document.createElement("div");
        col.className = "col-12 col-md-6";
        col.innerHTML = `<div class="card shadow-sm"><div class="card-body"><div class="fw-medium">${topic}</div><div class="small-note">Correct ${stats.correct} / ${stats.total}</div><div class="badge-progress mt-2"><div style="width:${pct}%"></div></div></div></div>`;
        grid.appendChild(col);
      });
    }

    // per-question review
    const reviewWrap = document.getElementById("answerReview");
    if (reviewWrap && Array.isArray(r.review)) {
      reviewWrap.innerHTML = "";
      r.review.forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "card shadow-sm mb-2";
        const optionsHtml = (item.options || []).map((opt, i) => {
          let cls = "";
          let prefix = "•";
          if (i === item.correctIndex) { cls = "text-success fw-semibold"; prefix = "✔"; }
          if (item.chosenIndex === i && i !== item.correctIndex) { cls = "text-danger fw-semibold"; prefix = "✖"; }
          return `<div class="${cls}">${prefix} ${String.fromCharCode(65 + i)}. ${(opt || "").replace(/</g, "&lt;")}</div>`;
        }).join("");
        card.innerHTML = `<div class="card-body"><div class="small text-secondary mb-1">${item.topic}</div><div class="fw-medium mb-2">${idx + 1}. ${item.question}</div>${optionsHtml}</div>`;
        reviewWrap.appendChild(card);
      });
    }
  }

  // ---------------- Dashboard (student) ----------------
  function initDashboard() {
    const u = getUser();
    document.getElementById('welcomeText') && (document.getElementById('welcomeText').textContent = `Welcome ${u?.name || ''}. Track your practice history.`);
    document.getElementById('logoutBtn')?.addEventListener('click', () => { clearUser(); window.location.href = "index.html"; });

    const hist = readHistory();
    document.getElementById('statAttempts') && (document.getElementById('statAttempts').textContent = hist.length);
    const best = hist.reduce((m, r) => Math.max(m, r.percentage || 0), 0);
    const avg = hist.length ? Math.round(hist.reduce((s, r) => s + (r.percentage || 0), 0) / hist.length) : 0;
    document.getElementById('statBest') && (document.getElementById('statBest').textContent = `${best}%`);
    document.getElementById('statAvg') && (document.getElementById('statAvg').textContent = `${avg}%`);

    const tbody = document.querySelector('#historyTable tbody');
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!hist.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="text-center text-secondary">No attempts yet. Start your first round!</td>`;
      tbody.appendChild(tr);
    } else {
      hist.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(r.finishedAt).toLocaleString()}</td>
          <td class="text-capitalize">${r.round}</td>
          <td>${(r.subjects || []).join(", ")}</td>
          <td>${r.correct}/${r.total}</td>
          <td>${r.percentage}%</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // ---------------- Admin ----------------
  function initAdminDashboard() {
    if (!isAdmin()) { window.location.href = "dashboard.html"; return; }
    const u = getUser();
    document.getElementById('welcomeText') && (document.getElementById('welcomeText').textContent = `Welcome Admin ${u?.name}. Manage the global question bank and review stats.`);
    document.getElementById('logoutBtn')?.addEventListener('click', () => { clearUser(); window.location.href = "index.html"; });

    const hist = readAllHistory();
    document.getElementById('statAttempts') && (document.getElementById('statAttempts').textContent = hist.length);
    const best = hist.reduce((m, r) => Math.max(m, r.percentage || 0), 0);
    const avg = hist.length ? Math.round(hist.reduce((s, r) => s + (r.percentage || 0), 0) / hist.length) : 0;
    document.getElementById('statBest') && (document.getElementById('statBest').textContent = `${best}%`);
    document.getElementById('statAvg') && (document.getElementById('statAvg').textContent = `${avg}%`);

    // Hook admin controls
    wireAdminControls();

    document.getElementById('btnClearBank')?.addEventListener('click', () => {
      if (!confirm('Clear entire question bank? This cannot be undone.')) return;
      setBank({});
      renderBankStats();
      wireAdminControls();
      const importLog = document.getElementById('importLog');
      if (importLog) importLog.textContent = "Cleared bank.";
    });
  }

  function renderBankStats() {
    const b = getBank();
    const statEl = document.getElementById('statBank');
    if (statEl) statEl.textContent = bankSize(b);
    const bt = document.querySelector('#bankTable tbody');
    if (!bt) return;
    bt.innerHTML = "";
    const keys = Object.keys(b).sort();
    if (!keys.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="2" class="text-secondary">No imported questions yet.</td>`;
      bt.appendChild(tr);
      return;
    }
    keys.forEach(sub => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${sub}</td><td>${b[sub].length}</td>`;
      bt.appendChild(tr);
    });
  }

  // --------------- Admin CRUD helpers ----------------
  function ensureBankStructure() {
    const b = getBank();
    // ensures key exists
    setBank(b);
  }
  function addSubject(name) {
    if (!name) return false;
    const bank = getBank();
    if (bank[name]) return false;
    bank[name] = [];
    setBank(bank);
    return true;
  }
  function removeSubject(name) {
    if (!name) return false;
    const bank = getBank();
    if (!bank[name]) return false;
    delete bank[name];
    setBank(bank);
    return true;
  }
  function addQuestionToBank(q) {
    if (!q || !q.topic || !q.text || !Array.isArray(q.options)) return false;
    const bank = getBank();
    bank[q.topic] = bank[q.topic] || [];
    const h = hashText((q.topic || "") + "|" + (q.text || ""));
    if (bank[q.topic].some(x => x._h === h)) return false;
    const obj = { ...q, _h: h };
    bank[q.topic].push(obj);
    setBank(bank);
    return true;
  }
  function removeQuestionByHash(subject, hash) {
    const bank = getBank();
    if (!bank[subject]) return false;
    bank[subject] = bank[subject].filter(q => q._h !== hash);
    setBank(bank);
    return true;
  }

  // --------------- Admin UI rendering & wiring ----------------
  function renderAdminSubjectsUI() {
    const bank = getBank();
    const subjectChips = document.getElementById('subjectChips');
    const subjectDetails = document.getElementById('subjectDetails');
    const qSubjectSelect = document.getElementById('qSubjectSelect');
    const aiSubject = document.getElementById('aiSubject');
    if (!subjectChips || !subjectDetails || !qSubjectSelect || !aiSubject) return;
    subjectChips.innerHTML = '';
    subjectDetails.innerHTML = '';
    qSubjectSelect.innerHTML = '<option value="">--Select subject--</option>';
    aiSubject.innerHTML = '<option value="">--Select subject--</option>';

    const subjects = Object.keys(bank).sort();
    if (subjects.length === 0) {
      subjectChips.innerHTML = '<div class="text-secondary">No subjects yet. Add one.</div>';
    }

    subjects.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-dark me-1 mb-1';
      btn.textContent = sub;
      btn.addEventListener('click', () => {
        const el = document.getElementById(`subject-card-${encodeURIComponent(sub)}`);
        if (el) el.classList.toggle('d-none');
        el && el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      subjectChips.appendChild(btn);

      const opt = document.createElement('option'); opt.value = sub; opt.textContent = sub;
      qSubjectSelect.appendChild(opt);
      aiSubject.appendChild(opt.cloneNode(true));

      const card = document.createElement('div');
      card.className = 'card shadow-sm mb-2';
      card.id = `subject-card-${encodeURIComponent(sub)}`;
      const rows = (bank[sub] || []).map(q => `
        <tr>
          <td class="small">${q.text.replace(/</g,'&lt;')}</td>
          <td>${(q.options||[]).map((o,i)=>`<div class="small">${String.fromCharCode(65+i)}. ${ (o||'').replace(/</g,'&lt;') }</div>`).join('')}</td>
          <td>${typeof q.answerIndex==='number' ? String.fromCharCode(65+q.answerIndex) : ''}</td>
          <td><button class="btn btn-sm btn-outline-danger" data-h="${q._h}" data-sub="${sub}">Delete</button></td>
        </tr>
      `).join('');
      card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-semibold">${sub} — ${bank[sub].length} questions</div>
            <div>
              <button class="btn btn-sm btn-outline-secondary" data-export="${sub}">Export CSV</button>
              <button class="btn btn-sm btn-outline-danger" data-delete-sub="${sub}">Delete Subject</button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead class="table-light"><tr><th>Question</th><th>Options</th><th>Answer</th><th>Action</th></tr></thead>
              <tbody>
                ${rows || '<tr><td colspan="4" class="text-secondary">No questions</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
      subjectDetails.appendChild(card);
    });

    // wire delete question
    subjectDetails.querySelectorAll('button[data-h]').forEach(b => {
      b.addEventListener('click', () => {
        const h = b.getAttribute('data-h'); const s = b.getAttribute('data-sub');
        if (confirm('Delete this question?')) {
          removeQuestionByHash(s, h);
          renderAdminSubjectsUI();
          renderBankStats();
        }
      });
    });
    // export
    subjectDetails.querySelectorAll('button[data-export]').forEach(b => {
      b.addEventListener('click', () => {
        const s = b.getAttribute('data-export');
        const bank = getBank();
        const arr = bank[s] || [];
        if (!arr.length) { alert('No questions to export'); return; }
        const rows = [['topic','text','opt1','opt2','opt3','opt4','answerIndex']];
        arr.forEach(q => {
          const r = [q.topic, q.text, q.options[0]||'', q.options[1]||'', q.options[2]||'', q.options[3]||'', q.answerIndex||0];
          rows.push(r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
        });
        const csv = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${s}-questions.csv`; a.click();
        URL.revokeObjectURL(url);
      });
    });
    // delete subject
    subjectDetails.querySelectorAll('button[data-delete-sub]').forEach(b => {
      b.addEventListener('click', () => {
        const s = b.getAttribute('data-delete-sub');
        if (confirm(`Delete subject ${s} and all its questions?`)) {
          removeSubject(s);
          renderAdminSubjectsUI();
          renderBankStats();
        }
      });
    });
  }

  // --------------- AI helpers ----------------
  async function generateQuestionsAI_openai(subject, count, apiKey) {
    if (!apiKey) throw new Error("API key required");
    const prompt = `Generate ${count} multiple-choice questions for the subject "${subject}". Return a JSON array of objects with fields: topic, text, options (array of 4 strings), answerIndex (0..3). Only return the JSON array, no extra commentary.`;
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "You are a JSON-only assistant." }, { role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || "AI API error");
    }
    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || "";
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      const m = content.match(/(\[.*\])/s);
      if (m) return JSON.parse(m[1]);
      throw new Error("Could not parse AI response");
    }
  }

  function generateQuestionsLocal(subject, count) {
    const templates = {
      default: [
        { q: "What is the primary purpose of {subject}?", opts: ["A general concept", "A specific algorithm", "A library", "An unrelated tool"], ans: 0 },
        { q: "Which statement is true about {subject}?", opts: ["True option A", "True option B", "False option C", "False option D"], ans: 1 }
      ],
      Python: [
        { q: "Which keyword creates a generator in Python?", opts: ["yield", "gen", "return", "async"], ans: 0 },
        { q: "Which is a Python package manager?", opts: ["pip", "npm", "maven", "gem"], ans: 0 }
      ],
      Java: [
        { q: "Which keyword prevents subclassing in Java?", opts: ["static", "final", "private", "sealed"], ans: 1 }
      ]
    };
    const pool = templates[subject] || templates.default;
    const out = [];
    let i = 0;
    while (out.length < count && i < 500) {
      const t = pool[i % pool.length];
      const opts = t.opts.map(s => s.replace("{subject}", subject));
      const obj = {
        topic: subject,
        text: t.q.replace("{subject}", subject) + (i ? ` (var ${i})` : ""),
        options: opts,
        answerIndex: t.ans
      };
      obj._h = hashText(obj.topic + "|" + obj.text);
      if (!out.some(x => x._h === obj._h)) out.push(obj);
      i++;
    }
    return out;
  }

  // --------------- Admin wiring ----------------
  function wireAdminControls() {
    if (window.__adminWired) return;
    window.__adminWired = true;

    ensureBankStructure();
    renderAdminSubjectsUI();
    renderBankStats();

    // modal instances (Bootstrap optional)
    const ModalClass = (window.bootstrap && window.bootstrap.Modal) ? window.bootstrap.Modal : null;
    const addSubjectModal = ModalClass ? new ModalClass(document.getElementById('addSubjectModal')) : null;
    const addQuestionModal = ModalClass ? new ModalClass(document.getElementById('addQuestionModal')) : null;
    const aiGenModal = ModalClass ? new ModalClass(document.getElementById('aiGenModal')) : null;

    document.getElementById('btnAddSubject')?.addEventListener('click', () => {
      document.getElementById('newSubjectName') && (document.getElementById('newSubjectName').value = '');
      if (addSubjectModal) addSubjectModal.show(); else document.getElementById('addSubjectModal')?.classList.add('show');
    });
    document.getElementById('saveSubjectBtn')?.addEventListener('click', () => {
      const name = (document.getElementById('newSubjectName')?.value || "").trim();
      if (!name) { alert('Enter subject name'); return; }
      if (!addSubject(name)) { alert('Subject exists or invalid'); return; }
      renderAdminSubjectsUI(); renderBankStats();
      if (addSubjectModal) addSubjectModal.hide(); else document.getElementById('addSubjectModal')?.classList.remove('show');
    });

    document.getElementById('btnAddQuestion')?.addEventListener('click', () => {
      renderAdminSubjectsUI();
      if (addQuestionModal) addQuestionModal.show(); else document.getElementById('addQuestionModal')?.classList.add('show');
      // clear fields
      ['qText', 'opt0', 'opt1', 'opt2', 'opt3'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      const sel = document.getElementById('qSubjectSelect'); if (sel) sel.value = "";
    });

    document.getElementById('saveQuestionBtn')?.addEventListener('click', () => {
      const topic = (document.getElementById('qSubjectSelect')?.value || "").trim();
      const text = (document.getElementById('qText')?.value || "").trim();
      const opts = [
        (document.getElementById('opt0')?.value || "").trim(),
        (document.getElementById('opt1')?.value || "").trim(),
        (document.getElementById('opt2')?.value || "").trim(),
        (document.getElementById('opt3')?.value || "").trim()
      ];
      const answerIndex = Number(document.getElementById('correctIdx')?.value || 0);
      if (!topic) { alert('Select subject'); return; }
      if (!text) { alert('Enter question text'); return; }
      if ((opts.filter(Boolean).length) < 2) { alert('Enter at least 2 options'); return; }
      const qObj = { topic, text, options: [opts[0] || "", opts[1] || "", opts[2] || "", opts[3] || ""], answerIndex };
      if (!addQuestionToBank(qObj)) { alert('Duplicate or invalid question'); return; }
      renderAdminSubjectsUI(); renderBankStats();
      if (addQuestionModal) addQuestionModal.hide(); else document.getElementById('addQuestionModal')?.classList.remove('show');
      alert('Question added');
    });

    document.getElementById('btnGenerateAI')?.addEventListener('click', () => {
      renderAdminSubjectsUI();
      if (aiGenModal) aiGenModal.show(); else document.getElementById('aiGenModal')?.classList.add('show');
    });

    document.getElementById('aiGenerateBtn')?.addEventListener('click', async () => {
      const subject = (document.getElementById('aiSubject')?.value || "").trim();
      const count = Number(document.getElementById('aiCount')?.value) || 10;
      const apiKey = (document.getElementById('aiApiKey')?.value || "").trim();
      if (!subject) { alert('Pick a subject'); return; }
      document.getElementById('aiGenerateBtn').disabled = true;
      try {
        if (!apiKey) throw new Error("No API key");
        const arr = await generateQuestionsAI_openai(subject, count, apiKey);
        let added = 0;
        for (const q of arr) {
          if (q && q.text && Array.isArray(q.options)) {
            const qobj = { topic: q.topic || subject, text: q.text, options: q.options.slice(0, 4), answerIndex: Number(q.answerIndex || 0) };
            if (addQuestionToBank(qobj)) added++;
          }
        }
        alert(`Imported ${added} questions (AI).`);
      } catch (err) {
        console.warn("AI failed:", err);
        const arr = generateQuestionsLocal(subject, count);
        let added = 0;
        arr.forEach(q => { if (addQuestionToBank(q)) added++; });
        alert(`AI failed or key missing. Added ${added} offline questions as fallback.`);
      } finally {
        document.getElementById('aiGenerateBtn').disabled = false;
        renderAdminSubjectsUI(); renderBankStats();
        if (aiGenModal) aiGenModal.hide(); else document.getElementById('aiGenModal')?.classList.remove('show');
      }
    });

    document.getElementById('aiFallbackBtn')?.addEventListener('click', () => {
      const subject = (document.getElementById('aiSubject')?.value || "").trim();
      const count = Number(document.getElementById('aiCount')?.value) || 10;
      if (!subject) { alert('Pick a subject'); return; }
      const arr = generateQuestionsLocal(subject, count);
      let added = 0;
      arr.forEach(q => { if (addQuestionToBank(q)) added++; });
      alert(`Added ${added} questions using offline generator.`);
      renderAdminSubjectsUI(); renderBankStats();
      if (aiGenModal) aiGenModal.hide();
    });

    // importer
    const fileInput = document.getElementById('fileInput');
    fileInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      let added = 0, skipped = 0;
      const bank = getBank();
      for (const f of files) {
        const text = await f.text();
        // CSV detection
        if (f.name.toLowerCase().endsWith(".csv") || (text.includes(",") && text.includes("\n") && !text.trim().startsWith("{") && !text.trim().startsWith("["))) {
          const rows = text.split(/\r?\n/).filter(Boolean);
          if (!rows.length) continue;
          const header = rows.shift().split(",").map(s => s.trim().toLowerCase());
          const idx = {
            topic: header.indexOf("topic"),
            text: header.indexOf("text"),
            opt1: header.indexOf("opt1"),
            opt2: header.indexOf("opt2"),
            opt3: header.indexOf("opt3"),
            opt4: header.indexOf("opt4"),
            answerIndex: header.indexOf("answerindex")
          };
          for (const row of rows) {
            const cols = row.split(",");
            const sub = (cols[idx.topic] || "General").trim();
            const q = {
              topic: sub,
              text: (cols[idx.text] || "").trim(),
              options: [cols[idx.opt1], cols[idx.opt2], cols[idx.opt3], cols[idx.opt4]].filter(Boolean),
              answerIndex: Number(cols[idx.answerIndex] || 0)
            };
            if (!q.text || !q.options.length) { skipped++; continue; }
            const h = hashText(q.topic + "|" + q.text);
            bank[sub] = bank[sub] || [];
            const set = new Set(bank[sub].map(x => x._h));
            if (set.has(h)) { skipped++; continue; }
            q._h = h;
            bank[sub].push(q);
            added++;
          }
        } else {
          // JSON
          let data;
          try { data = JSON.parse(text); } catch (e) { skipped++; continue; }
          const arr = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
          for (const q of arr) {
            const sub = (q.topic || "General").trim();
            if (!q.text || !Array.isArray(q.options) || typeof q.answerIndex !== "number") { skipped++; continue; }
            const h = hashText(q.topic + "|" + q.text);
            bank[sub] = bank[sub] || [];
            const set = new Set(bank[sub].map(x => x._h));
            if (set.has(h)) { skipped++; continue; }
            bank[sub].push({ topic: q.topic, text: q.text, options: q.options, answerIndex: q.answerIndex, _h: h });
            added++;
          }
        }
      }
      setBank(bank);
      renderAdminSubjectsUI();
      renderBankStats();
      const importLog = document.getElementById('importLog');
      if (importLog) importLog.textContent = `Imported ${added} questions, skipped ${skipped} (duplicates/invalid).`;
      fileInput.value = "";
    });

  } // end wireAdminControls

  // --------------- Start Exam builder ----------------
  function startExam(round, subjects) {
    const u = getUser();
    const seed = seedFrom(`${u?.email || 'guest'}-${Date.now()}`);
    const rng = mulberry32(seed);
    const BANK = getBank();
    const hasBank = bankSize(BANK) > 0;
    let pool = [];
    let pickedSubjects = subjects && subjects.length ? subjects : [];
    if (round === 'technical') {
      if (!pickedSubjects.length) pickedSubjects = DEFAULT_TECH_SUBJECTS.slice(0, 1);
      const sub = pickedSubjects[0];
      const src = (hasBank && BANK[sub]?.length) ? BANK[sub] : (DATA.technical[sub] || []);
      const shuffled = shuffle(src, rng);
      pool = shuffled.slice(0, 20);
    } else { // aptitude
      const sub = "Aptitude";
      const src = (hasBank && BANK[sub]?.length) ? BANK[sub] : ([]).concat(DATA.aptitude.quant || [], DATA.aptitude.reasoning || [], DATA.aptitude.verbal || []);
      const shuffled = shuffle(src, rng);
      pool = shuffled.slice(0, 20);
      pickedSubjects = [sub];
    }
    const exam = {
      round,
      subjects: pickedSubjects,
      pool,
      startedAt: Date.now(),
      pageIndex: 0,
      pageSize: 10,
      pageDurationMin: PAGE_DEFAULT_TIME_MIN
    };
    setCurrentExam(exam);
    window.location.href = "exam.html";
  }

  // --------------- Behavioral ----------------
  function analyzeBehavioralAnswer(transcript) {
    const text = (transcript || "").trim();
    const wc = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const avgLen = sentences.length ? Math.round(wc / sentences.length) : wc;
    const fillers = ["um", "uh", "like", "you know", "basically", "actually", "so", "well", "kind of", "sort of"];
    const fillerCount = fillers.reduce((n, f) => n + (text.toLowerCase().match(new RegExp(`\\b${f}\\b`, "g")) || []).length, 0);
    const posWords = ["achieved", "improved", "success", "resolved", "collaborated", "delivered", "impact", "learned", "optimized", "led", "exceeded"];
    const negWords = ["failed", "problem", "issue", "difficult", "blocked", "delay", "mistake", "conflict", "argued", "complaint"];
    const pos = posWords.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
    const neg = negWords.reduce((n, w) => n + (text.toLowerCase().includes(w) ? 1 : 0), 0);
    const iCount = (text.match(/\bI\b/gi) || []).length;
    const weCount = (text.match(/\bwe\b/gi) || []).length;
    const numbers = (text.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
    const S = /situation|context|background|problem/i.test(text);
    const T = /task|goal|responsib/i.test(text);
    const A = /i\s+(?:decided|took|led|designed|built|implemented|coordinated|spoke|organized|analy)/i.test(text);
    const R = /result|outcome|impact|improv|reduced|increased|grew|saved|delivered|shipped/i.test(text);

    let structure = (S + T + A + R) * 2.5;
    let clarity = Math.max(0, Math.min(10, 10 - Math.abs(avgLen - 18)));
    let delivery = Math.max(0, 10 - Math.min(10, fillerCount));
    let positivity = Math.max(0, Math.min(10, 5 + pos - neg));
    let ownership = Math.max(0, Math.min(10, 5 + iCount - Math.floor(weCount / 2)));
    let evidence = Math.min(10, numbers * 2);

    const total = Math.round((structure + clarity + delivery + positivity + ownership + evidence) / 6);

    const tips = [];
    if (!S) tips.push("Add 1–2 lines of Situation/Context at the start.");
    if (!T) tips.push("State your Task/Goal clearly.");
    if (!A) tips.push("Describe Actions you personally took (use “I”).");
    if (!R) tips.push("End with a measurable Result/Impact.");
    if (fillerCount > 3) tips.push("Reduce filler words like 'um/uh/like'. Pause briefly instead.");
    if (avgLen > 24) tips.push("Shorten long sentences for clarity.");
    if (numbers < 1) tips.push("Add numbers (%, time saved, revenue, users).");
    if (weCount > iCount) tips.push("Use “I” to show your contribution (keep teamwork too).");

    const improved = [
      "Situation: Briefly set the scene (who/what/when/why).",
      "Task: What was the goal or responsibility?",
      "Action: 2–3 concrete steps you took (verbs + details).",
      "Result: Quantify impact (e.g., “reduced X by 20% in 3 weeks”).",
      "Reflection: One sentence on what you learned."
    ].join("\n");

    return {
      wordCount: wc,
      sentences: sentences.length,
      avgSentenceLen: avgLen,
      fillerCount,
      pos, neg,
      iCount, weCount,
      numbers,
      scores: { structure, clarity, delivery, positivity, ownership, evidence, total },
      tips,
      improvedTemplate: improved
    };
  }
// Replace your existing initBehavioral() with this function
// Robust behavioral page initializer — paste/replace entire initBehavioral()

// --- Replace the existing initBehavioral() in your app.js with this entire function ---
function initBehavioral() {
  const MAX_SEC = 120;
  const qTotal = BEHAVIORAL_QUESTIONS.length;

  // page elements
  const elQNo = document.getElementById('bhQNo');
  const elQTotal = document.getElementById('bhQTotal');
  const elQuestion = document.getElementById('bhQuestion');
  const elTranscript = document.getElementById('bhTranscript');
  const elTimer = document.getElementById('bhTimer');
  const btnStart = document.getElementById('bhStart');
  const btnPause = document.getElementById('bhPause');
  const btnStop = document.getElementById('bhStop');
  const btnPrev = document.getElementById('bhPrev');
  const btnNext = document.getElementById('bhNext');

  if (!elQNo || !elQTotal || !elQuestion || !elTranscript || !elTimer || !btnStart) {
    console.error('Behavioral page missing required elements.');
    return;
  }

  // state
  let qIndex = 0;
  let elapsed = 0;
  let timerId = null;

  // answers array stores { transcript, analysis, question, durationSec }
  const answers = Array(qTotal).fill(null);

  // robust recognition state object
 // robust recognition state object
const state = {
  recognition: null,
  listening: false,
  starting: false,     // <-- new: prevents double-start race
  finalSnapshot: ''    // store confirmed final transcript only (prevents doubling)
};

  // UI render
  function render() {
    elQNo.textContent = qIndex + 1;
    elQTotal.textContent = qTotal;
    elQuestion.textContent = BEHAVIORAL_QUESTIONS[qIndex] || "Question not found";
    elTranscript.value = answers[qIndex]?.transcript || state.finalSnapshot || "";
    btnPrev.disabled = qIndex === 0;
    btnNext.disabled = !answers[qIndex];
    elTimer.textContent = "00:00";
  }

  // Timer helpers
  function startTimer() {
    const start = Date.now() - (elapsed * 1000);
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      elapsed = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      elTimer.textContent = `${m}:${s}`;
      if (elapsed >= MAX_SEC) {
        // auto stop & evaluate current question
        stopRecording();
        evaluate();
      }
    }, 250);
  }
  function stopTimerNow() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  // Create SpeechRecognition instance
  function createRecognitionInstance() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    return r;
  }

  // Start recording — asks mic permission if needed, avoids duplicates
// REPLACE the old startRecording() with this implementation

async function startRecording() {
  if (state.listening || state.starting) return; // already running or in startup
  // Check browser support
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("Speech Recognition not supported — use Chrome or Edge (desktop).");
    return;
  }

  // Ensure microphone permission (prompts user)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    console.error("getUserMedia failed:", err);
    alert("Microphone access denied or blocked. Allow microphone in site settings and reload.");
    return;
  }

  // Abort any previous recognition object safely
  try {
    if (state.recognition) {
      if (typeof state.recognition.abort === "function") state.recognition.abort();
      else state.recognition.stop();
    }
  } catch (e) { console.warn("Failed to abort previous recognition:", e); }

  // create a fresh instance and attach handlers
  state.recognition = createRecognitionInstance();
  if (!state.recognition) {
    alert("Unable to initialize SpeechRecognition.");
    return;
  }

  // set starting guard so further clicks won't call start again
  state.starting = true;

  // set starting snapshot from previously saved answer so we don't duplicate
  state.finalSnapshot = answers[qIndex]?.transcript || (elTranscript.value || "").trim() || "";

  // attach handlers
  state.recognition.onstart = () => {
    state.starting = false;
    state.listening = true;
    btnStart.classList.add('listening');
    btnPause.disabled = false;
    btnStop.disabled = false;
    if (!timerId) startTimer();
  };

  state.recognition.onend = () => {
    state.starting = false;
    state.listening = false;
    btnStart.classList.remove('listening');
    stopTimerNow();
  };

  state.recognition.onerror = (ev) => {
    console.warn("Recognition error:", ev);
    const err = ev && ev.error ? ev.error : "";
    if (err === "no-speech") alert("No speech detected. Speak louder or check microphone.");
    else if (err === "not-allowed" || err === "permission-denied") alert("Permission denied for microphone. Allow it in site settings and reload.");
    else alert("Recording error: " + err);
    state.starting = false;
    state.listening = false;
    btnStart.classList.remove('listening');
    stopTimerNow();
  };

  state.recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) {
        state.finalSnapshot = (state.finalSnapshot ? (state.finalSnapshot + " ") : "") + res[0].transcript.trim();
      } else {
        interim += (interim ? " " : "") + res[0].transcript.trim();
      }
    }
    elTranscript.value = (state.finalSnapshot ? (state.finalSnapshot + (interim ? " " : "")) : "") + interim;
    elTranscript.scrollTop = elTranscript.scrollHeight;
  };

  // Now start recognition (guarded by state.starting)
  try {
    state.recognition.start();
  } catch (err) {
    console.error("recognition.start error:", err);
    alert("Could not start speech recognition. Try reloading and ensuring mic permission.");
    // clear guards so user can retry
    state.starting = false;
    state.recognition = null;
  }
}



  // Pause recording (stop recognition but keep transcript)
  function pauseRecording() {
    if (!state.recognition) return;
    try {
      state.recognition.stop();
    } catch (e) { /* ignore */ }
    state.listening = false;
    btnStart.classList.remove('listening');
    btnStart.classList.add('paused');
    btnPause.disabled = true;
    btnStop.disabled = false;
    stopTimerNow();
    // save snapshot into transcript field
    elTranscript.value = (state.finalSnapshot || "").trim();
  }

  // Stop recording and save final transcript for current question
  function stopRecording() {
    if (state.recognition) {
      try {
        // abort preferred to avoid onend loops in some browsers
        if (typeof state.recognition.abort === "function") state.recognition.abort();
        else state.recognition.stop();
      } catch (e) { /* ignore */ }
    }
    state.listening = false;
    btnStart.classList.remove('listening');
    btnStart.classList.remove('paused');
    btnPause.disabled = true;
    btnStop.disabled = true;
    stopTimerNow();

    // commit final snapshot to answers array
    const finalText = (state.finalSnapshot || elTranscript.value || "").trim();
    if (finalText) {
      answers[qIndex] = answers[qIndex] || {};
      answers[qIndex].transcript = finalText;
      // keep duration (elapsed seconds)
      answers[qIndex].durationSec = elapsed;
    }
    // cleanup recognition instance and handlers to avoid duplicate events later
    try {
      if (state.recognition) {
        state.recognition.onresult = null;
        state.recognition.onend = null;
        state.recognition.onerror = null;
        state.recognition.onstart = null;
      }
    } catch (e) { /* ignore */ }
    state.recognition = null;
    // make sure transcript field shows final saved content
    elTranscript.value = finalText;
  }

  // compute overall for behavioral (uses existing helper analyzeBehavioralAnswer)
  function computeBehavioralOverall(items) {
    const valid = items.filter(Boolean);
    if (!valid.length) return null;
    const avg = (k) => Math.round(valid.reduce((s, x) => s + x.analysis.scores[k], 0) / valid.length);
    return {
      structure: avg('structure'),
      clarity: avg('clarity'),
      delivery: avg('delivery'),
      positivity: avg('positivity'),
      ownership: avg('ownership'),
      evidence: avg('evidence'),
      total: avg('total'),
      avgDurationSec: Math.round(valid.reduce((s, x) => s + x.durationSec, 0) / valid.length),
      totalWords: valid.reduce((s, x) => s + x.analysis.wordCount, 0),
    };
  }

  // Evaluate current transcript: analyze and save; if last question -> finalize result
  function evaluate() {
    const transcript = (elTranscript.value || "").trim();
    if (!transcript) { alert("Please record or type your answer before evaluating."); return; }
    const analysis = analyzeBehavioralAnswer(transcript);
    answers[qIndex] = { transcript, analysis, question: BEHAVIORAL_QUESTIONS[qIndex], durationSec: elapsed };

    btnNext.disabled = false;

    if (qIndex === qTotal - 1) {
      const res = {
        type: 'behavioral',
        userId: getUser()?.id,
        round: 'behavioral',
        total: qTotal,
        finishedAt: Date.now(),
        items: answers,
        overall: computeBehavioralOverall(answers),
      };
      // store result + history and navigate
      setLastResult(res);
      appendHistory(res);
      clearCurrentExam(); // safe to call (no exam active)
      window.location.href = "result.html";
    } else {
      alert("Saved & analyzed! You can proceed to the next question.");
    }
  }

  // Button listeners (these call the functions above)
  btnStart.addEventListener('click', () => {
    // reset elapsed only when starting a fresh recording for the question
    elapsed = 0;
    state.finalSnapshot = answers[qIndex]?.transcript || "";
    startRecording();
    // ensure UI
    btnPause.disabled = false;
    btnStop.disabled = false;
  });
  btnPause.addEventListener('click', () => pauseRecording());
  btnStop.addEventListener('click', () => { stopRecording(); evaluate(); });

  btnPrev.addEventListener('click', () => {
    // stop current recording and preserve transcript if any
    stopRecording();
    if (elTranscript.value.trim()) {
      answers[qIndex] = answers[qIndex] || {};
      answers[qIndex].transcript = elTranscript.value.trim();
    }
    qIndex = Math.max(0, qIndex - 1);
    elapsed = 0; elTimer.textContent = "00:00";
    // reset finalSnapshot to current question's transcript
    state.finalSnapshot = answers[qIndex]?.transcript || "";
    render();
  });

  btnNext.addEventListener('click', () => {
    stopRecording();
    qIndex = Math.min(qTotal - 1, qIndex + 1);
    elapsed = 0; elTimer.textContent = "00:00";
    state.finalSnapshot = answers[qIndex]?.transcript || "";
    render();
  });

  // If user manually edits transcript textarea, keep state.finalSnapshot in sync
  elTranscript.addEventListener('input', () => {
    // Do not immediately overwrite finalSnapshot while recording; only update snapshot when not listening
    if (!state.listening) {
      state.finalSnapshot = elTranscript.value || "";
    }
  });

  // initial render
  render();
}



  // expose some helpers to console for debugging
  window._aimis = {
    getBank, setBank, addSubject, addQuestionToBank, removeQuestionByHash, removeSubject, getUsersDB, setUsersDB, getUser, setUser
  };

  // Auto-wire admin controls on load if admin page present
  document.addEventListener('DOMContentLoaded', () => {
    try { if (document.body && document.getElementById('adminPageMarker')) wireAdminControls(); } catch (e) { console.warn('admin auto-wire failed', e); }
  });

})(); 
