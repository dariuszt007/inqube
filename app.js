const EVENTS_URL = "https://raw.githubusercontent.com/dariuszt007/ictcalendar/main/events.json";
const MEMO_URL = "https://raw.githubusercontent.com/dariuszt007/inqube/main/memo.json";
const MEMO_STORAGE_KEY = "inqube_memo_data";

const statusEl = document.getElementById("status");
const copyStatusEl = document.getElementById("copyStatus");
const reloadBtn = document.getElementById("reloadBtn");
const copyAllMemoBtn = document.getElementById("copyAllMemoBtn");
const calendarEl = document.getElementById("calendar");

let calendar = null;
let memoData = {};

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
    console.error("Błąd odczytu localStorage memo:", error);
    return {};
  }
}

function saveMemoToLocalStorage(data) {
  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(data, null, 2));
}

function getContrastTextColor(hexColor) {
  if (!hexColor) return "#111827";

  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return "#111827";

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#111827" : "#ffffff";
}

function convertEventsToCalendarFormat(eventsObj) {
  return Object.entries(eventsObj).map(([date, event]) => {
    const eventColor = event.color || "#9ca3af";
    const textColor = getContrastTextColor(eventColor);
    const allDay = !!event.isAllDay;

    let start;
    let end;

    if (!allDay && event.startTime && event.endTime) {
      start = `${date}T${event.startTime}:00`;
      end = `${date}T${event.endTime}:00`;
    } else {
      start = date;
      const nextDay = new Date(`${date}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      end = nextDay.toISOString().slice(0, 10);
    }

    return {
      id: date,
      title: event.text || "(bez nazwy)",
      start,
      end,
      allDay,
      display: "block",
      backgroundColor: eventColor,
      borderColor: eventColor,
      textColor: textColor,
      extendedProps: {
        date,
        location: event.location || "",
        category: event.category || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        isAllDay: !!event.isAllDay
      }
    };
  });
}

function createCalendar(calendarEvents) {
  if (calendar) {
    calendar.destroy();
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    locale: "pl",
    initialView: "dayGridMonth",
    firstDay: 1,
    weekends: false,
    height: "auto",
    fixedWeekCount: true,
    navLinks: false,
    headerToolbar: {
      left: "title",
      center: "",
      right: "prev today next"
    },
    buttonText: {
      today: "Dziś"
    },
    views: {
      dayGridMonth: {
        dayHeaderFormat: { weekday: "short" }
      }
    },
    events: calendarEvents,
    eventTimeFormat: {
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    },
    eventClick(info) {
      const dateKey = info.event.id;
      window.location.href = `event.html?date=${encodeURIComponent(dateKey)}`;
    },
    dateClick(info) {
      window.location.href = `event.html?date=${encodeURIComponent(info.dateStr)}`;
    }
  });

  calendar.render();
}

async function loadCalendar() {
  statusEl.classList.remove("hidden");
  statusEl.textContent = "Ładowanie wydarzeń i memo...";

  try {
    const [eventsObj, memoFromRepo] = await Promise.all([
      fetchEvents(),
      fetchMemoFromRepo()
    ]);

    const memoFromLocal = loadMemoFromLocalStorage();

    memoData = {
      ...memoFromRepo,
      ...memoFromLocal
    };

    saveMemoToLocalStorage(memoData);

    const calendarEvents = convertEventsToCalendarFormat(eventsObj);
    createCalendar(calendarEvents);

    const count = Object.keys(eventsObj).length;
    statusEl.textContent = `Załadowano ${count} wydarzeń oraz memo z repo/localStorage.`;
  } catch (error) {
    console.error("Błąd ładowania kalendarza:", error);
    statusEl.innerHTML = `
      Nie udało się pobrać danych.<br>
      <small>${String(error.message || error)}</small><br>
      Sprawdź konsolę przeglądarki klawiszem F12.
    `;
  }
}

async function copyWholeMemoJson() {
  const textToCopy = JSON.stringify(memoData, null, 2);

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyStatusEl.classList.remove("hidden");
    copyStatusEl.textContent = "Skopiowano cały memo.json do schowka.";
  } catch (error) {
    console.error("Błąd kopiowania:", error);
    copyStatusEl.classList.remove("hidden");
    copyStatusEl.textContent = "Nie udało się skopiować.";
  }
}

reloadBtn.addEventListener("click", loadCalendar);
copyAllMemoBtn.addEventListener("click", copyWholeMemoJson);

loadCalendar();
