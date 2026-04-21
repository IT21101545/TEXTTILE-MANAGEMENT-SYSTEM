const $ = (id) => document.getElementById(id);

const MODE = "API"; // Switch to "API" when backend is ready
const LS_USERS_KEY = "zeefashion_users_v1";
const USERS_API = "/api/users";

let currentUser = null; 

function toast(msg, type=""){
    const t = $("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

function escapeHtml(s){
    return String(s ?? "")
        .replaceAll("&","&amp;").replaceAll("<","&lt;")
        .replaceAll(">","&gt;").replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
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

// --- DEMO API IMPLEMENTATION ---
function loadUsers(){
    const raw = localStorage.getItem(LS_USERS_KEY);
    return raw ? JSON.parse(raw) : [
        { id:"U-001", name:"Admin User", email:"admin@zeefashion.lk", role:"ADMIN", status:"ACTIVE" },
        { id:"U-002", name:"System Staff", email:"staff@zeefashion.lk", role:"STAFF", status:"ACTIVE" },
        { id:"U-100003", name:"Inventory Admin", email:"inventory@mail.com", role:"INVENTORY_ADMIN", status:"ACTIVE" },
        { id:"U-100004", name:"Supplier Admin", email:"supplier@mail.com", role:"SUPPLIER_ADMIN", status:"ACTIVE" },
        { id:"U-003", name:"Test Customer", email:"customer@test.com", role:"CUSTOMER", status:"ACTIVE" }
    ];
}
function saveUsers(list){ localStorage.setItem(LS_USERS_KEY, JSON.stringify(list)); }

async function demoApiCall(url, method, body){
    let users = loadUsers();
    if(method === "GET"){
        return users;
    }
    if(method === "POST"){
        const newUser = { id: "U-" + Math.floor(100+Math.random()*900), ...body, status:"ACTIVE" };
        users.push(newUser);
        saveUsers(users);
        return newUser;
    }
    if(method === "PUT"){
        const id = url.split("/").pop();
        const idx = users.findIndex(u => u.id === id);
        if(idx !== -1){
            users[idx] = { ...users[idx], ...body };
            saveUsers(users);
            return users[idx];
        }
    }
    if(method === "DELETE"){
        const id = url.split("/").pop();
        users = users.filter(u => u.id !== id);
        saveUsers(users);
        return { success: true };
    }
}

// Admin Users endpoints
async function apiGetUsers() { return apiCall(USERS_API); }
async function apiCreateUser(data) { return apiCall(USERS_API, "POST", data); }
async function apiUpdateUser(id, data) { return apiCall(`${USERS_API}/${id}`, "PUT", data); }
async function apiDeleteUser(id) { return apiCall(`${USERS_API}/${id}`, "DELETE"); }

/* =========================================================
   UI
========================================================= */
let allUsers = [];

function checkAuth(){
    currentUser = getSession();
    if(!currentUser){
        window.location.href = "/pages/login.html";
        return;
    }
    
    if(currentUser.role !== "ADMIN"){
        const panel = $("tab-users");
        if(panel) panel.style.display = "none";
        const msg = $("notAdminMsg");
        if(msg) msg.style.display = "block";
        return;
    }

    // Set UI header
    if($("userPill")) $("userPill").style.display = "flex";
    if($("btnLogout")) $("btnLogout").style.display = "block";
    if($("pillName")) $("pillName").textContent = currentUser.name || currentUser.userId;
    if($("pillRole")) {
        $("pillRole").textContent = currentUser.role;
        if(currentUser.role === "ADMIN") $("pillRole").classList.add("gold");
    }
    
    initUsers();
}

async function initUsers(){
    try {
        allUsers = await apiGetUsers();
        renderUsers();
    } catch(err){
        toast(err.message, "error");
    }
}

function renderUsers(){
    const tbody = $("usersTable").querySelector("tbody");
    tbody.innerHTML = "";
    
    const q = $("userSearch").value.trim().toLowerCase();
    const rFilter = $("userRoleFilter").value;
    
    let rows = allUsers.filter(u => {
        const hay = `${u.name} ${u.email}`.toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(rFilter !== "all" && u.role !== rFilter) return false;
        return true;
    });
    
    $("userCount").textContent = `${rows.length} users`;
    
    rows.forEach(u => {
        const tr = document.createElement("tr");
        const statusBadge = (u.status === "ACTIVE" || !u.status) 
            ? `<span class="badge ok">● ACTIVE</span>` 
            : `<span class="badge bad">● ${escapeHtml(u.status)}</span>`;
            
        tr.innerHTML = `
            <td><strong>${escapeHtml(u.name)}</strong><div class="muted">${escapeHtml(u.id)}</div></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.role)}</td>
            <td>${statusBadge}</td>
            <td class="right">
                <button class="btn small ghost2" onclick="editUser('${u.id}')">Edit</button>
                <button class="btn small danger" onclick="deleteUser('${u.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openUserModal(isEdit=false){
    $("userModalTitle").textContent = isEdit ? "Edit User" : "New User";
    $("userModalSub").textContent = isEdit ? "Update account details." : "Create a new user account.";
    if(isEdit){
        $("umPasswordWrap").style.display = "none";
        $("umPassword").removeAttribute("required");
    }else{
        $("umPasswordWrap").style.display = "block";
        $("umPassword").setAttribute("required", "true");
    }
    $("userModal").classList.add("open");
}

function closeUserModal(){
    $("userModal").classList.remove("open");
    $("userForm").reset();
}

function editUser(id){
    const u = allUsers.find(x => x.id === id);
    if(!u) return;
    
    const names = (u.name || "").split(" ");
    $("umId").value = u.id;
    $("umFirst").value = names[0] || "";
    $("umLast").value = names.slice(1).join(" ") || "";
    $("umEmail").value = u.email || "";
    $("umRole").value = u.role || "CUSTOMER";
    $("umStatus").value = u.status || "ACTIVE";
    
    openUserModal(true);
}

async function deleteUser(id){
    if(!confirm("Are you sure you want to delete this user?")) return;
    try {
        await apiDeleteUser(id);
        toast("User deleted", "success");
        initUsers();
    } catch(err){
        toast(err.message, "error");
    }
}

// Global scope
window.editUser = editUser;
window.deleteUser = deleteUser;

document.addEventListener("DOMContentLoaded", ()=>{
    checkAuth();

    if($("btnLogout")) $("btnLogout").addEventListener("click", logout);
    
    if($("userSearch")) $("userSearch").addEventListener("input", renderUsers);
    if($("userRoleFilter")) $("userRoleFilter").addEventListener("change", renderUsers);
    
    if($("btnNewUser")) $("btnNewUser").addEventListener("click", ()=>{
        $("umId").value = "";
        openUserModal(false);
    });
    
    if($("btnCloseUserModal")) $("btnCloseUserModal").addEventListener("click", closeUserModal);
    if($("btnCancelUser")) $("btnCancelUser").addEventListener("click", closeUserModal);
    
    if($("userForm")){
        $("userForm").addEventListener("submit", async (e)=>{
            e.preventDefault();
            
            const id = $("umId").value;
            const name = ($("umFirst").value.trim() + " " + $("umLast").value.trim()).trim();
            const email = $("umEmail").value.trim();
            const role = $("umRole").value;
            const status = $("umStatus").value;
            
            try {
                if(id){
                    await apiUpdateUser(id, { name, email, role, status });
                    toast("User updated", "success");
                }else{
                    const password = $("umPassword").value.trim();
                    await apiCreateUser({ name, email, password, role, status });
                    toast("User created", "success");
                }
                closeUserModal();
                initUsers();
            } catch(err){
                toast(err.message, "error");
            }
        });
    }
});
