(() => {
  const TILE_STATES = ["absent", "present", "correct"];
  const STATE_EMOJI = {
    correct: "🟩",
    present: "🟨",
    absent: "⬛",
  };
  const CATEGORY_LABELS = {
    optimal: "Top Optimal",
    "vowel-heavy": "Vowel-Heavy",
    rare: "Uncommon Letters",
    standard: "Valid Guess",
  };
  const THEME_KEY = "wordleStarter.theme";
  const MAX_HISTORY = 6;
  const DICT_PAGE_SIZE = 200;

  // DOM Elements
  const tiles = Array.from(document.querySelectorAll("#wordle-row .tile"));
  const resultMeta = document.getElementById("result-meta");
  const randomBtn = document.getElementById("random-btn");
  const rerollColorsBtn = document.getElementById("reroll-colors-btn");
  const copyBtn = document.getElementById("copy-btn");
  const filterPills = Array.from(document.querySelectorAll(".filter-pill"));

  const historySection = document.getElementById("history-section");
  const historyBoard = document.getElementById("history-board");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  const openDictBtn = document.getElementById("open-dict-btn");
  const closeDictBtn = document.getElementById("close-dict-btn");
  const dictModal = document.getElementById("dict-modal");
  const dictCountBadge = document.getElementById("dict-count-badge");
  const dictModalSubtitle = document.getElementById("dict-modal-subtitle");
  const dictSearchInput = document.getElementById("dict-search-input");
  const dictMatchStatus = document.getElementById("dict-match-status");
  const dictWordGrid = document.getElementById("dict-word-grid");

  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIconMoon = document.getElementById("theme-icon-moon");
  const themeIconSun = document.getElementById("theme-icon-sun");
  const toastEl = document.getElementById("toast");

  // Application State
  const dictionary = Array.isArray(WORDLE_STARTERS) ? WORDLE_STARTERS : [];
  let activeCategory = "all";
  let currentRoll = null; // { word, category, states }
  let history = [];
  let activeTimers = [];
  let toastTimer = null;

  // Modal Pagination State
  let dictFilteredList = [];
  let dictRenderedCount = 0;

  function getFilteredPool() {
    if (activeCategory === "all") return dictionary;
    if (activeCategory === "optimal") return dictionary.filter((e) => e.isOptimal);
    if (activeCategory === "vowel-heavy") return dictionary.filter((e) => e.isVowelHeavy);
    if (activeCategory === "rare") return dictionary.filter((e) => e.hasRare);
    return dictionary;
  }

  function pickRandomEntry() {
    const pool = getFilteredPool();
    if (pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    let candidate;
    let attempts = 0;
    do {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      attempts += 1;
    } while (currentRoll && candidate.word === currentRoll.word && attempts < 10);

    return candidate;
  }

  function generateRandomStates() {
    return Array.from({ length: 5 }, () => {
      const idx = Math.floor(Math.random() * TILE_STATES.length);
      return TILE_STATES[idx];
    });
  }

  function clearPendingAnimations() {
    for (const id of activeTimers) {
      clearTimeout(id);
    }
    activeTimers = [];
    for (const tile of tiles) {
      tile.classList.remove("flip-out", "flip-in", "pop");
    }
  }

  function renderRoll(entry, states, { pushHistory = true } = {}) {
    clearPendingAnimations();

    if (pushHistory && currentRoll) {
      history.unshift(currentRoll);
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }
      renderHistory();
    }

    currentRoll = {
      word: entry.word,
      category: entry.category,
      states,
    };

    rerollColorsBtn.disabled = false;
    copyBtn.disabled = false;

    // Show letters immediately, then flip each tile sequentially to reveal color
    tiles.forEach((tile, i) => {
      tile.textContent = entry.word[i];
      tile.className = "tile filled pop";
      tile.setAttribute("aria-label", `${entry.word[i]}, ${stateLabel(states[i])}`);

      const startDelay = 70 + i * 110;

      const t1 = setTimeout(() => {
        tile.classList.remove("pop");
        tile.classList.add("flip-out");
      }, startDelay);

      const t2 = setTimeout(() => {
        tile.classList.remove("flip-out", "filled");
        tile.classList.add(states[i], "flip-in");
      }, startDelay + 220);

      const t3 = setTimeout(() => {
        tile.classList.remove("flip-in");
      }, startDelay + 440);

      activeTimers.push(t1, t2, t3);
    });

    renderResultMeta(entry.category, states);
  }

  function stateLabel(state) {
    if (state === "correct") return "green (correct)";
    if (state === "present") return "yellow (present)";
    return "grey (absent)";
  }

  function renderResultMeta(category, states) {
    const counts = { correct: 0, present: 0, absent: 0 };
    for (const s of states) counts[s] += 1;

    const categoryLabel = CATEGORY_LABELS[category] || "Valid Guess";
    resultMeta.innerHTML = `
      <span class="category-tag">${categoryLabel}</span>
      <span class="breakdown-pill"><span class="dot dot-correct"></span>${counts.correct} Green</span>
      <span class="breakdown-pill"><span class="dot dot-present"></span>${counts.present} Yellow</span>
      <span class="breakdown-pill"><span class="dot dot-absent"></span>${counts.absent} Grey</span>
    `;
  }

  function renderHistory() {
    if (history.length === 0) {
      historySection.classList.add("hidden");
      historyBoard.innerHTML = "";
      return;
    }

    historySection.classList.remove("hidden");
    historyBoard.innerHTML = "";

    history.forEach((item) => {
      const rowEl = document.createElement("div");
      rowEl.className = "history-row";
      rowEl.title = `Click to re-load ${item.word}`;

      item.word.split("").forEach((letter, idx) => {
        const cell = document.createElement("div");
        cell.className = `mini-tile ${item.states[idx]}`;
        cell.textContent = letter;
        rowEl.appendChild(cell);
      });

      rowEl.addEventListener("click", () => {
        renderRoll(
          { word: item.word, category: item.category },
          [...item.states],
          { pushHistory: false }
        );
      });

      historyBoard.appendChild(rowEl);
    });
  }

  function handleRandomSelection() {
    const entry = pickRandomEntry();
    if (!entry) {
      showToast("No words available in this category");
      return;
    }
    const states = generateRandomStates();
    renderRoll(entry, states, { pushHistory: true });
  }

  function handleRerollColors() {
    if (!currentRoll) return;
    const states = generateRandomStates();
    renderRoll(
      { word: currentRoll.word, category: currentRoll.category },
      states,
      { pushHistory: true }
    );
  }

  async function handleCopyGrid() {
    if (!currentRoll) return;
    const emojis = currentRoll.states.map((s) => STATE_EMOJI[s]).join("");
    const text = `Wordle Starter: ${currentRoll.word}\n${emojis}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!");
    } catch {
      showToast(`${currentRoll.word} ${emojis}`);
    }
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 2000);
  }

  // Dictionary Modal (Paginated for 14,855+ words)
  function updateDictionaryCount() {
    const formatted = dictionary.length.toLocaleString();
    dictCountBadge.textContent = formatted;
    dictModalSubtitle.textContent = `${formatted} valid Wordle guesses — click any word to roll it`;
  }

  function appendDictionaryBatch() {
    const existingLoadBtn = dictWordGrid.querySelector(".dict-load-more-btn");
    if (existingLoadBtn) existingLoadBtn.remove();

    const nextEnd = Math.min(dictRenderedCount + DICT_PAGE_SIZE, dictFilteredList.length);
    const fragment = document.createDocumentFragment();

    for (let i = dictRenderedCount; i < nextEnd; i++) {
      const entry = dictFilteredList[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dict-word-chip";
      btn.textContent = entry.word;
      btn.title = `${CATEGORY_LABELS[entry.category] || "Valid Guess"} — click to use`;
      btn.addEventListener("click", () => {
        closeDictModal();
        renderRoll(entry, generateRandomStates(), { pushHistory: true });
      });
      fragment.appendChild(btn);
    }

    dictRenderedCount = nextEnd;

    if (dictRenderedCount < dictFilteredList.length) {
      const remaining = dictFilteredList.length - dictRenderedCount;
      const loadMoreBtn = document.createElement("button");
      loadMoreBtn.type = "button";
      loadMoreBtn.className = "dict-load-more-btn";
      loadMoreBtn.textContent = `Load more (${remaining.toLocaleString()} remaining)`;
      loadMoreBtn.addEventListener("click", appendDictionaryBatch);
      fragment.appendChild(loadMoreBtn);
    }

    dictWordGrid.appendChild(fragment);
    dictMatchStatus.textContent = `Showing ${dictRenderedCount.toLocaleString()} of ${dictFilteredList.length.toLocaleString()} matching valid guesses`;
  }

  function renderDictionaryGrid(query = "") {
    const q = query.trim().toUpperCase();
    dictFilteredList = q
      ? dictionary.filter((entry) => entry.word.includes(q))
      : dictionary;
    dictRenderedCount = 0;
    dictWordGrid.innerHTML = "";
    dictWordGrid.scrollTop = 0;

    if (dictFilteredList.length === 0) {
      dictMatchStatus.textContent = "0 matching valid guesses";
      const empty = document.createElement("div");
      empty.className = "dict-empty";
      empty.textContent = "No matching valid Wordle guesses found.";
      dictWordGrid.appendChild(empty);
      return;
    }

    appendDictionaryBatch();
  }

  function openDictModal() {
    updateDictionaryCount();
    dictSearchInput.value = "";
    renderDictionaryGrid("");
    dictModal.classList.remove("hidden");
    dictSearchInput.focus();
  }

  function closeDictModal() {
    dictModal.classList.add("hidden");
  }

  // Theme Handling
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    themeIconMoon.classList.toggle("hidden", isDark);
    themeIconSun.classList.toggle("hidden", !isDark);
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      // Ignore storage errors
    }
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }

  // Event Listeners
  randomBtn.addEventListener("click", handleRandomSelection);
  rerollColorsBtn.addEventListener("click", handleRerollColors);
  copyBtn.addEventListener("click", handleCopyGrid);

  clearHistoryBtn.addEventListener("click", () => {
    history = [];
    renderHistory();
  });

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      activeCategory = pill.dataset.category || "all";
      filterPills.forEach((p) => p.classList.toggle("active", p === pill));
    });
  });

  openDictBtn.addEventListener("click", openDictModal);
  closeDictBtn.addEventListener("click", closeDictModal);
  dictModal.addEventListener("click", (e) => {
    if (e.target === dictModal) closeDictModal();
  });
  dictSearchInput.addEventListener("input", (e) => {
    renderDictionaryGrid(e.target.value);
  });

  themeToggleBtn.addEventListener("click", toggleTheme);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dictModal.classList.contains("hidden")) {
      closeDictModal();
      return;
    }

    if (!dictModal.classList.contains("hidden")) return;

    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.code === "Space") {
      e.preventDefault();
      handleRandomSelection();
    }
  });

  // Init
  initTheme();
  updateDictionaryCount();
})();
