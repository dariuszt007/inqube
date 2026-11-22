const EVENTS_URL = "https://raw.githubusercontent.com/dariuszt007/ictcalendar/main/events.json";
const MEMO_URL = "https://raw.githubusercontent.com/dariuszt007/inqube/main/memo.json";
const MEMO_STORAGE_KEY = "inqube_memo_data";

const eventStatusEl = document.getElementById("eventStatus");
const eventContentEl = document.getElementById("eventContent");

const eventTitleEl = document.getElementById("eventTitle");
const eventDateEl = document.getElementById("eventDate");
const eventLocationEl = document.getElementById("eventLocation");
const eventStartEl = document.getElementById("eventStart");
const eventEndEl = document.getElementById("eventEnd");
const eventAllDayEl = document.getElementById("eventAllDay");
const eventCategoryEl = document.getElementById("eventCategory");
const colorBarEl = document.getElementById("colorBar");

const memoInputEl = document.getElementById("memoInput");
const saveMemoBtn = document.getElementById("saveMemoBtn");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const memoStatusEl = document.getElementById("memoStatus");
const jsonPreviewEl = document.getElementById("jsonPreview");

let currentDateKey = null;
let memoData = {};

function getDateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("date");
}

async function fetchJsonFromUrl(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  return JSON.parse(text);
}

async function fetchEvents() {
  return await fetchJsonFromUrl(EVENTS_URL);
}

async function fetchMemoFromRepo() {
  try {
    return await fetchJsonFromUrl(MEMO_URL);
  } catch (error) {
    console.warn("Nie udało się pobrać memo.json z repo:", error);
    return {};
  }
}

function loadMemoFromLocalStorage() {
  const raw = localStorage.getItem(MEMO_STORAGE_KEY);

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Błąd odczytu memo z localStorage:", error);
    return {};
  }
}

function saveMemoToLocalStorage(data) {
  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(data, null, 2));
}

async function loadEventDetails() {
  currentDateKey = getDateFromQuery();

  if (!currentDateKey) {
    eventStatusEl.textContent = "Brak parametru daty w adresie.";
    return;
  }

  try {
    const [events, memoFromRepo] = await Promise.all([
      fetchEvents(),
      fetchMemoFromRepo()
    ]);

    const memoFromLocal = loadMemoFromLocalStorage();

    memoData = {
      ...memoFromRepo,
      ...memoFromLocal
    };

    saveMemoToLocalStorage(memoData);

    const event = events[currentDateKey] || null;
    renderEvent(event);
    renderMemoPreview();

    eventStatusEl.textContent = event
      ? "Załadowano szczegóły wydarzenia i memo."
      : "Dla tego dnia nie ma wydarzenia w events.json, ale możesz zapisać memo.";
    eventContentEl.classList.remove("hidden");
  } catch (error) {
    console.error("Błąd pobierania szczegółów:", error);
    eventStatusEl.innerHTML = `
      Nie udało się pobrać danych wydarzenia.<br>
      <small>${String(error.message || error)}</small>
    `;
  }
}

function renderEvent(event) {
  eventTitleEl.textContent = event?.text || "(brak wydarzenia w events.json)";
  eventDateEl.textContent = currentDateKey || "-";
  eventLocationEl.textContent = event?.location || "-";
  eventStartEl.textContent = event?.startTime || "-";
  eventEndEl.textContent = event?.endTime || "-";
  eventAllDayEl.textContent = event ? (event.isAllDay ? "Tak" : "Nie") : "-";
  eventCategoryEl.textContent = event?.category || "-";
  colorBarEl.style.background = event?.color || "#9ca3af";

  const currentMemo = memoData[currentDateKey]?.memo || "";
  memoInputEl.value = currentMemo;
}

function saveMemoLocally() {
  if (!currentDateKey) {
    memoStatusEl.textContent = "Brak daty.";
    return;
  }

  memoData[currentDateKey] = {
    memo: memoInputEl.value.trim()
  };

  saveMemoToLocalStorage(memoData);
  renderMemoPreview();
  memoStatusEl.textContent = "Memo zapisane lokalnie. Możesz dalej edytować lub skopiować cały memo.json.";
}

function renderMemoPreview() {
  jsonPreviewEl.textContent = JSON.stringify(memoData, null, 2);
}

async function copyWholeMemoJson() {
  const textToCopy = JSON.stringify(memoData, null, 2);

  try {
    await navigator.clipboard.writeText(textToCopy);
    memoStatusEl.textContent = "Skopiowano cały memo.json.";
  } catch (error) {
    console.error("Błąd kopiowania:", error);
    memoStatusEl.textContent = "Nie udało się skopiować. Skopiuj ręcznie z podglądu.";
  }
}

saveMemoBtn.addEventListener("click", saveMemoLocally);
copyJsonBtn.addEventListener("click", copyWholeMemoJson);

loadEventDetails();
