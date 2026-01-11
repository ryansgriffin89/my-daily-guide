
const STORAGE_KEYS = {
  GUIDE: "mdg_guide_json_override_v1",
  CONTEXT_BY_DATE: "mdg_day_context_by_date_v1",
  COMPLETIONS: "mdg_completions_v1",
  NOTES: "mdg_notes_v1",
  ANCHOR_LAST_SHOWN: "mdg_anchor_last_shown_v1",
  REMINDERS: "mdg_reminders_v1",
  SKIPS_BY_DATE: "mdg_skips_by_date_v1"
};

let guide = null;
let activeTab = "today";
let searchTerm = "";
let swReg = null;
let scheduledTimeouts = [];

const el = (id) => document.getElementById(id);

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

function weekdayIndex(dateObj = new Date()) {
  const js = dateObj.getDay(); // 0 Sun..6 Sat
  return js === 0 ? 7 : js;    // 1 Mon..7 Sun
}

function currentTimeHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function hhmmToMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isBetweenTime(now, start, end) {
  const n = hhmmToMin(now);
  const s = hhmmToMin(start);
  const e = hhmmToMin(end);
  if (s <= e) return n >= s && n <= e; // normal
  return (n >= s) || (n <= e);         // overnight
}

function getCurrentTimeBlock(settings) {
  const now = currentTimeHHMM();
  const blocks = settings.timeBlocks || {};
  for (const [block, range] of Object.entries(blocks)) {
    if (isBetweenTime(now, range.start, range.end)) return block;
  }
  return "any";
}

function resolveDayMode(ctx) {
  if (ctx.dayMode) return ctx.dayMode;
  if (ctx.painState === "red") return "recovery";
  if (ctx.painState === "yellow") return "modified";
  return "normal";
}

function getCompletions() {
  return loadJSON(STORAGE_KEYS.COMPLETIONS, {});
}
function setCompletions(obj) {
  saveJSON(STORAGE_KEYS.COMPLETIONS, obj);
}
function getNotes() {
  return loadJSON(STORAGE_KEYS.NOTES, {});
}
function setNotes(obj) {
  saveJSON(STORAGE_KEYS.NOTES, obj);
}

function isDone(taskId, dateStr) {
  const comps = getCompletions();
  return Boolean(comps?.[dateStr]?.[taskId]?.status === "done");
}

function setDone(taskId, dateStr, done) {
  const comps = getCompletions();
  comps[dateStr] = comps[dateStr] || {};
  comps[dateStr][taskId] = comps[dateStr][taskId] || {};
  comps[dateStr][taskId].status = done ? "done" : "not_done";
  comps[dateStr][taskId].completedAt = done ? new Date().toISOString() : null;
  setCompletions(comps);
}

function getSkipsByDate() {
  return loadJSON(STORAGE_KEYS.SKIPS_BY_DATE, {});
}
function setSkipsByDate(obj) {
  saveJSON(STORAGE_KEYS.SKIPS_BY_DATE, obj);
}
function isBlockSkipped(dateStr, blockName) {
  const s = getSkipsByDate();
  return Boolean(s?.[dateStr]?.[blockName] === true);
}
function setBlockSkipped(dateStr, blockName, skipped) {
  const s = getSkipsByDate();
  s[dateStr] = s[dateStr] || {};
  s[dateStr][blockName] = skipped;
  setSkipsByDate(s);
}

function buildDayContext(dateStr) {
  const contexts = loadJSON(STORAGE_KEYS.CONTEXT_BY_DATE, {});
  const existing = contexts[dateStr];
  if (existing) return existing;

  // Keep your original prompts minimal
  const pain = (prompt("Pain state today? (green / yellow / red)", "green") || "green").toLowerCase().trim();
  const env = (prompt("Environment today? (home / gym / noEquipment / travel)", "home") || "home").toLowerCase().trim();

  const ctx = {
    date: dateStr,
    painState: ["green","yellow","red"].includes(pain) ? pain : "green",
    environment: ["home","gym","noequipment","noEquipment","travel"].includes(env) ? (env === "noequipment" ? "noEquipment" : env) : "home",
    weekday: weekdayIndex(new Date()),
    dayMode: null
  };

  ctx.dayMode = resolveDayMode(ctx);

  contexts[dateStr] = ctx;
  saveJSON(STORAGE_KEYS.CONTEXT_BY_DATE, contexts);
  return ctx;
}

function resetDay(dateStr) {
  const contexts = loadJSON(STORAGE_KEYS.CONTEXT_BY_DATE, {});
  delete contexts[dateStr];
  saveJSON(STORAGE_KEYS.CONTEXT_BY_DATE, contexts);

  const comps = getCompletions();
  delete comps[dateStr];
  setCompletions(comps);

  const skips = getSkipsByDate();
  delete skips[dateStr];
  setSkipsByDate(skips);
}

function computeStreakAnyDone() {
  const comps = getCompletions();
  let streak = 0;
  let cursor = new Date();
  for (;;) {
    const iso = cursor.toISOString().slice(0,10);
    const day = comps[iso];
    if (!day) break;

    const anyDone = Object.values(day).some(v => v?.status === "done");
    if (!anyDone) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderTabs() {
  const tabsEl = el("tabs");
  tabsEl.innerHTML = "";
  for (const t of guide.tabs) {
    const b = document.createElement("button");
    b.className = "tab" + (t.id === activeTab ? " active" : "");
    b.textContent = t.label;
    b.onclick = () => {
      activeTab = t.id;
      render();
    };
    tabsEl.appendChild(b);
  }
}

function getReminderSettings() {
  const defaults = guide?.settings?.reminders || {
    enabled: true,
    times: { morning: "08:00", midday: "12:00", evening: "18:00", bed: "21:30" },
    offToday: false
  };
  const saved = loadJSON(STORAGE_KEYS.REMINDERS, null);
  return saved ? { ...defaults, ...saved, times: { ...defaults.times, ...(saved.times || {}) } } : { ...defaults, offToday: false };
}
function saveReminderSettings(settings) {
  saveJSON(STORAGE_KEYS.REMINDERS, settings);
}

function clearScheduledReminders() {
  for (const t of scheduledTimeouts) clearTimeout(t);
  scheduledTimeouts = [];
}

function minutesUntilTime(todayDate, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date(todayDate);
  target.setHours(h, m, 0, 0);
  const now = new Date();
  return Math.floor((target - now) / 60000);
}

function tasksForBlock(dateStr, blockName) {
  const tasks = guide.tasks || [];
  return tasks
    .filter(t => t.timeBlock === blockName)
    .filter(t => !isBlockSkipped(dateStr, blockName));
}

async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

async function showReminderNotification(title, body) {
  // Prefer SW showNotification if available
  if (swReg && swReg.showNotification) {
    await swReg.showNotification(title, {
      body,
      tag: "mdg-reminder",
      renotify: false
    });
    return;
  }
  // Fallback
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function scheduleDailyReminders(dateStr) {
  clearScheduledReminders();

  const settings = getReminderSettings();
  if (!settings.enabled) return;
  if (settings.offToday) return;

  const today = new Date();
  const blocks = ["morning","midday","evening","bed"];

  for (const block of blocks) {
    if (isBlockSkipped(dateStr, block)) continue;

    const hhmm = settings.times?.[block];
    if (!hhmm) continue;

    const mins = minutesUntilTime(today, hhmm);
    if (mins <= 0) continue; // already passed

    const ms = mins * 60 * 1000;

    const timeoutId = setTimeout(async () => {
      const count = tasksForBlock(dateStr, block).length;
      if (count <= 0) return;
      const blockTitle = block.toUpperCase();
      const title = `My Daily Guide • ${blockTitle}`;
      const body = `${count} item(s) queued. Open the app to check them off or skip this block today.`;
      await showReminderNotification(title, body);
    }, ms);

    scheduledTimeouts.push(timeoutId);
  }
}

function taskCard(task, dateStr) {
  const done = isDone(task.id, dateStr);

  const wrap = document.createElement("div");
  wrap.className = "item";

  const top = document.createElement("div");
  top.className = "item-top";

  const chk = document.createElement("div");
  chk.className = "chk" + (done ? " done" : "");
  chk.textContent = done ? "✓" : "";
  chk.onclick = () => {
    setDone(task.id, dateStr, !done);
    render();
  };

  const content = document.createElement("div");
  const title = document.createElement("p");
  title.className = "item-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "item-meta";
  meta.textContent = `${task.timeBlock.toUpperCase()} • ~${task.durationMin}m • ${task.priority.toUpperCase()}`;

  content.appendChild(title);
  content.appendChild(meta);

  const details = document.createElement("div");
  details.className = "details";
  details.innerHTML =
    `<b>Why:</b> ${escapeHTML(task.why || "")}<br/>` +
    `<b>How:</b> ${escapeHTML(task.how || "")}`;

  content.appendChild(details);

  if (task.tags && task.tags.length) {
    const tags = document.createElement("div");
    tags.className = "tags";
    for (const tg of task.tags.slice(0, 8)) {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tg;
      tags.appendChild(span);
    }
    content.appendChild(tags);
  }

  const notes = getNotes();
  const curNote = notes[task.id] || "";
  const noteWrap = document.createElement("div");
  noteWrap.className = "note";
  const input = document.createElement("input");
  input.placeholder = "Add a note…";
  input.value = curNote;
  input.onchange = () => {
    const n = getNotes();
    n[task.id] = input.value;
    setNotes(n);
  };
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn ghost";
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => {
    const n = getNotes();
    n[task.id] = input.value;
    setNotes(n);
  };
  noteWrap.appendChild(input);
  noteWrap.appendChild(saveBtn);

  content.appendChild(noteWrap);

  top.appendChild(chk);
  top.appendChild(content);
  wrap.appendChild(top);

  return wrap;
}

function groupByTimeBlock(tasks) {
  const blocks = { morning: [], midday: [], evening: [], bed: [], any: [] };
  for (const t of tasks) (blocks[t.timeBlock] || blocks.any).push(t);
  return blocks;
}

function filterTasksForToday(dateStr) {
  const tasks = (guide.tasks || []).slice();

  // Hide blocks skipped today
  const blocks = ["morning","midday","evening","bed"];
  const skipped = new Set(blocks.filter(b => isBlockSkipped(dateStr, b)));

  return tasks.filter(t => !skipped.has(t.timeBlock));
}

function renderToday(ctx, dateStr) {
  const view = el("view");
  view.innerHTML = "";

  const currentBlock = getCurrentTimeBlock(guide.settings || {});
  const allTasks = filterTasksForToday(dateStr);

  const filtered = searchTerm.trim()
    ? allTasks.filter(t => {
        const s = (t.title + " " + (t.why||"") + " " + (t.how||"") + " " + (t.tags||[]).join(" ")).toLowerCase();
        return s.includes(searchTerm.toLowerCase());
      })
    : allTasks;

  const grouped = groupByTimeBlock(filtered);

  // Skip controls quick row
  const skipBlock = document.createElement("div");
  skipBlock.className = "block";
  skipBlock.innerHTML = `<h4>Today controls</h4>
    <div class="details">Skip a time block if you’re not doing it today (it hides tasks + disables reminders for that block).</div>`;
  const wrap = document.createElement("div");
  wrap.className = "row-wrap";

  for (const b of ["morning","midday","evening","bed"]) {
    const btn = document.createElement("button");
    btn.className = "btn small ghost";
    const skipped = isBlockSkipped(dateStr, b);
    btn.textContent = skipped ? `Enable ${b}` : `Skip ${b} today`;
    btn.onclick = () => {
      setBlockSkipped(dateStr, b, !skipped);
      scheduleDailyReminders(dateStr);
      render();
    };
    wrap.appendChild(btn);
  }
  skipBlock.appendChild(wrap);
  view.appendChild(skipBlock);

  const hr0 = document.createElement("div");
  hr0.className = "hr";
  view.appendChild(hr0);

  // Right Now
  const rnTitle = document.createElement("div");
  rnTitle.className = "section-title";
  rnTitle.textContent = "Right Now";
  view.appendChild(rnTitle);

  const rnSub = document.createElement("div");
  rnSub.className = "section-sub";
  rnSub.textContent = `Current block: ${currentBlock.toUpperCase()} • Pain: ${ctx.painState.toUpperCase()} • Mode: ${ctx.dayMode.toUpperCase()} • Env: ${ctx.environment}`;
  view.appendChild(rnSub);

  const rnList = document.createElement("div");
  rnList.className = "list";
  const rightNow = (grouped[currentBlock] || []).slice(0, 6);
  if (!rightNow.length) {
    const empty = document.createElement("div");
    empty.className = "block";
    empty.innerHTML = `<div class="details">Nothing queued right now. Check the other blocks below.</div>`;
    rnList.appendChild(empty);
  } else {
    for (const t of rightNow) rnList.appendChild(taskCard(t, dateStr));
  }
  view.appendChild(rnList);

  // Today at a glance
  const hr1 = document.createElement("div");
  hr1.className = "hr";
  view.appendChild(hr1);

  const glanceTitle = document.createElement("div");
  glanceTitle.className = "section-title";
  glanceTitle.textContent = "Today at a glance";
  view.appendChild(glanceTitle);

  const blocksWrap = document.createElement("div");
  blocksWrap.className = "grid";

  for (const blockName of ["morning","midday","evening","bed"]) {
    const col = document.createElement("div");
    col.className = "col6";

    const block = document.createElement("div");
    block.className = "block";

    const list = (grouped[blockName] || []);
    const doneCount = list.filter(t => isDone(t.id, dateStr)).length;
    const skipped = isBlockSkipped(dateStr, blockName);

    block.innerHTML = `<h4>${blockName.toUpperCase()} ${skipped ? "• SKIPPED" : ""}</h4>
      <div class="details">${doneCount}/${list.length} done</div>`;

    const ul = document.createElement("ul");
    for (const t of list.slice(0, 8)) {
      const li = document.createElement("li");
      li.textContent = `${isDone(t.id, dateStr) ? "✓ " : ""}${t.title}`;
      ul.appendChild(li);
    }
    block.appendChild(ul);

    col.appendChild(block);
    blocksWrap.appendChild(col);
  }

  view.appendChild(blocksWrap);
}

function renderSimpleModule(moduleId) {
  const view = el("view");
  view.innerHTML = "";

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = moduleId.charAt(0).toUpperCase() + moduleId.slice(1);
  view.appendChild(title);

  const tasks = (guide.tasks || []).filter(t => t.moduleId === moduleId);

  if (tasks.length) {
    const list = document.createElement("div");
    list.className = "list";
    for (const t of tasks) {
      const card = document.createElement("div");
      card.className = "item";
      card.innerHTML = `<div class="item-title">${escapeHTML(t.title)}</div>
        <div class="details"><b>Why:</b> ${escapeHTML(t.why || "")}<br/><b>How:</b> ${escapeHTML(t.how || "")}</div>`;
      list.appendChild(card);
    }
    view.appendChild(list);
  } else {
    const empty = document.createElement("div");
    empty.className = "block";
    empty.innerHTML = `<div class="details">No content yet for this section.</div>`;
    view.appendChild(empty);
  }
}

function updateHeaderStats(ctx, dateStr) {
  const tasks = filterTasksForToday(dateStr);
  const total = tasks.length;
  const done = tasks.filter(t => isDone(t.id, dateStr)).length;

  el("doneValue").textContent = `${done}/${total}`;
  el("dayBadge").textContent = `${ctx.painState.toUpperCase()} / ${ctx.dayMode.toUpperCase()}`;

  el("streakValue").textContent = String(computeStreakAnyDone());

  const d = new Date();
  const datePretty = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  el("todayMeta").textContent = `${datePretty} • Env: ${ctx.environment}`;
}

async function setupButtons(dateStr) {
  el("btnMinimum").onclick = () => {
    const contexts = loadJSON(STORAGE_KEYS.CONTEXT_BY_DATE, {});
    contexts[dateStr] = contexts[dateStr] || {};
    contexts[dateStr].dayMode = "minimum";
    saveJSON(STORAGE_KEYS.CONTEXT_BY_DATE, contexts);
    render();
  };

  el("btnResetDay").onclick = () => {
    const ok = confirm("Reset today? Clears checkmarks + skips + your day prompts on this device.");
    if (!ok) return;
    resetDay(dateStr);
    scheduleDailyReminders(dateStr);
    render();
  };

  el("btnExport").onclick = () => {
    const exportObj = {
      guideOverride: loadJSON(STORAGE_KEYS.GUIDE, null),
      contexts: loadJSON(STORAGE_KEYS.CONTEXT_BY_DATE, {}),
      completions: loadJSON(STORAGE_KEYS.COMPLETIONS, {}),
      notes: loadJSON(STORAGE_KEYS.NOTES, {}),
      reminders: loadJSON(STORAGE_KEYS.REMINDERS, null),
      skipsByDate: loadJSON(STORAGE_KEYS.SKIPS_BY_DATE, {})
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-daily-guide-export-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  el("btnImport").onclick = () => {
    el("importArea").value = "";
    el("importDialog").showModal();
  };

  el("btnImportConfirm").onclick = () => {
    try {
      const raw = el("importArea").value.trim();
      const parsed = JSON.parse(raw);

      if (parsed.guideOverride) saveJSON(STORAGE_KEYS.GUIDE, parsed.guideOverride);
      if (parsed.contexts) saveJSON(STORAGE_KEYS.CONTEXT_BY_DATE, parsed.contexts);
      if (parsed.completions) saveJSON(STORAGE_KEYS.COMPLETIONS, parsed.completions);
      if (parsed.notes) saveJSON(STORAGE_KEYS.NOTES, parsed.notes);
      if (parsed.reminders) saveJSON(STORAGE_KEYS.REMINDERS, parsed.reminders);
      if (parsed.skipsByDate) saveJSON(STORAGE_KEYS.SKIPS_BY_DATE, parsed.skipsByDate);

      location.reload();
    } catch {
      alert("Import failed. Paste valid JSON from a previous export.");
    }
  };

  // Reminders dialog
  el("btnReminders").onclick = async () => {
    const settings = getReminderSettings();

    el("remindersEnabled").checked = !!settings.enabled;
    el("remindersOffToday").checked = !!settings.offToday;
    el("timeMorning").value = settings.times.morning || "08:00";
    el("timeMidday").value = settings.times.midday || "12:00";
    el("timeEvening").value = settings.times.evening || "18:00";
    el("timeBed").value = settings.times.bed || "21:30";

    // build skip buttons
    const skipWrap = el("skipButtons");
    skipWrap.innerHTML = "";
    for (const b of ["morning","midday","evening","bed"]) {
      const skipped = isBlockSkipped(dateStr, b);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn small ghost";
      btn.textContent = skipped ? `Enable ${b}` : `Skip ${b} today`;
      btn.onclick = () => {
        setBlockSkipped(dateStr, b, !skipped);
        scheduleDailyReminders(dateStr);
        render();
        // refresh label in dialog
        el("btnReminders").click(); // reopen with refreshed states
      };
      skipWrap.appendChild(btn);
    }

    el("remindersDialog").showModal();
  };

  el("btnSaveReminders").onclick = async () => {
    const enabled = el("remindersEnabled").checked;
    const offToday = el("remindersOffToday").checked;
    const times = {
      morning: el("timeMorning").value || "08:00",
      midday: el("timeMidday").value || "12:00",
      evening: el("timeEvening").value || "18:00",
      bed: el("timeBed").value || "21:30"
    };

    const settings = { enabled, offToday, times };
    saveReminderSettings(settings);

    if (enabled && !offToday) {
      const ok = await ensureNotificationPermission();
      if (!ok) alert("Notifications are blocked for this site. Enable them in browser settings.");
    }

    scheduleDailyReminders(dateStr);
  };
}

async function loadGuide() {
  const override = loadJSON(STORAGE_KEYS.GUIDE, null);
  if (override) return override;
  const res = await fetch("./guide.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load guide.json");
  return await res.json();
}

function render() {
  renderTabs();

  const dateStr = todayISO();
  const ctx = buildDayContext(dateStr);
  ctx.dayMode = resolveDayMode(ctx);

  updateHeaderStats(ctx, dateStr);

  const viewTitle = activeTab === "today"
    ? "Today"
    : guide.tabs.find(t => t.id === activeTab)?.label || "View";
  el("todayTitle").textContent = viewTitle;

  if (activeTab === "today") renderToday(ctx, dateStr);
  else if (activeTab === "schedule") renderSimpleModule("schedule");
  else renderSimpleModule(activeTab);
}

async function init() {
  guide = await loadGuide();

  el("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value || "";
    render();
  });

  const offlineStatus = el("offlineStatus");
  if ("serviceWorker" in navigator) {
    try {
      swReg = await navigator.serviceWorker.register("./sw.js");
      offlineStatus.textContent = "Ready.";
    } catch {
      offlineStatus.textContent = "Ready (no offline cache).";
    }
  } else {
    offlineStatus.textContent = "Ready.";
  }

  const dateStr = todayISO();
  await setupButtons(dateStr);

  // ask permission only if enabled
  const reminderSettings = getReminderSettings();
  if (reminderSettings.enabled && !reminderSettings.offToday) {
    await ensureNotificationPermission();
  }

  scheduleDailyReminders(dateStr);
  render();
}

init().catch(err => {
  console.error(err);
  el("view").innerHTML = `<div class="block"><h4>Error</h4><div class="details">Failed to load. Make sure guide.json exists in the repo root.</div></div>`;
});
