// Immediate hide of any element with a data-role to prevent UI flashes for unauthorized users
(function() {
    const style = document.createElement('style');
    style.id = 'auth-hide-style';
    style.innerHTML = '[data-role] { display: none !important; }';
    document.head.appendChild(style);
})();

const AuthState = (() => {
    let currentUser = null;
    
    try {
        const u = localStorage.getItem("zeefashion_user");
        if(u) currentUser = JSON.parse(u);
    } catch(e) {}

    return {
        getUser: () => currentUser,
        isLoggedIn: () => !!currentUser,
        getRole: () => currentUser ? currentUser.role.toUpperCase() : null, // Normalize to uppercase
        
        // RBAC logic - Case-Insensitive
        hasAccess: (requiredRole) => {
            if(!currentUser || !currentUser.role) return false;
            const userRole = currentUser.role.toUpperCase();
            const targetRole = requiredRole.toUpperCase();

            // Specific role checks
            if(userRole === "ADMIN") return true; // Admin has full access

            if(targetRole === "ADMIN") return userRole === "ADMIN";
            if(targetRole === "INVENTORY_ADMIN") return userRole === "INVENTORY_ADMIN";
            if(targetRole === "SUPPLIER_ADMIN") return userRole === "SUPPLIER_ADMIN";
            if(targetRole === "SALES_MANAGER") return userRole === "SALES_MANAGER";
            if(targetRole === "STAFF") return userRole === "STAFF";
            if(targetRole === "CUSTOMER") return userRole === "CUSTOMER";
            
            // Composite roles (if needed for shared pages)
            if(targetRole === "ANY_MANAGEMENT") return ["ADMIN", "INVENTORY_ADMIN", "SUPPLIER_ADMIN", "SALES_MANAGER", "STAFF"].includes(userRole);
            
            return userRole === targetRole;
        }
    };
})();

// Main logic runs on every page
(() => {
    window.addEventListener("DOMContentLoaded", () => {
        // Show/Hide role-restricted elements
        document.querySelectorAll("[data-role]").forEach(el => {
            const req = el.getAttribute("data-role");
            if (req && AuthState.hasAccess(req)) {
                // If authorized, override the default-hide CSS
                el.style.setProperty('display', 'block', 'important');
                if (el.tagName === 'A' || el.classList.contains('flex')) {
                    el.style.setProperty('display', 'flex', 'important');
                }
            } else {
                // Explicitly hide unauthorized elements
                el.style.setProperty('display', 'none', 'important');
            }
        });

        // Toggle Login/Logout buttons
        const loginBtn = document.getElementById("navLogin");
        if(loginBtn && AuthState.isLoggedIn()){
            loginBtn.style.display = 'none';
        }
    });

    // Global Logout function
    window.logoutApp = function() {
        localStorage.removeItem("zeefashion_user");
        localStorage.removeItem("zeefashion_cart");
        window.location.href = "/pages/login.html";
    };

    // Hard-lock routes based on current path
    const path = window.location.pathname.toLowerCase();
    
    const ROUTE_LOCKS = {
        "/pages/inventory.html": "INVENTORY_ADMIN",
        "/pages/sup.html": "SUPPLIER_ADMIN",
        "/pages/order.html": "STAFF",
        "/pages/sales.html": "SALES_MANAGER",
        "/pages/users.html": "ADMIN",
        "/pages/products.html": "CUSTOMER",
        "/pages/cart.html": "CUSTOMER"
    };

    // Helper for validation
    const validateAccess = (userRole, required) => {
        return AuthState.hasAccess(required);
    };

    let required = null;
    for (let key in ROUTE_LOCKS) {
        if (path.endsWith(key.toLowerCase())) {
            required = ROUTE_LOCKS[key];
            break;
        }
    }

    if (required) {
        if (!AuthState.isLoggedIn()) {
            window.location.href = "/pages/login.html";
        } else if (!validateAccess(AuthState.getRole(), required)) {
            alert("Security Exception: Access Denied.");
            if (AuthState.getRole() === 'CUSTOMER') {
                window.location.href = "/pages/products.html";
            } else {
                let target = "/pages/products.html";
                const role = AuthState.getRole();
                if(role === 'ADMIN') target = "/pages/users.html";
                else if(role === 'STAFF') target = "/pages/order.html";
                else if(role === 'INVENTORY_ADMIN') target = "/pages/inventory.html";
                else if(role === 'SUPPLIER_ADMIN') target = "/pages/sup.html";
                else if(role === 'SALES_MANAGER') target = "/pages/sales.html";
                window.location.href = target;
            }
        }
    }
})();


