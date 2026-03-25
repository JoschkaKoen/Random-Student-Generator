(function () {
  "use strict";

  const STUDENTS = [
    "Luca",
    "Ruby",
    "Calvin",
    "Nancy",
    "Ella",
    "Cindy",
    "Zack",
    "Jack",
    "Simon",
    "Yasmine",
    "Mable",
    "Evian",
    "Ashley",
    "Evelyn",
    "Elsie",
    "Zane",
    "Sherry",
    "Elisa",
    "Domee",
    "Saluna",
    "Silence",
    "Yuze",
    "Eva",
    "Kaka",
    "Sonny",
    "Teddy",
    "Harper",
    "Linus",
    "Ian",
  ];

  const SLOTS = [
    { label: "03/30 Mo 9:25–10:55", count: 3 },
    { label: "03/30 Mo 13:25–16:40", count: 6 },
    { label: "03/31 Tu 8:35–10:05", count: 3 },
    { label: "04/01 We 10:15–11:45", count: 3 },
    { label: "04/01 We 13:25–15:50", count: 5 },
    { label: "04/02 Th 13:25–16:40", count: 6 },
    { label: "04/03 Fr 12:35–14:05", count: 3 },
  ];

  const SLOT_COUNTS = SLOTS.map((s) => s.count);
  const TOTAL_SEATS = SLOT_COUNTS.reduce((a, b) => a + b, 0);

  /**
   * Stable hues across a blue range (lighter azure → deeper blue).
   * Each student gets a distinct shade while staying in the same family.
   */
  const STUDENT_HUE = new Map();
  (function initStudentHues() {
    const n = STUDENTS.length;
    const hMin = 199;
    const hMax = 234;
    STUDENTS.forEach((name, i) => {
      const h = n <= 1 ? 218 : hMin + (i / (n - 1)) * (hMax - hMin);
      STUDENT_HUE.set(name, h);
    });
  })();

  function colorForStudent(name) {
    const h = STUDENT_HUE.has(name) ? STUDENT_HUE.get(name) : 218;
    return {
      bg: `hsla(${h}, 48%, 56%, 0.14)`,
      border: `hsla(${h}, 55%, 58%, 0.38)`,
      fg: `hsl(${h}, 28%, 91%)`,
    };
  }

  function applyStudentNameStyle(el, name) {
    const c = colorForStudent(name);
    el.style.background = c.bg;
    el.style.color = c.fg;
    el.style.borderLeft = `3px solid ${c.border}`;
  }

  function clearStudentNameStyle(el) {
    el.removeAttribute("style");
  }

  /** Delay between slot starts (left-to-right cascade). */
  const STAGGER_MS = 560;
  /** Offset between names within the same slot. */
  const NAME_JITTER_MS = 220;
  /** Spinner: first tick delay; grows each tick until lock. */
  const BASE_INTERVAL_MS = 82;
  /** Slower growth = more ticks and a longer draw before names lock. */
  const INTERVAL_GROWTH = 1.056;
  const INTERVAL_MAX = 420;
  const LOCK_WHEN_INTERVAL_GTE = 400;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function assertCounts() {
    if (STUDENTS.length !== TOTAL_SEATS) {
      throw new Error(
        `Student count (${STUDENTS.length}) must equal total seats (${TOTAL_SEATS}).`
      );
    }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function partitionAssignments(shuffled) {
    let cursor = 0;
    return SLOT_COUNTS.map((n) => {
      const group = shuffled.slice(cursor, cursor + n);
      cursor += n;
      return group;
    });
  }

  function randomStudent() {
    return STUDENTS[Math.floor(Math.random() * STUDENTS.length)];
  }

  function renderSlotsGrid(container) {
    container.innerHTML = "";
    SLOTS.forEach((slot, index) => {
      const card = document.createElement("article");
      card.className = "slot-card";
      card.dataset.slotIndex = String(index);

      const head = document.createElement("div");
      head.className = "slot-card__head";
      const left = document.createElement("div");
      const num = document.createElement("p");
      num.className = "slot-card__num";
      num.textContent = `Slot ${index + 1}`;
      const time = document.createElement("p");
      time.className = "slot-card__time";
      time.textContent = slot.label;
      const meta = document.createElement("p");
      meta.className = "slot-card__meta";
      meta.textContent = `${slot.count} Candidates`;
      left.append(num, time, meta);

      head.appendChild(left);
      card.appendChild(head);

      const namesWrap = document.createElement("div");
      namesWrap.className = "slot-card__names";
      for (let i = 0; i < slot.count; i++) {
        const el = document.createElement("div");
        el.className = "name-placeholder name-placeholder--empty";
        el.textContent = "—";
        el.dataset.nameIndex = String(i);
        namesWrap.appendChild(el);
      }
      card.appendChild(namesWrap);
      container.appendChild(card);
    });
  }

  function startSpinner(el, finalName, onComplete) {
    let interval = BASE_INTERVAL_MS;

    function tick() {
      const pick = randomStudent();
      el.textContent = pick;
      el.classList.remove("name-placeholder--empty");
      applyStudentNameStyle(el, pick);
      interval = Math.min(interval * INTERVAL_GROWTH, INTERVAL_MAX);
      if (interval >= LOCK_WHEN_INTERVAL_GTE) {
        el.textContent = finalName;
        el.classList.add("locked");
        el.classList.remove("name-placeholder--empty");
        applyStudentNameStyle(el, finalName);
        if (onComplete) onComplete();
        return;
      }
      setTimeout(tick, interval);
    }

    tick();
  }

  function runSpinnersForSlot(slotIndex, names, onSpinnerDone) {
    const grid = document.getElementById("slot-grid");
    const card = grid.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (!card) return;
    const placeholders = card.querySelectorAll(".name-placeholder");

    names.forEach((name, i) => {
      const delay = slotIndex * STAGGER_MS + i * NAME_JITTER_MS;
      const el = placeholders[i];
      setTimeout(() => {
        startSpinner(el, name, onSpinnerDone);
      }, delay);
    });
  }

  function lockCardVisual(slotIndex) {
    const grid = document.getElementById("slot-grid");
    const card = grid.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (!card) return;
    card.classList.remove("slot-card--locked");
    void card.offsetWidth;
    card.classList.add("slot-card--locked");
  }

  function buildPdf(assignments) {
    const jspdf = window.jspdf;
    if (!jspdf || !jspdf.jsPDF) {
      throw new Error("jsPDF not loaded");
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = margin;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Speaking Test Assignments", margin, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${dateStr} ${timeStr}`, margin, 24);

    y = 38;
    doc.setTextColor(30, 30, 40);

    assignments.forEach((names, i) => {
      const slot = SLOTS[i];
      const blockH = 8 + names.length * 6.5;

      if (y + blockH > 280) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(124, 58, 237);
      doc.rect(margin, y, pageW - 2 * margin, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`Slot ${i + 1} — ${slot.label}`, margin + 2, y + 5.5);
      doc.text(`${slot.count} Candidates`, pageW - margin - 2, y + 5.5, { align: "right" });

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 50);

      names.forEach((name, j) => {
        doc.text(`${j + 1}. ${name}`, margin + 4, y + 4);
        y += 6.5;
      });

      y += 6;
    });

    const pageH = doc.internal.pageSize.getHeight();
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text(
      "Randomly generated — run again for a new draw.",
      margin,
      pageH - 10
    );

    return doc;
  }

  function downloadPdf(assignments) {
    const doc = buildPdf(assignments);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fname = `speaking-test-assignments-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.pdf`;
    doc.save(fname);
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  let state = {
    assignments: null,
    running: false,
    completedSpinners: 0,
  };

  function resetUiForRun() {
    document.getElementById("successBanner").classList.add("hidden");
    document.getElementById("fallbackPdfBtn").classList.add("hidden");
    document.getElementById("shuffleAgainBtn").classList.add("hidden");
    state.completedSpinners = 0;
    state.assignments = null;

    const grid = document.getElementById("slot-grid");
    grid.querySelectorAll(".name-placeholder").forEach((el) => {
      el.textContent = "—";
      el.className = "name-placeholder name-placeholder--empty";
      el.classList.remove("locked");
      clearStudentNameStyle(el);
    });
    grid.querySelectorAll(".slot-card").forEach((c) => {
      c.classList.remove("slot-card--locked");
    });
  }

  function runDraw() {
    assertCounts();
    const startBtn = document.getElementById("startBtn");
    if (state.running) return;
    state.running = true;
    startBtn.disabled = true;
    startBtn.classList.add("btn--running");
    resetUiForRun();

    const shuffled = shuffle(STUDENTS);
    const assignments = partitionAssignments(shuffled);
    state.assignments = assignments;

    const totalSpinners = TOTAL_SEATS;
    let drawFinished = false;

    function finishAll() {
      if (drawFinished) return;
      drawFinished = true;
      state.running = false;
      startBtn.disabled = false;
      startBtn.classList.remove("btn--running");
      SLOTS.forEach((_, i) => lockCardVisual(i));
      document.getElementById("successBanner").classList.remove("hidden");
      document.getElementById("shuffleAgainBtn").classList.remove("hidden");

      try {
        downloadPdf(state.assignments);
        showToast("PDF downloading…");
      } catch (e) {
        console.error(e);
        document.getElementById("fallbackPdfBtn").classList.remove("hidden");
        showToast("Use the button below to download the PDF.");
      }
    }

    if (prefersReducedMotion()) {
      assignments.forEach((names, slotIndex) => {
        const grid = document.getElementById("slot-grid");
        const card = grid.querySelector(`[data-slot-index="${slotIndex}"]`);
        const placeholders = card.querySelectorAll(".name-placeholder");
        names.forEach((name, i) => {
          placeholders[i].textContent = name;
          placeholders[i].classList.add("locked");
          placeholders[i].classList.remove("name-placeholder--empty");
          applyStudentNameStyle(placeholders[i], name);
        });
        lockCardVisual(slotIndex);
      });
      state.completedSpinners = totalSpinners;
      finishAll();
      return;
    }

    assignments.forEach((names, slotIndex) => {
      let doneInSlot = 0;
      runSpinnersForSlot(slotIndex, names, () => {
        doneInSlot += 1;
        if (doneInSlot === names.length) {
          lockCardVisual(slotIndex);
        }
        state.completedSpinners += 1;
        if (state.completedSpinners >= totalSpinners) {
          finishAll();
        }
      });
    });
  }

  function init() {
    assertCounts();
    const grid = document.getElementById("slot-grid");
    renderSlotsGrid(grid);

    document.getElementById("startBtn").addEventListener("click", runDraw);

    document.getElementById("shuffleAgainBtn").addEventListener("click", () => {
      runDraw();
    });

    document.getElementById("fallbackPdfBtn").addEventListener("click", () => {
      if (state.assignments) {
        try {
          downloadPdf(state.assignments);
          showToast("PDF downloading…");
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
