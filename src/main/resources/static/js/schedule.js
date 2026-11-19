const API_URL = "/api/events";

let selectedDate = getLocalDateString(new Date());
let currentEvents = [];
let selectedEvent = null;
let toastTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeDate();
    initializeEvents();
    initializeClock();
    initializeListeners();
});

/* --------------------------------
   Date and time helpers
-------------------------------- */

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function formatTime(time) {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return "--:--";
    }

    // Keep the original 24-hour value.
    return time;
}

function getDateTime(date, time) {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function getEventStatus(event) {
    const eventDate = getDateTime(event.date, event.time);
    const now = new Date();

    if (eventDate < now) {
        return "completed";
    }

    return "upcoming";
}

function getCurrentHourForSelectedDate() {
    const today = getLocalDateString(new Date());

    if (selectedDate !== today) {
        return -1;
    }

    return new Date().getHours();
}

/* --------------------------------
   Initialization
-------------------------------- */

function initializeDate() {
    document.getElementById("eventDateInput").value = selectedDate;
    updateDateDisplay();
}

function initializeEvents() {
    loadEvents();
}

function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000);

    // Refresh current-hour highlighting and event summary.
    setInterval(() => {
        renderTimeline();
        renderSummary();
    }, 15000);
}

function initializeListeners() {
    document.getElementById("prevDay").addEventListener("click", () => {
        changeDate(-1);
    });

    document.getElementById("nextDay").addEventListener("click", () => {
        changeDate(1);
    });

    document.getElementById("todayButton").addEventListener("click", () => {
        selectedDate = getLocalDateString(new Date());
        refreshSelectedDate();
    });

    document.getElementById("eventDateInput").addEventListener("change", event => {
        if (!event.target.value) return;

        selectedDate = event.target.value;
        refreshSelectedDate();
    });

    document.getElementById("openEventModal").addEventListener("click", openCreateModal);
    document.getElementById("closeEventModal").addEventListener("click", closeCreateModal);
    document.getElementById("cancelEvent").addEventListener("click", closeCreateModal);

    document.getElementById("eventForm").addEventListener("submit", saveEvent);

    document.getElementById("closeDetailModal").addEventListener("click", closeDetailModal);
    document.getElementById("closeDetailButton").addEventListener("click", closeDetailModal);
    document.getElementById("deleteEventButton").addEventListener("click", deleteSelectedEvent);

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    // Close modal when clicking outside the modal card.
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", event => {
            if (event.target === backdrop) {
                backdrop.classList.remove("show");
            }
        });
    });

    // Close modal with Escape.
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeCreateModal();
            closeDetailModal();
        }
    });
}

/* --------------------------------
   Theme
-------------------------------- */

function initializeTheme() {
    const savedTheme = localStorage.getItem("liveEventTheme") || "light";
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    localStorage.setItem("liveEventTheme", nextTheme);
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.getElementById("themeIcon").textContent =
        theme === "dark" ? "☀" : "☾";
}

/* --------------------------------
   Live clock
-------------------------------- */

function updateClock() {
    const now = new Date();

    const clock = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    document.getElementById("liveClock").textContent = clock;
}

/* --------------------------------
   Date navigation
-------------------------------- */

function changeDate(amount) {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    date.setDate(date.getDate() + amount);

    selectedDate = getLocalDateString(date);
    refreshSelectedDate();
}

function refreshSelectedDate() {
    document.getElementById("eventDateInput").value = selectedDate;
    updateDateDisplay();
    loadEvents();
}

function updateDateDisplay() {
    document.getElementById("eventDate").textContent = formatDate(selectedDate);
}

/* --------------------------------
   API
-------------------------------- */

async function loadEvents() {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = `<div class="empty-day">Loading your schedule...</div>`;

    try {
        const response = await fetch(`${API_URL}?date=${encodeURIComponent(selectedDate)}`);

        if (!response.ok) {
            throw new Error("Could not load events.");
        }

        const data = await response.json();

        currentEvents = Array.isArray(data) ? data : [];

        currentEvents.sort((a, b) => {
            return (a.time || "").localeCompare(b.time || "");
        });

        renderTimeline();
        renderSummary();

    } catch (error) {
        console.error(error);

        currentEvents = [];
        timeline.innerHTML = `
            <div class="empty-day">
                Unable to load events. Please check that the backend is running.
            </div>
        `;

        renderSummary();
        showToast("Unable to load events.");
    }
}

async function saveEvent(event) {
    event.preventDefault();

    const title = document.getElementById("eventTitle").value.trim();
    const date = document.getElementById("eventDateField").value;
    const time = document.getElementById("eventTime").value;
    const description = document.getElementById("eventDescription").value.trim();

    const errorElement = document.getElementById("formError");
    errorElement.textContent = "";

    if (!title || !date || !time) {
        errorElement.textContent = "Please complete the title, date, and time.";
        return;
    }

    const eventData = {
        date,
        time,
        title,
        description
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            throw new Error("Could not save event.");
        }

        closeCreateModal();
        showToast("Event created successfully.");

        selectedDate = date;
        document.getElementById("eventDateInput").value = date;
        updateDateDisplay();

        await loadEvents();

    } catch (error) {
        console.error(error);
        errorElement.textContent = "Unable to save event. Please try again.";
    }
}

async function deleteSelectedEvent() {
    if (!selectedEvent || !selectedEvent.id) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${selectedEvent.title}"?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(selectedEvent.id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("Could not delete event.");
        }

        closeDetailModal();
        showToast("Event deleted.");

        await loadEvents();

    } catch (error) {
        console.error(error);
        showToast("Unable to delete event.");
    }
}

/* --------------------------------
   Render three-column daily grid
-------------------------------- */

function renderTimeline() {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    const currentHour = getCurrentHourForSelectedDate();

    if (currentEvents.length === 0) {
        // Still show all 24 hours when there are no events.
    }

    // Three columns: 00-07, 08-15, and 16-23.
    for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
        const column = document.createElement("div");
        column.className = "hour-column";

        const startHour = columnIndex * 8;
        const endHour = startHour + 8;

        for (let hour = startHour; hour < endHour; hour++) {
            const slot = createHourSlot(hour, currentHour);
            column.appendChild(slot);
        }

        timeline.appendChild(column);
    }
}

function createHourSlot(hour, currentHour) {
    const slot = document.createElement("div");
    slot.className = "hour-slot";

    if (hour === currentHour) {
        slot.classList.add("is-current");
    }

    const label = document.createElement("div");
    label.className = "hour-label";

    const time = document.createElement("strong");
    time.textContent = `${String(hour).padStart(2, "0")}:00`;

    label.appendChild(time);

    if (hour === currentHour) {
        const nowTag = document.createElement("span");
        nowTag.className = "current-hour-tag";
        nowTag.textContent = "NOW";
        label.appendChild(nowTag);
    } else {
        const period = document.createElement("span");
        period.textContent = hour < 12 ? "MORNING" : hour < 18 ? "AFTERNOON" : "EVENING";
        label.appendChild(period);
    }

    const eventsContainer = document.createElement("div");
    eventsContainer.className = "hour-events";

    const hourEvents = currentEvents.filter(event => {
        if (!event.time) return false;

        return Number(event.time.split(":")[0]) === hour;
    });

    hourEvents.forEach(event => {
        eventsContainer.appendChild(createEventCard(event));
    });

    if (hourEvents.length === 0) {
        const empty = document.createElement("span");
        empty.className = "empty-hour";
        empty.textContent = "—";
        eventsContainer.appendChild(empty);
    }

    slot.appendChild(label);
    slot.appendChild(eventsContainer);

    return slot;
}

function createEventCard(event) {
    const status = getEventStatus(event);

    const card = document.createElement("article");
    card.className = `event-card ${status}-event`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${formatTime(event.time)} ${event.title}`);

    const time = document.createElement("span");
    time.className = "event-card-time";
    time.textContent = formatTime(event.time);

    const title = document.createElement("span");
    title.className = "event-card-title";
    title.textContent = event.title || "Untitled event";

    const tooltip = document.createElement("div");
    tooltip.className = "event-tooltip";

    const tooltipTime = document.createElement("span");
    tooltipTime.className = "tooltip-time";
    tooltipTime.textContent = `${formatTime(event.time)} · ${event.date}`;

    const tooltipTitle = document.createElement("span");
    tooltipTitle.className = "tooltip-title";
    tooltipTitle.textContent = event.title || "Untitled event";

    const tooltipDescription = document.createElement("span");
    tooltipDescription.className = "tooltip-description";
    tooltipDescription.textContent = event.description || "No description provided.";

    tooltip.appendChild(tooltipTime);
    tooltip.appendChild(tooltipTitle);
    tooltip.appendChild(tooltipDescription);

    card.appendChild(time);
    card.appendChild(title);
    card.appendChild(tooltip);

    card.addEventListener("click", () => openDetailModal(event));

    card.addEventListener("keydown", eventKey => {
        if (eventKey.key === "Enter" || eventKey.key === " ") {
            eventKey.preventDefault();
            openDetailModal(event);
        }
    });

    return card;
}

/* --------------------------------
   Summary cards
-------------------------------- */

function renderSummary() {
    const now = new Date();

    const completed = currentEvents.filter(event => {
        return getEventStatus(event) === "completed";
    });

    const upcoming = currentEvents.filter(event => {
        return getEventStatus(event) === "upcoming";
    });

    const nextEvent = upcoming
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))[0];

    document.getElementById("totalEvents").textContent = currentEvents.length;
    document.getElementById("completedEvents").textContent = completed.length;
    document.getElementById("upcomingEvents").textContent = upcoming.length;

    const nextEventElement = document.getElementById("nextEvent");

    if (nextEvent) {
        nextEventElement.textContent =
            `${formatTime(nextEvent.time)} · ${nextEvent.title}`;
        nextEventElement.title = nextEvent.title;
    } else {
        nextEventElement.textContent = "No upcoming event";
        nextEventElement.title = "";
    }
}

/* --------------------------------
   Create event modal
-------------------------------- */

function openCreateModal() {
    const form = document.getElementById("eventForm");
    form.reset();

    document.getElementById("eventDateField").value = selectedDate;
    document.getElementById("formError").textContent = "";

    document.getElementById("eventModal").classList.add("show");

    setTimeout(() => {
        document.getElementById("eventTitle").focus();
    }, 100);
}

function closeCreateModal() {
    document.getElementById("eventModal").classList.remove("show");
}

/* --------------------------------
   Event detail modal
-------------------------------- */

function openDetailModal(event) {
    selectedEvent = event;

    document.getElementById("detailTitle").textContent =
        event.title || "Untitled event";

    document.getElementById("detailDateTime").textContent =
        `${formatDate(event.date)} · ${formatTime(event.time)}`;

    document.getElementById("detailDescription").textContent =
        event.description || "No description available.";

    document.getElementById("detailModal").classList.add("show");
}

function closeDetailModal() {
    document.getElementById("detailModal").classList.remove("show");
    selectedEvent = null;
}

/* --------------------------------
   Toast notification
-------------------------------- */

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}