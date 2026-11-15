/**
 * ============================================================================
 * OOP CONCEPT: INHERITANCE (Child Class)
 * ============================================================================
 * 
 * Income extends Transaction.
 * It inherits all attributes and methods from Transaction (id, title, amount, date, etc.)
 * and adds an income-specific attribute: 'source' (e.g. Salary, Client, Investment).
 */
public class Income extends Transaction {

    // ENCAPSULATION: Private variable specific to Income
    private String source;

    public Income() {
        super();
        this.type = "INCOME";
    }

    public Income(String id, String title, double amount, String category, String date, String notes, String source) {
        // Calling parent class constructor using 'super' keyword
        super(id, "INCOME", title, amount, category, date, notes);
        this.source = (source != null && !source.trim().isEmpty()) ? source.trim() : "Main Source";
    }

    // ENCAPSULATION: Getter and Setter for source
    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    // Polymorphic implementation of abstract method from Transaction
    @Override
    public String getSpecificDetail() {
        return this.source;
    }
}
