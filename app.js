const EVENTS_URL = "https://raw.githubusercontent.com/dariuszt007/ictcalendar/main/events.json";
const MEMO_STORAGE_KEY = "inqube_memo_data";

const statusEl = document.getElementById("status");
const copyStatusEl = document.getElementById("copyStatus");
const reloadBtn = document.getElementById("reloadBtn");
const copyAllMemoBtn = document.getElementById("copyAllMemoBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");
const calendarEl = document.getElementById("calendar");

let calendar = null;
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
    console.error("Błąd odczytu memo:", error);
    memoData = {};
  }
}

async function fetchEvents() {
  const response = await fetch(EVENTS_URL, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  return JSON.parse(text);
}

function convertEventsToCalendarFormat(eventsObj) {
  return Object.entries(eventsObj).map(([date, event]) => {
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
      backgroundColor: event.color || "#9ca3af",
      borderColor: event.color || "#9ca3af",
      textColor: "#1f2937",
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

function updateViewButtons(viewName) {
  monthViewBtn.classList.toggle("active", viewName === "dayGridMonth");
  weekViewBtn.classList.toggle("active", viewName === "timeGridWeek");
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
      },
      timeGridWeek: {
        dayHeaderFormat: { weekday: "short", day: "numeric" },
        slotMinTime: "05:00:00",
        slotMaxTime: "21:00:00",
        allDaySlot: true
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
  updateViewButtons("dayGridMonth");
}

async function loadCalendar() {
  statusEl.classList.remove("hidden");
  statusEl.textContent = "Ładowanie wydarzeń...";

  try {
    loadMemoFromLocal();
    const eventsObj = await fetchEvents();
    const calendarEvents = convertEventsToCalendarFormat(eventsObj);
    createCalendar(calendarEvents);

    const count = Object.keys(eventsObj).length;
    statusEl.textContent = `Załadowano ${count} wydarzeń.`;
  } catch (error) {
    console.error("Błąd ładowania kalendarza:", error);
    statusEl.innerHTML = `
      Nie udało się pobrać events.json.<br>
      <small>${String(error.message || error)}</small><br>
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
    copyStatusEl.textContent = "Nie udało się skopiować. Skopiuj z podglądu w szczegółach wydarzenia.";
  }
}

reloadBtn.addEventListener("click", loadCalendar);

copyAllMemoBtn.addEventListener("click", copyWholeMemoJson);

monthViewBtn.addEventListener("click", () => {
  if (!calendar) return;
  calendar.changeView("dayGridMonth");
  updateViewButtons("dayGridMonth");
});

weekViewBtn.addEventListener("click", () => {
  if (!calendar) return;
  calendar.changeView("timeGridWeek");
  updateViewButtons("timeGridWeek");
});

loadCalendar();
