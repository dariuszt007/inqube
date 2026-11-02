const EVENTS_API_URL = "https://api.github.com/repos/dariuszt007/ictcalendar/contents/events.json";
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

function loadMemoFromLocal() {
  const raw = localStorage.getItem(MEMO_STORAGE_KEY);

  if (!raw) {
    memoData = {};
    return;
  }

  try {
    memoData = JSON.parse(raw);
  } catch (error) {
    console.error("Błąd odczytu memo:", error);
    memoData = {};
  }
}

function decodeBase64Utf8(base64) {
  const binaryString = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function fetchEventsFromGitHub() {
  const response = await fetch(EVENTS_API_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const fileData = await response.json();

  if (!fileData.content) {
    throw new Error("Brak pola content");
  }

  const jsonText = decodeBase64Utf8(fileData.content);
  return JSON.parse(jsonText);
}

async function loadEventDetails() {
  currentDateKey = getDateFromQuery();

  if (!currentDateKey) {
    eventStatusEl.textContent = "Brak parametru daty w adresie.";
    return;
  }

  try {
    const events = await fetchEventsFromGitHub();
    const event = events[currentDateKey] || null;

    loadMemoFromLocal();
    renderEvent(event);
    renderMemoPreview();

    eventStatusEl.textContent = event
      ? "Załadowano szczegóły wydarzenia."
      : "Dla tego dnia nie ma wydarzenia w events.json, ale możesz zapisać memo.";
    eventContentEl.classList.remove("hidden");
  } catch (error) {
    console.error("Błąd pobierania szczegółów:", error);
    eventStatusEl.textContent = "Nie udało się pobrać danych wydarzenia.";
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

  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memoData, null, 2));
  renderMemoPreview();
  memoStatusEl.textContent = "Memo zapisane lokalnie.";
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
