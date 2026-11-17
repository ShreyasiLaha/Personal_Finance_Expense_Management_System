import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ============================================================================
 * MAIN APPLICATION: BASIC JAVA HTTP SERVER
 * ============================================================================
 * 
 * Uses standard Java built-in HttpServer (com.sun.net.httpserver.HttpServer).
 * No external frameworks (like Spring Boot) are required.
 * Serves the HTML, CSS, JavaScript frontend and exposes simple REST APIs.
 */
public class Main {
    private static int PORT = 8080;
    private static final String DATA_FILE = "transactions.txt";
    private static final String WEB_DIR = "web";

    // References to our FinanceManager and FileManager
    private final FinanceManager financeManager;
    private final FileManager fileManager;

    public Main() {
        this.fileManager = new FileManager(DATA_FILE);
        this.financeManager = new FinanceManager(fileManager);
    }

    public static void main(String[] args) {
        Main app = new Main();

        // Support quick terminal summary flag
        if (args.length > 0 && "--summary".equalsIgnoreCase(args[0])) {
            app.printTerminalSummary();
            return;
        }

        app.startServer();
    }

    /**
     * Starts the built-in Java HTTP Server
     */
    public void startServer() {
        HttpServer server = null;
        int[] candidatePorts = {PORT, 8081, 8082, 8000, 9000};
        
        for (int p : candidatePorts) {
            try {
                server = HttpServer.create(new InetSocketAddress(p), 0);
                PORT = p;
                break;
            } catch (IOException e) {
                // Try next candidate port
            }
        }

        if (server == null) {
            System.err.println("Could not bind HTTP server to any available port.");
            return;
        }

        try {
            server.setExecutor(Executors.newFixedThreadPool(6));

            // Static Web Page Routing
            server.createContext("/", new StaticFileHandler());

            // REST API Endpoints
            server.createContext("/api/summary", new SummaryHandler());
            server.createContext("/api/transactions", new TransactionsHandler());
            server.createContext("/api/budgets", new BudgetsHandler());
            server.createContext("/api/goals", new GoalsHandler());
            server.createContext("/api/analysis", new AnalysisHandler());
            server.createContext("/api/delete", new DeleteHandler());
            server.createContext("/api/reset", new ResetHandler());
            server.createContext("/api/export", new ExportHandler());

            server.start();

            printBanner();

        } catch (Exception e) {
            System.err.println("Error configuring server: " + e.getMessage());
        }
    }

    private void printBanner() {
        System.out.println("=================================================================");
        System.out.println("   PERSONAL FINANCE & EXPENSE MANAGEMENT SYSTEM (JAVA)");
        System.out.println("=================================================================");
        System.out.println(" Web Server URL:  http://localhost:" + PORT);
        System.out.println(" Data Storage:    " + new File(DATA_FILE).getAbsolutePath());
        System.out.println(" Server Status:   RUNNING (Press Ctrl+C to stop)");
        System.out.println("-----------------------------------------------------------------");
        System.out.printf(" Total Income:    $%,10.2f%n", financeManager.getTotalIncome());
        System.out.printf(" Total Expenses:  $%,10.2f%n", financeManager.getTotalExpenses());
        System.out.printf(" Current Balance: $%,10.2f%n", financeManager.getCurrentBalance());
        System.out.printf(" Total Records:   %d transactions%n", financeManager.getAllTransactions().size());
        System.out.println("=================================================================");
    }

    public void printTerminalSummary() {
        System.out.println("=== Personal Finance Summary ===");
        System.out.printf("Total Income:    $%.2f%n", financeManager.getTotalIncome());
        System.out.printf("Total Expenses:  $%.2f%n", financeManager.getTotalExpenses());
        System.out.printf("Current Balance: $%.2f%n", financeManager.getCurrentBalance());
        System.out.println("Expense Categories:");
        HashMap<String, Double> cats = financeManager.getExpenseByCategory();
        for (Map.Entry<String, Double> e : cats.entrySet()) {
            System.out.printf(" - %-12s: $%.2f%n", e.getKey(), e.getValue());
        }
    }

    // ========================================================================
    // HTTP HANDLER: Static Web Files (HTML, CSS, JS)
    // ========================================================================
    private class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Security: Prevent directory traversal
            if (path.contains("..")) {
                sendText(exchange, 403, "Forbidden");
                return;
            }

            File file = new File(WEB_DIR, path.startsWith("/") ? path.substring(1) : path);
            if (!file.exists() || file.isDirectory()) {
                sendText(exchange, 404, "File Not Found");
                return;
            }

            String mimeType = getMimeType(file.getName());
            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String getMimeType(String name) {
            if (name.endsWith(".html")) return "text/html; charset=UTF-8";
            if (name.endsWith(".css")) return "text/css; charset=UTF-8";
            if (name.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (name.endsWith(".json")) return "application/json; charset=UTF-8";
            if (name.endsWith(".svg")) return "image/svg+xml";
            if (name.endsWith(".png")) return "image/png";
            return "text/plain; charset=UTF-8";
        }
    }

    // ========================================================================
    // HTTP HANDLER: Dashboard Summary (/api/summary)
    // ========================================================================
    private class SummaryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String json = financeManager.getSummaryJson();
            sendJson(exchange, 200, json);
        }
    }

    // ========================================================================
    // HTTP HANDLER: Transactions (/api/transactions)
    // Supports GET (List/Filter), POST (Add), DELETE (Delete)
    // ========================================================================
    private class TransactionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(method)) {
                // Feature: List & Filter transactions
                Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
                String type = query.getOrDefault("type", "ALL");
                String category = query.getOrDefault("category", "ALL");
                String search = query.getOrDefault("search", "");

                ArrayList<Transaction> list = financeManager.filterTransactions(type, category, search);
                String json = financeManager.getTransactionsJson(list);
                sendJson(exchange, 200, json);

            } else if ("POST".equals(method)) {
                // Features 2 & 3: Add Income or Add Expense
                String body = readRequestBody(exchange);
                Map<String, String> data = parseSimpleJson(body);

                String type = data.getOrDefault("type", "EXPENSE").toUpperCase();
                String title = data.getOrDefault("title", "Untitled");
                double amount = 0.0;
                try {
                    amount = Double.parseDouble(data.getOrDefault("amount", "0"));
                } catch (NumberFormatException ignored) {}

                String category = data.getOrDefault("category", "Food");
                String date = data.getOrDefault("date", java.time.LocalDate.now().toString());
                String notes = data.getOrDefault("notes", "");
                String detail = data.getOrDefault("detail", "");

                String id = data.get("id");
                if (id == null || id.trim().isEmpty()) {
                    id = "TXN-" + System.currentTimeMillis() % 1000000;
                }

                Transaction t;
                if ("INCOME".equalsIgnoreCase(type)) {
                    // Polymorphic instantiation of Income
                    t = new Income(id, title, amount, category, date, notes, detail.isEmpty() ? "Salary" : detail);
                } else {
                    // Polymorphic instantiation of Expense
                    t = new Expense(id, title, amount, category, date, notes, detail.isEmpty() ? "Cash" : detail);
                }

                boolean added = financeManager.addTransaction(t);
                if (added) {
                    String alert = "EXPENSE".equalsIgnoreCase(type) ? financeManager.checkExpenseAlert(category, amount) : null;
                    String json = t.toJson();
                    if (alert != null) {
                        json = json.substring(0, json.length() - 1) + ",\"budgetAlert\":\"" + alert.replace("\"", "\\\"") + "\"}";
                    }
                    sendJson(exchange, 201, json);
                } else {
                    sendJson(exchange, 400, "{\"error\":\"Could not add transaction\"}");
                }

            } else if ("DELETE".equals(method)) {
                // Feature 6: Delete transaction
                Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
                String id = query.get("id");
                if (id != null && financeManager.deleteTransaction(id)) {
                    sendJson(exchange, 200, "{\"success\":true,\"id\":\"" + id + "\"}");
                } else {
                    sendJson(exchange, 404, "{\"error\":\"Transaction not found\"}");
                }
            } else {
                sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    // ========================================================================
    // HTTP HANDLER: Budgets & Alerts (/api/budgets)
    // ========================================================================
    private class BudgetsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(method)) {
                String json = financeManager.getBudgetSummaryJson();
                sendJson(exchange, 200, json);
            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, String> data = parseSimpleJson(body);

                String category = data.getOrDefault("category", "Overall");
                double limit = 0.0;
                try {
                    limit = Double.parseDouble(data.getOrDefault("limit", data.getOrDefault("limitAmount", "0")));
                } catch (NumberFormatException ignored) {}

                boolean updated = financeManager.setCategoryBudget(category, limit);
                if (updated) {
                    sendJson(exchange, 200, financeManager.getBudgetSummaryJson());
                } else {
                    sendJson(exchange, 400, "{\"error\":\"Could not update budget\"}");
                }
            } else {
                sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    // ========================================================================
    // HTTP HANDLER: Savings Goal Tracker (/api/goals)
    // Supports GET (list), POST (create/update/deposit), DELETE (remove)
    // ========================================================================
    private class GoalsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(method)) {
                String json = financeManager.getSavingsGoalsJson();
                sendJson(exchange, 200, json);

            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                Map<String, String> data = parseSimpleJson(body);

                String action = data.getOrDefault("action", "");
                String id = data.get("id");

                // Check for "Add Savings" deposit action
                if ("deposit".equalsIgnoreCase(action) || data.containsKey("depositAmount")) {
                    double depositAmt = 0.0;
                    try {
                        depositAmt = Double.parseDouble(data.getOrDefault("depositAmount", data.getOrDefault("amount", "0")));
                    } catch (NumberFormatException ignored) {}

                    if (id != null && depositAmt > 0) {
                        SavingsGoal updated = financeManager.addSavingsToGoal(id, depositAmt);
                        if (updated != null) {
                            sendJson(exchange, 200, updated.toJson());
                            return;
                        }
                    }
                    sendJson(exchange, 400, "{\"error\":\"Could not add savings to goal\"}");
                    return;
                }

                // Normal Create or Edit Goal
                String name = data.getOrDefault("name", "Savings Goal");
                double target = 1000.00;
                double saved = 0.00;
                try {
                    target = Double.parseDouble(data.getOrDefault("targetAmount", data.getOrDefault("target", "1000")));
                    saved = Double.parseDouble(data.getOrDefault("savedAmount", data.getOrDefault("saved", "0")));
                } catch (NumberFormatException ignored) {}

                String targetDate = data.getOrDefault("targetDate", java.time.LocalDate.now().plusMonths(6).toString());
                String category = data.getOrDefault("category", "General");

                if (id != null && !id.trim().isEmpty() && financeManager.getSavingsGoalById(id) != null) {
                    // Update existing goal
                    SavingsGoal existing = new SavingsGoal(id, name, target, saved, targetDate, category);
                    boolean ok = financeManager.updateSavingsGoal(existing);
                    if (ok) {
                        sendJson(exchange, 200, existing.toJson());
                    } else {
                        sendJson(exchange, 400, "{\"error\":\"Failed to update goal\"}");
                    }
                } else {
                    // Create new goal
                    String newId = (id != null && !id.trim().isEmpty()) ? id : "GOAL-" + System.currentTimeMillis() % 1000000;
                    SavingsGoal goal = new SavingsGoal(newId, name, target, saved, targetDate, category);
                    boolean ok = financeManager.addSavingsGoal(goal);
                    if (ok) {
                        sendJson(exchange, 201, goal.toJson());
                    } else {
                        sendJson(exchange, 400, "{\"error\":\"Failed to create goal\"}");
                    }
                }

            } else if ("DELETE".equals(method)) {
                Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
                String id = query.get("id");

                if (id != null && financeManager.deleteSavingsGoal(id)) {
                    sendJson(exchange, 200, "{\"success\":true,\"id\":\"" + id + "\"}");
                } else {
                    sendJson(exchange, 404, "{\"error\":\"Savings goal not found\"}");
                }

            } else {
                sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    // ========================================================================
    // HTTP HANDLER: Smart Spending Analysis (/api/analysis)
    // ========================================================================
    private class AnalysisHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String json = financeManager.getSpendingAnalysisJson();
            sendJson(exchange, 200, json);
        }
    }

    // ========================================================================
    // HTTP HANDLER: Delete by query or POST (/api/delete)
    // ========================================================================
    private class DeleteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
            String id = query.get("id");

            if (id != null && financeManager.deleteTransaction(id)) {
                sendJson(exchange, 200, "{\"success\":true,\"id\":\"" + id + "\"}");
            } else {
                sendJson(exchange, 400, "{\"error\":\"Invalid transaction ID\"}");
            }
        }
    }

    // ========================================================================
    // HTTP HANDLER: Reset sample data (/api/reset)
    // ========================================================================
    private class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            new File(DATA_FILE).delete();
            fileManager.seedDefaultTransactions();
            fileManager.seedDefaultGoals();
            financeManager.loadData();
            sendJson(exchange, 200, "{\"message\":\"Sample data reset successfully\"}");
        }
    }

    // ========================================================================
    // HTTP HANDLER: Export CSV file (/api/export)
    // ========================================================================
    private class ExportHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Type,Title,Amount,Category,Date,Notes,Detail\n");

            for (Transaction t : financeManager.getAllTransactions()) {
                csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        t.getId(),
                        t.getType(),
                        t.getTitle().replace("\"", "\"\""),
                        t.getAmount(),
                        t.getCategory().replace("\"", "\"\""),
                        t.getDate(),
                        t.getNotes().replace("\"", "\"\""),
                        t.getSpecificDetail().replace("\"", "\"\"")
                ));
            }

            byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/csv; charset=UTF-8");
            exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"transactions.csv\"");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================
    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendText(HttpExchange exchange, int status, String text) throws IOException {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int read;
            while ((read = is.read(buffer)) != -1) {
                baos.write(buffer, 0, read);
            }
            return baos.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            try {
                if (idx > 0 && idx < pair.length() - 1) {
                    String k = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                    String v = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.name());
                    map.put(k, v);
                } else if (idx > 0) {
                    String k = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                    map.put(k, "");
                }
            } catch (Exception ignored) {}
        }
        return map;
    }

    private static Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) {
            return map;
        }

        // Clean, standard regex-based JSON key-value parser (no complex escaping or char indexing)
        Pattern pattern = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|([0-9.-]+|true|false))");
        Matcher matcher = pattern.matcher(json);
        while (matcher.find()) {
            String key = matcher.group(1);
            String val = matcher.group(2) != null ? matcher.group(2) : matcher.group(3);
            if (key != null && val != null) {
                map.put(key.trim(), val.trim());
            }
        }
        return map;
    }
}
