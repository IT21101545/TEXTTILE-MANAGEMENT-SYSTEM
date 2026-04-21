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

function setSession(u){
    if(u){
        localStorage.setItem("zeefashion_user", JSON.stringify(u));
    }else{
        localStorage.removeItem("zeefashion_user");
    }
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

    // Login Form Submit
    const loginForm = $("loginForm");
    if(loginForm){
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = $("loginEmail").value.trim();
            const pass = $("loginPassword").value.trim();
            
            try {
                // Same implementation as old user.js
                const res = await apiCall(`${AUTH_API}/login`, "POST", { email, password: pass });
                if(res && res.userId){
                    setSession({
                        userId: res.userId,
                        name: res.name,
                        role: res.role
                    });
                    toast("Logged in successfully!", "success");
                    // Redirect to dashboard
                    setTimeout(() => {
                        let target = "/pages/products.html";
                        if(res.role === 'ADMIN') target = "/pages/users.html";
                        else if(res.role === 'STAFF') target = "/pages/order.html";
                        else if(res.role === 'INVENTORY_ADMIN') target = "/pages/inventory.html";
                        else if(res.role === 'SUPPLIER_ADMIN') target = "/pages/sup.html";
                        else if(res.role === 'SALES_MANAGER') target = "/pages/sales.html";
                        window.location.href = target;
                    }, 500);
                } else {
                    toast("Login failed", "error");
                }
            } catch(err){
                toast(err.message, "error");
            }
        });
    }

    // Forgot Password
    const forgotForm = $("forgotForm");
    if($("goForgot")){
        $("goForgot").addEventListener("click", () => {
            $("loginForm").style.display = "none";
            $("forgotForm").style.display = "flex";
            $("authTitle").textContent = "Recover Password";
            $("authSub").textContent = "We will send you a reset link.";
        });
    }
    if($("goLogin")){
        $("goLogin").addEventListener("click", () => {
             $("loginForm").style.display = "flex";
             $("forgotForm").style.display = "none";
             $("authTitle").textContent = "Login";
             $("authSub").textContent = "Sign in to access your dashboard.";
        });
    }

    if(forgotForm){
        forgotForm.addEventListener("submit", async (e)=>{
            e.preventDefault();
            const email = $("forgotEmail").value.trim();
            try {
                await apiCall(`${AUTH_API}/forgot-password`, "POST", { email });
                toast("If the email exists, instructions were sent.", "success");
                $("goLogin").click();
            } catch(err){
                toast(err.message, "error");
            }
        });
    }
});
