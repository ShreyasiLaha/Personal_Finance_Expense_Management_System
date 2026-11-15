import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * ============================================================================
 * OOP CONCEPT 1: INHERITANCE (Parent Class)
 * OOP CONCEPT 2: ENCAPSULATION (Private variables with public getters/setters)
 * ============================================================================
 * 
 * Transaction is the abstract base class representing any financial record.
 * Both Income and Expense inherit from this class.
 */
public abstract class Transaction {

    // ------------------------------------------------------------------------
    // ENCAPSULATION: All instance variables are declared private/protected
    // so they cannot be accessed directly from outside the class hierarchy.
    // ------------------------------------------------------------------------
    protected String id;
    protected String type;       // "INCOME" or "EXPENSE"
    protected String title;      // Name or description of transaction
    protected double amount;     // Monetary amount
    protected String category;   // Category: Food, Shopping, Travel, Education, Bills, Salary, etc.
    protected String date;       // Formatted date (YYYY-MM-DD)
    protected String notes;      // Optional notes or details

    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Default constructor
    public Transaction() {
        this.date = LocalDate.now().format(DATE_FORMATTER);
    }

    // Parameterized constructor
    public Transaction(String id, String type, String title, double amount, String category, String date, String notes) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.amount = Math.abs(amount);
        this.category = category;
        this.date = (date != null && !date.trim().isEmpty()) ? date.trim() : LocalDate.now().format(DATE_FORMATTER);
        this.notes = notes != null ? notes.trim() : "";
    }

    // ------------------------------------------------------------------------
    // ENCAPSULATION: Public Getter and Setter methods provide controlled access
    // ------------------------------------------------------------------------
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = Math.abs(amount);
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    // Abstract method implemented by child classes (Polymorphism)
    public abstract String getSpecificDetail();

    /**
     * Converts transaction to a pipe-delimited string for file storage
     */
    public String toFileString() {
        return String.join("|",
                id != null ? id : "",
                type != null ? type : "",
                title != null ? title.replace("|", "/") : "",
                String.format(java.util.Locale.US, "%.2f", amount),
                category != null ? category.replace("|", "/") : "",
                date != null ? date : "",
                notes != null ? notes.replace("|", "/") : "",
                getSpecificDetail() != null ? getSpecificDetail().replace("|", "/") : ""
        );
    }

    /**
     * Converts transaction to a simple JSON object string
     */
    public String toJson() {
        return "{" +
                "\"id\":\"" + escapeJson(id) + "\"," +
                "\"type\":\"" + escapeJson(type) + "\"," +
                "\"title\":\"" + escapeJson(title) + "\"," +
                "\"amount\":" + String.format(java.util.Locale.US, "%.2f", amount) + "," +
                "\"category\":\"" + escapeJson(category) + "\"," +
                "\"date\":\"" + escapeJson(date) + "\"," +
                "\"notes\":\"" + escapeJson(notes) + "\"," +
                "\"detail\":\"" + escapeJson(getSpecificDetail()) + "\"" +
                "}";
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", "");
    }
}
