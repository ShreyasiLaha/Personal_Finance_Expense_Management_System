import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * ============================================================================
 * OOP CONCEPT: COLLECTIONS
 * ============================================================================
 * 
 * Demonstrates the use of:
 * 1. ArrayList<Transaction>: Dynamically sized list to store and manage records.
 * 2. HashMap<String, Double>: Key-value pairs to calculate category totals 
 *    and monthly summaries.
 */
public class FinanceManager {

    // ------------------------------------------------------------------------
    // COLLECTIONS: ArrayList used as the in-memory data store for transactions
    // COLLECTIONS: HashMap used to store budget limits by category
    // COLLECTIONS: ArrayList used for savings goals tracking
    // ------------------------------------------------------------------------
    private final ArrayList<Transaction> transactions;
    private final HashMap<String, Double> categoryBudgets;
    private final ArrayList<SavingsGoal> savingsGoals;
    private final FileManager fileManager;

    public FinanceManager(FileManager fileManager) {
        this.fileManager = fileManager;
        this.transactions = new ArrayList<>();
        this.categoryBudgets = new HashMap<>();
        this.savingsGoals = new ArrayList<>();
        loadData();
    }

    /**
     * Loads transactions and budgets from file into our Collections
     */
    public final synchronized void loadData() {
        this.transactions.clear();
        this.transactions.addAll(fileManager.loadTransactions());

        this.categoryBudgets.clear();
        this.categoryBudgets.putAll(fileManager.loadBudgets());

        this.savingsGoals.clear();
        this.savingsGoals.addAll(fileManager.loadSavingsGoals());
    }

    /**
     * Saves our ArrayList of transactions back to the text file
     */
    public synchronized void saveData() {
        fileManager.saveTransactions(this.transactions);
    }

    /**
     * Adds an Income transaction to the ArrayList
     */
    public synchronized boolean addIncome(String id, String title, double amount, String category, String date, String notes, String source) {
        Income income = new Income(id, title, amount, category, date, notes, source);
        return addTransaction(income);
    }

    /**
     * Adds an Expense transaction to the ArrayList
     */
    public synchronized boolean addExpense(String id, String title, double amount, String category, String date, String notes, String paymentMethod) {
        Expense expense = new Expense(id, title, amount, category, date, notes, paymentMethod);
        return addTransaction(expense);
    }

    /**
     * Generic method to add a Transaction object to the collection
     */
    public synchronized boolean addTransaction(Transaction transaction) {
        if (transaction == null) return false;

        // Check for duplicate ID - if exists, update it instead
        for (int i = 0; i < transactions.size(); i++) {
            if (transactions.get(i).getId().equalsIgnoreCase(transaction.getId())) {
                transactions.set(i, transaction);
                saveData();
                return true;
            }
        }

        // Add to the beginning of the list (most recent first)
        transactions.add(0, transaction);
        saveData();
        return true;
    }

    /**
     * Updates an existing transaction in the ArrayList by ID
     */
    public synchronized boolean updateTransaction(Transaction updated) {
        if (updated == null) return false;
        for (int i = 0; i < transactions.size(); i++) {
            if (transactions.get(i).getId().equalsIgnoreCase(updated.getId())) {
                transactions.set(i, updated);
                saveData();
                return true;
            }
        }
        return false;
    }

    /**
     * Deletes a transaction from the ArrayList by ID
     */
    public synchronized boolean deleteTransaction(String id) {
        if (id == null) return false;

        for (int i = 0; i < transactions.size(); i++) {
            if (transactions.get(i).getId().equalsIgnoreCase(id.trim())) {
                transactions.remove(i);
                saveData();
                return true;
            }
        }
        return false;
    }

    /**
     * Returns a copy of the ArrayList containing all transactions
     */
    public synchronized ArrayList<Transaction> getAllTransactions() {
        return new ArrayList<>(this.transactions);
    }

    /**
     * Feature 1: Calculates Total Income
     */
    public synchronized double getTotalIncome() {
        double total = 0.0;
        for (Transaction t : transactions) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                total += t.getAmount();
            }
        }
        return total;
    }

    /**
     * Feature 1: Calculates Total Expenses
     */
    public synchronized double getTotalExpenses() {
        double total = 0.0;
        for (Transaction t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                total += t.getAmount();
            }
        }
        return total;
    }

    /**
     * Feature 1: Calculates Current Balance (Income - Expense)
     */
    public synchronized double getCurrentBalance() {
        return getTotalIncome() - getTotalExpenses();
    }

    /**
     * ------------------------------------------------------------------------
     * COLLECTIONS: HashMap used to map each Expense Category to its total sum
     * ------------------------------------------------------------------------
     * Categories: Food, Shopping, Travel, Education, Bills, etc.
     */
    public synchronized HashMap<String, Double> getExpenseByCategory() {
        HashMap<String, Double> categoryMap = new HashMap<>();

        for (Transaction t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                String cat = t.getCategory();
                double currentSum = categoryMap.getOrDefault(cat, 0.0);
                categoryMap.put(cat, currentSum + t.getAmount());
            }
        }
        return categoryMap;
    }

    /**
     * ------------------------------------------------------------------------
     * COLLECTIONS: HashMap used to calculate Monthly Expense Summary
     * ------------------------------------------------------------------------
     * Maps Month (e.g., "2026-11") to total expenses in that month.
     */
    public synchronized HashMap<String, Double> getMonthlyExpenseSummary() {
        HashMap<String, Double> monthlyMap = new HashMap<>();

        for (Transaction t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                // Extract YYYY-MM from YYYY-MM-DD
                String dateStr = t.getDate();
                String monthKey = (dateStr != null && dateStr.length() >= 7) ? dateStr.substring(0, 7) : "Unknown";
                double currentSum = monthlyMap.getOrDefault(monthKey, 0.0);
                monthlyMap.put(monthKey, currentSum + t.getAmount());
            }
        }
        return monthlyMap;
    }

    /**
     * ------------------------------------------------------------------------
     * COLLECTIONS: HashMap used to calculate Monthly Income vs Expense totals
     * ------------------------------------------------------------------------
     */
    public synchronized HashMap<String, double[]> getMonthlyTotals() {
        HashMap<String, double[]> monthlyTotals = new HashMap<>();

        for (Transaction t : transactions) {
            String dateStr = t.getDate();
            String monthKey = (dateStr != null && dateStr.length() >= 7) ? dateStr.substring(0, 7) : "Unknown";

            if (!monthlyTotals.containsKey(monthKey)) {
                monthlyTotals.put(monthKey, new double[]{0.0, 0.0}); // index 0: income, index 1: expense
            }

            double[] values = monthlyTotals.get(monthKey);
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                values[0] += t.getAmount();
            } else {
                values[1] += t.getAmount();
            }
        }
        return monthlyTotals;
    }

    /**
     * Filters transactions by type, category, and search query
     */
    public synchronized ArrayList<Transaction> filterTransactions(String type, String category, String search) {
        ArrayList<Transaction> result = new ArrayList<>();
        String sQuery = search != null ? search.trim().toLowerCase() : "";

        for (Transaction t : transactions) {
            if (type != null && !type.equalsIgnoreCase("ALL") && !t.getType().equalsIgnoreCase(type)) {
                continue;
            }
            if (category != null && !category.equalsIgnoreCase("ALL") && !t.getCategory().equalsIgnoreCase(category)) {
                continue;
            }
            if (!sQuery.isEmpty()) {
                boolean match = t.getTitle().toLowerCase().contains(sQuery)
                        || t.getCategory().toLowerCase().contains(sQuery)
                        || t.getNotes().toLowerCase().contains(sQuery)
                        || t.getSpecificDetail().toLowerCase().contains(sQuery);
                if (!match) continue;
            }
            result.add(t);
        }
        return result;
    }

    /**
     * Generates a complete JSON summary for the frontend dashboard
     */
    public synchronized String getSummaryJson() {
        double income = getTotalIncome();
        double expenses = getTotalExpenses();
        double balance = getCurrentBalance();
        double savingsRate = income > 0 ? Math.max(0, (balance / income) * 100) : 0;

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"totalIncome\":").append(String.format(Locale.US, "%.2f", income)).append(",");
        sb.append("\"totalExpense\":").append(String.format(Locale.US, "%.2f", expenses)).append(",");
        sb.append("\"currentBalance\":").append(String.format(Locale.US, "%.2f", balance)).append(",");
        sb.append("\"savingsRate\":").append(String.format(Locale.US, "%.1f", savingsRate)).append(",");
        sb.append("\"transactionCount\":").append(transactions.size()).append(",");

        // Category breakdown from HashMap
        sb.append("\"expenseByCategory\":{");
        HashMap<String, Double> catMap = getExpenseByCategory();
        int cIdx = 0;
        for (Map.Entry<String, Double> e : catMap.entrySet()) {
            if (cIdx > 0) sb.append(",");
            sb.append("\"").append(escapeJson(e.getKey())).append("\":").append(String.format(Locale.US, "%.2f", e.getValue()));
            cIdx++;
        }
        sb.append("},");

        // Monthly Expense Summary from HashMap
        sb.append("\"monthlyExpenseSummary\":{");
        HashMap<String, Double> monthExpMap = getMonthlyExpenseSummary();
        int mIdx = 0;
        for (Map.Entry<String, Double> e : monthExpMap.entrySet()) {
            if (mIdx > 0) sb.append(",");
            sb.append("\"").append(escapeJson(e.getKey())).append("\":").append(String.format(Locale.US, "%.2f", e.getValue()));
            mIdx++;
        }
        sb.append("},");

        // Monthly trends (income vs expense)
        sb.append("\"monthlyTotals\":{");
        HashMap<String, double[]> totalsMap = getMonthlyTotals();
        int tIdx = 0;
        for (Map.Entry<String, double[]> e : totalsMap.entrySet()) {
            if (tIdx > 0) sb.append(",");
            sb.append("\"").append(escapeJson(e.getKey())).append("\":{")
              .append("\"income\":").append(String.format(Locale.US, "%.2f", e.getValue()[0])).append(",")
              .append("\"expense\":").append(String.format(Locale.US, "%.2f", e.getValue()[1]))
              .append("}");
            tIdx++;
        }
        sb.append("}");

        // Budget Alerts Summary
        sb.append(",\"budgetSummary\":").append(getBudgetSummaryJson());

        // Savings Goal Summary
        sb.append(",\"savingsGoalSummary\":").append(getSavingsGoalsSummaryJson());

        // Smart Spending Analysis Summary
        sb.append(",\"spendingAnalysis\":").append(getSpendingAnalysisJson());

        sb.append("}");
        return sb.toString();
    }

    /**
     * ========================================================================
     * BUDGET & ALERT SYSTEM METHODS (Collections & Logic)
     * ========================================================================
     */
    public synchronized boolean setCategoryBudget(String category, double limit) {
        if (category == null || category.trim().isEmpty()) return false;
        categoryBudgets.put(category.trim(), Math.max(0.0, limit));
        return fileManager.saveBudgets(categoryBudgets);
    }

    public synchronized HashMap<String, Double> getCategoryBudgets() {
        return new HashMap<>(this.categoryBudgets);
    }

    public synchronized String getBudgetSummaryJson() {
        HashMap<String, Double> expByCat = getExpenseByCategory();
        double totalExp = getTotalExpenses();

        // Standard ordered categories to display
        String[] displayCategories = {"Overall", "Food", "Shopping", "Travel", "Education", "Bills", "Other"};
        ArrayList<String> allCategories = new ArrayList<>();
        for (String c : displayCategories) {
            allCategories.add(c);
        }
        for (String c : categoryBudgets.keySet()) {
            if (!allCategories.contains(c)) {
                allCategories.add(c);
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("[");
        int count = 0;

        for (String cat : allCategories) {
            double limit = categoryBudgets.getOrDefault(cat, cat.equals("Overall") ? 900.00 : 150.00);
            double spent = cat.equalsIgnoreCase("Overall") ? totalExp : expByCat.getOrDefault(cat, 0.0);
            double remaining = limit - spent;
            double pct = limit > 0 ? (spent / limit) * 100.0 : 0.0;

            String status = "ON_TRACK";
            String alertMsg = "";

            if (pct >= 100.0) {
                status = "EXCEEDED";
                alertMsg = cat + " budget exceeded by $" + String.format(Locale.US, "%.2f", Math.abs(remaining)) + "!";
            } else if (pct >= 80.0) {
                status = "WARNING";
                alertMsg = "Warning: " + String.format(Locale.US, "%.0f", pct) + "% of " + cat + " budget reached.";
            }

            if (count > 0) sb.append(",");
            sb.append("{")
              .append("\"category\":\"").append(escapeJson(cat)).append("\",")
              .append("\"limit\":").append(String.format(Locale.US, "%.2f", limit)).append(",")
              .append("\"spent\":").append(String.format(Locale.US, "%.2f", spent)).append(",")
              .append("\"remaining\":").append(String.format(Locale.US, "%.2f", remaining)).append(",")
              .append("\"percentage\":").append(String.format(Locale.US, "%.1f", pct)).append(",")
              .append("\"status\":\"").append(status).append("\",")
              .append("\"alert\":\"").append(escapeJson(alertMsg)).append("\"")
              .append("}");
            count++;
        }

        sb.append("]");
        return sb.toString();
    }

    /**
     * Checks if a new expense transaction triggers a budget alert
     */
    public synchronized String checkExpenseAlert(String category, double amount) {
        if (category == null) return null;
        double currentSpent = getExpenseByCategory().getOrDefault(category, 0.0);
        double limit = categoryBudgets.getOrDefault(category, 0.0);

        if (limit > 0) {
            double newTotal = currentSpent + amount;
            if (newTotal >= limit) {
                return "🚨 Budget Alert: This puts your " + category + " expenses at $" + 
                        String.format(Locale.US, "%.2f", newTotal) + ", exceeding your $" + 
                        String.format(Locale.US, "%.2f", limit) + " budget!";
            } else if ((newTotal / limit) >= 0.8) {
                return "⚠️ Budget Warning: This expense brings your " + category + " budget to " + 
                        String.format(Locale.US, "%.0f", (newTotal / limit) * 100) + "% of limit.";
            }
        }
        return null;
    }

    /**
     * Converts a list of transactions to JSON array
     */
    public synchronized String getTransactionsJson(ArrayList<Transaction> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(list.get(i).toJson());
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * ========================================================================
     * SAVINGS GOAL TRACKER METHODS (Collections & Logic)
     * ========================================================================
     */
    public synchronized ArrayList<SavingsGoal> getAllSavingsGoals() {
        return new ArrayList<>(this.savingsGoals);
    }

    public synchronized SavingsGoal getSavingsGoalById(String id) {
        if (id == null) return null;
        for (SavingsGoal g : savingsGoals) {
            if (g.getId().equalsIgnoreCase(id.trim())) {
                return g;
            }
        }
        return null;
    }

    public synchronized boolean addSavingsGoal(SavingsGoal goal) {
        if (goal == null) return false;
        savingsGoals.add(goal);
        return fileManager.saveSavingsGoals(savingsGoals);
    }

    public synchronized boolean updateSavingsGoal(SavingsGoal updated) {
        if (updated == null) return false;
        for (int i = 0; i < savingsGoals.size(); i++) {
            if (savingsGoals.get(i).getId().equalsIgnoreCase(updated.getId())) {
                savingsGoals.set(i, updated);
                return fileManager.saveSavingsGoals(savingsGoals);
            }
        }
        return false;
    }

    public synchronized boolean deleteSavingsGoal(String id) {
        if (id == null) return false;
        boolean removed = savingsGoals.removeIf(g -> g.getId().equalsIgnoreCase(id.trim()));
        if (removed) {
            return fileManager.saveSavingsGoals(savingsGoals);
        }
        return false;
    }

    public synchronized SavingsGoal addSavingsToGoal(String id, double amount) {
        SavingsGoal goal = getSavingsGoalById(id);
        if (goal != null && amount > 0) {
            goal.addSavings(amount);
            fileManager.saveSavingsGoals(savingsGoals);
            return goal;
        }
        return null;
    }

    public synchronized String getSavingsGoalsJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < savingsGoals.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(savingsGoals.get(i).toJson());
        }
        sb.append("]");
        return sb.toString();
    }

    public synchronized String getSavingsGoalsSummaryJson() {
        int totalGoals = savingsGoals.size();
        int achievedGoals = 0;
        double totalTarget = 0.0;
        double totalSaved = 0.0;

        for (SavingsGoal g : savingsGoals) {
            totalTarget += g.getTargetAmount();
            totalSaved += g.getSavedAmount();
            if (g.isAchieved()) {
                achievedGoals++;
            }
        }

        double overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100.0 : 0.0;

        return "{" +
                "\"totalGoals\":" + totalGoals + "," +
                "\"achievedGoals\":" + achievedGoals + "," +
                "\"totalTarget\":" + String.format(Locale.US, "%.2f", totalTarget) + "," +
                "\"totalSaved\":" + String.format(Locale.US, "%.2f", totalSaved) + "," +
                "\"overallProgress\":" + String.format(Locale.US, "%.1f", overallPct) +
                "}";
    }

    /**
     * ========================================================================
     * SMART SPENDING ANALYSIS (Collections: HashMap & ArrayList)
     * ========================================================================
     * Calculates highest/lowest spending categories and generates smart suggestions.
     * Easy to explain during college viva.
     */
    public synchronized String getSpendingAnalysisJson() {
        HashMap<String, Double> categoryMap = getExpenseByCategory();
        double totalExpense = getTotalExpenses();
        double totalIncome = getTotalIncome();
        double balance = getCurrentBalance();
        double savingsRate = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

        String highestCategory = "None";
        double highestAmount = 0.0;
        String lowestCategory = "None";
        double lowestAmount = Double.MAX_VALUE;

        for (Map.Entry<String, Double> entry : categoryMap.entrySet()) {
            double amt = entry.getValue();
            if (amt > highestAmount) {
                highestAmount = amt;
                highestCategory = entry.getKey();
            }
            if (amt < lowestAmount && amt > 0) {
                lowestAmount = amt;
                lowestCategory = entry.getKey();
            }
        }

        if (lowestAmount == Double.MAX_VALUE) {
            lowestAmount = 0.0;
            lowestCategory = "None";
        }

        // Generate simple, rule-based smart suggestions using ArrayList
        ArrayList<String> suggestions = new ArrayList<>();

        if (!highestCategory.equals("None")) {
            suggestions.add("You spent the most on " + highestCategory + " ($" + String.format(Locale.US, "%.2f", highestAmount) + ") this month.");
        }

        double shoppingAmt = categoryMap.getOrDefault("Shopping", 0.0);
        if (shoppingAmt > 100.0) {
            suggestions.add("Your shopping expenses are relatively high at $" + String.format(Locale.US, "%.2f", shoppingAmt) + ". Consider reviewing non-essential purchases.");
        }

        double foodAmt = categoryMap.getOrDefault("Food", 0.0);
        if (totalExpense > 0 && (foodAmt / totalExpense) >= 0.30) {
            suggestions.add("Food accounts for " + String.format(Locale.US, "%.0f", (foodAmt / totalExpense) * 100) + "% of total expenses. Preparing home meals can boost savings.");
        }

        if (savingsRate >= 40.0) {
            suggestions.add("Great! You maintained a healthy " + String.format(Locale.US, "%.1f", savingsRate) + "% savings rate this month.");
        } else {
            suggestions.add("Try saving more by reducing unnecessary expenses to build a safety net.");
        }

        if (!lowestCategory.equals("None") && !lowestCategory.equals(highestCategory)) {
            suggestions.add("Your lowest spending was on " + lowestCategory + " ($" + String.format(Locale.US, "%.2f", lowestAmount) + "), keeping costs well controlled there.");
        }

        // Build clean JSON
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"totalExpenses\":").append(String.format(Locale.US, "%.2f", totalExpense)).append(",");
        sb.append("\"highestCategory\":\"").append(escapeJson(highestCategory)).append("\",");
        sb.append("\"highestAmount\":").append(String.format(Locale.US, "%.2f", highestAmount)).append(",");
        sb.append("\"highestPercentage\":").append(totalExpense > 0 ? String.format(Locale.US, "%.1f", (highestAmount / totalExpense) * 100) : "0.0").append(",");
        sb.append("\"lowestCategory\":\"").append(escapeJson(lowestCategory)).append("\",");
        sb.append("\"lowestAmount\":").append(String.format(Locale.US, "%.2f", lowestAmount)).append(",");
        sb.append("\"lowestPercentage\":").append(totalExpense > 0 ? String.format(Locale.US, "%.1f", (lowestAmount / totalExpense) * 100) : "0.0").append(",");
        
        // Category breakdown from HashMap
        sb.append("\"categoryExpenses\":{");
        int idx = 0;
        for (Map.Entry<String, Double> e : categoryMap.entrySet()) {
            if (idx > 0) sb.append(",");
            sb.append("\"").append(escapeJson(e.getKey())).append("\":").append(String.format(Locale.US, "%.2f", e.getValue()));
            idx++;
        }
        sb.append("},");

        // Suggestions array from ArrayList
        sb.append("\"suggestions\":[");
        for (int i = 0; i < suggestions.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(suggestions.get(i))).append("\"");
        }
        sb.append("]");

        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
