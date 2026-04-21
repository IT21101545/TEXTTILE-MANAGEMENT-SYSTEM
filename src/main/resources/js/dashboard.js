// IMMEDIATELY REDIRECT to the appropriate management page
(function() {
    const u = localStorage.getItem("zeefashion_user");
    if (u) {
        const user = JSON.parse(u);
        let target = "/pages/products.html";
        if (user.role === 'ADMIN') target = "/pages/users.html";
        else if (user.role === 'STAFF') target = "/pages/order.html";
        else if (user.role === 'INVENTORY_ADMIN') target = "/pages/inventory.html";
        else if (user.role === 'SUPPLIER_ADMIN') target = "/pages/sup.html";
        else if (user.role === 'SALES_MANAGER') target = "/pages/sales.html";
        window.location.href = target;
    } else {
        window.location.href = "/pages/login.html";
    }
})();

const $ = (id) => document.getElementById(id);

const MODE = "DEMO"; // Switch to "API" when backend is ready

let currentUser = null; 

const AUTH_API = "/api/auth";
const USERS_API = "/api/users";

function toast(msg, type=""){
    const t = $("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

function getSession(){
    const u = localStorage.getItem("zeefashion_user");
    return u ? JSON.parse(u) : null;
}
function setSession(u){
    if(u){
        localStorage.setItem("zeefashion_user", JSON.stringify(u));
        currentUser = u;
    }else{
        localStorage.removeItem("zeefashion_user");
        currentUser = null;
    }
}
function logout(){
    setSession(null);
    window.location.href = "/pages/login.html";
}

async function apiCall(url, method="GET", body=null){
    if(MODE === "DEMO"){
       return demoApiCall(url, method, body);
    }
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

async function demoApiCall(url, method, body){
    // Basic mocks for profile
    if(url.includes("/me")){
        if(method === "GET") return { userId: currentUser.userId, name: currentUser.name, email: "admin@zeefashion.lk", role: currentUser.role, phone: "+94 77 123 4567", address: "ZEE FASHION HQ, Colombo" };
        if(method === "PUT") return { ...body };
    }
    if(url.includes("forgot-password")) return { success: true };
    return null;
}

// User endpoints
async function apiGetMe(userId) { return apiCall(`${USERS_API}/me?userId=${userId}`); }
async function apiUpdateMe(userId, data) { return apiCall(`${USERS_API}/me?userId=${userId}`, "PUT", data); }
async function apiForgot(email) { return apiCall(`${AUTH_API}/forgot-password`, "POST", { email }); }

/* =========================================================
   UI
========================================================= */

function checkAuth(){
    currentUser = getSession();
    if(!currentUser){
        // Not logged in -> redirect
        window.location.href = "/pages/login.html";
        return;
    }

    // Set UI header
    if($("pillName")) $("pillName").textContent = currentUser.name || currentUser.userId;
    if($("pillRole")) {
        $("pillRole").textContent = currentUser.role;
        if(currentUser.role === "ADMIN") $("pillRole").classList.add("gold");
    }
    
    loadProfile();
    setTab("profile");
}

function setTab(name){
    // Standard tab switching
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("show"));
    const selectedTab = $(`tab-${name}`);
    if (selectedTab) selectedTab.classList.add("show");

    // Initialize charts if analytics tab is selected
    if (name === "analytics") {
        initCharts();
    }
}

/* =========================================================
   ANALYTICS LOGIC (Chart.js)
 ========================================================= */
let revChart = null;
let distChart = null;

function initCharts() {
    if (revChart) revChart.destroy();
    if (distChart) distChart.destroy();

    // Stats
    $("statSales").textContent = "Rs. 450,200.00";
    $("statOrders").textContent = "124";
    $("statUsers").textContent = "+12";

    // 1. Revenue Chart (Line)
    const revCtx = $("revenueChart").getContext("2d");
    revChart = new Chart(revCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue (Rs)',
                data: [65000, 59000, 80000, 81000, 56000, 55000],
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. Category Distribution (Doughnut)
    const distCtx = $("categoryChart").getContext("2d");
    distChart = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cotton', 'Silk', 'Linen', 'Polyester'],
            datasets: [{
                data: [40, 25, 20, 15],
                backgroundColor: ['#D4AF37', '#4A3328', '#8C7B6E', '#F1D592'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

/* =========================================================
   PROFILE LOGIC
========================================================= */

async function loadProfile(){
    if(!currentUser) return;
    try {
        const u = await apiGetMe(currentUser.userId);
        if(!u) return;
        
        const names = (u.name || "").split(" ");
        if($("pfFirst")) $("pfFirst").value = names[0] || "";
        if($("pfLast")) $("pfLast").value = names.slice(1).join(" ") || "";
        if($("pfEmail")) $("pfEmail").value = u.email || "";
        if($("pfRole")) $("pfRole").value = u.role || "";
        if($("pfPhone")) $("pfPhone").value = u.phone || "";
        if($("pfAddress")) $("pfAddress").value = u.address || "";
        
    } catch(err){
        toast(err.message, "error");
    }
}

async function saveProfile(){
    if(!currentUser) return;
    const nameStr = ($("pfFirst").value.trim() + " " + $("pfLast").value.trim()).trim();
    
    const payload = {
        name: nameStr,
        phone: $("pfPhone").value.trim(),
        address: $("pfAddress").value.trim()
    };
    
    try {
        const u = await apiUpdateMe(currentUser.userId, payload);
        toast("Profile updated", "success");
        currentUser.name = u.name;
        setSession(currentUser);
        if($("pillName")) $("pillName").textContent = currentUser.name;
    } catch(err){
        toast(err.message, "error");
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    checkAuth();

    // --- Logout ---
    if($("btnLogout")) $("btnLogout").addEventListener("click", logout);
    
    // --- Tabs ---
    document.querySelectorAll(".tab").forEach(btn=>{
        btn.addEventListener("click", ()=>setTab(btn.dataset.tab));
    });
    
    // --- Profile ---
    if($("profileForm")){
        $("profileForm").addEventListener("submit", (e)=>{
            e.preventDefault();
            saveProfile();
        });
    }
    if($("btnOpenForgotFromApp")){
        $("btnOpenForgotFromApp").addEventListener("click", async()=>{
            if(!currentUser) return;
            try {
                await apiForgot($("pfEmail").value);
                toast("Reset link sent!", "success");
            } catch(err){
                toast(err.message, "error");
            }
        });
    }
});
