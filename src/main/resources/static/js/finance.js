
document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const monthSelector = document.getElementById("monthSelector");
    const transactionTable = document.getElementById("transactionTable");

    const transactionModal = document.getElementById("transactionModal");
    const deleteModal = document.getElementById("deleteModal");

    const transactionForm = document.getElementById("transactionForm");

    const transactionNo = document.getElementById("transactionNo");
    const categoryInput = document.getElementById("transactionCategory");
    const typeInput = document.getElementById("transactionType");
    const amountInput = document.getElementById("transactionAmount");
    const currencyInput = document.getElementById("transactionCurrency");
    const remarkInput = document.getElementById("transactionRemark");

    const saveButton = document.getElementById("saveTransaction");
    const confirmDeleteButton = document.getElementById("confirmDelete");

    let editingRecord = false;
    let deletingRecordNo = null;

    let currentRecords = [];


    // =====================================================
    // API CONFIGURATION
    // =====================================================

    const API = {
        query: "/finance/query",
        create: "/finance/create",
        update: "/finance/update",
        delete: "/finance/delete"
    };

    function getSelectedMonth() {
        return monthSelector.value ||
            new Date().toLocaleDateString("en-CA").slice(0, 7);
    }

    function buildMonthUrl(endpoint, month) {
        return `${endpoint}?month=${encodeURIComponent(month)}`;
    }

    function getCsrfHeaders() {
        const headers = {};

        const csrfToken = document.querySelector(
            'meta[name="_csrf"]'
        )?.content;

        const csrfHeader = document.querySelector(
            'meta[name="_csrf_header"]'
        )?.content;

        if (csrfToken && csrfHeader) {
            headers[csrfHeader] = csrfToken;
        }

        return headers;
    }

    async function getErrorMessage(response) {
        try {
            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const data = await response.json();

                return data.message ||
                    data.error ||
                    `Request failed (${response.status})`;
            }

            const text = await response.text();

            return text && !text.trim().startsWith("<")
                ? text
                : `Request failed (${response.status})`;
        } catch {
            return `Request failed (${response.status})`;
        }
    }

    async function apiRequest(url, options = {}) {

        const headers = {
            ...getCsrfHeaders(),
            ...(options.headers || {})
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        return response;
    }


    // =====================================================
    // THEME
    // =====================================================

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    function applyTheme(theme) {

        const isLight = theme === "light";

        document.body.classList.toggle("light-theme", isLight);

        themeIcon.textContent = isLight ? "☀️" : "🌙";
        themeLabel.textContent = isLight ? "Light mode" : "Dark mode";
    }

    applyTheme("dark");

    themeToggle.addEventListener("click", () => {

        const isLight = document.body.classList.contains("light-theme");

        applyTheme(isLight ? "dark" : "light");
    });


    // =====================================================
    // FORMATTERS
    // =====================================================

    function formatAmount(amount, currency) {

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return "-";
        }

        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: currency === "USD" ? 2 : 0,
            maximumFractionDigits: currency === "USD" ? 2 : 0
        }).format(value);
    }

    function formatCurrency(amount, currency) {

        const formatted = formatAmount(amount, currency);

        return currency === "USD"
            ? `$${formatted}`
            : `${formatted} ${currency}`;
    }

    function formatMonth(month) {

        if (!month) {
            return "";
        }

        const [year, monthNumber] = month.split("-");

        const date = new Date(
            Number(year),
            Number(monthNumber) - 1,
            1
        );

        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });
    }


    // =====================================================
    // SUMMARY CALCULATION
    // =====================================================

    function calculateSummary(records) {

        const credit = {};
        const debit = {};

        const currencies = new Set();

        records.forEach(record => {

            const currency = record.currency;
            const amount = Number(record.amount) || 0;

            currencies.add(currency);

            if (record.type === "C") {
                credit[currency] = (credit[currency] || 0) + amount;
            }

            if (record.type === "D") {
                debit[currency] = (debit[currency] || 0) + amount;
            }
        });

        renderCurrencyBreakdown(
            document.getElementById("creditBreakdown"),
            credit,
            "credit"
        );

        renderCurrencyBreakdown(
            document.getElementById("debitBreakdown"),
            debit,
            "debit"
        );

        document.getElementById("totalTransactions").textContent =
            records.length;

        document.getElementById("totalCurrencies").textContent =
            currencies.size;
    }

    function renderCurrencyBreakdown(container, totals, type) {

        container.replaceChildren();

        const entries = Object.entries(totals)
            .sort(([currencyA], [currencyB]) =>
                currencyA.localeCompare(currencyB)
            );

        if (entries.length === 0) {

            const empty = document.createElement("span");
            empty.className = "summary-empty";
            empty.textContent = type === "credit"
                ? "No income yet"
                : "No expenses yet";

            container.appendChild(empty);
            return;
        }

        entries.forEach(([currency, amount]) => {

            const row = document.createElement("div");
            row.className = "currency-total";

            const label = document.createElement("span");
            label.textContent = currency;

            const value = document.createElement("strong");
            value.textContent = formatCurrency(amount, currency);

            row.append(label, value);
            container.appendChild(row);
        });
    }


    // =====================================================
    // TABLE RENDERING
    // =====================================================

    function renderTransactionTable(records) {

        transactionTable.replaceChildren();

        if (!records || records.length === 0) {

            const row = document.createElement("tr");
            row.className = "empty-row";

            const cell = document.createElement("td");
            cell.colSpan = 8;

            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const icon = document.createElement("div");
            icon.className = "empty-state-icon";
            icon.textContent = "↗";

            const title = document.createElement("h3");
            title.textContent = "No transactions found";

            const description = document.createElement("p");
            description.textContent =
                "Add your first transaction to get started.";

            emptyState.append(icon, title, description);
            cell.appendChild(emptyState);
            row.appendChild(cell);
            transactionTable.appendChild(row);

            updateTableCount(0);
            return;
        }

        records.forEach(record => {

            const row = document.createElement("tr");

            row.dataset.no = record.no;
            row.dataset.category = record.category;
            row.dataset.type = record.type;
            row.dataset.amount = record.amount;
            row.dataset.currency = record.currency;
            row.dataset.remark = record.remark || "";
            row.dataset.date = record.date || "";

            appendCell(row, record.no);
            appendCell(row, record.date);

            const categoryCell = document.createElement("td");

            const categoryLabel = document.createElement("span");
            categoryLabel.className = "category-label";
            categoryLabel.textContent = record.category;

            categoryCell.appendChild(categoryLabel);
            row.appendChild(categoryCell);


            // Credit / Debit badge
            const typeCell = document.createElement("td");

            const badge = document.createElement("span");
            badge.className = record.type === "C"
                ? "type-badge credit"
                : "type-badge debit";

            badge.textContent = record.type === "C"
                ? "Credit"
                : "Debit";

            typeCell.appendChild(badge);
            row.appendChild(typeCell);


            // Remark
            const remarkCell = document.createElement("td");
            remarkCell.className = "remark-cell";
            remarkCell.textContent = record.remark || "-";
            row.appendChild(remarkCell);


            // Amount
            const amountCell = document.createElement("td");
            amountCell.className = "amount-cell text-right";
            amountCell.textContent = formatAmount(
                record.amount,
                record.currency
            );
            row.appendChild(amountCell);


            // Currency
            const currencyCell = document.createElement("td");

            const currencyLabel = document.createElement("span");
            currencyLabel.className = "currency-label";
            currencyLabel.textContent = record.currency;

            currencyCell.appendChild(currencyLabel);
            row.appendChild(currencyCell);


            // Actions
            const actionCell = document.createElement("td");

            const actions = document.createElement("div");
            actions.className = "action-buttons";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "edit-button";
            editButton.textContent = "Edit";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";

            actions.append(editButton, deleteButton);
            actionCell.appendChild(actions);
            row.appendChild(actionCell);

            transactionTable.appendChild(row);
        });

        updateTableCount(records.length);
        applyTransactionFilters();
    }

    function appendCell(row, value) {

        const cell = document.createElement("td");
        cell.textContent = value ?? "-";

        row.appendChild(cell);
    }

    function updateTableCount(count) {

        document.getElementById("tableRecordCount").textContent =
            `${count} transaction${count === 1 ? "" : "s"}`;
    }


    // =====================================================
    // FILTERING
    // =====================================================

    function applyTransactionFilters() {

        const searchValue = document.getElementById("searchInput")
            .value.trim().toLowerCase();

        const selectedType = document.getElementById("typeFilter").value;

        const selectedCurrency =
            document.getElementById("currencyFilter").value;

        let visibleCount = 0;

        transactionTable
            .querySelectorAll("tr[data-no]")
            .forEach(row => {

                const matchesSearch =
                    row.textContent.toLowerCase().includes(searchValue);

                const matchesType =
                    !selectedType || row.dataset.type === selectedType;

                const matchesCurrency =
                    !selectedCurrency ||
                    row.dataset.currency === selectedCurrency;

                const visible =
                    matchesSearch && matchesType && matchesCurrency;

                row.hidden = !visible;

                if (visible) {
                    visibleCount++;
                }
            });

        updateTableCount(visibleCount);
    }

    document.getElementById("searchInput")
        .addEventListener("input", applyTransactionFilters);

    document.getElementById("typeFilter")
        .addEventListener("change", applyTransactionFilters);

    document.getElementById("currencyFilter")
        .addEventListener("change", applyTransactionFilters);

    document.getElementById("clearFilters")
        .addEventListener("click", () => {

            document.getElementById("searchInput").value = "";
            document.getElementById("typeFilter").value = "";
            document.getElementById("currencyFilter").value = "";

            applyTransactionFilters();
        });


    // =====================================================
    // MONTHLY HISTORY
    // =====================================================

    async function loadFinanceHistory(month) {

        const response = await apiRequest(
            buildMonthUrl(API.query, month),
            { method: "GET" }
        );

        const data = await response.json();

        currentRecords = data.records || [];

        renderTransactionTable(currentRecords);
        calculateSummary(currentRecords);

        document.getElementById("selectedMonthLabel").textContent =
            formatMonth(month);
    }

    monthSelector.addEventListener("change", async () => {

        try {
            await loadFinanceHistory(getSelectedMonth());
        } catch (error) {
            console.error("Unable to load monthly history:", error);
            showNotification(error.message, "error");
        }
    });

    function hideFormError() {
        const formError = document.getElementById("formError");

        if (formError) {
            formError.textContent = "";
            formError.hidden = true;
        }
    }

    function showFormError(message) {
        const formError = document.getElementById("formError");

        if (formError) {
            formError.textContent = message;
            formError.hidden = false;
        }
    }


    // =====================================================
    // CREATE MODAL
    // =====================================================
    function getTodayDate() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function openTransactionModal() {

        transactionModal.classList.add("active");
        transactionModal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";

        setTimeout(() => categoryInput.focus(), 100);
    }

    function closeTransactionModal() {

        transactionModal.classList.remove("active");
        transactionModal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        transactionForm.reset();
        transactionNo.value = "";

        hideFormError();
    }

    function resetCreateForm() {
        const form = document.getElementById("transactionForm");

        form.reset();

        document.getElementById("transactionNo").value = "";
        document.getElementById("transactionDate").value = getTodayDate();

        document.getElementById("modalTitle").textContent =
            "Create Transaction";

        document.getElementById("modalSubtitle").textContent =
            "Add a new financial record.";

        document.getElementById("saveTransaction").textContent =
            "Save Transaction";

        editingRecord = false;

        hideFormError();
    }

    document.getElementById("createTransactionButton")
        .addEventListener("click", () => {

            resetCreateForm();
            openTransactionModal();
        });


    // =====================================================
    // EDIT MODAL
    // =====================================================

    function openEditForm(record) {

        if (!record) {
            console.error("Cannot edit transaction: record is undefined.");
            return;
        }

        editingRecord = true;

        document.getElementById("transactionNo").value = record.no;
        document.getElementById("transactionCategory").value = record.category;
        document.getElementById("transactionType").value = record.type;
        document.getElementById("transactionAmount").value = record.amount;
        document.getElementById("transactionCurrency").value = record.currency;
        document.getElementById("transactionRemark").value = record.remark || "";
        document.getElementById("transactionDate").value = record.date || getTodayDate();

        document.getElementById("modalTitle").textContent = "Update Transaction";

        document.getElementById("modalSubtitle").textContent =
            `Editing transaction No. ${record.no}`;

        document.getElementById("saveTransaction").textContent =
            "Update Transaction";

        hideFormError();
        openTransactionModal();
    }

    transactionTable.addEventListener("click", event => {

        const editButton = event.target.closest(".edit-button");
        const deleteButton = event.target.closest(".delete-button");

        if (editButton) {

            const row = editButton.closest("tr");

            const record = currentRecords.find(
                item => String(item.no) === String(row.dataset.no)
            );

            if (record) {
                openEditForm(record);
            }
        }

        if (deleteButton) {

            const row = deleteButton.closest("tr");
            openDeleteModal(row.dataset.no);
        }
    });


    // =====================================================
    // CREATE / UPDATE API
    // =====================================================

    transactionForm.addEventListener("submit", async event => {

        event.preventDefault();
        hideFormError();

        const amount = Number(amountInput.value);

        if (!categoryInput.value) {
            showFormError("Please select a category.");
            return;
        }

        if (!typeInput.value) {
            showFormError("Please select a transaction type.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showFormError("Amount must be greater than zero.");
            return;
        }

        if (!currencyInput.value) {
            showFormError("Please select a currency.");
            return;
        }

        const month = getSelectedMonth();

        const request = {
            category: categoryInput.value,
            type: typeInput.value,
            amount: amount,
            currency: currencyInput.value,
            date: document.getElementById("transactionDate").value || getTodayDate(),
            remark: remarkInput.value.trim()
        };

        let endpoint;
        let method;

        if (editingRecord) {

            request.no = Number(transactionNo.value);

            endpoint = API.update;
            method = "POST";

        } else {

            endpoint = API.create;
            method = "POST";
        }

        saveButton.disabled = true;
        saveButton.textContent = editingRecord
            ? "Updating..."
            : "Saving...";

        try {

            await apiRequest(
                buildMonthUrl(endpoint, month),
                {
                    method,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(request)
                }
            );

            closeTransactionModal();

            await loadFinanceHistory(month);

            showNotification(
                editingRecord
                    ? "Transaction updated successfully."
                    : "Transaction created successfully.",
                "success"
            );

        } catch (error) {

            console.error("Transaction save failed:", error);
            showFormError(error.message || "Unable to save transaction.");

        } finally {

            saveButton.disabled = false;

            saveButton.textContent = editingRecord
                ? "Update Transaction"
                : "Save Transaction";
        }
    });


    // =====================================================
    // DELETE MODAL
    // =====================================================

    function openDeleteModal(no) {

        deletingRecordNo = no;

        document.getElementById("deleteRecordNo").textContent = no;

        document.getElementById("deleteError").hidden = true;

        deleteModal.classList.add("active");
        deleteModal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
    }

    function closeDeleteModal() {

        deleteModal.classList.remove("active");
        deleteModal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        deletingRecordNo = null;
    }


    // =====================================================
    // DELETE API
    // =====================================================

    confirmDeleteButton.addEventListener("click", async () => {

        if (deletingRecordNo === null) {
            return;
        }

        const month = getSelectedMonth();
        const no = deletingRecordNo;

        confirmDeleteButton.disabled = true;
        confirmDeleteButton.textContent = "Deleting...";

        try {

            await apiRequest(
                `${API.delete}/${encodeURIComponent(no)}?month=${encodeURIComponent(month)}`,
                {
                    method: "POST"
                }
            );

            closeDeleteModal();

            await loadFinanceHistory(month);

            showNotification(
                "Transaction deleted successfully.",
                "success"
            );

        } catch (error) {

            console.error("Transaction delete failed:", error);

            const errorElement =
                document.getElementById("deleteError");

            errorElement.textContent =
                error.message || "Unable to delete transaction.";

            errorElement.hidden = false;

        } finally {

            confirmDeleteButton.disabled = false;
            confirmDeleteButton.textContent = "Delete Transaction";
        }
    });


    // =====================================================
    // MODAL CLOSE EVENTS
    // =====================================================

    document.getElementById("closeTransactionModal")
        .addEventListener("click", closeTransactionModal);

    document.getElementById("cancelTransaction")
        .addEventListener("click", closeTransactionModal);

    document.getElementById("modalBackdrop")
        .addEventListener("click", closeTransactionModal);

    document.getElementById("cancelDelete")
        .addEventListener("click", closeDeleteModal);

    document.getElementById("deleteBackdrop")
        .addEventListener("click", closeDeleteModal);

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            if (transactionModal.classList.contains("active")) {
                closeTransactionModal();
            }

            if (deleteModal.classList.contains("active")) {
                closeDeleteModal();
            }
        }
    });


    // =====================================================
    // NOTIFICATION
    // =====================================================

    function showNotification(message, type = "success") {

        let notification = document.getElementById("financeNotification");

        if (!notification) {

            notification = document.createElement("div");
            notification.id = "financeNotification";
            notification.className = "finance-notification";

            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `finance-notification ${type} show`;

        clearTimeout(notification.hideTimeout);

        notification.hideTimeout = setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }


    // =====================================================
    // INITIALIZE DASHBOARD
    // =====================================================

    async function initializeDashboard() {

        try {

            await loadFinanceHistory(getSelectedMonth());

        } catch (error) {

            console.error("Dashboard initialization failed:", error);

            // Keep server-rendered rows visible if the API fails.
            const initialRecords = Array.from(
                transactionTable.querySelectorAll("tr[data-no]")
            ).map(row => ({
                no: row.dataset.no,
                category: row.dataset.category,
                type: row.dataset.type,
                amount: Number(row.dataset.amount),
                currency: row.dataset.currency,
                remark: row.dataset.remark,
                date: row.dataset.date
            }));

            currentRecords = initialRecords;

            calculateSummary(initialRecords);
            updateTableCount(initialRecords.length);

            document.getElementById("selectedMonthLabel").textContent =
                formatMonth(getSelectedMonth());

            showNotification(
                "Could not refresh records from the server.",
                "error"
            );
        }
    }

    initializeDashboard();

});
