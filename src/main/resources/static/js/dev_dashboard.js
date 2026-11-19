document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // =========================
    // ELEMENTS
    // =========================

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const suggestionList = document.getElementById("suggestionList");
    const suggestionResults = document.getElementById("suggestionResults");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    const tableSection = document.getElementById("libraryTableSection");
    const tableBody = document.getElementById("libraryTableBody");
    const libraryCount = document.getElementById("libraryCount");

    const saveModal = document.getElementById("saveModal");
    const createItemButton = document.getElementById("createItemButton");
    const closeSaveModal = document.getElementById("closeSaveModal");
    const cancelSaveButton = document.getElementById("cancelSaveButton");
    const libraryForm = document.getElementById("libraryForm");
    const saveModalTitle = document.getElementById("saveModalTitle");
    const submitSaveButton = document.getElementById("submitSaveButton");

    // Form fields
    const formItemId = document.getElementById("formItemId");
    const formTitle = document.getElementById("formTitle");
    const formCategory = document.getElementById("formCategory");
    const formDescription = document.getElementById("formDescription");
    const formAlias = document.getElementById("formAlias");
    const formTags = document.getElementById("formTags");
    const formContent = document.getElementById("formContent");

    // Detail modal elements
    const detailModal = document.getElementById("detailModal");
    const closeDetailModal = document.getElementById("closeDetailModal");
    const closeDetailFooter = document.getElementById("closeDetailFooter");
    const copyContentButton = document.getElementById("copyContentButton");

    // Check libraryItems from Thymeleaf
    if (typeof libraryItems === "undefined" || !Array.isArray(libraryItems)) {
        console.error("libraryItems is missing or is not an array. Check home.html.");
        return;
    }

    console.log("libraryItem " + JSON.stringify(libraryItems))
    let filteredItems = [];
    let selectedIndex = -1;
    let currentItem = null;

    // =========================
    // HELPER FUNCTIONS
    // =========================

    function setBodyScrollLocked(locked) {
        document.body.style.overflow = locked ? "hidden" : "";
    }

    function normalizeArray(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim()) {
            return value.split(",").map(part => part.trim()).filter(Boolean);
        }

        return [];
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "Not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleString();
    }

    function getCategoryIcon(category) {
        switch ((category || "").toLowerCase()) {
            case "sql":
            case "postgresql":
                return "🗄️";

            case "java":
                return "☕";

            case "api":
            case "apis":
                return "🔌";

            case "javascript":
            case "js":
                return "🟨";

            case "notes":
                return "📝";

            default:
                return "📄";
        }
    }

    function parseApiResponse(response, responseText) {
        if (!responseText || !responseText.trim()) {
            return null;
        }

        try {
            return JSON.parse(responseText);
        } catch (error) {
            console.error("API returned a non-JSON response:", responseText);

            const contentType = response.headers.get("content-type") || "unknown";
            const preview = responseText.trim().slice(0, 180).replace(/\s+/g, " ");

            throw new Error(
                `The server returned HTML or invalid JSON (HTTP ${response.status}, ${contentType}). ` +
                `Check the API URL and Spring Boot controller. Response: ${preview}`
            );
        }
    }

    function getSavedItemFromResponse(payload) {
        // Supports direct LibraryItem or { item: LibraryItem }
        if (payload && typeof payload === "object" && payload.item) {
            return payload.item;
        }

        return payload;
    }

    // =========================
    // THEME
    // =========================

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        if (themeIcon) {
            themeIcon.textContent = isDark ? "☀️" : "🌙";
        }

        if (themeLabel) {
            themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
        }
    }

    const savedTheme = localStorage.getItem("devLibraryTheme") || "light";

    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isDark = document.body.classList.contains("dark-mode");
            const newTheme = isDark ? "light" : "dark";

            applyTheme(newTheme);
            localStorage.setItem("devLibraryTheme", newTheme);
        });
    }

    // =========================
    // SEARCH SUGGESTIONS
    // =========================

    function closeSuggestions() {
        if (suggestionList) {
            suggestionList.classList.remove("active");
        }

        selectedIndex = -1;
    }

    function openSuggestions() {
        if (suggestionList) {
            suggestionList.classList.add("active");
        }
    }

    function createSuggestion(item, index) {
        const suggestion = document.createElement("div");

        suggestion.className = "suggestion-item";
        suggestion.dataset.index = String(index);

        const icon = document.createElement("div");
        icon.className = "suggestion-icon";
        icon.textContent = getCategoryIcon(item.category);

        const details = document.createElement("div");
        details.className = "suggestion-details";

        const title = document.createElement("div");
        title.className = "suggestion-title";
        title.textContent = item.title || "Untitled";

        const description = document.createElement("div");
        description.className = "suggestion-description";
        description.textContent = item.description || "No description available";

        details.appendChild(title);
        details.appendChild(description);

        const category = document.createElement("div");
        category.className = "suggestion-category";
        category.textContent = item.category || "General";

        suggestion.appendChild(icon);
        suggestion.appendChild(details);
        suggestion.appendChild(category);

        suggestion.addEventListener("click", function () {
            selectSuggestion(index);
        });

        return suggestion;
    }

    function renderSuggestions(keyword) {
        if (!suggestionResults) {
            return;
        }

        suggestionResults.innerHTML = "";

        filteredItems = [];
        selectedIndex = -1;

        if (!keyword.trim()) {
            closeSuggestions();
            return;
        }

        const searchKeyword = keyword.toLowerCase();

        filteredItems = libraryItems.filter(item => {
            const title = (item.title || "").toLowerCase();
            const category = (item.category || "").toLowerCase();
            const description = (item.description || "").toLowerCase();
            const aliases = normalizeArray(item.alias).join(" ").toLowerCase();
            const tags = normalizeArray(item.tags).join(" ").toLowerCase();

            return title.includes(searchKeyword)
                || category.includes(searchKeyword)
                || description.includes(searchKeyword)
                || aliases.includes(searchKeyword)
                || tags.includes(searchKeyword);
        });

        if (filteredItems.length === 0) {
            const empty = document.createElement("div");
            empty.className = "suggestion-empty";

            const icon = document.createElement("div");
            icon.className = "suggestion-empty-icon";
            icon.textContent = "🔍";

            const title = document.createElement("div");
            title.className = "suggestion-empty-title";
            title.textContent = "No results found";

            const description = document.createElement("div");
            description.className = "suggestion-empty-description";
            description.textContent = "Try another keyword.";

            empty.appendChild(icon);
            empty.appendChild(title);
            empty.appendChild(description);

            suggestionResults.appendChild(empty);

            openSuggestions();
            return;
        }

        filteredItems.slice(0, 8).forEach((item, index) => {
            const suggestion = createSuggestion(item, index);
            suggestionResults.appendChild(suggestion);
        });

        openSuggestions();
    }

    function selectSuggestion(index) {
        const item = filteredItems[index];

        if (!item) {
            return;
        }

        if (searchInput) {
            searchInput.value = item.title || "";
            searchInput.focus();
        }

        closeSuggestions();

        document.dispatchEvent(
            new CustomEvent("library:item-selected", {
                detail: item
            })
        );
    }

    function updateSelectedItem() {
        if (!suggestionResults) {
            return;
        }

        const suggestions = suggestionResults.querySelectorAll(".suggestion-item");

        suggestions.forEach((element, index) => {
            element.classList.toggle("selected", index === selectedIndex);
        });

        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            suggestions[selectedIndex].scrollIntoView({
                block: "nearest"
            });
        }
    }

    // =========================
    // SEARCH
    // =========================

    function performSearch() {
        if (!searchInput) {
            return;
        }

        const keyword = searchInput.value.trim();

        if (!keyword) {
            searchInput.focus();
            showAllItems();
            return;
        }

        const matchingItem = libraryItems.find(item =>
            (item.title || "").toLowerCase() === keyword.toLowerCase()
        );

        if (matchingItem) {
            closeSuggestions();

            document.dispatchEvent(
                new CustomEvent("library:item-selected", {
                    detail: matchingItem
                })
            );
        } else {
            renderSuggestions(keyword);
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderSuggestions(this.value);
        });

        searchInput.addEventListener("keydown", function (event) {
            const isOpen = suggestionList &&
                suggestionList.classList.contains("active");

            if (event.key === "ArrowDown" && isOpen && filteredItems.length > 0) {
                event.preventDefault();

                selectedIndex = Math.min(
                    selectedIndex + 1,
                    Math.min(filteredItems.length, 8) - 1
                );

                updateSelectedItem();

            } else if (event.key === "ArrowUp" && isOpen && filteredItems.length > 0) {
                event.preventDefault();

                selectedIndex = Math.max(selectedIndex - 1, 0);

                updateSelectedItem();

            } else if (event.key === "Enter") {
                if (isOpen && selectedIndex >= 0) {
                    event.preventDefault();
                    selectSuggestion(selectedIndex);
                } else {
                    event.preventDefault();
                    performSearch();
                }

            } else if (event.key === "Escape") {
                closeSuggestions();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener("click", performSearch);
    }

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".search-wrapper")) {
            closeSuggestions();
        }
    });

    // =========================
    // DETAIL MODAL
    // =========================

    function normalizeCodeIndent(code) {
        if (!code) return "";

        const lines = code.replace(/\r\n/g, "\n").split("\n");

        // Remove empty lines at the beginning and end
        while (lines.length && !lines[0].trim()) {
            lines.shift();
        }

        while (lines.length && !lines[lines.length - 1].trim()) {
            lines.pop();
        }

        // Find the minimum indentation among non-empty lines
        const indentation = lines
            .filter(line => line.trim())
            .map(line => line.match(/^[\t ]*/)[0].replace(/\t/g, "    ").length);

        const minIndent = Math.min(...indentation);

        return lines.map(line => {
            if (!line.trim()) return "";

            let currentIndent = 0;
            let index = 0;

            while (index < line.length && currentIndent < minIndent) {
                if (line[index] === "\t") {
                    currentIndent += 4;
                } else if (line[index] === " ") {
                    currentIndent++;
                } else {
                    break;
                }
                index++;
            }

            return line.substring(index);
        }).join("\n");
    }

    function renderChips(elementId, values) {
        const container = document.getElementById(elementId);

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const normalizedValues = normalizeArray(values);

        if (normalizedValues.length === 0) {
            const empty = document.createElement("span");

            empty.className = "detail-empty";
            empty.textContent = "No information available";

            container.appendChild(empty);
            return;
        }

        normalizedValues.forEach(value => {
            const chip = document.createElement("span");

            chip.className = "detail-chip";
            chip.textContent = value;

            container.appendChild(chip);
        });
    }

    function openDetailModal(item) {
        if (!item || !detailModal) {
            return;
        }

        currentItem = item;

        function setText(elementId, value) {
            const element = document.getElementById(elementId);

            if (element) {
                element.textContent = value;
            }
        }

        setText("detailId", item.id || "N/A");
        setText("detailTitle", item.title || "Untitled");
        setText("detailCategory", item.category || "General");

        setText(
            "detailDescription",
            item.description || "No description available"
        );

        renderChips("detailAliases", item.alias);
        renderChips("detailTags", item.tags);

        setText("detailContent", normalizeCodeIndent(item.content || "No content available"));
        setText("detailCreatedAt", formatDate(item.createdAt));
        setText("detailUpdatedAt", formatDate(item.updatedAt));

        setText(
            "detailFooterId",
            "Item ID: " + (item.id || "N/A")
        );

        detailModal.classList.add("active");

        setBodyScrollLocked(true);
    }

    function hideDetailModal() {
        if (detailModal) {
            detailModal.classList.remove("active");
        }

        currentItem = null;

        setBodyScrollLocked(
            Boolean(saveModal && saveModal.classList.contains("active"))
        );
    }

    document.addEventListener("library:item-selected", function (event) {
        openDetailModal(event.detail);
    });

    if (closeDetailModal) {
        closeDetailModal.addEventListener("click", hideDetailModal);
    }

    if (closeDetailFooter) {
        closeDetailFooter.addEventListener("click", hideDetailModal);
    }

    if (detailModal) {
        detailModal.addEventListener("click", function (event) {
            if (event.target === detailModal) {
                hideDetailModal();
            }
        });
    }

    // Copy content
    if (copyContentButton) {
        copyContentButton.addEventListener("click", async function () {
            if (!currentItem || !currentItem.content) {
                return;
            }

            try {
                await navigator.clipboard.writeText(currentItem.content);

                copyContentButton.textContent = "Copied!";

                setTimeout(() => {
                    copyContentButton.textContent = "Copy content";
                }, 1500);

            } catch (error) {
                console.error("Unable to copy content:", error);
                copyContentButton.textContent = "Copy failed";
            }
        });
    }

    // =========================
    // LIBRARY TABLE
    // =========================

    function createActionButton(label, className, onClick) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = label;
        button.className = className;

        button.addEventListener("click", function (event) {
            event.stopPropagation();
            onClick();
        });

        return button;
    }

    function showAllItems() {
        if (!tableSection || !tableBody || !libraryCount) {
            return;
        }

        tableSection.hidden = false;
        tableBody.innerHTML = "";

        libraryCount.textContent = `${libraryItems.length} items`;

        if (libraryItems.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "No library items found.";
            cell.className = "empty-table";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        libraryItems.forEach(item => {
            const row = document.createElement("tr");

            // Title
            const titleCell = document.createElement("td");
            titleCell.textContent = item.title || "-";

            // Category
            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category || "-";

            // Description
            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = item.description || "-";

            // Updated date
            const updatedCell = document.createElement("td");

            updatedCell.textContent = item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString()
                : "-";

            // Action buttons
            const actionCell = document.createElement("td");

            const viewButton = createActionButton(
                "View",
                "view-button",
                () => openDetailModal(item)
            );

            const editButton = createActionButton(
                "Edit",
                "view-button",
                () => openEditModal(item)
            );

            const deleteButton = createActionButton(
                "Delete",
                "view-button",
                () => deleteItem(item.id)
            );

            actionCell.appendChild(viewButton);
            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(titleCell);
            row.appendChild(categoryCell);
            row.appendChild(descriptionCell);
            row.appendChild(updatedCell);
            row.appendChild(actionCell);

            row.addEventListener("click", function () {
                openDetailModal(item);
            });

            tableBody.appendChild(row);
        });
    }

    // =========================
    // CREATE / EDIT MODAL
    // =========================

    function openCreateModal() {
        if (!libraryForm || !saveModal) {
            return;
        }

        libraryForm.reset();

        formItemId.value = "";

        saveModalTitle.textContent = "Create New Item";
        submitSaveButton.textContent = "Save Item";

        saveModal.classList.add("active");
        saveModal.setAttribute("aria-hidden", "false");

        setBodyScrollLocked(true);

        formTitle.focus();
    }

    function openEditModal(item) {
        if (!item || !libraryForm || !saveModal) {
            return;
        }

        formItemId.value = item.id || "";
        formTitle.value = item.title || "";
        formCategory.value = item.category || "";
        formDescription.value = item.description || "";

        formAlias.value = normalizeArray(item.alias).join(", ");
        formTags.value = normalizeArray(item.tags).join(", ");

        formContent.value = item.content || "";

        saveModalTitle.textContent = "Update Item";
        submitSaveButton.textContent = "Update Item";

        saveModal.classList.add("active");
        saveModal.setAttribute("aria-hidden", "false");

        setBodyScrollLocked(true);

        formTitle.focus();
    }

    function closeModal() {
        if (!saveModal) {
            return;
        }

        saveModal.classList.remove("active");
        saveModal.setAttribute("aria-hidden", "true");

        setBodyScrollLocked(
            Boolean(detailModal && detailModal.classList.contains("active"))
        );
    }

    if (createItemButton) {
        createItemButton.addEventListener("click", openCreateModal);
    }

    if (closeSaveModal) {
        closeSaveModal.addEventListener("click", closeModal);
    }

    if (cancelSaveButton) {
        cancelSaveButton.addEventListener("click", closeModal);
    }

    // Click outside modal
    if (saveModal) {
        saveModal.addEventListener("click", function (event) {
            if (event.target === saveModal) {
                closeModal();
            }
        });
    }

    // =========================
    // SAVE: CREATE OR UPDATE
    // =========================

    if (libraryForm) {
        libraryForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const id = formItemId.value.trim();
            const isUpdate = Boolean(id);

            const itemData = {
                title: formTitle.value.trim(),
                category: formCategory.value.trim(),
                description: formDescription.value.trim(),

                alias: formAlias.value
                    .split(",")
                    .map(value => value.trim())
                    .filter(Boolean),

                tags: formTags.value
                    .split(",")
                    .map(value => value.trim())
                    .filter(Boolean),

                content: formContent.value
            };

            const url = isUpdate
                ? `/api/library/${encodeURIComponent(id)}`
                : "/api/library";

            const method = isUpdate ? "PUT" : "POST";

            submitSaveButton.disabled = true;
            submitSaveButton.textContent = "Saving...";

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(itemData)
                });

                const responseText = await response.text();

                // Check HTTP status
                if (!response.ok) {
                    const preview = responseText
                        ? responseText.trim().slice(0, 300)
                        : "No response body";

                    throw new Error(
                        `Save failed (HTTP ${response.status}). ${preview}`
                    );
                }

                // Parse response
                const payload = parseApiResponse(response, responseText);

                // IMPORTANT: Declare savedItem before using it
                const savedItem = getSavedItemFromResponse(payload);

                if (!savedItem || typeof savedItem !== "object") {
                    throw new Error(
                        "API request succeeded but returned no LibraryItem JSON. " +
                        "Check your Spring Boot controller response."
                    );
                }

                // Keep existing ID if update response does not contain it
                if (isUpdate && !savedItem.id) {
                    savedItem.id = id;
                }

                // Update local array
                if (isUpdate) {
                    const index = libraryItems.findIndex(
                        existing => String(existing.id) === String(id)
                    );

                    if (index !== -1) {
                        libraryItems[index] = savedItem;
                    } else {
                        libraryItems.push(savedItem);
                    }

                } else {
                    libraryItems.push(savedItem);
                }

                closeModal();

                showAllItems();

                // alert(
                //     isUpdate
                //         ? "Item updated successfully!"
                //         : "Item created successfully!"
                // );

            } catch (error) {
                console.error("Save item error:", error);

                alert("Unable to save item: " + error.message);

            } finally {
                submitSaveButton.disabled = false;

                submitSaveButton.textContent = isUpdate
                    ? "Update Item"
                    : "Save Item";
            }
        });
    }

    // =========================
    // DELETE
    // =========================

    async function deleteItem(id) {
        if (id === undefined || id === null || id === "") {
            alert("Cannot delete this item because its ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to delete this item?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `/api/library/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    responseText || `Delete failed (HTTP ${response.status})`
                );
            }

            const index = libraryItems.findIndex(
                item => String(item.id) === String(id)
            );

            if (index !== -1) {
                libraryItems.splice(index, 1);
            }

            showAllItems();

            // alert("Item deleted successfully!");

        } catch (error) {
            console.error("Delete item error:", error);

            alert("Unable to delete item: " + error.message);
        }
    }

    // =========================
    // GLOBAL ESCAPE KEY
    // =========================

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (saveModal && saveModal.classList.contains("active")) {
            closeModal();

        } else if (detailModal && detailModal.classList.contains("active")) {
            hideDetailModal();

        } else {
            closeSuggestions();
        }
    });

});