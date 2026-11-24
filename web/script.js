/**
 * ============================================================================
 * PERSONAL FINANCE & EXPENSE MANAGEMENT SYSTEM - FRONTEND SCRIPT
 * ============================================================================
 * Handles UI interactions, API calls to Java HTTP server, charts, routing,
 * and client-side fallback persistence for Vercel / GitHub Pages deployment.
 */

// ============================================================================
// DUAL-MODE API ADAPTER: Java Backend (Local) <--> ClientStorage (Vercel/Static)
// ============================================================================
(function initApiAdapter() {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    let backendActive = isLocalhost;

    if (isLocalhost) {
        fetch("/api/summary", { method: "GET", cache: "no-store" })
            .then(res => { backendActive = res.ok; })
            .catch(() => { backendActive = false; });
    } else {
        backendActive = false; // Always use high-performance client storage on Vercel / GitHub Pages
    }

    const originalFetch = window.fetch.bind(window);

    const STORAGE_KEY_TRX = "finance_pulse_transactions";
    const STORAGE_KEY_BUDGETS = "finance_pulse_budgets";
    const STORAGE_KEY_GOALS = "finance_pulse_goals";

    function getStored(key, defaultVal) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function setStored(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
    }

    const DEFAULT_TRANSACTIONS = [
        { id: "TRX-001", type: "INCOME", title: "Monthly Tech Salary", amount: 4500.0, category: "Salary", date: "2026-11-01", notes: "Regular salary", detail: "Direct Deposit" },
        { id: "TRX-002", type: "INCOME", title: "Freelance UI Project", amount: 850.0, category: "Freelance", date: "2026-11-05", notes: "Website design contract", detail: "Bank Transfer" },
        { id: "TRX-003", type: "EXPENSE", title: "Organic Grocery Haul", amount: 140.0, category: "Food", date: "2026-11-03", notes: "Fresh fruits & pantry essentials", detail: "Debit Card" },
        { id: "TRX-004", type: "EXPENSE", title: "Matcha Latte & Brunch", amount: 80.0, category: "Food", date: "2026-11-07", notes: "Weekend cafe date", detail: "Credit Card" },
        { id: "TRX-005", type: "EXPENSE", title: "Pastel Wool Cardigan", amount: 120.0, category: "Shopping", date: "2026-11-08", notes: "Cozy autumn wardrobe", detail: "Credit Card" },
        { id: "TRX-006", type: "EXPENSE", title: "Monthly Transit Pass", amount: 60.0, category: "Travel", date: "2026-11-10", notes: "Metro & city buses", detail: "Metro Card" },
        { id: "TRX-007", type: "EXPENSE", title: "Full-Stack Web Bootcamp", amount: 89.99, category: "Education", date: "2026-11-12", notes: "Java & web certifications", detail: "UPI" },
        { id: "TRX-008", type: "EXPENSE", title: "High-Speed WiFi & Cloud", amount: 145.0, category: "Bills", date: "2026-11-14", notes: "Fiber internet & phone plan", detail: "Auto Debit" }
    ];

    const DEFAULT_BUDGETS = {
        "Overall": 900.0,
        "Food": 275.0,
        "Shopping": 150.0,
        "Travel": 80.0,
        "Education": 100.0,
        "Bills": 180.0,
        "Other": 100.0
    };

    const DEFAULT_GOALS = [
        { id: "GOAL-001", name: "New iPhone 16 Pro", targetAmount: 1199.0, savedAmount: 1199.0, targetDate: "2026-11-15", category: "Gadgets" },
        { id: "GOAL-002", name: "MacBook Pro M4", targetAmount: 1799.0, savedAmount: 1250.0, targetDate: "2026-12-25", category: "Laptop" },
        { id: "GOAL-003", name: "Japan Cherry Blossom Trip", targetAmount: 2500.0, savedAmount: 850.0, targetDate: "2027-04-10", category: "Travel" },
        { id: "GOAL-004", name: "Emergency Nest Egg", targetAmount: 3000.0, savedAmount: 1800.0, targetDate: "2027-06-30", category: "Emergency" }
    ];

    function seedIfEmpty() {
        if (!localStorage.getItem(STORAGE_KEY_TRX)) setStored(STORAGE_KEY_TRX, DEFAULT_TRANSACTIONS);
        if (!localStorage.getItem(STORAGE_KEY_BUDGETS)) setStored(STORAGE_KEY_BUDGETS, DEFAULT_BUDGETS);
        if (!localStorage.getItem(STORAGE_KEY_GOALS)) setStored(STORAGE_KEY_GOALS, DEFAULT_GOALS);
    }
    seedIfEmpty();

    function computeSummary() {
        const transactions = getStored(STORAGE_KEY_TRX, DEFAULT_TRANSACTIONS);
        const budgets = getStored(STORAGE_KEY_BUDGETS, DEFAULT_BUDGETS);
        const goals = getStored(STORAGE_KEY_GOALS, DEFAULT_GOALS);

        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategory = {};
        const monthlyExpenseSummary = {};
        const monthlyTotals = {};

        transactions.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            const ym = (t.date || "").substring(0, 7) || "2026-11";
            if (!monthlyTotals[ym]) monthlyTotals[ym] = { income: 0, expense: 0 };

            if (t.type === "INCOME") {
                totalIncome += amt;
                monthlyTotals[ym].income += amt;
            } else {
                totalExpense += amt;
                monthlyTotals[ym].expense += amt;
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
                monthlyExpenseSummary[ym] = (monthlyExpenseSummary[ym] || 0) + amt;
            }
        });

        const currentBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

        const budgetSummary = Object.entries(budgets).map(([cat, limit]) => {
            const spent = cat === "Overall" ? totalExpense : (expenseByCategory[cat] || 0);
            const remaining = limit - spent;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            let status = "ON_TRACK";
            let alert = "";
            if (percentage >= 100) {
                status = "DANGER";
                alert = `Alert: ${cat} budget exceeded!`;
            } else if (percentage >= 80) {
                status = "WARNING";
                alert = `Warning: ${percentage.toFixed(0)}% of ${cat} budget reached.`;
            }
            return {
                category: cat,
                limit: limit,
                spent: spent,
                remaining: remaining,
                percentage: parseFloat(percentage.toFixed(1)),
                status: status,
                alert: alert
            };
        });

        let totalTarget = 0;
        let totalSaved = 0;
        let achievedGoals = 0;
        goals.forEach(g => {
            const tgt = parseFloat(g.targetAmount) || 0;
            const svd = parseFloat(g.savedAmount) || 0;
            totalTarget += tgt;
            totalSaved += svd;
            if (svd >= tgt && tgt > 0) achievedGoals++;
        });
        const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

        const catEntries = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
        const highestCat = catEntries.length > 0 ? catEntries[0][0] : "None";
        const highestAmt = catEntries.length > 0 ? catEntries[0][1] : 0;
        const highestPct = totalExpense > 0 ? (highestAmt / totalExpense) * 100 : 0;

        const lowestCat = catEntries.length > 0 ? catEntries[catEntries.length - 1][0] : "None";
        const lowestAmt = catEntries.length > 0 ? catEntries[catEntries.length - 1][1] : 0;
        const lowestPct = totalExpense > 0 ? (lowestAmt / totalExpense) * 100 : 0;

        const suggestions = [];
        if (highestCat !== "None") {
            suggestions.push(`You spent the most on ${highestCat} ($${highestAmt.toFixed(2)}) this month.`);
        }
        if ((expenseByCategory["Shopping"] || 0) > 100) {
            suggestions.push(`Your shopping expenses are relatively high at $${(expenseByCategory["Shopping"] || 0).toFixed(2)}. Consider mindful purchasing.`);
        }
        if (highestPct > 30) {
            suggestions.push(`${highestCat} accounts for ${highestPct.toFixed(0)}% of total expenses. Preparing home meals will boost your savings.`);
        }
        if (savingsRate > 50) {
            suggestions.push(`Great job! You maintained an inspiring ${savingsRate.toFixed(1)}% savings rate.`);
        } else {
            suggestions.push("Try boosting your savings rate by setting aside funds right on payday.");
        }
        if (lowestCat !== "None") {
            suggestions.push(`Your lowest spending was on ${lowestCat} ($${lowestAmt.toFixed(2)}), keeping costs well controlled there.`);
        }

        return {
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            currentBalance: currentBalance,
            savingsRate: parseFloat(savingsRate.toFixed(1)),
            transactionCount: transactions.length,
            expenseByCategory: expenseByCategory,
            monthlyExpenseSummary: monthlyExpenseSummary,
            monthlyTotals: monthlyTotals,
            budgetSummary: budgetSummary,
            savingsGoalSummary: {
                totalGoals: goals.length,
                achievedGoals: achievedGoals,
                totalTarget: totalTarget,
                totalSaved: totalSaved,
                overallProgress: parseFloat(overallProgress.toFixed(1))
            },
            spendingAnalysis: {
                totalExpenses: totalExpense,
                highestCategory: highestCat,
                highestAmount: highestAmt,
                highestPercentage: parseFloat(highestPct.toFixed(1)),
                lowestCategory: lowestCat,
                lowestAmount: lowestAmt,
                lowestPercentage: parseFloat(lowestPct.toFixed(1)),
                categoryExpenses: expenseByCategory,
                suggestions: suggestions
            }
        };
    }

    window.fetch = async function(url, options = {}) {
        const urlStr = typeof url === "string" ? url : (url.url || "");
        if (!urlStr.startsWith("/api/")) {
            return originalFetch(url, options);
        }

        if (backendActive) {
            try {
                const res = await originalFetch(url, options);
                if (res.ok) return res;
            } catch (e) {
                backendActive = false;
            }
        }

        const method = (options.method || "GET").toUpperCase();
        const parsedUrl = new URL(urlStr, window.location.origin);
        const path = parsedUrl.pathname;
        const params = parsedUrl.searchParams;

        let resData = {};
        const status = 200;

        if (path === "/api/summary") {
            resData = computeSummary();
        } else if (path === "/api/transactions") {
            const list = getStored(STORAGE_KEY_TRX, DEFAULT_TRANSACTIONS);
            if (method === "GET") {
                const search = (params.get("search") || "").toLowerCase();
                const type = params.get("type") || "ALL";
                const category = params.get("category") || "ALL";
                resData = list.filter(t => {
                    const matchSearch = !search ||
                        (t.title || "").toLowerCase().includes(search) ||
                        (t.notes || "").toLowerCase().includes(search) ||
                        (t.category || "").toLowerCase().includes(search);
                    const matchType = type === "ALL" || t.type === type;
                    const matchCat = category === "ALL" || t.category === category;
                    return matchSearch && matchType && matchCat;
                });
            } else if (method === "POST") {
                const body = JSON.parse(options.body || "{}");
                if (body.id) {
                    const idx = list.findIndex(t => t.id === body.id);
                    if (idx >= 0) list[idx] = { ...list[idx], ...body };
                } else {
                    body.id = "TRX-" + Date.now();
                    list.unshift(body);
                }
                setStored(STORAGE_KEY_TRX, list);
                resData = body;
            } else if (method === "DELETE") {
                const id = params.get("id");
                const next = list.filter(t => t.id !== id);
                setStored(STORAGE_KEY_TRX, next);
                resData = { success: true, id: id };
            }
        } else if (path === "/api/budgets") {
            const budgets = getStored(STORAGE_KEY_BUDGETS, DEFAULT_BUDGETS);
            if (method === "GET") {
                resData = computeSummary().budgetSummary;
            } else if (method === "POST") {
                const body = JSON.parse(options.body || "{}");
                const cat = body.category || "Overall";
                const limit = parseFloat(body.limit || body.limitAmount || 0);
                budgets[cat] = limit;
                setStored(STORAGE_KEY_BUDGETS, budgets);
                resData = computeSummary().budgetSummary;
            }
        } else if (path === "/api/goals") {
            const goals = getStored(STORAGE_KEY_GOALS, DEFAULT_GOALS);
            if (method === "GET") {
                resData = goals.map(g => {
                    const target = parseFloat(g.targetAmount) || 0;
                    const saved = parseFloat(g.savedAmount) || 0;
                    const remaining = Math.max(0, target - saved);
                    const pct = target > 0 ? (saved / target) * 100 : 0;
                    return {
                        ...g,
                        targetAmount: target,
                        savedAmount: saved,
                        remainingAmount: remaining,
                        percentage: parseFloat(pct.toFixed(1)),
                        isAchieved: saved >= target && target > 0
                    };
                });
            } else if (method === "POST") {
                const body = JSON.parse(options.body || "{}");
                if (body.action === "deposit" || body.depositAmount) {
                    const id = body.id;
                    const dep = parseFloat(body.depositAmount || body.amount || 0);
                    const targetGoal = goals.find(g => g.id === id);
                    if (targetGoal) {
                        targetGoal.savedAmount = (parseFloat(targetGoal.savedAmount) || 0) + dep;
                        setStored(STORAGE_KEY_GOALS, goals);
                        resData = targetGoal;
                    }
                } else if (body.id) {
                    const idx = goals.findIndex(g => g.id === body.id);
                    if (idx >= 0) goals[idx] = { ...goals[idx], ...body };
                    setStored(STORAGE_KEY_GOALS, goals);
                    resData = body;
                } else {
                    body.id = "GOAL-" + Date.now();
                    body.savedAmount = parseFloat(body.savedAmount || 0);
                    body.targetAmount = parseFloat(body.targetAmount || 0);
                    goals.push(body);
                    setStored(STORAGE_KEY_GOALS, goals);
                    resData = body;
                }
            } else if (method === "DELETE") {
                const id = params.get("id");
                const next = goals.filter(g => g.id !== id);
                setStored(STORAGE_KEY_GOALS, next);
                resData = { success: true, id: id };
            }
        } else if (path === "/api/analysis") {
            resData = computeSummary().spendingAnalysis;
        } else if (path === "/api/reset") {
            setStored(STORAGE_KEY_TRX, DEFAULT_TRANSACTIONS);
            setStored(STORAGE_KEY_BUDGETS, DEFAULT_BUDGETS);
            setStored(STORAGE_KEY_GOALS, DEFAULT_GOALS);
            resData = { message: "Sample data reset successfully" };
        } else if (path === "/api/export") {
            const list = getStored(STORAGE_KEY_TRX, DEFAULT_TRANSACTIONS);
            let csv = "ID,Type,Title,Amount,Category,Date,Notes,Detail\n";
            list.forEach(t => {
                csv += `"${t.id}","${t.type}","${t.title}",${t.amount},"${t.category}","${t.date}","${t.notes || ''}","${t.detail || ''}"\n`;
            });
            return new Response(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": 'attachment; filename="transactions.csv"'
                }
            });
        }

        return new Response(JSON.stringify(resData), {
            status: status,
            headers: { "Content-Type": "application/json" }
        });
    };
})();

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

    const PASTEL_CHART_COLORS = [
        "#f472b6", "#c084fc", "#fb923c", "#38bdf8", "#4ade80",
        "#facc15", "#f87171", "#a78bfa", "#fdba74"
    ];
    const TEAL_CHART_COLORS = PASTEL_CHART_COLORS;

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

    // Budget Alert System DOM References
    const sidebarAlertBadge = document.getElementById("sidebarAlertBadge");
    const dashboardAlertBanner = document.getElementById("dashboardAlertBanner");
    const alertBannerTitle = document.getElementById("alertBannerTitle");
    const alertBannerMessage = document.getElementById("alertBannerMessage");
    const bannerManageBudgetsBtn = document.getElementById("bannerManageBudgetsBtn");
    const setBudgetForm = document.getElementById("setBudgetForm");
    const budgetCategorySelect = document.getElementById("budgetCategorySelect");
    const budgetLimitInput = document.getElementById("budgetLimitInput");
    const budgetCardsGrid = document.getElementById("budgetCardsGrid");

    // Savings Goal Tracker DOM References
    const sidebarGoalsBadge = document.getElementById("sidebarGoalsBadge");
    const dashGoalsBanner = document.getElementById("dashGoalsBanner");
    const dashGoalsProgressText = document.getElementById("dashGoalsProgressText");
    const dashGoalsPctText = document.getElementById("dashGoalsPctText");
    const dashGoalsBarFill = document.getElementById("dashGoalsBarFill");
    const dashViewGoalsBtn = document.getElementById("dashViewGoalsBtn");
    const openCreateGoalBtn = document.getElementById("openCreateGoalBtn");
    const closeGoalFormBtn = document.getElementById("closeGoalFormBtn");
    const cancelGoalFormBtn = document.getElementById("cancelGoalFormBtn");
    const goalFormWrapper = document.getElementById("goalFormWrapper");
    const saveGoalForm = document.getElementById("saveGoalForm");
    const goalFormHeaderTitle = document.getElementById("goalFormHeaderTitle");
    const submitGoalBtn = document.getElementById("submitGoalBtn");
    const goalEditId = document.getElementById("goalEditId");
    const goalNameInput = document.getElementById("goalNameInput");
    const goalCategorySelect = document.getElementById("goalCategorySelect");
    const goalTargetInput = document.getElementById("goalTargetInput");
    const goalSavedInput = document.getElementById("goalSavedInput");
    const goalTargetDateInput = document.getElementById("goalTargetDateInput");
    const goalsTotalCount = document.getElementById("goalsTotalCount");
    const goalsAchievedCount = document.getElementById("goalsAchievedCount");
    const goalsTotalSaved = document.getElementById("goalsTotalSaved");
    const goalsOverallProgress = document.getElementById("goalsOverallProgress");
    const goalsCardsGrid = document.getElementById("goalsCardsGrid");

    // Deposit Modal References
    const addSavingsModal = document.getElementById("addSavingsModal");
    const modalGoalTitle = document.getElementById("modalGoalTitle");
    const modalGoalSubtitle = document.getElementById("modalGoalSubtitle");
    const depositGoalId = document.getElementById("depositGoalId");
    const depositAmountInput = document.getElementById("depositAmountInput");
    const closeSavingsModalBtn = document.getElementById("closeSavingsModalBtn");
    const cancelSavingsModalBtn = document.getElementById("cancelSavingsModalBtn");
    const depositSavingsForm = document.getElementById("depositSavingsForm");

    // Default Date to today
    formDate.value = new Date().toISOString().split("T")[0];
    if (goalTargetDateInput) {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        goalTargetDateInput.value = d.toISOString().split("T")[0];
    }

    // ------------------------------------------------------------------------
    // THEME SWITCHER (Blush, Lavender, Peach, Matcha, Dark)
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

    const savedTheme = localStorage.getItem("preferred_theme") || "blush";
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
                pageHeading.textContent = "Personal Finance System";
                pageSubheading.textContent = "Your aesthetic Personal Finance & Expense Management System ✨";
                break;
            case "section-dashboard":
                pageHeading.textContent = "Hello, Sunshine! ♡";
                pageSubheading.textContent = "Welcome back to your aesthetic financial snapshot ✨";
                break;
            case "section-add":
                pageHeading.textContent = "Record Transaction ♡";
                pageSubheading.textContent = "Plant a new spending or earning seed in your ledger 🌱";
                break;
            case "section-history":
                pageHeading.textContent = "Transaction Diary ♡";
                pageSubheading.textContent = "Review and reflect on your past money moments 📖";
                break;
            case "section-summary":
                pageHeading.textContent = "Monthly Overview ♡";
                pageSubheading.textContent = "A gentle breakdown of where your funds flow each month 🌸";
                break;
            case "section-budgets":
                pageHeading.textContent = "Budget Guardrails ♡";
                pageSubheading.textContent = "Keep your spending cozy and within mindful limits 🎀";
                break;
            case "section-goals":
                pageHeading.textContent = "Dream Board & Goals ♡";
                pageSubheading.textContent = "Every rupee brings you closer to what you adore ✨";
                loadSavingsGoals();
                break;
            case "section-analysis":
                pageHeading.textContent = "Smart Spending Analysis ♡";
                pageSubheading.textContent = "Pastel charts & loving suggestions to guide your habits 💡";
                loadSpendingAnalysis();
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
    if (bannerManageBudgetsBtn) bannerManageBudgetsBtn.addEventListener("click", () => navigateToSection("section-budgets"));
    if (dashViewGoalsBtn) dashViewGoalsBtn.addEventListener("click", () => navigateToSection("section-goals"));

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
        toast.className = `toast ${type === 'error' ? 'toast-error' : (type === 'warning' ? 'toast-warning' : '')}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s";
            setTimeout(() => toast.remove(), 300);
        }, 3600);
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

            // Render Budget Alerts in Section 5 & Dashboard Alert Banner
            renderBudgetCards(data.budgetSummary || []);

            // Update Savings Goal Spotlight & Badge
            if (data.savingsGoalSummary) {
                const s = data.savingsGoalSummary;
                if (sidebarGoalsBadge) sidebarGoalsBadge.textContent = s.totalGoals || 0;
                if (dashGoalsProgressText) dashGoalsProgressText.textContent = `${s.achievedGoals || 0} of ${s.totalGoals || 0} Achieved`;
                if (dashGoalsPctText) dashGoalsPctText.textContent = `${(s.overallProgress || 0).toFixed(0)}%`;
                if (dashGoalsBarFill) dashGoalsBarFill.style.width = `${Math.min(100, Math.max(0, s.overallProgress || 0))}%`;
            }

            // Refresh Smart Spending Analysis
            loadSpendingAnalysis();

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
    // BUDGET ALERT SYSTEM: Render Cards, Badges & Dashboard Alert Banner
    // ------------------------------------------------------------------------
    function renderBudgetCards(budgets) {
        if (!budgetCardsGrid) return;
        budgetCardsGrid.innerHTML = "";

        if (!budgets || budgets.length === 0) {
            budgetCardsGrid.innerHTML = `<div class="empty-state"><p>No budget limits configured.</p></div>`;
            if (sidebarAlertBadge) sidebarAlertBadge.classList.add("hidden");
            if (dashboardAlertBanner) dashboardAlertBanner.classList.add("hidden");
            return;
        }

        // Identify active alert categories (WARNING >= 80% or EXCEEDED >= 100%)
        const alertItems = budgets.filter(b => b.status === "EXCEEDED" || b.status === "WARNING");

        // Update Sidebar Alert Badge
        if (sidebarAlertBadge) {
            if (alertItems.length > 0) {
                sidebarAlertBadge.textContent = alertItems.length;
                sidebarAlertBadge.classList.remove("hidden");
            } else {
                sidebarAlertBadge.classList.add("hidden");
            }
        }

        // Update Dashboard Alert Banner
        if (dashboardAlertBanner) {
            if (alertItems.length > 0) {
                dashboardAlertBanner.classList.remove("hidden");
                const hasExceeded = alertItems.some(b => b.status === "EXCEEDED");
                const bannerIcon = dashboardAlertBanner.querySelector(".alert-banner-icon");

                if (hasExceeded) {
                    dashboardAlertBanner.classList.remove("banner-warning");
                    dashboardAlertBanner.classList.add("banner-danger");
                    if (bannerIcon) bannerIcon.textContent = "🚨";
                    if (alertBannerTitle) alertBannerTitle.textContent = "Budget Limits Exceeded!";
                    const exceededCats = alertItems
                        .filter(b => b.status === "EXCEEDED")
                        .map(b => b.category)
                        .join(", ");
                    if (alertBannerMessage) {
                        alertBannerMessage.textContent = `Immediate attention needed: Spending limit exceeded for ${exceededCats}.`;
                    }
                } else {
                    dashboardAlertBanner.classList.remove("banner-danger");
                    dashboardAlertBanner.classList.add("banner-warning");
                    if (bannerIcon) bannerIcon.textContent = "⚠️";
                    if (alertBannerTitle) alertBannerTitle.textContent = "Budget Warning Threshold Reached";
                    const warningCats = alertItems.map(b => b.category).join(", ");
                    if (alertBannerMessage) {
                        alertBannerMessage.textContent = `Caution: Spending is at 80% or more of budget for ${warningCats}.`;
                    }
                }
            } else {
                dashboardAlertBanner.classList.add("hidden");
            }
        }

        // Render each budget card
        budgets.forEach(b => {
            const pct = b.percentage || 0;
            const barWidth = Math.min(100, Math.max(0, pct));

            let fillClass = "fill-green";
            let badgeClass = "badge-on-track";
            let badgeLabel = "On Track";

            if (b.status === "EXCEEDED" || pct >= 100) {
                fillClass = "fill-red";
                badgeClass = "badge-exceeded";
                badgeLabel = "Exceeded";
            } else if (b.status === "WARNING" || pct >= 80) {
                fillClass = "fill-amber";
                badgeClass = "badge-warning";
                badgeLabel = "Warning";
            }

            const card = document.createElement("div");
            card.className = "budget-card";

            card.innerHTML = `
                <div class="budget-card-header">
                    <span class="budget-card-title">${escapeHtml(b.category)}</span>
                    <span class="budget-status-badge ${badgeClass}">${badgeLabel}</span>
                </div>
                <div class="budget-amounts">
                    <span class="budget-spent-val">${formatMoney(b.spent)}</span>
                    <span class="budget-limit-val">of ${formatMoney(b.limit)} (${pct.toFixed(0)}%)</span>
                </div>
                <div class="budget-bar-track">
                    <div class="budget-bar-fill ${fillClass}" style="width: ${barWidth}%;"></div>
                </div>
                <div class="budget-footer">
                    <span>${b.remaining >= 0 ? `${formatMoney(b.remaining)} remaining` : `${formatMoney(Math.abs(b.remaining))} over limit!`}</span>
                    <button type="button" class="btn-quick-adjust" data-category="${escapeHtml(b.category)}" data-limit="${b.limit}">
                        Adjust Limit
                    </button>
                </div>
            `;

            const adjustBtn = card.querySelector(".btn-quick-adjust");
            if (adjustBtn) {
                adjustBtn.addEventListener("click", () => {
                    if (budgetCategorySelect) budgetCategorySelect.value = b.category;
                    if (budgetLimitInput) {
                        budgetLimitInput.value = Math.round(b.limit);
                        budgetLimitInput.focus();
                    }
                    if (setBudgetForm) {
                        setBudgetForm.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                });
            }

            budgetCardsGrid.appendChild(card);
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
            const resData = await res.json();

            // Reset form and edit state
            addTransactionForm.reset();
            document.getElementById("formEditId").value = "";
            document.getElementById("formHeaderTitle").textContent = "Add New Transaction";
            document.getElementById("formSubmitBtn").textContent = "Save Transaction";
            formDate.value = new Date().toISOString().split("T")[0];
            document.querySelector('input[name="transType"][value="EXPENSE"]').checked = true;
            updateFormCategories("EXPENSE");

            showToast(editId ? `Updated "${title}" successfully!` : `Recorded ${type.toLowerCase()}: "${title}" ($${amount.toFixed(2)})`, "success");

            // Real-time Budget Alert notification if spending threshold is breached
            if (resData && resData.budgetAlert) {
                setTimeout(() => {
                    const isExceeded = resData.budgetAlert.includes("exceeding") || resData.budgetAlert.includes("🚨");
                    showToast(resData.budgetAlert, isExceeded ? "error" : "warning");
                }, 600);
            }

            await loadTransactions();
            await loadSummary();

            // Switch to Dashboard after save
            navigateToSection("section-dashboard");

        } catch (err) {
            console.error(err);
            showToast("Error saving transaction: " + err.message, "error");
        }
    });

    // ------------------------------------------------------------------------
    // FORM: Set / Update Category Budget Limit
    // ------------------------------------------------------------------------
    if (setBudgetForm) {
        setBudgetForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const category = budgetCategorySelect.value;
            const limit = parseFloat(budgetLimitInput.value);

            if (isNaN(limit) || limit <= 0) {
                showToast("Please enter a valid positive budget limit.", "error");
                return;
            }

            try {
                const res = await fetch("/api/budgets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ category, limit: limit.toString() })
                });

                if (!res.ok) throw new Error("Could not update budget limit");

                const updatedBudgets = await res.json();
                renderBudgetCards(updatedBudgets);
                showToast(`Budget limit for ${category} updated to $${limit.toFixed(2)}`, "success");
                budgetLimitInput.value = "";
                await loadSummary();

            } catch (err) {
                console.error(err);
                showToast("Error updating budget: " + err.message, "error");
            }
        });
    }

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

    // ========================================================================
    // SAVINGS GOAL TRACKER (CRUD, Calculations & Real-time Celebration)
    // ========================================================================
    function getGoalCategoryIcon(category) {
        switch ((category || "").toLowerCase()) {
            case "gadgets": return "📱";
            case "laptop": return "💻";
            case "travel": return "✈️";
            case "shopping": return "🛍️";
            case "vehicle": return "🚗";
            case "education": return "🎓";
            case "emergency": return "🛡️";
            default: return "🎯";
        }
    }

    async function loadSavingsGoals() {
        try {
            const res = await fetch("/api/goals");
            if (!res.ok) throw new Error("Failed to load savings goals");
            const goals = await res.json();

            // Calculate metrics
            let totalTarget = 0;
            let totalSaved = 0;
            let achievedCount = 0;

            goals.forEach(g => {
                totalTarget += (g.targetAmount || 0);
                totalSaved += (g.savedAmount || 0);
                if (g.achieved) achievedCount++;
            });

            const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

            if (goalsTotalCount) goalsTotalCount.textContent = goals.length;
            if (goalsAchievedCount) goalsAchievedCount.textContent = achievedCount;
            if (goalsTotalSaved) goalsTotalSaved.textContent = formatMoney(totalSaved);
            if (goalsOverallProgress) goalsOverallProgress.textContent = overallPct.toFixed(1) + "%";
            if (sidebarGoalsBadge) sidebarGoalsBadge.textContent = goals.length;

            renderGoalCards(goals);

        } catch (err) {
            console.error("Goals load error:", err);
        }
    }

    function renderGoalCards(goals) {
        if (!goalsCardsGrid) return;
        goalsCardsGrid.innerHTML = "";

        if (!goals || goals.length === 0) {
            goalsCardsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🎯</div>
                    <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No savings goals yet!</p>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Create your first milestone: New Phone, Laptop, Trip, or Shopping target.</p>
                </div>
            `;
            return;
        }

        goals.forEach(g => {
            const pct = Math.max(0, g.progressPercentage || 0);
            const barWidth = Math.min(100, pct);
            const icon = getGoalCategoryIcon(g.category);
            const isAchieved = g.achieved || pct >= 100;

            const card = document.createElement("div");
            card.className = `goal-card ${isAchieved ? 'achieved-card' : ''}`;

            card.innerHTML = `
                <div class="goal-card-header">
                    <div class="goal-icon-box">${icon}</div>
                    <div class="goal-title-group">
                        <div class="goal-title" title="${escapeHtml(g.name)}">${escapeHtml(g.name)}</div>
                        <div class="goal-meta-row">
                            <span class="goal-category-badge">${escapeHtml(g.category || 'General')}</span>
                            <span class="goal-target-date">📅 Target: ${g.targetDate || 'TBD'}</span>
                        </div>
                    </div>
                </div>

                <div class="goal-amounts-row">
                    <div>
                        <span class="goal-saved-big">${formatMoney(g.savedAmount)}</span>
                    </div>
                    <div>
                        <span class="goal-target-sub">Target: ${formatMoney(g.targetAmount)}</span>
                    </div>
                </div>

                <div class="goal-progress-track">
                    <div class="goal-progress-fill ${isAchieved ? 'fill-achieved' : ''}" style="width: ${barWidth}%;"></div>
                </div>

                <div class="goal-stats-row">
                    <span class="goal-remaining-text">
                        ${isAchieved ? '🎉 Target reached!' : `Remaining: ${formatMoney(g.remainingAmount)}`}
                    </span>
                    <span class="goal-pct-badge">${pct.toFixed(1)}%</span>
                </div>

                ${isAchieved ? `
                    <div class="goal-achieved-banner">
                        <span>🎉</span>
                        <span>Congratulations! You achieved your savings goal!</span>
                    </div>
                ` : ''}

                <div class="goal-actions-row">
                    <button type="button" class="btn-add-savings" data-id="${g.id}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span>Add Savings</span>
                    </button>
                    <div class="goal-icon-buttons">
                        <button type="button" class="btn-goal-tool btn-tool-edit" data-id="${g.id}" title="Edit Goal">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-goal-tool btn-tool-del" data-id="${g.id}" data-name="${escapeHtml(g.name)}" title="Delete Goal">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            // Action: Add Savings
            const addBtn = card.querySelector(".btn-add-savings");
            addBtn.addEventListener("click", () => openDepositModal(g));

            // Action: Edit Goal
            const editBtn = card.querySelector(".btn-tool-edit");
            editBtn.addEventListener("click", () => handleEditGoal(g));

            // Action: Delete Goal
            const delBtn = card.querySelector(".btn-tool-del");
            delBtn.addEventListener("click", () => handleDeleteGoal(g.id, g.name));

            goalsCardsGrid.appendChild(card);
        });
    }

    // Modal: Open & Close Deposit Modal
    function openDepositModal(goal) {
        if (!addSavingsModal) return;
        depositGoalId.value = goal.id;
        modalGoalTitle.textContent = `Add Savings: ${goal.name}`;
        modalGoalSubtitle.textContent = `Target: ${formatMoney(goal.targetAmount)} (Currently saved: ${formatMoney(goal.savedAmount)})`;
        depositAmountInput.value = "";
        addSavingsModal.classList.remove("hidden");
        setTimeout(() => depositAmountInput.focus(), 100);
    }

    function closeDepositModal() {
        if (addSavingsModal) addSavingsModal.classList.add("hidden");
    }

    if (closeSavingsModalBtn) closeSavingsModalBtn.addEventListener("click", closeDepositModal);
    if (cancelSavingsModalBtn) cancelSavingsModalBtn.addEventListener("click", closeDepositModal);

    // Quick deposit pills (+$25, +$50, +$100, etc.)
    document.querySelectorAll(".btn-deposit-quick").forEach(btn => {
        btn.addEventListener("click", () => {
            const amt = parseFloat(btn.getAttribute("data-amt") || "0");
            const current = parseFloat(depositAmountInput.value) || 0;
            depositAmountInput.value = (current + amt).toString();
        });
    });

    // Submit Deposit Savings
    if (depositSavingsForm) {
        depositSavingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = depositGoalId.value;
            const depositAmount = parseFloat(depositAmountInput.value);

            if (isNaN(depositAmount) || depositAmount <= 0) {
                showToast("Please enter a positive deposit amount.", "error");
                return;
            }

            try {
                const res = await fetch("/api/goals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "deposit", id, depositAmount: depositAmount.toString() })
                });

                if (!res.ok) throw new Error("Deposit failed");
                const resData = await res.json();

                closeDepositModal();

                if (resData.achieved) {
                    showToast(`🎉 Congratulations! You achieved your savings goal: "${resData.name}"!`, "success");
                } else {
                    showToast(`Added ${formatMoney(depositAmount)} to "${resData.name}"!`, "success");
                }

                await loadSavingsGoals();
                await loadSummary();

            } catch (err) {
                console.error(err);
                showToast("Failed to add savings: " + err.message, "error");
            }
        });
    }

    // Toggle Goal Form
    if (openCreateGoalBtn) {
        openCreateGoalBtn.addEventListener("click", () => {
            goalEditId.value = "";
            goalFormHeaderTitle.textContent = "Create New Savings Goal";
            submitGoalBtn.textContent = "Save Goal";
            saveGoalForm.reset();
            const d = new Date();
            d.setMonth(d.getMonth() + 6);
            goalTargetDateInput.value = d.toISOString().split("T")[0];
            goalFormWrapper.classList.remove("hidden");
            goalNameInput.focus();
            goalFormWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    if (closeGoalFormBtn) closeGoalFormBtn.addEventListener("click", () => goalFormWrapper.classList.add("hidden"));
    if (cancelGoalFormBtn) cancelGoalFormBtn.addEventListener("click", () => goalFormWrapper.classList.add("hidden"));

    // Edit Goal Action
    function handleEditGoal(g) {
        goalEditId.value = g.id;
        goalFormHeaderTitle.textContent = `Edit Savings Goal (${g.id})`;
        submitGoalBtn.textContent = "Update Goal";
        goalNameInput.value = g.name;
        goalCategorySelect.value = g.category || "General";
        goalTargetInput.value = g.targetAmount;
        goalSavedInput.value = g.savedAmount;
        goalTargetDateInput.value = g.targetDate || "";
        goalFormWrapper.classList.remove("hidden");
        goalNameInput.focus();
        goalFormWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Delete Goal Action
    async function handleDeleteGoal(id, name) {
        if (!confirm(`Delete savings goal "${name}"?`)) return;

        try {
            const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            showToast(`Deleted "${name}"`, "success");
            await loadSavingsGoals();
            await loadSummary();

        } catch (err) {
            console.error(err);
            showToast("Failed to delete goal: " + err.message, "error");
        }
    }

    // Create / Edit Goal Form Submit
    if (saveGoalForm) {
        saveGoalForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = goalEditId.value;
            const name = goalNameInput.value.trim();
            const category = goalCategorySelect.value;
            const targetAmount = parseFloat(goalTargetInput.value);
            const savedAmount = parseFloat(goalSavedInput.value) || 0;
            const targetDate = goalTargetDateInput.value;

            if (!name || isNaN(targetAmount) || targetAmount <= 0 || !targetDate) {
                showToast("Please enter a valid goal name, target amount, and target date.", "error");
                return;
            }

            const payload = {
                id,
                name,
                category,
                targetAmount: targetAmount.toString(),
                savedAmount: savedAmount.toString(),
                targetDate
            };

            try {
                const res = await fetch("/api/goals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error("Failed to save savings goal");
                const resData = await res.json();

                goalFormWrapper.classList.add("hidden");
                saveGoalForm.reset();

                if (resData.achieved) {
                    showToast(`🎉 Congratulations! You achieved your savings goal: "${name}"!`, "success");
                } else {
                    showToast(id ? `Updated goal "${name}" successfully!` : `Created goal "${name}" with target ${formatMoney(targetAmount)}!`, "success");
                }

                await loadSavingsGoals();
                await loadSummary();

            } catch (err) {
                console.error(err);
                showToast("Error saving goal: " + err.message, "error");
            }
        });
    }

    // ========================================================================
    // SMART SPENDING ANALYSIS & CHART.JS ANALYTICS
    // ========================================================================
    let chartJsSpendingPieInstance = null;
    let chartJsMonthlyBarInstance = null;

    const analysisTotalExpense = document.getElementById("analysisTotalExpense");
    const analysisHighestCatName = document.getElementById("analysisHighestCatName");
    const analysisHighestBadge = document.getElementById("analysisHighestBadge");
    const analysisLowestCatName = document.getElementById("analysisLowestCatName");
    const analysisLowestBadge = document.getElementById("analysisLowestBadge");
    const analysisTrackedCount = document.getElementById("analysisTrackedCount");
    const analysisSuggestionsGrid = document.getElementById("analysisSuggestionsGrid");
    const analysisCategoryTableBody = document.getElementById("analysisCategoryTableBody");
    const chartJsSpendingPie = document.getElementById("chartJsSpendingPie");
    const chartJsMonthlyBar = document.getElementById("chartJsMonthlyBar");

    async function loadSpendingAnalysis() {
        try {
            // Fetch analysis data and summary data concurrently
            const [analysisRes, summaryRes] = await Promise.all([
                fetch("/api/analysis"),
                fetch("/api/summary")
            ]);

            if (!analysisRes.ok) throw new Error("Could not load spending analysis");
            const data = await analysisRes.json();
            const summary = summaryRes.ok ? await summaryRes.json() : {};

            // 1. Update 4 Key Metrics
            if (analysisTotalExpense) analysisTotalExpense.textContent = formatMoney(data.totalExpenses || 0);
            if (analysisHighestCatName) analysisHighestCatName.textContent = data.highestCategory || "None";
            if (analysisHighestBadge) {
                analysisHighestBadge.textContent = `${formatMoney(data.highestAmount || 0)} (${data.highestPercentage || 0}%)`;
            }
            if (analysisLowestCatName) analysisLowestCatName.textContent = data.lowestCategory || "None";
            if (analysisLowestBadge) {
                analysisLowestBadge.textContent = `${formatMoney(data.lowestAmount || 0)} (${data.lowestPercentage || 0}%)`;
            }
            if (analysisTrackedCount) {
                const count = Object.keys(data.categoryExpenses || {}).length;
                analysisTrackedCount.textContent = count;
            }

            // 2. Render Smart Suggestions
            renderSmartSuggestions(data.suggestions || []);

            // 3. Render Chart.js Pie Chart (Category-wise allocation)
            renderChartJsPie(data.categoryExpenses || {}, data.totalExpenses || 0);

            // 4. Render Chart.js Bar Chart (Monthly Income vs Expense)
            renderChartJsBar(summary.monthlyTotals || {});

            // 5. Render Detailed Category Breakdown Table
            renderAnalysisCategoryTable(data.categoryExpenses || {}, data.totalExpenses || 0);

        } catch (err) {
            console.error("Spending analysis error:", err);
        }
    }

    function renderSmartSuggestions(suggestions) {
        if (!analysisSuggestionsGrid) return;
        analysisSuggestionsGrid.innerHTML = "";

        if (!suggestions || suggestions.length === 0) {
            analysisSuggestionsGrid.innerHTML = `
                <div class="suggestion-card" style="grid-column: 1 / -1;">
                    <span class="suggestion-icon">💡</span>
                    <span class="suggestion-text">Add more expenses to generate personalized smart spending suggestions.</span>
                </div>
            `;
            return;
        }

        suggestions.forEach(tip => {
            const card = document.createElement("div");
            let icon = "💡";
            let extraClass = "";

            if (tip.includes("Great!") || tip.includes("saved") || tip.includes("lowest")) {
                icon = "🎉";
                extraClass = "suggestion-success";
            } else if (tip.includes("most") || tip.includes("high") || tip.includes("reducing")) {
                icon = "⚠️";
                extraClass = "suggestion-warning";
            } else if (tip.includes("Food")) {
                icon = "🍽️";
            } else if (tip.includes("Shopping")) {
                icon = "🛍️";
            }

            card.className = `suggestion-card ${extraClass}`;
            card.innerHTML = `
                <span class="suggestion-icon">${icon}</span>
                <span class="suggestion-text">${escapeHtml(tip)}</span>
            `;
            analysisSuggestionsGrid.appendChild(card);
        });
    }

    function renderChartJsPie(categoryExpenses, totalExpense) {
        if (!chartJsSpendingPie) return;
        if (typeof Chart === "undefined") {
            console.warn("Chart.js is not loaded yet");
            return;
        }

        const labels = Object.keys(categoryExpenses);
        const values = Object.values(categoryExpenses);

        if (chartJsSpendingPieInstance) {
            chartJsSpendingPieInstance.destroy();
        }

        if (labels.length === 0 || totalExpense === 0) {
            return;
        }

        const ctx = chartJsSpendingPie.getContext("2d");
        const colors = PASTEL_CHART_COLORS;

        chartJsSpendingPieInstance = new Chart(ctx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 3,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            font: { family: "'Poppins', 'Nunito', sans-serif", size: 12 },
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : "0.0";
                                return ` ${context.label}: $${val.toFixed(2)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderChartJsBar(monthlyTotals) {
        if (!chartJsMonthlyBar) return;
        if (typeof Chart === "undefined") {
            console.warn("Chart.js is not loaded yet");
            return;
        }

        const months = Object.keys(monthlyTotals).sort();
        const incomeData = months.map(m => monthlyTotals[m].income || 0);
        const expenseData = months.map(m => monthlyTotals[m].expense || 0);

        if (chartJsMonthlyBarInstance) {
            chartJsMonthlyBarInstance.destroy();
        }

        if (months.length === 0) {
            return;
        }

        const ctx = chartJsMonthlyBar.getContext("2d");

        chartJsMonthlyBarInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Income ($)",
                        data: incomeData,
                        backgroundColor: "#f472b6",
                        borderRadius: 8
                    },
                    {
                        label: "Expense ($)",
                        data: expenseData,
                        backgroundColor: "#c084fc",
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: "'Poppins', 'Nunito', sans-serif" } }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return "$" + value; },
                            font: { family: "'Poppins', 'Nunito', sans-serif" }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            font: { family: "'Poppins', 'Nunito', sans-serif", size: 12 },
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: $${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderAnalysisCategoryTable(categoryMap, totalExpense) {
        if (!analysisCategoryTableBody) return;
        analysisCategoryTableBody.innerHTML = "";

        const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            analysisCategoryTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No expense categories to display.</td></tr>`;
            return;
        }

        entries.forEach(([cat, amt]) => {
            const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : "0.0";
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>
                    <span class="badge badge-category" style="font-size: 0.85rem;">${escapeHtml(cat)}</span>
                </td>
                <td>
                    <div class="cat-progress-cell">
                        <div class="cat-track-bar">
                            <div class="cat-fill-bar" style="width: ${Math.min(100, Math.max(0, pct))}%;"></div>
                        </div>
                    </div>
                </td>
                <td class="text-right" style="font-weight: 700;">
                    ${formatMoney(amt)}
                </td>
                <td class="text-right" style="color: var(--primary); font-weight: 800;">
                    ${pct}%
                </td>
            `;

            analysisCategoryTableBody.appendChild(tr);
        });
    }

    // ------------------------------------------------------------------------
    // PRELOADER / LOADING SCREEN ANIMATION
    // ------------------------------------------------------------------------
    const appPreloader = document.getElementById("appPreloader");
    const preloaderFill = document.getElementById("preloaderFill");
    const preloaderPercent = document.getElementById("preloaderPercent");
    const preloaderMessage = document.getElementById("preloaderMessage");
    const preloaderEmoji = document.querySelector(".preloader-emoji");

    const loadingPhrases = [
        { pct: 25, text: "Tidying up your expense records... 🌸", emoji: "🌸" },
        { pct: 55, text: "Calculating your balance & budgets... ✨", emoji: "✨" },
        { pct: 85, text: "Aligning your savings milestones... ♡", emoji: "🎀" },
        { pct: 100, text: "Welcome! Your financial space is ready 🌸", emoji: "💖" }
    ];

    function runPreloaderAnimation() {
        if (!appPreloader) return;
        let step = 0;
        let progress = 0;

        const interval = setInterval(() => {
            progress += 3;
            if (progress > 100) progress = 100;

            if (preloaderFill) preloaderFill.style.width = progress + "%";
            if (preloaderPercent) preloaderPercent.textContent = progress + "%";

            if (step < loadingPhrases.length && progress >= loadingPhrases[step].pct) {
                if (preloaderMessage) preloaderMessage.textContent = loadingPhrases[step].text;
                if (preloaderEmoji) preloaderEmoji.textContent = loadingPhrases[step].emoji;
                step++;
            }

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    appPreloader.classList.add("preloader-fadeout");
                    setTimeout(() => {
                        appPreloader.style.display = "none";
                    }, 650);
                }, 350);
            }
        }, 30);
    }

    // Start preloader animation immediately on boot
    runPreloaderAnimation();

    // Initial Load
    loadTransactions();
    loadSummary();
    loadSavingsGoals();
    loadSpendingAnalysis();
});
