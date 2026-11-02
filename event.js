const EVENTS_URL = "https://raw.githubusercontent.com/dariuszt007/ictcalendar/main/events.json";

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

const MEMO_STORAGE_KEY = "inqube_memo_data";

let currentDateKey = null;
let currentEvent = null;
let memoData = {};

function getDateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("date");
}

async function loadEventDetails() {
  currentDateKey = getDateFromQuery();

  if (!currentDateKey) {
    eventStatusEl.textContent = "Brak parametru daty w adresie.";
    return;
  }

  try {
    const response = await fetch(EVENTS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const events = await response.json();
    const event = events[currentDateKey];

    if (!event) {
      eventStatusEl.textContent = "Nie znaleziono wydarzenia dla podanej daty.";
      return;
    }

    currentEvent = event;
    loadMemoFromLocal();
    renderEvent(event);
    renderMemoPreview();

    eventStatusEl.textContent = "Załadowano szczegóły wydarzenia.";
    eventContentEl.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    eventStatusEl.textContent = "Nie udało się pobrać szczegółów wydarzenia.";
  }
}

function renderEvent(event) {
  eventTitleEl.textContent = event.text || "(bez nazwy)";
  eventDateEl.textContent = currentDateKey || "-";
  eventLocationEl.textContent = event.location || "-";
  eventStartEl.textContent = event.startTime || "-";
  eventEndEl.textContent = event.endTime || "-";
  eventAllDayEl.textContent = event.isAllDay ? "Tak" : "Nie";
  eventCategoryEl.textContent = event.category || "-";
  colorBarEl.style.background = event.color || "#9ca3af";

  const currentMemo = memoData[currentDateKey]?.memo || "";
  memoInputEl.value = currentMemo;
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
    console.error(error);
    memoData = {};
  }
}

function saveMemoLocally() {
  if (!currentDateKey) {
    memoStatusEl.textContent = "Brak daty wydarzenia.";
    return;
  }

  const memoText = memoInputEl.value.trim();

  memoData[currentDateKey] = {
    memo: memoText
  };

  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memoData, null, 2));
  renderMemoPreview();
  memoStatusEl.textContent = "Memo zapisane lokalnie w przeglądarce. Teraz możesz skopiować cały memo.json.";
}

function renderMemoPreview() {
  jsonPreviewEl.textContent = JSON.stringify(memoData, null, 2);
}

async function copyWholeMemoJson() {
  const textToCopy = JSON.stringify(memoData, null, 2);

  try {
    await navigator.clipboard.writeText(textToCopy);
    memoStatusEl.textContent = "Skopiowano cały memo.json do schowka.";
  } catch (error) {
    console.error(error);
    memoStatusEl.textContent = "Nie udało się skopiować do schowka. Skopiuj ręcznie z podglądu poniżej.";
  }
}

saveMemoBtn.addEventListener("click", saveMemoLocally);
copyJsonBtn.addEventListener("click", copyWholeMemoJson);

loadEventDetails();
