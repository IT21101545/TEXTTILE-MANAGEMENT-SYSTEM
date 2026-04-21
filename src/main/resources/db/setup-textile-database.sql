-- Run this in SQL Server Management Studio (SSMS) as a user who can create databases
-- (e.g. connect to: localhost\SQLEXPRESS with Windows Authentication)

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'TextileManagementSystem')
BEGIN
    CREATE DATABASE TextileManagementSystem;
END
GO

USE TextileManagementSystem;
GO

-- Optional: grant your Windows login full access to this database (replace YOURDOMAIN\YourWindowsUser)
-- First ensure the login exists under Server > Security > Logins (add Windows user if missing).
-- Example (uncomment and fix the login name):
-- IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'YOURDOMAIN\YourWindowsUser')
--     CREATE USER [YOURDOMAIN\YourWindowsUser] FOR LOGIN [YOURDOMAIN\YourWindowsUser];
-- ALTER ROLE db_owner ADD MEMBER [YOURDOMAIN\YourWindowsUser];

GO
