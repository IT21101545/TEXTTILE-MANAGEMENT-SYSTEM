const $ = (id) => document.getElementById(id);
const AUTH_API = "/api/auth";

function toast(msg, type=""){
    const t = $("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

async function apiCall(url, method="GET", body=null){
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if(body) options.body = JSON.stringify(body);
    
    const res = await fetch(url, options);
    if(!res.ok){
        let msg = "API Error";
        try { const err = await res.json(); msg = err.message || msg; } 
        catch { msg = `API Error: ${res.status}`; }
        throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in
    const existing = localStorage.getItem("zeefashion_user");
    if(existing){
        try{
            const user = JSON.parse(existing);
            let target = "/pages/products.html";
            if(user.role === 'ADMIN') target = "/pages/users.html";
            else if(user.role === 'STAFF') target = "/pages/order.html";
            else if(user.role === 'INVENTORY_ADMIN') target = "/pages/inventory.html";
            else if(user.role === 'SUPPLIER_ADMIN') target = "/pages/sup.html";
            else if(user.role === 'SALES_MANAGER') target = "/pages/sales.html";
            window.location.href = target;
        } catch(e) { window.location.href = "/pages/products.html"; }
        return;
    }

    const registerForm = $("registerForm");
    if(registerForm){
        registerForm.addEventListener("submit", async (e)=>{
            e.preventDefault();
            const name = $("regFullName").value.trim();
            const email = $("regEmail").value.trim();
            const phone = $("regPhone").value.trim();
            const pass = $("regPassword").value.trim();
            const confirmPass = $("regConfirmPassword").value.trim();
            const role = $("regRole").value;

            if (pass !== confirmPass) {
                toast("Passwords do not match", "error");
                return;
            }
            
            try {
                // Assuming backend accepts phone in register if provided, otherwise just passing it
                const res = await apiCall(`${AUTH_API}/register`, "POST", { name, email, phone, password: pass, role });
                if(res && res.userId){
                    toast("Registration successful. Redirecting to login...", "success");
                    setTimeout(() => {
                        window.location.href = "/pages/login.html";
                    }, 1000);
                } else {
                    toast("Registration failed", "error");
                }
            } catch(err){
                toast(err.message, "error");
            }
        });
    }
});
