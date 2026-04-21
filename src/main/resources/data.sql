-- ===== USERS =====
INSERT IGNORE INTO users (id, name, email, password, role, phone, status)
VALUES
    ('U-100001', 'Admin', 'admin@mail.com', '1234', 'ADMIN', '0770000000', 'ACTIVE'),
    ('U-100002', 'Staff', 'staff@mail.com', '1234', 'STAFF', '0771111111', 'ACTIVE'),
    ('U-100003', 'Inventory Admin', 'inventory@mail.com', '1234', 'INVENTORY_ADMIN', '0772222222', 'ACTIVE'),
    ('U-100004', 'Supplier Admin', 'supplier@mail.com', '1234', 'SUPPLIER_ADMIN', '0773333333', 'ACTIVE');

-- ===== SUPPLIERS & MATERIALS (CLEARED) =====
SET FOREIGN_KEY_CHECKS = 0;
-- Table truncation removed to ensure data persistence across restarts.
SET FOREIGN_KEY_CHECKS = 1;


