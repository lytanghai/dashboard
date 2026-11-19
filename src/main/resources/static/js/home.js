
document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("projectSearch");
    const projectCards = document.querySelectorAll(".project-card");
    const emptyState = document.getElementById("emptyState");
    const themeToggle = document.getElementById("themeToggle");

    // Search projects
    searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        projectCards.forEach(card => {
            const name = card.dataset.name || "";
            const description = card.dataset.description || "";

            const matched =
                name.includes(keyword) ||
                description.includes(keyword);

            card.style.display = matched ? "flex" : "none";

            if (matched) {
                visibleCount++;
            }
        });

        emptyState.hidden = visibleCount > 0;
    });

    // Theme toggle
    const savedTheme = localStorage.getItem("workspace-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀";
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");

        localStorage.setItem(
            "workspace-theme",
            isDark ? "dark" : "light"
        );

        themeToggle.textContent = isDark ? "☀" : "☾";
    });

});
