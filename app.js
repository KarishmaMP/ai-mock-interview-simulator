// =============== Global Config & Utilities ===============
const DEFAULT_TECH_SUBJECTS = ["Python","Java","Web","DBMS","OS","C"];
const DURATION_MIN = 20;

// >>> ADD YOUR ADMIN EMAILS HERE <<<
const ADMIN_EMAILS = [
  "karishma@gmail.com",
];

const DATA = (function(){
  function q(topic, text, options, answerIndex){ return { topic, text, options, answerIndex }; }
  return {
    technical: {
      Python: [
        q("Python","What is list comprehension in Python?", ["A way to write loops","A syntax to create lists from iterables","A decorator feature","A threading model"], 1),
        q("Python","What does PEP8 refer to?", ["Python Enhancement Proposal on style","Package manager","Virtualenv","Bytecode"], 0),
        q("Python","Which keyword creates a generator?", ["yield","gen","return","async"], 0),
        q("Python","Which DS is LIFO?", ["Queue","Stack","Set","Dict"], 1),
        q("Python","What is GIL?", ["Garbage Inline","Global Interpreter Lock","Generic Interface Layer","Graph Inline Loader"], 1),
        q("Python","Pick one immutable type:", ["list","set","dict","tuple"], 3),
        q("Python","pip installs from?", ["PyPI","npm","maven","rubygems"], 0),
      ],
      Java: [
        q("Java","Which keyword prevents inheritance?", ["static","final","private","sealed"], 1),
        q("Java","JVM stands for?", ["Java Virtual Machine","Just-in-time VM","Java Vendor Machine","None"], 0),
        q("Java","Which collection is synchronized?", ["ArrayList","Vector","HashMap","LinkedList"], 1),
        q("Java","Interface default method keyword?", ["default","impl","extend","virtual"], 0),
        q("Java","Checked exception example:", ["NullPointerException","IOException","ArithmeticException","IndexOutOfBounds"], 1),
      ],
      Web: [
        q("Web","Which tag links CSS?", ["<style>","<link>","<script>","<css>"], 1),
        q("Web","HTTP status for Redirect?", ["200","301/302","401","500"], 1),
        q("Web","Flexbox main axis property:", ["justify-content","align-items","gap","order"], 0),
        q("Web","Promise resolves via:", ["then","await","both","neither"], 2),
        q("Web","CSR stands for:", ["Client Side Rendering","Central Style Rule","Cross Site Request","Cloud Service Router"], 0),
      ],
      DBMS: [
        q("DBMS","Which is a primary key property?", ["Nullable","Unique","Composite only","Text only"], 1),
        q("DBMS","SQL to remove table?", ["DROP TABLE","DELETE TABLE","REMOVE TABLE","TRUNCATE TABLE"], 0),
        q("DBMS","Normalization reduces:", ["Redundancy","Indexes","ACID","Joins"], 0),
        q("DBMS","Foreign key links:", ["Two databases","Two tables","Two schemas","Two users"], 1),
        q("DBMS","ACID: C means:", ["Commit","Consistency","Connection","Constraint"], 1),
      ],
      OS: [
        q("OS","Scheduling algorithm example:", ["Dijkstra","Round Robin","Kruskal","DFS"], 1),
        q("OS","Deadlock needs?", ["Mutual exclusion","Low memory","RAID","Paging"], 0),
        q("OS","Page replacement algo:", ["FIFO","Prim","A*","Bellman-Ford"], 0),
        q("OS","Kernel mode is for:", ["User apps","Privileged ops","Browsers","Editors"], 1),
        q("OS","Semaphore used for:", ["Networking","Sync","Graphics","Power"], 1),
      ],
      C: [
        q("C","Which is not a C storage class?", ["auto","register","static","sealed"], 3),
        q("C","printf is in:", ["stdio.h","stdlib.h","string.h","ctype.h"], 0),
        q("C","Pointer to pointer type:", ["int**","int*[]","int&","ptr<int>"], 0),
        q("C","Array index starts at:", ["0","1","-1","Depends"], 0),
        q("C","Which allocates memory?", ["malloc","scanf","sizeof","typedef"], 0),
      ],
    },
    aptitude: {
      quant: [
        q("Quant","What is 12% of 250?", ["25","30","28","35"], 1),
        q("Quant","Simplify: 3/5 + 2/5 = ?", ["1","5/5","1/5","3/10"], 1),
        q("Quant","Square of 18?", ["324","256","289","361"], 0),
        q("Quant","Ratio 2:3 equals?", ["0.66","1.5","2","3"], 1),
        q("Quant","Prime after 29?", ["31","33","35","37"], 0),
      ],
      reasoning: [
        q("Reasoning","Opposite of ARID?", ["dry","humid","hot","cold"], 1),
        q("Reasoning","Series: 2,4,8,16,?", ["18","24","32","64"], 2),
        q("Reasoning","If SOME cats are pets...", ["syllogism","set","graph","mod"], 0),
        q("Reasoning","Mirror of 'b' is like:", ["d","p","q","l"], 2),
        q("Reasoning","Clock angle 3:00?", ["0°","90°","180°","270°"], 1),
      ],
      verbal: [
        q("Verbal","Choose correct: 'Its/It's raining'", ["Its","It's","Its'","It is's"], 1),
        q("Verbal","Synonym of RAPID", ["slow","quick","late","dull"], 1),
        q("Verbal","Antonym of VAGUE", ["unclear","fuzzy","definite","dim"], 2),
        q("Verbal","Fill: 'She ___ the exam'", ["has pass","passed","have pass","passing"], 1),
        q("Verbal","Plural of 'analysis'", ["analysis","analysises","analyses","analysis'"], 2),
      ],
    }
  };
})();

// ===== Behavioral (HR) question bank =====
const BEHAVIORAL_QUESTIONS = [
  "Tell me about a time you handled a conflict within a team.",
  "Describe a situation where you had to work under pressure.",
  "Give an example of when you took initiative.",
  "Tell me about a failure and what you learned.",
  "Describe a time you influenced someone without authority.",
  "Tell me about a time you prioritized multiple tasks.",
  "Describe a situation you had to adapt quickly.",
  "Tell me about a time you resolved a customer or user complaint.",
  "Describe a time you received critical feedback and acted on it.",
  "Tell me about a time you led a project end-to-end."
];

// Random, utility helpers
function cryptoRandomId(){
  const a = new Uint32Array(2); crypto.getRandomValues(a);
  return Array.from(a).map(x=>x.toString(16)).join("");
}
function seedFrom(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^(t>>>15), t|1); t^=t+Math.imul(t^(t>>>7), t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function shuffle(arr, rng){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function sampleUnique(pool, n, rng){ const a=[...pool]; const out=[]; const k=Math.min(n, a.length); for(let i=0;i<k;i++){ const idx=Math.floor(rng()*a.length); out.push(a.splice(idx,1)[0]); } return out; }

// Speech
function getSpeechRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

// -------- Storage helpers --------
function getUser(){
  const raw = localStorage.getItem("aimis:user");
  return raw ? JSON.parse(raw) : null;
}
function setUser(u){
  localStorage.setItem("aimis:user", JSON.stringify(u));
}
function clearUser(){
  localStorage.removeItem("aimis:user");
}
function getUsersDB(){
  return JSON.parse(localStorage.getItem("aimis:users") || "{}");
}
function setUsersDB(db){
  localStorage.setItem("aimis:users", JSON.stringify(db));
}

// ---------- HISTORY HELPERS ----------
function getHistoryKey(){
  const u = getUser();
  return `aimis:history:${u?.id || "guest"}`;
}

function appendHistory(rec){
  const u = getUser();
  const key = getHistoryKey();
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.unshift(rec);
  localStorage.setItem(key, JSON.stringify(arr));

  const allKey = "aimis:history:all";
  const allArr = JSON.parse(localStorage.getItem(allKey) || "[]");
  allArr.unshift({
    ...rec,
    userId: u?.id,
    userName: u?.name,
    userEmail: (u?.email || "").toLowerCase()
  });
  localStorage.setItem(allKey, JSON.stringify(allArr));
}

function readHistory(){
  const key = getHistoryKey();
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function readAllHistory(){
  return JSON.parse(localStorage.getItem("aimis:history:all") || "[]");
}

// Exam state
function setCurrentExam(ex){
  localStorage.setItem("aimis:currentExam", JSON.stringify(ex));
}
function getCurrentExam(){
  const raw = localStorage.getItem("aimis:currentExam");
  return raw ? JSON.parse(raw) : null;
}
function clearCurrentExam(){
  localStorage.removeItem("aimis:currentExam");
}

// Last result
function setLastResult(r){
  localStorage.setItem("aimis:lastResult", JSON.stringify(r));
}
function getLastResult(){
  const raw = localStorage.getItem("aimis:lastResult");
  return raw ? JSON.parse(raw) : null;
}

// Bank helpers
function getBank(){ return JSON.parse(localStorage.getItem("aimis:bank") || "{}"); }
function setBank(b){ localStorage.setItem("aimis:bank", JSON.stringify(b)); }
function bankSize(b){ return Object.values(b).reduce((sum,arr)=>sum+arr.length,0); }
function hashText(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36); }

// Admin check
function isAdmin(){
  const u = getUser();
  return !!(u && ADMIN_EMAILS.includes((u.email||"").trim().toLowerCase()));
}

function ensureAuth(){
  const u = getUser();
  if(!u){ window.location.href = "index.html"; return false; }
  return true;
}

// Page initializer
window.pageInit = function(page){
  if(page === 'index'){ initIndex(); }
  if(page === 'round'){ if(ensureAuth()) initRound(); }
  if(page === 'subject'){ if(ensureAuth()) initSubject(); }
  if(page === 'exam'){ if(ensureAuth()) initExam(); }
  if(page === 'result'){ if(ensureAuth()) initResult(); }
  if(page === 'dashboard'){ if(ensureAuth()) initDashboard(); }
  if(page === 'admin'){ if(ensureAuth()) initAdminDashboard(); }
  if(page === 'behavioral'){ if(ensureAuth()) initBehavioral(); }
};
// -------- Index (Auth) --------
function initIndex(){
  const tabBtns = document.querySelectorAll('[data-auth-tab]');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('authAlert');

  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-auth-tab');
    signupForm.classList.toggle('d-none', tab !== 'signup');
    loginForm.classList.toggle('d-none', tab !== 'login');
    alertBox.classList.add('d-none');
  }));

  // Signup validation
  const nameEl = document.getElementById('suName');
  const emailEl = document.getElementById('suEmail');
  const phoneEl = document.getElementById('suPhone');
  const collegeEl = document.getElementById('suCollege');
  const passEl = document.getElementById('suPassword');

  function emailOK(v){ return /^(?!.*\s)[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v||""); }
  function phoneOK(v){ return /^(\+?\d{10,15})$/.test(v||""); }
  function passOK(v){ return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}:;"'`~<>,.?/\\]{6,}$/.test(v||""); }
  function nameOK(v){ return (v||"").trim().length>=2; }
  function collegeOK(v){ return (v||"").trim().length>=2; }
  function warn(id, show){ document.getElementById(id).classList.toggle('d-none', !show); }

  signupForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const su = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim().toLowerCase(),
      phone: phoneEl.value.trim(),
      college: collegeEl.value.trim(),
      password: passEl.value,
    };
    const ok = emailOK(su.email) && phoneOK(su.phone) && passOK(su.password) && nameOK(su.name) && collegeOK(su.college);
    warn('suNameWarn', !nameOK(su.name));
    warn('suEmailWarn', !emailOK(su.email));
    warn('suPhoneWarn', !phoneOK(su.phone));
    warn('suCollegeWarn', !collegeOK(su.college));
    warn('suPassWarn', !passOK(su.password));
    if(!ok){ alertBox.textContent = "Please fix the highlighted fields."; alertBox.classList.remove('d-none'); return; }

    const db = getUsersDB();
    if(db[su.email]){ alertBox.textContent = "Email already registered. Try Login."; alertBox.classList.remove('d-none'); return; }
    const id = cryptoRandomId();
    db[su.email] = { ...su, id, createdAt: Date.now() };
    setUsersDB(db);
    setUser({ id, name: su.name, email: su.email, college: su.college });

    window.location.href = isAdmin() ? "admin.html" : "round.html";
  });

  // Login
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = document.getElementById('liEmail').value.trim().toLowerCase();
    const password = document.getElementById('liPassword').value;
    const db = getUsersDB();
    const rec = db[email];
    if(!rec){ alertBox.textContent="No account found. Please sign up."; alertBox.classList.remove('d-none'); return; }
    if(rec.password !== password){ alertBox.textContent="Incorrect password."; alertBox.classList.remove('d-none'); return; }
    setUser({ id: rec.id, name: rec.name, email: rec.email.toLowerCase(), college: rec.college });

    window.location.href = isAdmin() ? "admin.html" : "round.html";
  });
}

// -------- Round --------
function initRound(){
  document.getElementById('btnTechnical').addEventListener('click', ()=>{
    localStorage.setItem('aimis:round', 'technical');
    window.location.href = "subject.html";
  });

  document.getElementById('btnAptitude').addEventListener('click', ()=>{
    localStorage.setItem('aimis:round', 'aptitude');
    startExam('aptitude', []);
  });

  document.getElementById('btnBehavioral')?.addEventListener('click', ()=>{
    window.location.href = "behavioral.html";
  });
}

// -------- Subject --------
function initSubject(){
  const list = document.getElementById('subjectList');
  const picked = new Set();

  DEFAULT_TECH_SUBJECTS.forEach(sub => {
    const col = document.createElement('div');
    col.className = "col-6 col-md-4";
    col.innerHTML = `<button class="btn w-100 btn-outline-dark" data-sub="${sub}">${sub}</button>`;
    list.appendChild(col);
  });

  list.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-sub]');
    if(!btn) return;
    const sub = btn.getAttribute('data-sub');
    if(picked.has(sub)){
      picked.delete(sub);
      btn.classList.remove('btn-dark');
      btn.classList.add('btn-outline-dark');
    } else {
      picked.add(sub);
      btn.classList.remove('btn-outline-dark');
      btn.classList.add('btn-dark');
    }
  });

  document.getElementById('startExam').addEventListener('click', ()=>{
    localStorage.setItem('aimis:round', 'technical');
    startExam('technical', Array.from(picked));
  });
}



// ===================== EXAM ENGINE (MCQ) =====================

// -------- Exam (MCQ paginated) --------
function initExam(){
  const exam = getCurrentExam();
  if (!exam) {
    window.location.href = "round.html";
    return;
  }

  const PAGE_SIZE = exam.pageSize || 10;
  const PAGE_DURATION_MIN = exam.pageDurationMin || 10;
  const pool = exam.pool || [];
  const totalQ = pool.length;

  if (!totalQ) {
    alert("No questions found for this exam. Check your question bank/import.");
    window.location.href = "round.html";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalQ / PAGE_SIZE));

  const body      = document.getElementById("examBody");
  const prevBtn   = document.getElementById("examPrev");
  const nextBtn   = document.getElementById("examNext");
  const submitBtn = document.getElementById("submitExam");
  const pageInfo  = document.getElementById("pageInfo");
  const timeEl    = document.getElementById("timeLeft");

  if (!body || !submitBtn) {
    alert("Exam page is missing required elements (examBody or submitExam). Check exam.html IDs.");
    return;
  }

  let pageIndex = Number(exam.pageIndex || 0);
  let answers   = exam.answers || {};
  let timerId   = null;

  // ---------- persist state ----------
  function persist() {
    const e = getCurrentExam();
    if (!e) return;
    e.pageIndex = pageIndex;
    e.answers   = answers;
    if (!e.pageEndsAt || e.pageEndsAt < Date.now()) {
      e.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
    }
    setCurrentExam(e);
  }

  // ---------- render page ----------
  function renderPage() {
    body.innerHTML = "";
    const start = pageIndex * PAGE_SIZE;
    const end   = Math.min(start + PAGE_SIZE, totalQ);

    for (let i = start; i < end; i++) {
      const q    = pool[i];
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

      // restore previous answer
      const prevAns = answers[i];
      if (typeof prevAns === "number") {
        const el = body.querySelector(`input[name="q-${i}"][value="${prevAns}"]`);
        if (el) el.checked = true;
      }
    }

    // radio tracking
    body.querySelectorAll(".options").forEach(div => {
      div.addEventListener("change", () => {
        const pidx   = Number(div.getAttribute("data-pidx"));
        const chosen = div.querySelector('input[type="radio"]:checked');
        answers[pidx] = chosen ? Number(chosen.value) : null;
        persist();
      });
    });

    if (prevBtn)   prevBtn.disabled   = pageIndex === 0;
    if (nextBtn)   nextBtn.disabled   = pageIndex >= totalPages - 1;
    if (submitBtn) submitBtn.disabled = pageIndex < totalPages - 1;

    if (pageInfo) {
      const startQ = start + 1;
      const endQ   = end;
      pageInfo.textContent = 
        `Page ${pageIndex + 1} of ${totalPages} • Showing ${startQ}-${endQ} of ${totalQ} questions`;
    }

    persist();
  }

  // ---------- timer ----------
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
      const now    = Date.now();
      const msLeft = Math.max(0, endsAt - now);
      const m      = Math.floor(msLeft / 60000);
      const s      = Math.floor((msLeft % 60000) / 1000);

      if (timeEl) {
        timeEl.textContent =
          `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }

      if (msLeft <= 0) {
        persist();
        if (pageIndex < totalPages - 1) {
          pageIndex++;
          const e2 = getCurrentExam();
          if (e2) {
            e2.pageIndex   = pageIndex;
            e2.pageEndsAt  = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
            setCurrentExam(e2);
          }
          renderPage();
          startTimer();
        } else {
          submitBtn?.click();
        }
      }
    }, 500);
  }

  // ---------- finish exam ----------
  function finishExam() {
    persist();

    let correct   = 0;
    const perTopic = {};

    for (let i = 0; i < pool.length; i++) {
      const q      = pool[i];
      const chosen = (typeof answers[i] === "number") ? answers[i] : null;
      const ok     = (typeof q.answerIndex === "number") && (chosen === q.answerIndex);

      if (ok) correct++;

      const topic = q.topic || "General";
      if (!perTopic[topic]) perTopic[topic] = { total: 0, correct: 0 };
      perTopic[topic].total++;
      if (ok) perTopic[topic].correct++;
    }

    const pct = pool.length ? Math.round((correct / pool.length) * 100) : 0;

    const res = {
      userId: getUser()?.id,
      round: exam.round,
      subjects: exam.subjects,
      total: pool.length,
      correct,
      percentage: pct,
      perTopic,
      startedAt: exam.startedAt,
      finishedAt: Date.now(),
      elapsedMs: Date.now() - exam.startedAt
    };

    appendHistory(res);
    setLastResult(res);
    clearCurrentExam();
    window.location.href = "result.html";
  }

  // ---------- wire buttons ----------
  prevBtn?.addEventListener("click", () => {
    if (pageIndex === 0) return;
    persist();
    pageIndex--;
    const e2 = getCurrentExam();
    if (e2) {
      e2.pageIndex  = pageIndex;
      e2.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
      setCurrentExam(e2);
    }
    renderPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTimer();
  });

  nextBtn?.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    persist();
    pageIndex++;
    const e2 = getCurrentExam();
    if (e2) {
      e2.pageIndex  = pageIndex;
      e2.pageEndsAt = Date.now() + PAGE_DURATION_MIN * 60 * 1000;
      setCurrentExam(e2);
    }
    renderPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTimer();
  });

  submitBtn?.addEventListener("click", () => {
    alert("Submitting your exam…");
    try {
      finishExam();
    } catch (e) {
      console.error("Error while submitting exam:", e);
      alert("Error while submitting: " + (e.message || e));
    }
  });

  // init
  renderPage();
  startTimer();
}



// ===================== RESULT PAGE =====================
function initResult(){
  const r = getLastResult();
  if(!r){ window.location.href = "round.html"; return; }

  // ----- Behavioral Result -----
  if(r.type === 'behavioral'){
    const scoreEl = document.getElementById('scoreBadge');
    if(scoreEl) scoreEl.textContent = `Behavioral Score • ${r.overall.total}/10`;

    const wrap = document.getElementById('behavioralResult') || document.createElement('div');
    if(!wrap.id) { wrap.id = 'behavioralResult'; document.querySelector('main.container')?.appendChild(wrap); }

    const header = document.createElement('div');
    header.className = "card shadow-sm";
    header.innerHTML = `
      <div class="card-body">
        <div class="fw-semibold">Overall</div>
        <div class="small-note">
          Structure ${r.overall.structure}/10 • Clarity ${r.overall.clarity}/10 • Delivery ${r.overall.delivery}/10 •
          Positivity ${r.overall.positivity}/10 • Ownership ${r.overall.ownership}/10 • Evidence ${r.overall.evidence}/10
        </div>
        <div class="small-note">Avg duration: ${Math.round(r.overall.avgDurationSec)}s • Total words: ${r.overall.totalWords}</div>
      </div>`;
    wrap.appendChild(header);

    r.items.forEach((it, idx)=>{
      if(!it) return;
      const a = it.analysis;
      const card = document.createElement('div');
      card.className = "card shadow-sm";
      card.innerHTML = `
        <div class="card-body">
          <div class="small text-secondary mb-1">Q${idx+1}: ${it.question}</div>
          <div class="mb-2"><strong>Your transcript:</strong><br><span class="small-note">${(it.transcript||"").replace(/</g,"&lt;")}</span></div>
          <div class="mb-2"><strong>Scores:</strong>
            Structure ${a.scores.structure}/10 • Clarity ${a.scores.clarity}/10 • Delivery ${a.scores.delivery}/10 •
            Positivity ${a.scores.positivity}/10 • Ownership ${a.scores.ownership}/10 • Evidence ${a.scores.evidence}/10 •
            Total ${a.scores.total}/10
          </div>
          <div class="mb-2"><strong>Suggestions:</strong>
            <ul class="mb-0">${a.tips.map(t=>`<li>${t}</li>`).join("") || "<li>Great job! Keep this structure.</li>"}</ul>
          </div>
          <div><strong>Improve using STAR:</strong>
            <pre class="small mt-2" style="white-space:pre-wrap">${a.improvedTemplate}</pre>
          </div>
        </div>`;
      wrap.appendChild(card);
    });

    document.getElementById('topicGrid')?.classList.add('d-none');
    return;
  }

  // ----- MCQ Result -----
  document.getElementById('scoreBadge').textContent = `Score ${r.correct}/${r.total} • ${r.percentage}%`;

  const grid = document.getElementById('topicGrid');
  grid.innerHTML = "";

  Object.entries(r.perTopic).forEach(([topic, stats])=>{
    const pct = Math.round((stats.correct/stats.total)*100);
    const col = document.createElement('div');
    col.className = "col-12 col-md-6";
    col.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="fw-medium">${topic}</div>
          <div class="small-note">Correct ${stats.correct} / ${stats.total}</div>
          <div class="badge-progress mt-2"><div style="width:${pct}%"></div></div>
        </div>
      </div>`;
    grid.appendChild(col);
  });
}



// ===================== STUDENT DASHBOARD =====================
function initDashboard(){
  const u = getUser();
  document.getElementById('welcomeText').textContent =
    `Welcome ${u?.name}. Track your practice history.`;
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    clearUser(); window.location.href = "index.html";
  });

  const hist = readAllHistory();
  document.getElementById('statAttempts').textContent = hist.length;
  const best = hist.reduce((m,r)=>Math.max(m, r.percentage), 0);
  const avg = hist.length? Math.round(hist.reduce((s,r)=>s+r.percentage,0)/hist.length):0;

  document.getElementById('statBest').textContent = `${best}%`;
  document.getElementById('statAvg').textContent = `${avg}%`;

  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = "";

  if(!hist.length){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="text-center text-secondary">No attempts yet. Start your first round!</td>`;
    tbody.appendChild(tr);
  } else {
    hist.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(r.finishedAt).toLocaleString()}</td>
        <td>${r.userName || 'Unknown'}</td>
        <td class="text-capitalize">${r.round}</td>
        <td>${(r.subjects || []).join(", ")}</td>
        <td>${r.correct}/${r.total}</td>
        <td>${r.percentage}%</td>`;
      tbody.appendChild(tr);
    });
  }
}



// ===================== ADMIN DASHBOARD =====================
function initAdminDashboard(){
  if(!isAdmin()){
    window.location.href = "dashboard.html";
    return;
  }

  const u = getUser();
  document.getElementById('welcomeText').textContent =
    `Welcome ${u?.name}. Manage the global question bank and review stats.`;
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    clearUser(); window.location.href = "index.html";
  });

  const hist = readHistory();
  const attemptsEl = document.getElementById('statAttempts');
  const bestEl     = document.getElementById('statBest');
  const avgEl      = document.getElementById('statAvg');

  attemptsEl.textContent = hist.length;

  const best = hist.reduce((m,r)=>Math.max(m, r.percentage), 0);
  const avg  = hist.length? Math.round(hist.reduce((s,r)=>s+r.percentage,0)/hist.length):0;

  bestEl.textContent = `${best}%`;
  avgEl.textContent = `${avg}%`;

  const tbody = document.querySelector('#historyTable tbody');
  if(tbody){
    tbody.innerHTML = "";
    if(!hist.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="text-center text-secondary">No attempts yet.</td>`;
      tbody.appendChild(tr);
    } else {
      hist.forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(r.finishedAt).toLocaleString()}</td>
          <td class="text-capitalize">${r.round}</td>
          <td>${r.subjects.join(", ")}</td>
          <td>${r.correct}/${r.total}</td>
          <td>${r.percentage}%</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // Bank stats
  function renderBankStats(){
    const b = getBank();
    document.getElementById('statBank').textContent = bankSize(b);

    const bt = document.querySelector('#bankTable tbody');
    bt.innerHTML = "";
    const keys = Object.keys(b);
    if(!keys.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="2" class="text-secondary">No imported questions yet.</td>`;
      bt.appendChild(tr);
      return;
    }

    keys.sort().forEach(sub=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${sub}</td><td>${b[sub].length}</td>`;
      bt.appendChild(tr);
    });
  }
  renderBankStats();

  // importer
  const fileInput = document.getElementById('fileInput');
  const importLog = document.getElementById('importLog');

  document.getElementById('btnClearBank')?.addEventListener('click', ()=>{
    setBank({});
    renderBankStats();
    importLog.textContent = "Cleared bank.";
  });

  fileInput?.addEventListener('change', async (e)=>{
    const files = Array.from(e.target.files || []);
    let added = 0, skipped = 0;
    let bank = getBank();

    for(const f of files){
      const text = await f.text();
      if(f.name.toLowerCase().endsWith(".csv") ||
         (text.includes(",") && text.includes("\n") && !text.trim().startsWith("{") && !text.trim().startsWith("[")))
      {
        // CSV
        const rows = text.split(/\r?\n/).filter(Boolean);
        if(!rows.length) continue;
        const header = rows.shift().split(",").map(s=>s.trim().toLowerCase());
        const idx = {
          topic: header.indexOf("topic"),
          text: header.indexOf("text"),
          opt1: header.indexOf("opt1"),
          opt2: header.indexOf("opt2"),
          opt3: header.indexOf("opt3"),
          opt4: header.indexOf("opt4"),
          answerIndex: header.indexOf("answerindex"),
        };

        for(const row of rows){
          const cols = row.split(",");
          const sub = (cols[idx.topic]||"General").trim();
          const q = {
            topic: sub,
            text: (cols[idx.text]||"").trim(),
            options: [cols[idx.opt1], cols[idx.opt2], cols[idx.opt3], cols[idx.opt4]].filter(Boolean),
            answerIndex: Number(cols[idx.answerIndex]||0)
          };
          if(!q.text || !q.options.length){ skipped++; continue; }
          const h = hashText(q.topic + "|" + q.text);
          bank[sub] = bank[sub] || [];
          const set = new Set(bank[sub].map(x=>x._h));
          if(set.has(h)){ skipped++; continue; }
          q._h = h;
          bank[sub].push(q);
          added++;
        }

      } else {
        // JSON
        let data;
        try { data = JSON.parse(text); } catch(e){ skipped++; continue; }
        const arr = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        for(const q of arr){
          const sub = (q.topic || "General").trim();
          if(!q.text || !Array.isArray(q.options) || typeof q.answerIndex !== "number"){ skipped++; continue; }
          const h = hashText(q.topic + "|" + q.text);
          bank[sub] = bank[sub] || [];
          const set = new Set(bank[sub].map(x=>x._h));
          if(set.has(h)){ skipped++; continue; }
          bank[sub].push({ topic: q.topic, text: q.text, options: q.options, answerIndex: q.answerIndex, _h: h });
          added++;
        }
      }
    }

    setBank(bank);
    renderBankStats();
    importLog.textContent = `Imported ${added} questions, skipped ${skipped} (duplicates/invalid).`;
    fileInput.value = "";
  });
}



// ===================== EXAM BUILDER (MCQ) =====================
function startExam(round, subjects){
  const u = getUser();
  const seed = seedFrom(`${u?.email || "guest"}-${Date.now()}`);
  const rng  = mulberry32(seed);

  const BANK = getBank();
  const hasBank = bankSize(BANK) > 0;

  let pool = [];
  let pickedSubjects = subjects && subjects.length ? subjects : [];

  if (round === 'technical') {
    if (!pickedSubjects.length) {
      pickedSubjects = DEFAULT_TECH_SUBJECTS.slice(0, 1);
    }
    const sub = pickedSubjects[0];

    const src = (hasBank && BANK[sub]?.length)
      ? BANK[sub]
      : (DATA.technical[sub] || []);

    const shuffled = shuffle(src, rng);
    pool = shuffled.slice(0, 20);

  } else {
    const sub = "Aptitude";
    const src = (hasBank && BANK[sub]?.length)
      ? BANK[sub]
      : ([]).concat(
          DATA.aptitude.quant || [],
          DATA.aptitude.reasoning || [],
          DATA.aptitude.verbal || []
        );

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
    pageDurationMin: 10
  };

  setCurrentExam(exam);
  window.location.href = "exam.html";
}
// ===================== BEHAVIORAL ANALYSIS ENGINE =====================
function analyzeBehavioralAnswer(transcript){
  const text = (transcript || "").trim();

  // Basic metrics
  const wc = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const avgLen = sentences.length ? Math.round(wc / sentences.length) : wc;

  // Filler words
  const fillers = ["um","uh","like","you know","basically","actually","so","well","kind of","sort of"];
  const fillerCount = fillers.reduce((n,f)=> n + (text.toLowerCase().match(new RegExp(`\\b${f}\\b`, "g"))||[]).length, 0);

  // Positivity / Negativity
  const posWords = ["achieved","improved","success","resolved","collaborated","delivered","impact","learned","optimized","led","exceeded"];
  const negWords = ["failed","problem","issue","difficult","blocked","delay","mistake","conflict","argued","complaint"];
  const pos = posWords.reduce((n,w)=> n + (text.toLowerCase().includes(w)?1:0), 0);
  const neg = negWords.reduce((n,w)=> n + (text.toLowerCase().includes(w)?1:0), 0);

  // Ownership
  const iCount = (text.match(/\bI\b/gi)||[]).length;
  const weCount = (text.match(/\bwe\b/gi)||[]).length;

  // Evidence
  const numbers = (text.match(/\b\d+(\.\d+)?%?\b/g)||[]).length;

  // STAR detection
  const S = /situation|context|background|problem/i.test(text);
  const T = /task|goal|responsib/i.test(text);
  const A = /i\s+(?:decided|took|led|designed|built|implemented|coordinated|spoke|organized|analy)/i.test(text);
  const R = /result|outcome|impact|improv|reduced|increased|grew|saved|delivered|shipped/i.test(text);

  // Scoring
  let structure = (S+T+A+R) * 2.5;
  let clarity   = Math.max(0, Math.min(10, 10 - Math.abs(avgLen-18)));
  let delivery  = Math.max(0, 10 - Math.min(10, fillerCount));
  let positivity= Math.max(0, Math.min(10, 5 + pos - neg));
  let ownership = Math.max(0, Math.min(10, 5 + iCount - Math.floor(weCount/2)));
  let evidence  = Math.min(10, numbers * 2);

  const total = Math.round((structure+clarity+delivery+positivity+ownership+evidence)/6);

  const tips = [];
  if(!S) tips.push("Add 1–2 lines of **Situation** at the start.");
  if(!T) tips.push("Clearly describe your **Task**.");
  if(!A) tips.push("Explain **Actions** YOU took (use “I”).");
  if(!R) tips.push("Add a measurable **Result**.");
  if(fillerCount>3) tips.push("Reduce filler words like “um/uh/like”.");
  if(avgLen>24) tips.push("Shorten sentences to improve clarity.");
  if(numbers<1) tips.push("Add numbers to show measurable impact.");
  if(weCount>iCount) tips.push("Use more **I** to show your contribution.");

  const improved = [
    "**Situation:** Brief background.",
    "**Task:** What was expected/required?",
    "**Action:** Steps you personally took.",
    "**Result:** Quantified outcome.",
    "**Reflection:** What you learned."
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
    improvedTemplate: improved,
  };
}



// ===================== BEHAVIORAL ROUND PAGE =====================
function initBehavioral(){
  const MAX_SEC = 120;
  const qTotal = BEHAVIORAL_QUESTIONS.length;

  let qIndex = 0;
  let recognition = null;
  let listening = false;
  let elapsed = 0;
  let timerId = null;

  // UI elements
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

  if(!elQNo || !elQTotal || !elQuestion || !elTranscript){
    console.error("Missing required behavioral elements.");
    return;
  }

  const answers = Array(qTotal).fill(null);

  function render(){
    elQNo.textContent = qIndex+1;
    elQTotal.textContent = qTotal;
    elQuestion.textContent = BEHAVIORAL_QUESTIONS[qIndex];
    elTranscript.value = answers[qIndex]?.transcript || "";
    btnPrev.disabled = qIndex===0;
    btnNext.disabled = !answers[qIndex];
    elTimer.textContent = "00:00";
  }

  // ---------------- TIMER ----------------
  function startTimer(){
    const start = Date.now() - (elapsed * 1000);
    if(timerId) clearInterval(timerId);

    timerId = setInterval(()=>{
      elapsed = Math.floor((Date.now() - start)/1000);
      const m = String(Math.floor(elapsed/60)).padStart(2,'0');
      const s = String(elapsed%60).padStart(2,'0');
      elTimer.textContent = `${m}:${s}`;

      if(elapsed >= MAX_SEC){
        stopRecording();
        evaluate();
      }
    }, 250);
  }

  function stopTimerNow(){
    if(timerId){
      clearInterval(timerId);
      timerId = null;
    }
  }

  // ---------------- SPEECH RECOGNITION ----------------
  function createRecognitionSimple() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("Speech Recognition not supported. Use Chrome or Edge.");
    return null;
  }

  const rec = new SR();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;

  let finalTranscript = "";

  rec.onresult = (event) => {
    let interim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    // Update ONLY interim visually, without damaging final text
    elTranscript.value = finalTranscript + " " + interim;
  };

  rec.onstart = () => {
    listening = true;
    btnStart.classList.add("listening");
    btnPause.disabled = false;
    btnStop.disabled = false;

    if (!timerId) startTimer();
  };

  rec.onend = () => {
    listening = false;
    btnStart.classList.remove("listening");
  };

  rec.onerror = (e) => {
    console.error("Speech recognition error:", e);
  };

  return rec;
}

  function startRecording(){
    if(listening) return;

    navigator.mediaDevices.getUserMedia({audio:true})
      .then(stream=>{
        stream.getTracks().forEach(t=>t.stop()); // just permission check
        recognition = createRecognitionSimple();
        if(recognition){
          try { recognition.start(); }
          catch(e){ console.error(e); }
        }
      })
      .catch(()=>{
        alert("Microphone access denied. Enable permissions and retry.");
      });
  }

  function pauseRecording(){
    if(!recognition) return;
    try { recognition.stop(); } catch(e){}
    listening = false;
    btnPause.disabled = true;
    btnStop.disabled = false;
    stopTimerNow();
  }

  function stopRecording(){
    if(!recognition) return;

    try { recognition.stop(); } catch(e){}
    listening = false;

    // save transcript
    if(elTranscript.value.trim()){
      answers[qIndex] = {
        ...(answers[qIndex] || {}),
        transcript: elTranscript.value.trim()
      };
    }

    btnStart.classList.remove("listening");
    btnPause.disabled = true;
    btnStop.disabled = true;
    btnNext.disabled = false;

    stopTimerNow();

    recognition = null;
  }

  // ---------------- EVALUATION ----------------
  function computeBehavioralOverall(items){
    const valid = items.filter(Boolean);
    if(!valid.length) return null;

    const avg = k => 
      Math.round(valid.reduce((s,x)=>s+x.analysis.scores[k],0)/valid.length);

    return {
      structure: avg('structure'),
      clarity: avg('clarity'),
      delivery: avg('delivery'),
      positivity: avg('positivity'),
      ownership: avg('ownership'),
      evidence: avg('evidence'),
      total: avg('total'),
      avgDurationSec: Math.round(valid.reduce((s,x)=>s+x.durationSec,0)/valid.length),
      totalWords: valid.reduce((s,x)=>s+x.analysis.wordCount,0),
    };
  }

  function evaluate(){
    const transcript = elTranscript.value.trim();
    if(!transcript){
      alert("Please provide an answer before evaluating.");
      return;
    }

    const analysis = analyzeBehavioralAnswer(transcript);

    answers[qIndex] = {
      transcript,
      analysis,
      question: BEHAVIORAL_QUESTIONS[qIndex],
      durationSec: elapsed
    };

    btnNext.disabled = false;

    // last question → go to result page
    if(qIndex === qTotal - 1){
      const res = {
        type: 'behavioral',
        userId: getUser()?.id,
        round: 'behavioral',
        total: qTotal,
        finishedAt: Date.now(),
        items: answers,
        overall: computeBehavioralOverall(answers),
      };

      setLastResult(res);
      window.location.href = "result.html";
    } else {
      alert("Saved & analyzed! You can move to the next question.");
    }
  }

  // ---------------- BUTTONS ----------------
  btnStart.addEventListener('click', startRecording);
  btnPause.addEventListener('click', pauseRecording);
  btnStop.addEventListener('click', ()=>{ stopRecording(); evaluate(); });

  btnPrev.addEventListener('click', ()=>{
    stopRecording();
    if(elTranscript.value.trim()){
      answers[qIndex] = answers[qIndex] || {};
      answers[qIndex].transcript = elTranscript.value.trim();
    }
    qIndex = Math.max(0, qIndex-1);
    elapsed = 0;
    elTimer.textContent = "00:00";
    render();
  });

  btnNext.addEventListener('click', ()=>{
    stopRecording();
    qIndex = Math.min(qTotal-1, qIndex+1);
    elapsed = 0;
    elTimer.textContent = "00:00";
    render();
  });

  render();
}