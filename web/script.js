/**
 * ============================================================================
 * PERSONAL FINANCE & EXPENSE MANAGEMENT SYSTEM - FRONTEND SCRIPT
 * ============================================================================
 * Handles UI interactions, API calls to Java HTTP server, charts, and routing.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------------------------
    // Categories matching project requirements
    // ------------------------------------------------------------------------
    const EXPENSE_CATEGORIES = [
        "Food",
        "Shopping",
        "Travel",
        "Education",
        "Bills",
        "Other"
    ];

    const INCOME_CATEGORIES = [
        "Salary",
        "Freelance",
        "Investments",
        "Bonus",
        "Other"
    ];

    const TEAL_CHART_COLORS = [
        "#0d9488", "#14b8a6", "#2dd4bf", "#0ea5e9", "#f59e0b",
        "#ef4444", "#8b5cf6", "#ec4899", "#64748b"
    ];

    // ------------------------------------------------------------------------
    // DOM Element References
    // ------------------------------------------------------------------------
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".content-section");
    const pageHeading = document.getElementById("pageHeading");
    const pageSubheading = document.getElementById("pageSubheading");

    // KPI Cards
    const cardCurrentBalance = document.getElementById("cardCurrentBalance");
    const balanceStatusPill = document.getElementById("balanceStatusPill");
    const cardTotalIncome = document.getElementById("cardTotalIncome");
    const cardTotalExpense = document.getElementById("cardTotalExpense");
    const cardSavingsRate = document.getElementById("cardSavingsRate");
    const cardSavingsProgress = document.getElementById("cardSavingsProgress");

    // Screens
    const landingScreen = document.getElementById("landingScreen");
    const appScreen = document.getElementById("appScreen");

    // Full Landing Screen Buttons
    const mainEnterAppBtn = document.getElementById("mainEnterAppBtn");
    const landingNavEnterBtn = document.getElementById("landingNavEnterBtn");
    const bottomEnterAppBtn = document.getElementById("bottomEnterAppBtn");
    const landingQuickAddBtn = document.getElementById("landingQuickAddBtn");
    const returnLandingBtn = document.getElementById("returnLandingBtn");

    // Live Stats on Landing Screen
    const landingBalance = document.getElementById("landingBalance");
    const landingIncome = document.getElementById("landingIncome");
    const landingExpense = document.getElementById("landingExpense");
    const landingSavings = document.getElementById("landingSavings");

    // Tables
    const recentTransactionsTableBody = document.getElementById("recentTransactionsTableBody");
    const historyTableBody = document.getElementById("historyTableBody");
    const monthlySummaryTableBody = document.getElementById("monthlySummaryTableBody");
    const categorySummaryTableBody = document.getElementById("categorySummaryTableBody");
    const historyCount = document.getElementById("historyCount");
    const noHistoryState = document.getElementById("noHistoryState");

    // Form
    const addTransactionForm = document.getElementById("addTransactionForm");
    const formTitle = document.getElementById("formTitle");
    const formAmount = document.getElementById("formAmount");
    const formCategory = document.getElementById("formCategory");
    const formDate = document.getElementById("formDate");
    const formDetailLabel = document.getElementById("formDetailLabel");
    const formDetail = document.getElementById("formDetail");
    const formNotes = document.getElementById("formNotes");
    const transTypeRadios = document.querySelectorAll('input[name="transType"]');

    // Filters
    const filterSearch = document.getElementById("filterSearch");
    const filterTypeSelect = document.getElementById("filterTypeSelect");
    const filterCategorySelect = document.getElementById("filterCategorySelect");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // Buttons
    const quickAddBtn = document.getElementById("quickAddBtn");
    const viewAllBtn = document.getElementById("viewAllBtn");
    const sidebarExportBtn = document.getElementById("sidebarExportBtn");
    const sidebarResetBtn = document.getElementById("sidebarResetBtn");

    // Canvases
    const categoryDonutChart = document.getElementById("categoryDonutChart");
    const categoryLegendContainer = document.getElementById("categoryLegendContainer");
    const monthlyTrendChart = document.getElementById("monthlyTrendChart");

    // Default Date to today
    formDate.value = new Date().toISOString().split("T")[0];

    // ------------------------------------------------------------------------
    // THEME SWITCHER (Teal, Dark, Indigo, Ocean)
    // ------------------------------------------------------------------------
    const themeDots = document.querySelectorAll(".theme-dot");

    function setTheme(themeName) {
        document.documentElement.setAttribute("data-theme", themeName);
        localStorage.setItem("preferred_theme", themeName);

        themeDots.forEach(dot => {
            if (dot.getAttribute("data-theme") === themeName) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    const savedTheme = localStorage.getItem("preferred_theme") || "teal";
    setTheme(savedTheme);

    themeDots.forEach(dot => {
        dot.addEventListener("click", () => {
            const theme = dot.getAttribute("data-theme");
            setTheme(theme);
        });
    });

    // ------------------------------------------------------------------------
    // SECTION NAVIGATION (Sidebar Tabs)
    // ------------------------------------------------------------------------
    function navigateToSection(targetSectionId) {
        // Update nav items active state
        navItems.forEach(item => {
            if (item.getAttribute("data-section") === targetSectionId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        // Show corresponding section
        sections.forEach(sec => {
            if (sec.id === targetSectionId) {
                sec.classList.add("active");
            } else {
                sec.classList.remove("active");
            }
        });

        // Update Topbar Title
        switch (targetSectionId) {
            case "section-landing":
                pageHeading.textContent = "Welcome to FinancePulse";
                pageSubheading.textContent = "Your smart, college-ready Personal Finance & Expense Management System.";
                break;
            case "section-dashboard":
                pageHeading.textContent = "Financial Dashboard";
                pageSubheading.textContent = "Welcome back! Here is your current monetary snapshot.";
                break;
            case "section-add":
                pageHeading.textContent = "Add Transaction";
                pageSubheading.textContent = "Record a new income deposit or expense payout.";
                break;
            case "section-history":
                pageHeading.textContent = "Transaction History";
                pageSubheading.textContent = "Browse, filter, and manage your full list of transactions.";
                break;
            case "section-summary":
                pageHeading.textContent = "Monthly & Category Summary";
                pageSubheading.textContent = "Detailed breakdown of monthly spending and category analysis.";
                break;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-section");
            navigateToSection(target);
        });
    });

    quickAddBtn.addEventListener("click", () => navigateToSection("section-add"));
    viewAllBtn.addEventListener("click", () => navigateToSection("section-history"));

    // ------------------------------------------------------------------------
    // SCREEN SWITCHING (Full Landing Screen <-> App Screen)
    // ------------------------------------------------------------------------
    function openAppScreen(initialSection = "section-dashboard") {
        if (landingScreen) landingScreen.classList.add("hidden");
        if (appScreen) appScreen.classList.remove("hidden");
        navigateToSection(initialSection);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openLandingScreen() {
        if (appScreen) appScreen.classList.add("hidden");
        if (landingScreen) landingScreen.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Connect Landing page CTA buttons (The "one option" that opens others)
    if (mainEnterAppBtn) mainEnterAppBtn.addEventListener("click", () => openAppScreen("section-dashboard"));
    if (landingNavEnterBtn) landingNavEnterBtn.addEventListener("click", () => openAppScreen("section-dashboard"));
    if (bottomEnterAppBtn) bottomEnterAppBtn.addEventListener("click", () => openAppScreen("section-dashboard"));
    if (landingQuickAddBtn) landingQuickAddBtn.addEventListener("click", () => openAppScreen("section-add"));
    if (returnLandingBtn) returnLandingBtn.addEventListener("click", openLandingScreen);

    // ------------------------------------------------------------------------
    // FORM: Income vs. Expense dynamic categories & labels
    // ------------------------------------------------------------------------
    function updateFormCategories(type) {
        formCategory.innerHTML = "";
        const list = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

        list.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            formCategory.appendChild(opt);
        });

        if (type === "INCOME") {
            formDetailLabel.textContent = "Income Source / Employer";
            formDetail.placeholder = "e.g. Google LLC, Freelance Client, Dividend";
        } else {
            formDetailLabel.textContent = "Payment Method";
            formDetail.placeholder = "e.g. Credit Card, UPI, Cash, Bank Transfer";
        }
    }

    transTypeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            updateFormCategories(e.target.value);
        });
    });

    updateFormCategories("EXPENSE");

    // ------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // ------------------------------------------------------------------------
    function showToast(message, type = "success") {
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Currency Formatter
    function formatMoney(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2
        }).format(amount);
    }

    // ------------------------------------------------------------------------
    // API: Fetch and Render Dashboard Summary
    // ------------------------------------------------------------------------
    async function loadSummary() {
        try {
            const res = await fetch("/api/summary");
            if (!res.ok) throw new Error("Could not load summary");
            const data = await res.json();

            // Update KPI summary cards
            const balance = data.currentBalance || 0;
            cardCurrentBalance.textContent = formatMoney(balance);
            cardTotalIncome.textContent = formatMoney(data.totalIncome || 0);
            cardTotalExpense.textContent = formatMoney(data.totalExpense || 0);

            // Update Landing page stats
            if (landingBalance) landingBalance.textContent = formatMoney(balance);
            if (landingIncome) landingIncome.textContent = formatMoney(data.totalIncome || 0);
            if (landingExpense) landingExpense.textContent = formatMoney(data.totalExpense || 0);

            const savings = Math.max(0, Math.min(100, data.savingsRate || 0));
            cardSavingsRate.textContent = savings.toFixed(1) + "%";
            cardSavingsProgress.style.width = savings + "%";
            if (landingSavings) landingSavings.textContent = savings.toFixed(1) + "%";

            if (balance >= 0) {
                balanceStatusPill.textContent = "Surplus";
                balanceStatusPill.style.background = "rgba(16, 185, 129, 0.25)";
            } else {
                balanceStatusPill.textContent = "Deficit";
                balanceStatusPill.style.background = "rgba(239, 68, 68, 0.25)";
            }

            // Render Charts
            renderCategoryDonut(data.expenseByCategory || {});
            renderMonthlyTrendsBar(data.monthlyTotals || {});

            // Render Tables in Section 4
            renderMonthlySummaryTable(data.monthlyExpenseSummary || {});
            renderCategorySummaryTable(data.expenseByCategory || {}, data.totalExpense || 0);

        } catch (err) {
            console.error("Summary error:", err);
        }
    }

    // ------------------------------------------------------------------------
    // API: Fetch and Render Transactions List
    // ------------------------------------------------------------------------
    async function loadTransactions() {
        try {
            const params = new URLSearchParams();
            const search = filterSearch.value.trim();
            const type = filterTypeSelect.value;
            const category = filterCategorySelect.value;

            if (search) params.append("search", search);
            if (type !== "ALL") params.append("type", type);
            if (category !== "ALL") params.append("category", category);

            const res = await fetch(`/api/transactions?${params.toString()}`);
            if (!res.ok) throw new Error("Could not load transactions");
            const transactions = await res.json();

            renderRecentTable(transactions.slice(0, 5));
            renderHistoryTable(transactions);

        } catch (err) {
            console.error("Transactions error:", err);
        }
    }

    // Render Recent 5 Transactions on Dashboard
    function renderRecentTable(list) {
        recentTransactionsTableBody.innerHTML = "";
        if (!list || list.length === 0) {
            recentTransactionsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No recent transactions recorded.</td></tr>`;
            return;
        }

        list.forEach(t => {
            const isInc = t.type === "INCOME";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <span class="badge ${isInc ? 'badge-income' : 'badge-expense'}">
                        ${isInc ? '▲ Income' : '▼ Expense'}
                    </span>
                </td>
                <td><strong>${escapeHtml(t.title)}</strong></td>
                <td><span class="badge badge-category">${escapeHtml(t.category)}</span></td>
                <td>${t.date}</td>
                <td class="text-right">
                    <span class="${isInc ? 'amount-plus' : 'amount-minus'}">
                        ${isInc ? '+' : '-'}${formatMoney(t.amount)}
                    </span>
                </td>
            `;
            recentTransactionsTableBody.appendChild(tr);
        });
    }

    // Render Full History Table
    function renderHistoryTable(list) {
        historyTableBody.innerHTML = "";
        historyCount.textContent = `Viewing ${list.length} transaction${list.length === 1 ? '' : 's'}`;

        if (!list || list.length === 0) {
            noHistoryState.classList.remove("hidden");
            return;
        }
        noHistoryState.classList.add("hidden");

        list.forEach(t => {
            const isInc = t.type === "INCOME";
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>
                    <span class="badge ${isInc ? 'badge-income' : 'badge-expense'}">
                        ${isInc ? '▲ Income' : '▼ Expense'}
                    </span>
                </td>
                <td>
                    <div><strong>${escapeHtml(t.title)}</strong></div>
                    ${t.notes ? `<div style="font-size:0.78rem; color:#64748b;">${escapeHtml(t.notes)}</div>` : ''}
                </td>
                <td><span class="badge badge-category">${escapeHtml(t.category)}</span></td>
                <td style="color:#64748b;">${escapeHtml(t.detail || '—')}</td>
                <td>${t.date}</td>
                <td class="text-right">
                    <span class="${isInc ? 'amount-plus' : 'amount-minus'}">
                        ${isInc ? '+' : '-'}${formatMoney(t.amount)}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn-edit-icon" data-id="${t.id}" title="Edit Transaction">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete-icon" data-id="${t.id}" title="Delete Transaction">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            `;

            const editBtn = tr.querySelector(".btn-edit-icon");
            editBtn.addEventListener("click", () => handleEditTransaction(t));

            const delBtn = tr.querySelector(".btn-delete-icon");
            delBtn.addEventListener("click", () => handleDeleteTransaction(t.id, t.title));

            historyTableBody.appendChild(tr);
        });
    }

    // Edit Transaction Action: Pre-fills the form with existing data
    function handleEditTransaction(t) {
        document.getElementById("formEditId").value = t.id;
        document.getElementById("formHeaderTitle").textContent = "Edit Transaction (" + t.id + ")";
        document.getElementById("formSubmitBtn").textContent = "Update Transaction";

        const typeRadio = document.querySelector(`input[name="transType"][value="${t.type}"]`);
        if (typeRadio) typeRadio.checked = true;
        updateFormCategories(t.type);

        formTitle.value = t.title;
        formAmount.value = t.amount;
        formCategory.value = t.category;
        formDate.value = t.date;
        formDetail.value = t.detail || "";
        formNotes.value = t.notes || "";

        openAppScreen("section-add");
        formTitle.focus();
    }

    // Delete Transaction Action
    async function handleDeleteTransaction(id, title) {
        if (!confirm(`Delete "${title}"?`)) return;

        try {
            const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Delete failed");

            showToast(`Deleted "${title}" successfully`, "success");
            await loadTransactions();
            await loadSummary();
        } catch (err) {
            console.error(err);
            showToast("Failed to delete transaction", "error");
        }
    }

    // ------------------------------------------------------------------------
    // RENDER: Monthly Expense Summary Table (From Java HashMap)
    // ------------------------------------------------------------------------
    function renderMonthlySummaryTable(monthlyExpenseMap) {
        monthlySummaryTableBody.innerHTML = "";
        const keys = Object.keys(monthlyExpenseMap).sort().reverse();

        if (keys.length === 0) {
            monthlySummaryTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">No monthly expenses recorded yet.</td></tr>`;
            return;
        }

        keys.forEach(month => {
            const amt = monthlyExpenseMap[month];
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHtml(month)}</strong></td>
                <td class="text-right text-expense" style="font-weight:700;">${formatMoney(amt)}</td>
            `;
            monthlySummaryTableBody.appendChild(tr);
        });
    }

    // ------------------------------------------------------------------------
    // RENDER: Category Breakdown Table (From Java HashMap)
    // ------------------------------------------------------------------------
    function renderCategorySummaryTable(categoryMap, totalExpense) {
        categorySummaryTableBody.innerHTML = "";
        const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            categorySummaryTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No category data.</td></tr>`;
            return;
        }

        entries.forEach(([cat, amt]) => {
            const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : "0.0";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="badge badge-category">${escapeHtml(cat)}</span></td>
                <td class="text-right"><strong>${formatMoney(amt)}</strong></td>
                <td class="text-right" style="color:#0d9488; font-weight:700;">${pct}%</td>
            `;
            categorySummaryTableBody.appendChild(tr);
        });
    }

    // ------------------------------------------------------------------------
    // CHARTS: Custom Canvas Donut Chart (Category Breakdown)
    // ------------------------------------------------------------------------
    function renderCategoryDonut(categoryData) {
        const ctx = categoryDonutChart.getContext("2d");
        ctx.clearRect(0, 0, categoryDonutChart.width, categoryDonutChart.height);
        categoryLegendContainer.innerHTML = "";

        const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((acc, curr) => acc + curr[1], 0);

        if (entries.length === 0 || total === 0) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("No expenses recorded", categoryDonutChart.width / 2, categoryDonutChart.height / 2);
            return;
        }

        const cx = categoryDonutChart.width / 2;
        const cy = categoryDonutChart.height / 2;
        const outerR = Math.min(cx, cy) - 15;
        const innerR = outerR * 0.58;

        let startAngle = -Math.PI / 2;

        entries.forEach(([cat, amt], idx) => {
            const sliceAngle = (amt / total) * 2 * Math.PI;
            const color = TEAL_CHART_COLORS[idx % TEAL_CHART_COLORS.length];

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            startAngle += sliceAngle;

            // Legend item
            const pct = ((amt / total) * 100).toFixed(0);
            const chip = document.createElement("div");
            chip.className = "legend-chip";
            chip.innerHTML = `
                <span class="legend-dot" style="background:${color}"></span>
                <span>${escapeHtml(cat)} (${pct}%)</span>
            `;
            categoryLegendContainer.appendChild(chip);
        });

        // Center Label
        ctx.fillStyle = "#0f766e";
        ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatMoney(total), cx, cy - 8);

        ctx.fillStyle = "#64748b";
        ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Expenses", cx, cy + 12);
    }

    // ------------------------------------------------------------------------
    // CHARTS: Custom Canvas Bar Chart (Monthly Income vs. Expense)
    // ------------------------------------------------------------------------
    function renderMonthlyTrendsBar(totalsData) {
        const ctx = monthlyTrendChart.getContext("2d");
        ctx.clearRect(0, 0, monthlyTrendChart.width, monthlyTrendChart.height);

        const months = Object.keys(totalsData).sort();
        if (months.length === 0) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("No monthly trend data available", monthlyTrendChart.width / 2, monthlyTrendChart.height / 2);
            return;
        }

        const padLeft = 55;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 35;

        const w = monthlyTrendChart.width - padLeft - padRight;
        const h = monthlyTrendChart.height - padTop - padBottom;

        let maxVal = 100;
        months.forEach(m => {
            maxVal = Math.max(maxVal, totalsData[m].income, totalsData[m].expense);
        });
        maxVal = Math.ceil(maxVal * 1.15);

        // Horizontal Gridlines & Y-Axis values
        const steps = 4;
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= steps; i++) {
            const y = padTop + (h / steps) * i;
            const val = maxVal - (maxVal / steps) * i;

            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(monthlyTrendChart.width - padRight, y);
            ctx.stroke();

            ctx.fillText("$" + Math.round(val), padLeft - 6, y);
        }

        // Draw Bars
        const groupW = w / months.length;
        const barW = Math.min(22, (groupW - 16) / 2);

        months.forEach((m, idx) => {
            const inc = totalsData[m].income;
            const exp = totalsData[m].expense;

            const groupCenterX = padLeft + groupW * idx + groupW / 2;

            const incH = (inc / maxVal) * h;
            const expH = (exp / maxVal) * h;

            // Income (Teal/Emerald)
            const incX = groupCenterX - barW - 3;
            const incY = padTop + h - incH;
            ctx.fillStyle = "#0d9488";
            ctx.beginPath();
            ctx.roundRect(incX, incY, barW, incH, [4, 4, 0, 0]);
            ctx.fill();

            // Expense (Rose)
            const expX = groupCenterX + 3;
            const expY = padTop + h - expH;
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.roundRect(expX, expY, barW, expH, [4, 4, 0, 0]);
            ctx.fill();

            // Month Label
            ctx.fillStyle = "#475569";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(m, groupCenterX, padTop + h + 8);
        });

        // Top Legend inside chart
        ctx.textAlign = "left";
        ctx.fillStyle = "#0d9488";
        ctx.fillRect(padLeft + 10, 8, 12, 12);
        ctx.fillStyle = "#334155";
        ctx.fillText("Income", padLeft + 26, 17);

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(padLeft + 90, 8, 12, 12);
        ctx.fillStyle = "#334155";
        ctx.fillText("Expense", padLeft + 106, 17);
    }

    // ------------------------------------------------------------------------
    // FORM: Add Transaction Submission (Connects to Java POST /api/transactions)
    // ------------------------------------------------------------------------
    addTransactionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const type = document.querySelector('input[name="transType"]:checked').value;
        const title = formTitle.value.trim();
        const amount = parseFloat(formAmount.value);
        const category = formCategory.value;
        const date = formDate.value;
        const detail = formDetail.value.trim();
        const notes = formNotes.value.trim();

        if (!title || isNaN(amount) || amount <= 0 || !date) {
            showToast("Please enter a valid title, positive amount, and date.", "error");
            return;
        }

        const editId = document.getElementById("formEditId").value;

        const payload = {
            id: editId || "",
            type,
            title,
            amount: amount.toString(),
            category,
            date,
            detail,
            notes
        };

        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save transaction");

            // Reset form and edit state
            addTransactionForm.reset();
            document.getElementById("formEditId").value = "";
            document.getElementById("formHeaderTitle").textContent = "Add New Transaction";
            document.getElementById("formSubmitBtn").textContent = "Save Transaction";
            formDate.value = new Date().toISOString().split("T")[0];
            document.querySelector('input[name="transType"][value="EXPENSE"]').checked = true;
            updateFormCategories("EXPENSE");

            showToast(editId ? `Updated "${title}" successfully!` : `Recorded ${type.toLowerCase()}: "${title}" ($${amount.toFixed(2)})`, "success");

            await loadTransactions();
            await loadSummary();

            // Switch to Dashboard after save
            navigateToSection("section-dashboard");

        } catch (err) {
            console.error(err);
            showToast("Error saving transaction: " + err.message, "error");
        }
    });

    // Reset edit state when clear button is clicked
    const formCancelEditBtn = document.getElementById("formCancelEditBtn");
    if (formCancelEditBtn) {
        formCancelEditBtn.addEventListener("click", () => {
            document.getElementById("formEditId").value = "";
            document.getElementById("formHeaderTitle").textContent = "Add New Transaction";
            document.getElementById("formSubmitBtn").textContent = "Save Transaction";
        });
    }

    // ------------------------------------------------------------------------
    // FILTERS: Search & Category Listeners
    // ------------------------------------------------------------------------
    let searchTimeout;
    filterSearch.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadTransactions, 200);
    });

    filterTypeSelect.addEventListener("change", loadTransactions);
    filterCategorySelect.addEventListener("change", loadTransactions);

    resetFiltersBtn.addEventListener("click", () => {
        filterSearch.value = "";
        filterTypeSelect.value = "ALL";
        filterCategorySelect.value = "ALL";
        loadTransactions();
    });

    // ------------------------------------------------------------------------
    // SIDEBAR ACTIONS: Export CSV & Reset Data
    // ------------------------------------------------------------------------
    sidebarExportBtn.addEventListener("click", () => {
        window.location.href = "/api/export";
    });

    sidebarResetBtn.addEventListener("click", async () => {
        if (!confirm("Reset all transactions to default sample data?")) return;

        try {
            const res = await fetch("/api/reset", { method: "POST" });
            if (!res.ok) throw new Error("Reset failed");

            showToast("Sample data restored successfully!", "success");
            await loadTransactions();
            await loadSummary();
        } catch (err) {
            showToast("Failed to reset sample data", "error");
        }
    });

    // Helper: Escape HTML
    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Initial Load
    loadTransactions();
    loadSummary();
});
