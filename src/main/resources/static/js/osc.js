/* ========================================
   ONE STEP CLOSER - JAVASCRIPT
======================================== */

const API = {
    CREATE: "/osc/create",
    DEPOSIT: "/osc/deposit",
    GET: "/osc/get"
};

const PAGE_SIZE = 9;

let currentPage = 0;
let totalPages = 0;
let totalElements = 0;
let currentGoals = [];
let toastTimer = null;

/* ========================================
   DOM HELPERS
======================================== */

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value, currency = "USD") {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount)) {
        return currency === "KHR" ? "៛0" : "$0.00";
    }

    if (currency === "KHR") {
        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0
        }).format(amount) + " ៛";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function getStatusLabel(status) {
    switch (status) {
        case "IN_PROGRESS":
            return "IN PROGRESS";
        case "COMPLETED":
            return "COMPLETED";
        case "CANCELLED":
            return "CANCELLED";
        default:
            return status || "UNKNOWN";
    }
}

function getStatusClass(status) {
    switch (status) {
        case "IN_PROGRESS":
            return "status-in-progress";
        case "COMPLETED":
            return "status-completed";
        case "CANCELLED":
            return "status-cancelled";
        default:
            return "";
    }
}

function showError(elementId, message) {
    const element = $(elementId);

    element.textContent = message;
    element.classList.remove("hidden");
}

function hideError(elementId) {
    const element = $(elementId);

    element.textContent = "";
    element.classList.add("hidden");
}

/* ========================================
   API HELPERS
======================================== */

async function apiRequest(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(body)
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const responseText = await response.text();

        throw new Error(
            `Expected JSON response but received ${contentType || "unknown content type"}. ` +
            responseText.substring(0, 200)
        );
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
    }

    return result;
}

/* ========================================
   LOAD GOALS
======================================== */

async function loadGoals() {
    setLoading(true);

    try {
        const requestBody = {
            id: null,
            status: $("statusFilter").value || null,
            title: $("searchInput").value.trim() || null,
            description: null,
            sortBy: "createdDate",
            sortDirection: $("sortDirection").value,
            page: currentPage,
            size: PAGE_SIZE
        };

        const response = await apiRequest(API.GET, requestBody);

        if (response.code && String(response.code) !== "200") {
            throw new Error(response.message || "Unable to load goals");
        }

        const data = response.data || {};

        currentGoals = data.contents || [];
        totalPages = Number(data.totalPages || 0);
        totalElements = Number(data.totalElements || 0);
        currentPage = Number(data.page ?? currentPage);

        renderGoals(currentGoals);
        renderPagination(data);
        updateSummary(currentGoals);

    } catch (error) {
        console.error("Load goals failed:", error);

        currentGoals = [];
        renderGoals([]);

        showToast(
            error.message || "Failed to load goals",
            "error",
            "Loading Failed"
        );
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    $("loadingState").classList.toggle("hidden", !loading);

    if (loading) {
        $("goalsContainer").classList.add("hidden");
        $("emptyState").classList.add("hidden");
        $("paginationContainer").classList.add("hidden");
    }
}

/* ========================================
   RENDER GOALS
======================================== */

function renderGoals(goals) {
    const container = $("goalsContainer");
    container.innerHTML = "";

    if (!goals || goals.length === 0) {
        container.classList.add("hidden");
        $("emptyState").classList.remove("hidden");
        $("paginationContainer").classList.add("hidden");
        return;
    }

    $("emptyState").classList.add("hidden");
    container.classList.remove("hidden");

    goals.forEach(goal => {
        container.insertAdjacentHTML(
            "beforeend",
            createGoalCard(goal)
        );
    });
}

function createGoalCard(goal) {
    const currentAmount = Number(goal.current_amount || 0);
    const targetAmount = Number(goal.target_amount || 0);

    const percentage = targetAmount > 0
        ? Math.min((currentAmount / targetAmount) * 100, 100)
        : 0;

    const status = goal.status || "IN_PROGRESS";

    const imageUrl = goal.image_url?.trim() || "";

    const imageContent = imageUrl
        ? `
            <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(goal.title)}"
                loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=&quot;goal-image-placeholder&quot;>✦</div>'">
          `
        : `
            <div class="goal-image-placeholder">✦</div>
          `;

    const depositButton = status === "IN_PROGRESS"
        ? `
            <button
                class="btn btn-primary"
                onclick="openDepositModal(${Number(goal.id)})">
                ＋ Deposit
            </button>
          `
        : `
            <button class="btn btn-secondary" disabled>
                ${status === "COMPLETED" ? "Goal Achieved" : "Unavailable"}
            </button>
          `;

    return `
        <article class="goal-card">

            <div class="goal-image">
                ${imageContent}

                <span class="goal-status ${getStatusClass(status)}">
                    ${escapeHtml(getStatusLabel(status))}
                </span>
            </div>

            <div class="goal-content">

                <h3 class="goal-title">
                    ${escapeHtml(goal.title || "Untitled Goal")}
                </h3>

                <p class="goal-description">
                    ${escapeHtml(goal.description || "No description provided.")}
                </p>

                <div class="goal-amounts">
                    <span class="goal-current">
                        ${formatMoney(currentAmount)}
                    </span>

                    <span class="goal-target">
                        of ${formatMoney(targetAmount)}
                    </span>
                </div>

                <div class="goal-progress-track">
                    <div class="goal-progress-bar"
                         style="width: ${percentage}%">
                    </div>
                </div>

                <div class="goal-progress-info">
                    <span>${percentage.toFixed(1)}% completed</span>
                    <span>${formatMoney(Math.max(targetAmount - currentAmount, 0))} left</span>
                </div>

                <div class="goal-actions">
                    ${depositButton}
                </div>

            </div>

        </article>
    `;
}

/* ========================================
   SUMMARY
======================================== */

function updateSummary(goals) {
    let totalSaved = 0;
    let totalTarget = 0;
    let activeCount = 0;
    let completedCount = 0;

    goals.forEach(goal => {
        const current = Number(goal.current_amount || 0);
        const target = Number(goal.target_amount || 0);

        totalSaved += current;
        totalTarget += target;

        if (goal.status === "IN_PROGRESS") {
            activeCount++;
        }

        if (goal.status === "COMPLETED") {
            completedCount++;
        }
    });

    const percentage = totalTarget > 0
        ? Math.min((totalSaved / totalTarget) * 100, 100)
        : 0;

    $("totalSaved").textContent = formatMoney(totalSaved);
    $("activeGoals").textContent = activeCount;
    $("completedGoals").textContent = completedCount;
    $("overallProgress").textContent = `${percentage.toFixed(1)}%`;
}

/* ========================================
   PAGINATION
======================================== */

function renderPagination(data) {
    const pagination = $("paginationContainer");

    const page = Number(data.page ?? 0);
    const size = Number(data.size ?? PAGE_SIZE);
    const total = Number(data.totalElements ?? 0);

    const start = total === 0 ? 0 : page * size + 1;
    const end = Math.min((page + 1) * size, total);

    $("paginationInfo").textContent =
        `Showing ${start}-${end} of ${total} goals`;

    $("pageIndicator").textContent =
        `Page ${totalPages === 0 ? 0 : page + 1} of ${totalPages}`;

    $("previousPage").disabled = !data.hasPrevious;
    $("nextPage").disabled = !data.hasNext;

    pagination.classList.toggle("hidden", total === 0);
}

async function goToPreviousPage() {
    if (currentPage > 0) {
        currentPage--;
        await loadGoals();
    }
}

async function goToNextPage() {
    if (currentPage + 1 < totalPages) {
        currentPage++;
        await loadGoals();
    }
}

/* ========================================
   CREATE GOAL
======================================== */

function openCreateModal() {
    $("createForm").reset();
    hideError("createError");
    $("createModal").classList.remove("hidden");

    setTimeout(() => $("goalTitle").focus(), 100);
}

function closeCreateModal() {
    $("createModal").classList.add("hidden");
}

async function createGoal(event) {
    event.preventDefault();

    hideError("createError");

    const title = $("goalTitle").value.trim();
    const description = $("goalDescription").value.trim();
    const targetAmount = Number($("targetAmount").value);
    const imageUrl = $("goalImage").value.trim();

    if (!title) {
        showError("createError", "Please enter a goal title.");
        return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
        showError("createError", "Target amount must be greater than zero.");
        return;
    }

    const button = $("createSubmitButton");

    button.disabled = true;
    button.textContent = "Creating...";

    const requestBody = {
        title,
        description,
        targetAmount,
        image_url: imageUrl || "n/a"
    };

    try {
        const response = await apiRequest(API.CREATE, requestBody);

        if (response?.response !== "SUCCESS") {
            showToast(
                response?.message || "Unable to create your saving goal.",
                "error",
                "Create Failed"
            );
            return;
        }

        closeCreateModal();
        $("createForm").reset();
        currentPage = 0;

        showToast(
            "Your new saving goal has been created successfully.",
            "success",
            "Goal Created!"
        );

        await loadGoals();

    } catch (error) {
        console.error("Create goal failed:", error);

        showToast(
            error.message || "Failed to create goal.",
            "error",
            "Create Failed"
        );

    } finally {
        button.disabled = false;
        button.textContent = "Create Goal";
    }
}

/* ========================================
   DEPOSIT
======================================== */

function findGoalById(id) {
    return currentGoals.find(goal => Number(goal.id) === Number(id));
}

function openDepositModal(id) {
    const goal = findGoalById(id);

    if (!goal) {
        showToast(
            "Goal not found. Please refresh and try again.",
            "error",
            "Goal Not Found"
        );        return;
    }

    if (goal.status !== "IN_PROGRESS") {
        showToast(
            "This goal cannot receive deposits.",
            "warning",
            "Deposit Unavailable"
        );
        return;
    }

    $("depositForm").reset();
    hideError("depositError");

    $("depositGoalId").value = goal.id;
    $("depositGoalTitle").textContent = goal.title || "Savings Goal";

    $("depositCurrentAmount").textContent =
        formatMoney(goal.current_amount);

    $("depositTargetAmount").textContent =
        formatMoney(goal.target_amount);

    $("depositModal").classList.remove("hidden");

    setTimeout(() => $("depositAmount").focus(), 100);
}

function closeDepositModal() {
    $("depositModal").classList.add("hidden");
}

async function submitDeposit(event) {
    event.preventDefault();

    hideError("depositError");

    const oscId = Number($("depositGoalId").value);
    const currency = $("depositCurrency").value;
    const amount = Number($("depositAmount").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        showError("depositError", "Deposit amount must be greater than zero.");
        return;
    }

    const goal = findGoalById(oscId);

    if (!goal) {
        showError("depositError", "Goal not found. Please refresh.");
        return;
    }

    const button = $("depositSubmitButton");

    button.disabled = true;
    button.textContent = "Processing...";

    const requestBody = {
        oscId,
        currency,
        amount
    };

    try {
        const response = await apiRequest(API.DEPOSIT, requestBody);

        if (response?.response !== "SUCCESS") {
            showToast(
                response?.message || "Your deposit could not be completed.",
                "error",
                "Deposit Failed"
            );
            return;
        }

        closeDepositModal();
        $("depositForm").reset();

        await loadGoals();

        if (response.status === "COMPLETED") {
            showCompletionModal(goal.title);
        } else {
            showToast(
                "Your money has been added to this saving goal.",
                "success",
                "Deposit Successful!"
            );
        }

    } catch (error) {
        console.error("Deposit failed:", error);

        showToast(
            error.message || "Failed to process deposit.",
            "error",
            "Deposit Failed"
        );

    } finally {
        button.disabled = false;
        button.textContent = "Confirm Deposit";
    }
}

/* ========================================
   TOAST
======================================== */

function hideToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.classList.remove("show");

    clearTimeout(toastTimer);
}

function showToast(message, type = "success", title = null) {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast) return;

    const configs = {
        success: {
            icon: "✓",
            title: title || "Success"
        },
        error: {
            icon: "✕",
            title: title || "Something went wrong"
        },
        warning: {
            icon: "!",
            title: title || "Warning"
        }
    };

    const config = configs[type] || configs.success;

    toast.classList.remove("success", "error", "warning");
    toast.classList.add(type);

    toastIcon.textContent = config.icon;
    toastTitle.textContent = config.title;
    toastMessage.textContent = message;

    // Reset existing timer
    clearTimeout(toastTimer);

    // Show notification
    toast.classList.add("show");

    // Automatically hide after 4 seconds
    toastTimer = setTimeout(() => {
        hideToast();
    }, 4000);
}

function showCompletionModal(goalTitle) {
    const modal = $("completionModal");
    const title = $("completedGoalTitle");
    const confettiContainer = $("completionConfetti");

    title.textContent = goalTitle || "Your Saving Goal";

    // Clear previous confetti
    confettiContainer.innerHTML = "";

    const colors = [
        "#38d9a2",
        "#72a7ff",
        "#b69cff",
        "#ffbb75",
        "#ff727b",
        "#f5d76e"
    ];

    // Generate confetti
    for (let i = 0; i < 65; i++) {
        const piece = document.createElement("span");

        piece.className = "confetti-piece";
        piece.style.setProperty("--left", `${Math.random() * 100}%`);
        piece.style.setProperty(
            "--confetti-color",
            colors[Math.floor(Math.random() * colors.length)]
        );
        piece.style.setProperty(
            "--duration",
            `${2 + Math.random() * 2}s`
        );
        piece.style.setProperty(
            "--delay",
            `${Math.random() * 0.8}s`
        );

        confettiContainer.appendChild(piece);
    }

    modal.classList.add("show");
}

function hideCompletionModal() {
    $("completionModal").classList.remove("show");
}

/* ========================================
   MODAL EVENTS
======================================== */

function closeModal(modalId) {
    $(modalId).classList.add("hidden");
}

function initializeModalEvents() {
    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });

    ["createModal", "depositModal"].forEach(modalId => {
        const modal = $(modalId);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal("createModal");
            closeModal("depositModal");
        }
    });
}

/* ========================================
   FILTERS
======================================== */

let searchTimer = null;

function initializeFilters() {
    $("searchInput").addEventListener("input", () => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            currentPage = 0;
            loadGoals();
        }, 350);
    });

    $("statusFilter").addEventListener("change", () => {
        currentPage = 0;
        loadGoals();
    });

    $("sortDirection").addEventListener("change", () => {
        currentPage = 0;
        loadGoals();
    });
}

/* ========================================
   INITIALIZATION
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    $("openCreateModal").addEventListener("click", openCreateModal);
    $("emptyCreateButton").addEventListener("click", openCreateModal);

    $("createForm").addEventListener("submit", createGoal);
    $("depositForm").addEventListener("submit", submitDeposit);

    $("previousPage").addEventListener("click", goToPreviousPage);
    $("nextPage").addEventListener("click", goToNextPage);

    initializeModalEvents();
    initializeFilters();

    loadGoals();
});