const EVENTS_URL = "https://raw.githubusercontent.com/dariuszt007/ictcalendar/main/events.json";

const statusEl = document.getElementById("status");
const eventsListEl = document.getElementById("eventsList");
const reloadBtn = document.getElementById("reloadBtn");

async function loadEvents() {
  statusEl.textContent = "Ładowanie wydarzeń...";
  eventsListEl.innerHTML = "";

  try {
    const response = await fetch(EVENTS_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderEvents(data);

    const count = Object.keys(data).length;
    statusEl.textContent = `Załadowano ${count} wydarzeń.`;
  } catch (error) {
    console.error("Błąd pobierania events.json:", error);
    statusEl.innerHTML = `
      Nie udało się pobrać events.json.<br>
      Sprawdź konsolę przeglądarki klawiszem F12.<br>
      Używany adres:<br>
      <code>${EVENTS_URL}</code>
    `;
  }
}

function renderEvents(eventsObj) {
  const entries = Object.entries(eventsObj);

  if (entries.length === 0) {
    eventsListEl.innerHTML = "<p>Brak wydarzeń.</p>";
    return;
  }

  entries.sort((a, b) => a[0].localeCompare(b[0]));

  for (const [date, event] of entries) {
    const link = document.createElement("a");
    link.className = "event-card";
    link.href = `event.html?date=${encodeURIComponent(date)}`;
    link.style.borderLeftColor = event.color || "#9ca3af";

    const allDayText = event.isAllDay ? "Tak" : "Nie";
    const startTime = event.startTime || "-";
    const endTime = event.endTime || "-";

    link.innerHTML = `
      <div class="event-card-top">
        <div class="event-title">${escapeHtml(event.text || "(bez nazwy)")}</div>
        <div class="event-date">${escapeHtml(date)}</div>
      </div>
      <div class="event-meta">
        <div><strong>Lokalizacja:</strong> ${escapeHtml(event.location || "-")}</div>
        <div><strong>Godziny:</strong> ${escapeHtml(startTime)} - ${escapeHtml(endTime)}</div>
        <div><strong>Kategoria:</strong> ${escapeHtml(event.category || "-")}</div>
        <div><strong>Cały dzień:</strong> ${allDayText}</div>
      </div>
    `;

    eventsListEl.appendChild(link);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

reloadBtn.addEventListener("click", loadEvents);

loadEvents();
