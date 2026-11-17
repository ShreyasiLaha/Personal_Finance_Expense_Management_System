/**
 * ============================================================================
 * OOP CONCEPT: ENCAPSULATION
 * ============================================================================
 * 
 * SavingsGoal represents a financial milestone or target (e.g., New Phone, Laptop, Trip).
 * All fields are encapsulated with private access and accessed via public methods.
 * Demonstrates business logic calculation (remaining amount, completion percentage, achieved state).
 */
public class SavingsGoal {

    // ------------------------------------------------------------------------
    // ENCAPSULATION: Private attributes
    // ------------------------------------------------------------------------
    private String id;
    private String name;
    private double targetAmount;
    private double savedAmount;
    private String targetDate;   // Format: YYYY-MM-DD
    private String category;     // e.g. "Gadgets", "Travel", "Vehicle", "Shopping", "Education", "Other"

    // Default Constructor
    public SavingsGoal() {
        this.id = "GOAL-" + System.currentTimeMillis() % 1000000;
        this.name = "My Savings Goal";
        this.targetAmount = 1000.00;
        this.savedAmount = 0.00;
        this.targetDate = java.time.LocalDate.now().plusMonths(6).toString();
        this.category = "General";
    }

    // Parameterized Constructor
    public SavingsGoal(String id, String name, double targetAmount, double savedAmount, String targetDate, String category) {
        this.id = (id != null && !id.trim().isEmpty()) ? id.trim() : "GOAL-" + (System.currentTimeMillis() % 1000000);
        this.name = (name != null && !name.trim().isEmpty()) ? name.trim() : "Untitled Goal";
        this.targetAmount = Math.max(1.0, targetAmount);
        this.savedAmount = Math.max(0.0, savedAmount);
        this.targetDate = (targetDate != null && !targetDate.trim().isEmpty()) ? targetDate.trim() : java.time.LocalDate.now().plusMonths(6).toString();
        this.category = (category != null && !category.trim().isEmpty()) ? category.trim() : "General";
    }

    // ------------------------------------------------------------------------
    // PUBLIC GETTERS & SETTERS (Controlled access)
    // ------------------------------------------------------------------------
    public String getId() {
        return id;
    }

    public void setId(String id) {
        if (id != null && !id.trim().isEmpty()) {
            this.id = id.trim();
        }
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name.trim();
        }
    }

    public double getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(double targetAmount) {
        this.targetAmount = Math.max(1.0, targetAmount);
    }

    public double getSavedAmount() {
        return savedAmount;
    }

    public void setSavedAmount(double savedAmount) {
        this.savedAmount = Math.max(0.0, savedAmount);
    }

    public String getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(String targetDate) {
        if (targetDate != null && !targetDate.trim().isEmpty()) {
            this.targetDate = targetDate.trim();
        }
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = (category != null && !category.trim().isEmpty()) ? category.trim() : "General";
    }

    // ------------------------------------------------------------------------
    // BUSINESS LOGIC METHODS
    // ------------------------------------------------------------------------

    /**
     * Adds an amount to the saved total
     */
    public void addSavings(double amount) {
        if (amount > 0) {
            this.savedAmount += amount;
        }
    }

    /**
     * Calculates the remaining amount to reach the target
     */
    public double getRemainingAmount() {
        return Math.max(0.0, targetAmount - savedAmount);
    }

    /**
     * Calculates completion percentage (0.0 to 100.0+)
     */
    public double getProgressPercentage() {
        if (targetAmount <= 0) return 0.0;
        return (savedAmount / targetAmount) * 100.0;
    }

    /**
     * Checks if the savings target has been reached
     */
    public boolean isAchieved() {
        return savedAmount >= targetAmount;
    }

    // ------------------------------------------------------------------------
    // SERIALIZATION (File & JSON)
    // ------------------------------------------------------------------------

    /**
     * File storage format: ID|NAME|TARGET_AMOUNT|SAVED_AMOUNT|TARGET_DATE|CATEGORY
     */
    public String toFileString() {
        return String.join("|",
                id != null ? id : "",
                name != null ? name.replace("|", "/") : "",
                String.format(java.util.Locale.US, "%.2f", targetAmount),
                String.format(java.util.Locale.US, "%.2f", savedAmount),
                targetDate != null ? targetDate : "",
                category != null ? category.replace("|", "/") : "General"
        );
    }

    /**
     * Converts to JSON for frontend presentation
     */
    public String toJson() {
        return "{" +
                "\"id\":\"" + escapeJson(id) + "\"," +
                "\"name\":\"" + escapeJson(name) + "\"," +
                "\"targetAmount\":" + String.format(java.util.Locale.US, "%.2f", targetAmount) + "," +
                "\"savedAmount\":" + String.format(java.util.Locale.US, "%.2f", savedAmount) + "," +
                "\"remainingAmount\":" + String.format(java.util.Locale.US, "%.2f", getRemainingAmount()) + "," +
                "\"progressPercentage\":" + String.format(java.util.Locale.US, "%.1f", getProgressPercentage()) + "," +
                "\"targetDate\":\"" + escapeJson(targetDate) + "\"," +
                "\"category\":\"" + escapeJson(category) + "\"," +
                "\"achieved\":" + isAchieved() +
                "}";
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", "");
    }
}

