# Textlite - Supplier & Raw Material Management
## ZEE FASHION | IT Project ITP_KANDY_01

### Setup Steps

**1. Database**
- Open SQL Server Management Studio with Windows Authentication
- Run `database/setup.sql` to create TextliteDB and all tables

**2. JDBC Driver**
- Download `mssql-jdbc-12.x.x.jre11.jar` from:
  https://learn.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server
- In IntelliJ: File → Project Structure → Libraries → Add the JAR
- Also add `sqljdbc_auth.dll` to your system PATH (for Windows Auth)

**3. Run**
- Main class: `com.textlite.ui.MainFrame`

### Features
- Supplier CRUD with validation
- Raw Material CRUD linked to Suppliers, with Low Stock alerts
- Purchase History CRUD — auto-updates stock when status set to "Received"
- ZEE FASHION dark/gold theme with footer
