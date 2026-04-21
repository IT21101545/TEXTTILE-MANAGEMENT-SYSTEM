# ZEE FASHION - Textile Management System

![ZEE FASHION](https://img.shields.io/badge/ZEE-FASHION-A020F0?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=spring)
![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=java)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)

A premium, state-of-the-art **Textile Management System** designed for high-performance administrative control. ZEE FASHION integrates procurement, inventory tracking, sales analytics, and order management into a cohesive, visually stunning interface.

## 💎 Core Features

### 🏢 Supplier & Procurement Management
- **Supplier-Driven Workflow:** Materials are originated directly from supplier purchases to ensure auditability.
- **Volume Tracking:** Monitor total material contributions and reliability for each supplier.
- **Procurement History:** Detailed logs of every purchase and stock ingestion.

### 📦 Precision Inventory Control
- **Unique Material Coding:** Every item is assigned a unique code for seamless tracking.
- **Live Sync:** Automatic synchronization between internal Materials and storefront Products.
- **Glassmorphism UI:** A modern, high-density interface for managing stock levels and pricing.

### 📈 Sales & Analytics Dashboard
- **KPI Tracking:** Real-time statistics on revenue, orders, and customer feedback.
- **Visual Analytics:** Interactive charts (Chart.js) for sales trends and performance monitoring.
- **Daily Reporting:** Generate exportable sales reports for strategic decision-making.

### 🚚 Order Tracking & Verification
- **Automated Tracking:** Simple Order ID-based tracking for customers.
- **Payment Verification:** Dedicated module for verifying bank deposit slips and receipts.
- **Status History:** Transparent lifecycle tracking from 'Pending' to 'Shipped'.

### 🔐 Multi-Role Security
Role-based access control tailored for specific administrative tasks:
- **Inventory Admin:** Stock and material management.
- **Supplier Admin:** Supplier relations and procurement.
- **Sales Manager:** Analytics, coupons, and customer feedback.
- **Order Tracking:** Shipping and fulfillment logistics.

## 🛠️ Technology Stack

- **Backend:** Java 17, Spring Boot 3.2.0, Spring Data JPA
- **Database:** MySQL 8.0
- **Frontend:** Vanilla HTML5, CSS3 (Custom Glassmorphism Design), JavaScript (ES6+)
- **Security:** Custom RBAC Logic
- **Tools:** Maven, Lombok, Chart.js

## 🚀 Getting Started

### Prerequisites
- **JDK 17** or higher
- **Maven 3.8+**
- **MySQL 8.0**

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/ZEEFASHION.git
   cd ZEEFASHION
   ```

2. **Database Configuration**
   Create a database named `textile_db_v2` in MySQL. Update `src/main/resources/application.properties` with your credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/textile_db_v2
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   ```

3. **Run the Application**
   ```bash
   mvn spring-boot:run
   ```
   The server will start at `http://localhost:8081`.

## 🔑 Default Credentials

For development and testing purposes, the following accounts are pre-configured:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@mail.com` | `1234` |
| **Inventory Admin** | `inventory@mail.com` | `1234` |
| **Supplier Admin** | `supplier@mail.com` | `1234` |
| **Staff** | `staff@mail.com` | `1234` |

## 📁 Project Structure

```text
src/main/java/org/example/zeefashion/
├── config/        # Security and App configurations
├── controller/    # REST Endpoints
├── model/         # JPA Entities (Material, Order, Supplier, etc.)
├── repository/    # Data Access Layer
├── service/       # Business Logic
└── dto/           # Data Transfer Objects

src/main/resources/
├── static/        # Frontend (CSS, JS, Images)
├── templates/     # HTML Pages
└── data.sql       # Initial Data Setup
```

## 🎨 Design Philosophy
ZEE FASHION follows a **Premium Dark/Glassmorphism** aesthetic. Every interaction is enhanced with subtle micro-animations and a curated color palette (HSL tailored) to provide an administrative experience that feels refined and professional.

---
© 2026 ZEE FASHION Management System. Built for excellence.
