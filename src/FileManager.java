import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * OOP CONCEPT: FILE HANDLING
 * ============================================================================
 * 
 * Uses FileReader, FileWriter, BufferedReader, and BufferedWriter to persist
 * and retrieve transactions from transactions.txt.
 */
public class FileManager {

    // ENCAPSULATION: Private variable for the target storage file paths
    private final String filePath;
    private final String budgetsFilePath;
    private final String goalsFilePath;

    public FileManager(String filePath) {
        this.filePath = filePath;
        this.budgetsFilePath = "budgets.txt";
        this.goalsFilePath = "goals.txt";
    }

    public FileManager(String filePath, String budgetsFilePath) {
        this.filePath = filePath;
        this.budgetsFilePath = budgetsFilePath;
        this.goalsFilePath = "goals.txt";
    }

    public FileManager(String filePath, String budgetsFilePath, String goalsFilePath) {
        this.filePath = filePath;
        this.budgetsFilePath = budgetsFilePath;
        this.goalsFilePath = goalsFilePath;
    }

    /**
     * Reads all transactions from the text file using FileReader and BufferedReader.
     * 
     * @return ArrayList of Transaction objects
     */
    public synchronized ArrayList<Transaction> loadTransactions() {
        ArrayList<Transaction> transactions = new ArrayList<>();
        File file = new File(filePath);

        // If file doesn't exist or is empty, create it and seed sample data
        if (!file.exists() || file.length() == 0) {
            seedDefaultTransactions();
        }

        // --------------------------------------------------------------------
        // FILE HANDLING: FileReader wrapped in BufferedReader for efficient reading
        // --------------------------------------------------------------------
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Skip empty lines or comment lines starting with '#'
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                Transaction transaction = parseLine(line);
                if (transaction != null) {
                    transactions.add(transaction);
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading transactions: " + e.getMessage());
        }

        return transactions;
    }

    /**
     * Saves the entire list of transactions to the file using FileWriter and BufferedWriter.
     * 
     * @param transactions ArrayList of Transaction objects
     * @return true if successful, false otherwise
     */
    public synchronized boolean saveTransactions(ArrayList<Transaction> transactions) {
        File file = new File(filePath);

        // --------------------------------------------------------------------
        // FILE HANDLING: FileWriter wrapped in BufferedWriter for efficient writing
        // --------------------------------------------------------------------
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, false))) {
            writer.write("# Personal Finance & Expense Management System Data File");
            writer.newLine();
            writer.write("# Format: ID|TYPE|TITLE|AMOUNT|CATEGORY|DATE|NOTES|SPECIFIC_DETAIL");
            writer.newLine();

            for (Transaction t : transactions) {
                writer.write(t.toFileString());
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            System.err.println("Error writing transactions: " + e.getMessage());
            return false;
        }
    }

    /**
     * Appends a single transaction to the file.
     */
    public synchronized boolean appendTransaction(Transaction t) {
        File file = new File(filePath);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, true))) {
            writer.write(t.toFileString());
            writer.newLine();
            return true;
        } catch (IOException e) {
            System.err.println("Error appending transaction: " + e.getMessage());
            return false;
        }
    }

    /**
     * Parses a pipe-delimited line from the file into an Income or Expense object.
     */
    private Transaction parseLine(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 6) {
            return null;
        }

        try {
            String id = parts[0].trim();
            String type = parts[1].trim().toUpperCase();
            String title = parts[2].trim();
            double amount = Double.parseDouble(parts[3].trim());
            String category = parts[4].trim();
            String date = parts[5].trim();
            String notes = parts.length > 6 ? parts[6].trim() : "";
            String detail = parts.length > 7 ? parts[7].trim() : "";

            if ("INCOME".equalsIgnoreCase(type)) {
                return new Income(id, title, amount, category, date, notes, detail);
            } else {
                return new Expense(id, title, amount, category, date, notes, detail);
            }
        } catch (Exception e) {
            System.err.println("Skipping malformed transaction line: " + line);
            return null;
        }
    }

    /**
     * Seeds initial sample transactions covering standard categories (Food, Shopping, Travel, Education, Bills).
     */
    public synchronized void seedDefaultTransactions() {
        ArrayList<Transaction> sampleList = new ArrayList<>();

        // Incomes
        sampleList.add(new Income("TXN-101", "Monthly Job Salary", 4500.00, "Salary", "2026-11-01", "Full-time software role", "Corporate Payroll"));
        sampleList.add(new Income("TXN-102", "Web Freelance Project", 850.00, "Freelance", "2026-11-05", "Client website design", "Upwork"));

        // Expenses matching requested categories: Food, Shopping, Travel, Education, Bills
        sampleList.add(new Expense("TXN-103", "Apartment Electricity & Water", 145.00, "Bills", "2026-11-02", "Monthly utility bill", "Online Banking"));
        sampleList.add(new Expense("TXN-104", "Weekly Grocery & Supermarket", 165.50, "Food", "2026-11-04", "Vegetables, dairy, snacks", "Credit Card"));
        sampleList.add(new Expense("TXN-105", "Online Programming Course", 89.99, "Education", "2026-11-07", "Java & Web dev bootcamp", "Debit Card"));
        sampleList.add(new Expense("TXN-106", "Metro Train Monthly Pass", 60.00, "Travel", "2026-11-09", "Daily transit card reload", "UPI"));
        sampleList.add(new Expense("TXN-107", "Winter Jacket & Sneakers", 120.00, "Shopping", "2026-11-11", "Seasonal clothing mall purchase", "Credit Card"));
        sampleList.add(new Expense("TXN-108", "Italian Restaurant Dinner", 54.50, "Food", "2026-11-13", "Weekend dinner with friends", "Cash"));

        saveTransactions(sampleList);
    }

    /**
     * ========================================================================
     * BUDGET FILE HANDLING: Reads budgets from budgets.txt
     * ========================================================================
     */
    public synchronized HashMap<String, Double> loadBudgets() {
        HashMap<String, Double> budgets = new HashMap<>();
        File file = new File(budgetsFilePath);

        if (!file.exists() || file.length() == 0) {
            budgets = seedDefaultBudgets();
            return budgets;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                String[] parts = line.split("\\|", -1);
                if (parts.length >= 2) {
                    try {
                        String cat = parts[0].trim();
                        double limit = Double.parseDouble(parts[1].trim());
                        budgets.put(cat, limit);
                    } catch (NumberFormatException ignored) {}
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading budgets: " + e.getMessage());
        }

        if (budgets.isEmpty()) {
            budgets = seedDefaultBudgets();
        }

        return budgets;
    }

    /**
     * ========================================================================
     * BUDGET FILE HANDLING: Saves budgets to budgets.txt
     * ========================================================================
     */
    public synchronized boolean saveBudgets(HashMap<String, Double> budgets) {
        File file = new File(budgetsFilePath);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, false))) {
            writer.write("# Category Budgets File");
            writer.newLine();
            writer.write("# Format: CATEGORY|LIMIT_AMOUNT");
            writer.newLine();

            for (Map.Entry<String, Double> entry : budgets.entrySet()) {
                writer.write(entry.getKey() + "|" + String.format(java.util.Locale.US, "%.2f", entry.getValue()));
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            System.err.println("Error writing budgets: " + e.getMessage());
            return false;
        }
    }

    /**
     * Seeds initial sensible monthly budgets for all core categories
     */
    public synchronized HashMap<String, Double> seedDefaultBudgets() {
        HashMap<String, Double> defaults = new HashMap<>();
        defaults.put("Overall", 900.00);
        defaults.put("Food", 250.00);
        defaults.put("Shopping", 150.00);
        defaults.put("Travel", 80.00);
        defaults.put("Education", 100.00);
        defaults.put("Bills", 180.00);
        defaults.put("Other", 100.00);

        saveBudgets(defaults);
        return defaults;
    }

    /**
     * ========================================================================
     * SAVINGS GOAL FILE HANDLING: Reads goals from goals.txt
     * ========================================================================
     */
    public synchronized ArrayList<SavingsGoal> loadSavingsGoals() {
        ArrayList<SavingsGoal> goals = new ArrayList<>();
        File file = new File(goalsFilePath);

        if (!file.exists() || file.length() == 0) {
            goals = seedDefaultGoals();
            return goals;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                String[] parts = line.split("\\|", -1);
                if (parts.length >= 4) {
                    try {
                        String id = parts[0].trim();
                        String name = parts[1].trim();
                        double target = Double.parseDouble(parts[2].trim());
                        double saved = Double.parseDouble(parts[3].trim());
                        String date = parts.length > 4 ? parts[4].trim() : java.time.LocalDate.now().plusMonths(6).toString();
                        String category = parts.length > 5 ? parts[5].trim() : "General";

                        goals.add(new SavingsGoal(id, name, target, saved, date, category));
                    } catch (Exception ignored) {}
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading savings goals: " + e.getMessage());
        }

        if (goals.isEmpty()) {
            goals = seedDefaultGoals();
        }

        return goals;
    }

    /**
     * ========================================================================
     * SAVINGS GOAL FILE HANDLING: Saves goals to goals.txt
     * ========================================================================
     */
    public synchronized boolean saveSavingsGoals(ArrayList<SavingsGoal> goals) {
        File file = new File(goalsFilePath);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, false))) {
            writer.write("# Savings Goals File");
            writer.newLine();
            writer.write("# Format: ID|NAME|TARGET_AMOUNT|SAVED_AMOUNT|TARGET_DATE|CATEGORY");
            writer.newLine();

            for (SavingsGoal g : goals) {
                writer.write(g.toFileString());
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            System.err.println("Error writing savings goals: " + e.getMessage());
            return false;
        }
    }

    /**
     * Seeds initial sample savings goals
     */
    public synchronized ArrayList<SavingsGoal> seedDefaultGoals() {
        ArrayList<SavingsGoal> sampleGoals = new ArrayList<>();
        sampleGoals.add(new SavingsGoal("GOAL-101", "New Smartphone", 800.00, 600.00, "2026-12-25", "Gadgets"));
        sampleGoals.add(new SavingsGoal("GOAL-102", "Developer Laptop", 1500.00, 1500.00, "2026-11-30", "Laptop")); // Achieved!
        sampleGoals.add(new SavingsGoal("GOAL-103", "Goa Vacation Trip", 650.00, 320.00, "2027-01-15", "Travel"));
        sampleGoals.add(new SavingsGoal("GOAL-104", "Emergency Cushion Fund", 2000.00, 950.00, "2027-06-30", "Other"));

        saveSavingsGoals(sampleGoals);
        return sampleGoals;
    }
}
