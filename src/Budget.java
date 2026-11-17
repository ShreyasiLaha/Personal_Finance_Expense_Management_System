/**
 * ============================================================================
 * OOP CONCEPT: ENCAPSULATION
 * ============================================================================
 * 
 * Budget represents a spending limit set for a specific category or overall.
 * Demonstrates encapsulation with private attributes and public getters/setters.
 */
public class Budget {

    // ENCAPSULATION: Private attributes
    private String category;      // Category name: "Overall", "Food", "Shopping", "Travel", "Education", "Bills"
    private double limitAmount;   // Monthly budget limit

    public Budget() {
        this.category = "Overall";
        this.limitAmount = 1000.00;
    }

    public Budget(String category, double limitAmount) {
        this.category = (category != null && !category.trim().isEmpty()) ? category.trim() : "Overall";
        this.limitAmount = Math.max(0.0, limitAmount);
    }

    // Public Getters and Setters
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(double limitAmount) {
        this.limitAmount = Math.max(0.0, limitAmount);
    }

    /**
     * File storage format: CATEGORY|LIMIT
     */
    public String toFileString() {
        return category + "|" + String.format(java.util.Locale.US, "%.2f", limitAmount);
    }

    /**
     * Convert to JSON
     */
    public String toJson() {
        return "{" +
                "\"category\":\"" + escapeJson(category) + "\"," +
                "\"limitAmount\":" + String.format(java.util.Locale.US, "%.2f", limitAmount) +
                "}";
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

