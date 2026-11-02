const EVENTS_URL = "https://raw.githubusercontent.com/TWOJ_LOGIN_GITHUB/ictcalendar/main/events.json";

const statusEl = document.getElementById("status");
const eventsListEl = document.getElementById("eventsList");
const reloadBtn = document.getElementById("reloadBtn");

async function loadEvents() {
  statusEl.textContent = "Ładowanie wydarzeń...";
  eventsListEl.innerHTML = "";

  try {
    const response = await fetch(EVENTS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    renderEvents(data);

    const count = Object.keys(data).length;
    statusEl.textContent = `Załadowano ${count} wydarzeń.`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Nie udało się pobrać events.json. Sprawdź adres pliku i dostęp publiczny repozytorium.";
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
