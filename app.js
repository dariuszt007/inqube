const EVENTS_API_URL = "https://api.github.com/repos/dariuszt007/ictcalendar/contents/events.json";
const MEMO_STORAGE_KEY = "inqube_memo_data";

const statusEl = document.getElementById("status");
const copyStatusEl = document.getElementById("copyStatus");
const reloadBtn = document.getElementById("reloadBtn");
const copyAllMemoBtn = document.getElementById("copyAllMemoBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");
const calendarEl = document.getElementById("calendar");

let calendar = null;
let eventsMap = {};
let memoData = {};

function loadMemoFromLocal() {
  const raw = localStorage.getItem(MEMO_STORAGE_KEY);

  if (!raw) {
    memoData = {};
    return;
  }

  try {
    memoData = JSON.parse(raw);
  } catch (error) {
    console.error("Błąd odczytu memo z localStorage:", error);
    memoData = {};
  }
}

async function fetchEventsFromGitHub() {
  const response = await fetch(EVENTS_API_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const fileData = await response.json();

  if (!fileData.content) {
    throw new Error("Brak pola content w odpowiedzi GitHub API");
  }

  const jsonText = atob(fileData.content.replace(/\n/g, ""));
  return JSON.parse(jsonText);
}

function convertEventsToCalendarFormat(eventsObj) {
  return Object.entries(eventsObj).map(([date, event]) => {
    const allDay = !!event.isAllDay;

    let start = date;
    let end = date;

    if (!allDay && event.startTime && event.endTime) {
      start = `${date}T${event.startTime}:00`;
      end = `${date}T${event.endTime}:00`;
    } else {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      end = nextDay.toISOString().slice(0, 10);
    }

    return {
      id: date,
      title: event.text || "(bez nazwy)",
      start,
      end,
      allDay,
      backgroundColor: event.color || "#9ca3af",
      borderColor: event.color || "#9ca3af",
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
    initialView: "dayGridMonth",
    locale: "pl",
    height: "auto",
    firstDay: 1,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },
    buttonText: {
      today: "Dziś"
    },
    events: calendarEvents,
    eventClick(info) {
      const dateKey = info.event.id;
      window.location.href = `event.html?date=${encodeURIComponent(dateKey)}`;
    },
    dateClick(info) {
      window.location.href = `event.html?date=${encodeURIComponent(info.dateStr)}`;
    },
    views: {
      dayGridMonth: {
        dayMaxEventRows: 4
      },
      timeGridWeek: {
        slotMinTime: "05:00:00",
        slotMaxTime: "22:00:00",
        allDaySlot: true
      }
    }
  });

  calendar.render();
  setActiveViewButton("dayGridMonth");
}

function setActiveViewButton(viewName) {
  monthViewBtn.classList.toggle("active", viewName === "dayGridMonth");
  weekViewBtn.classList.toggle("active", viewName === "timeGridWeek");
}

async function loadCalendar() {
  statusEl.classList.remove("hidden");
  statusEl.textContent = "Ładowanie wydarzeń...";

  try {
    loadMemoFromLocal();
    eventsMap = await fetchEventsFromGitHub();
    const calendarEvents = convertEventsToCalendarFormat(eventsMap);
    createCalendar(calendarEvents);

    const count = Object.keys(eventsMap).length;
    statusEl.textContent = `Załadowano ${count} wydarzeń. Możesz przełączać widok miesiąca i tygodnia.`;
  } catch (error) {
    console.error("Błąd ładowania kalendarza:", error);
    statusEl.innerHTML = `
      Nie udało się pobrać events.json.<br>
      Sprawdź konsolę przeglądarki klawiszem F12.
    `;
  }
}

async function copyWholeMemoJson() {
  loadMemoFromLocal();
  const textToCopy = JSON.stringify(memoData, null, 2);

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyStatusEl.classList.remove("hidden");
    copyStatusEl.textContent = "Skopiowano cały memo.json do schowka.";
  } catch (error) {
    console.error("Błąd kopiowania:", error);
    copyStatusEl.classList.remove("hidden");
    copyStatusEl.textContent = "Nie udało się skopiować automatycznie. Skopiuj z widoku szczegółów wydarzenia.";
  }
}

reloadBtn.addEventListener("click", loadCalendar);

copyAllMemoBtn.addEventListener("click", copyWholeMemoJson);

monthViewBtn.addEventListener("click", () => {
  if (!calendar) return;
  calendar.changeView("dayGridMonth");
  setActiveViewButton("dayGridMonth");
});

weekViewBtn.addEventListener("click", () => {
  if (!calendar) return;
  calendar.changeView("timeGridWeek");
  setActiveViewButton("timeGridWeek");
});

loadCalendar();
