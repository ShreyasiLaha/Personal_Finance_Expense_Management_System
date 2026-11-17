# Personal Finance & Expense Management System

A beginner-friendly, lightweight web-based financial management system built with **Java (Standard HTTP Server)** on the backend and **HTML5, CSS3, and JavaScript** on the frontend. 

It demonstrates core **Object-Oriented Programming (OOP) concepts** and **Java File Handling** without any heavy or complex frameworks (No Spring Boot, No Hibernate, No MySQL required).

---

## 🌟 Key Features

1. **Financial Dashboard**: Real-time display of **Total Income**, **Total Expenses**, and **Current Balance** (Surplus/Deficit status).
2. **Savings Goal Tracker**: Create and track financial milestones (New Phone, Laptop, Trip, Shopping, Emergency Fund):
   - Track Target Amount, Current Saved Amount, Remaining Amount, and Completion Percentage.
   - Interactive cards with category icons (📱, 💻, ✈️, 🛍️, 🚗, 🎓, 🛡️, 🎯) and animated progress bars.
   - **Add Savings** button with quick deposit chips (`+$25`, `+$50`, `+$100`, `+$250`) to deposit funds incrementally.
   - Edit and delete goal options.
   - Automatic 100% milestone celebration banner: *"🎉 Congratulations! You achieved your savings goal!"*
   - Motivational message: *"Every rupee brings you closer to your dream!"*
3. **Automated Budget Alert System**: Set category and overall spending limits; tracks live utilization with automated alert states:
   - 🟢 **On Track** (`< 80%`)
   - 🟡 **Warning** (`80% - 99%`)
   - 🔴 **Exceeded** (`≥ 100%`)
   - Live dashboard alert banner, sidebar warning badges, and real-time alerts when adding expenses that breach limits.
4. **Add Income & Expenses**: Record earnings and outlays with titles, dates, categories, payment methods, and notes.
5. **Predefined & Custom Categories**:
   - **Expenses**: `Food`, `Shopping`, `Travel`, `Education`, `Bills`, `Other`
   - **Income**: `Salary`, `Freelance`, `Investments`, `Bonus`, `Other`
6. **Transaction History**: Searchable and filterable ledger with instant editing, deletion and category filtering.
7. **Monthly Expense Summary**: Aggregates and tracks month-by-month spending trends using Java Collections.
8. **Visual Analytics**: Interactive Category Donut Chart and Monthly Cash Flow Bar Chart rendered with HTML5 Canvas.
9. **CSV Data Export**: 1-click download of all transaction data.
10. **Teal & White Theme**: Modern responsive layout featuring sidebar navigation, multi-theme selector, smooth animations, and hover effects.

---

## 🎓 Object-Oriented Programming (OOP) Concepts Demonstrated

This project is structured specifically to showcase the four fundamental OOP principles:

### 1. Encapsulation
- **Where**: Implemented in [`Transaction.java`](src/Transaction.java), [`Income.java`](src/Income.java), [`Expense.java`](src/Expense.java), [`Budget.java`](src/Budget.java), and [`SavingsGoal.java`](src/SavingsGoal.java).
- **How**: All class variables (`id`, `title`, `amount`, `category`, `date`, `notes`, `source`, `paymentMethod`, `limitAmount`, `targetAmount`, `savedAmount`) are declared with `private` or `protected` access modifiers. 
- Public `getter` and `setter` methods provide controlled, validated read and write access to these variables.

### 2. Inheritance
- **Where**: [`Transaction.java`](src/Transaction.java) (Parent Class), [`Income.java`](src/Income.java) (Child Class), and [`Expense.java`](src/Expense.java) (Child Class).
- **How**: 
  - `Income extends Transaction` inherits all core properties (`id`, `amount`, `date`, etc.) and adds the `source` field.
  - `Expense extends Transaction` inherits all core properties and adds the `paymentMethod` field.
  - Polymorphism is demonstrated via `super(...)` constructor calls and overriding `getSpecificDetail()`.

### 3. Collections Framework
- **Where**: Implemented in [`FinanceManager.java`](src/FinanceManager.java).
- **How**:
  - `ArrayList<Transaction>`: Dynamically sized collection used to maintain the active list of transaction objects in memory.
  - `ArrayList<SavingsGoal>`: Collection tracking financial target milestones, deposits, and completion state.
  - `HashMap<String, Double>`: Key-value map used to aggregate category-wise expense totals (`Food`, `Shopping`, `Travel`, `Education`, `Bills`), calculate monthly spending summaries (`YYYY-MM` -> `Total`), and track category budget limits (`Food` -> `$300.00`).

### 4. File Handling
- **Where**: Implemented in [`FileManager.java`](src/FileManager.java).
- **How**:
  - `FileReader` wrapped inside `BufferedReader`: Reads delimited records line-by-line from `transactions.txt`, `budgets.txt`, and `goals.txt`.
  - `FileWriter` wrapped inside `BufferedWriter`: Persists new transactions, category budget limits, and savings goals efficiently without data corruption.

---

## 📂 Project Directory Structure

```
Personal_Finance_Expense_Management_System/
│
├── src/
│   ├── Main.java              # Java HTTP Server, API routes & static file server
│   ├── Transaction.java       # Abstract parent class (Encapsulation & Inheritance)
│   ├── Income.java            # Child class for income transactions
│   ├── Expense.java           # Child class for expense transactions
│   ├── Budget.java            # Encapsulated Budget model (category & limit)
│   ├── SavingsGoal.java       # Encapsulated Savings Goal model (target, saved & calculation)
│   ├── FinanceManager.java    # Business logic, budget alerts, savings goals & collections
│   └── FileManager.java       # File handling with FileReader, FileWriter, BufferedReader & BufferedWriter
│
├── web/
│   ├── index.html             # Dashboard UI with sidebar navigation & teal/white theme
│   ├── style.css              # Styling, responsive layout, animations & cards
│   └── script.js              # REST API connector, budget alert system, goals & canvas charts
│
├── bin/                       # Compiled .class bytecode files
├── transactions.txt           # Persistent text database for transactions
├── budgets.txt                # Persistent text database for category limits
├── goals.txt                  # Persistent text database for savings goals
└── README.md                  # Documentation and setup guide
```

---

## 🚀 Step-by-Step Instructions to Compile & Run

### Prerequisites
- Java Development Kit (JDK 8 or higher, e.g., JDK 11, 17, 21, or 25).
- Any standard web browser (Chrome, Edge, Firefox, Safari).

### 1. Open Terminal or PowerShell
Navigate into the project directory:
```bash
cd Personal_Finance_Expense_Management_System
```

### 2. Compile the Java Source Files
Compile all Java files into the `bin/` directory:
```bash
javac -d bin src/*.java
```

### 3. Run the Application
Start the built-in web server:
```bash
java -cp bin Main
```

You will see the terminal banner:
```text
=================================================================
   PERSONAL FINANCE & EXPENSE MANAGEMENT SYSTEM (JAVA)
=================================================================
 Web Server URL:  http://localhost:8080
 Data Storage:    .../transactions.txt
 Server Status:   RUNNING (Press Ctrl+C to stop)
=================================================================
```

### 4. Open in Your Browser
Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 💻 Optional Terminal Command-Line Mode

If you wish to view your financial summary directly in the command prompt without opening a browser:
```bash
java -cp bin Main --summary
```

---

## 🌐 REST API Endpoints Reference

The lightweight server exposes clean JSON endpoints used by the frontend:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Serves `web/index.html` dashboard |
| `/api/summary` | `GET` | Returns Current Balance, Total Income, Total Expenses, Category Breakdown (HashMap), Monthly Summary, and Budget Statuses |
| `/api/budgets` | `GET` | Returns category budget limits, amounts spent, percentages, and alert flags |
| `/api/budgets` | `POST` | Sets or updates a category budget limit and saves to `budgets.txt` |
| `/api/goals` | `GET` | Returns list of savings goals with target, saved, remaining, percentage, and achieved state |
| `/api/goals` | `POST` | Creates a new goal, updates an existing goal, or logs a savings deposit |
| `/api/goals?id=...` | `DELETE` | Removes a savings goal by ID and updates `goals.txt` |
| `/api/transactions` | `GET` | Returns transaction list (supports `?type=`, `?category=`, `?search=`) |
| `/api/transactions` | `POST` | Creates a new Income or Expense record and returns real-time budget alert warning if limit breached |
| `/api/transactions?id=...` | `DELETE` | Removes a transaction by ID and updates `transactions.txt` |
| `/api/export` | `GET` | Downloads all records as a `.csv` file |
| `/api/reset` | `POST` | Restores default sample data |

---

## 📝 License
This project is open-source and free to use for academic, college, and personal learning purposes.

