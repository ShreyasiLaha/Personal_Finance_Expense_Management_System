/**
 * ============================================================================
 * OOP CONCEPT: INHERITANCE (Child Class)
 * ============================================================================
 * 
 * Expense extends Transaction.
 * It inherits all attributes and methods from Transaction (id, title, amount, date, etc.)
 * and adds an expense-specific attribute: 'paymentMethod' (e.g. Cash, Credit Card, UPI).
 */
public class Expense extends Transaction {

    // ENCAPSULATION: Private variable specific to Expense
    private String paymentMethod;

    public Expense() {
        super();
        this.type = "EXPENSE";
    }

    public Expense(String id, String title, double amount, String category, String date, String notes, String paymentMethod) {
        // Calling parent class constructor using 'super' keyword
        super(id, "EXPENSE", title, amount, category, date, notes);
        this.paymentMethod = (paymentMethod != null && !paymentMethod.trim().isEmpty()) ? paymentMethod.trim() : "Cash";
    }

    // ENCAPSULATION: Getter and Setter for paymentMethod
    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    // Polymorphic implementation of abstract method from Transaction
    @Override
    public String getSpecificDetail() {
        return this.paymentMethod;
    }
}
