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
    // ------------------------------------------------------------------------
    private final ArrayList<Transaction> transactions;
    private final FileManager fileManager;

    public FinanceManager(FileManager fileManager) {
        this.fileManager = fileManager;
        this.transactions = new ArrayList<>();
        loadData();
    }

    /**
     * Loads transactions from file into our ArrayList
     */
    public synchronized void loadData() {
        this.transactions.clear();
        this.transactions.addAll(fileManager.loadTransactions());
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

        sb.append("}");
        return sb.toString();
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

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
