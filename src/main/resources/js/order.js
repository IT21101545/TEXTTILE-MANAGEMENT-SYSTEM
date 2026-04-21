/*******************************************************
 * ZEE FASHION - Order & Customer Management
 * Modern Dashboard Implementation
 *******************************************************/

const MODE = "API"; 
const $ = (id) => document.getElementById(id);

const state = {
    orders: [],
    customers: [],
    products: [],
    editingOrderId: null
};

async function apiCall(url, method="GET", body=null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if(body) options.body = JSON.stringify(body);
    
    const res = await fetch(url, options);
    if(!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `API Error: ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// --- Helper Functions ---
function toast(msg, type="") {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function escapeHtml(s){
    return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function money(v){
    return `Rs. ${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}

async function hydrate(){
    try {
        const [orders, products] = await Promise.all([
            apiCall("/api/orders"),
            apiCall("/api/products")
        ]);
        state.orders = orders;
        state.products = products;

        // Deriving customers and their metrics
        const customerMap = {};
        state.orders.forEach(o => {
            const key = o.customerPhone;
            if(!customerMap[key]){
                customerMap[key] = {
                    name: o.customerName,
                    phone: o.customerPhone,
                    email: "N/A",
                    address: o.customerAddress,
                    totalOrders: 0,
                    totalSpend: 0
                };
            }
            customerMap[key].totalOrders += 1;
            customerMap[key].totalSpend += Number(o.total || 0);
        });
        state.customers = Object.values(customerMap);
    } catch(e) {
        toast("Failed to load dashboard data", "error");
    }
}

// --- Render Logic ---
function renderAll(){
    renderKPIs();
    renderOrders();
    renderCustomerGrid();
}

function renderKPIs(){
    $("kpiOrders").textContent = state.orders.length;
    $("kpiDelivered").textContent = state.orders.filter(o => o.status === "DELIVERED" || o.status === "CONFIRMED").length;
    $("kpiPending").textContent = state.orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").length;
    $("kpiCustomers").textContent = state.customers.length;
}

function renderOrders(){
    const tbody = $("ordersTable").querySelector("tbody");
    tbody.innerHTML = "";
    
    const q = $("orderSearch").value.toLowerCase();
    const status = $("statusFilter").value;
    
    let filtered = state.orders.filter(o => {
        const hay = `${o.id} ${o.customerName} ${o.customerPhone}`.toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(status !== "all" && o.status !== status) return false;
        return true;
    });

    filtered.sort((a,b) => (b.id - a.id)).forEach(o => {
        const tr = document.createElement("tr");
        const statusClass = (o.status || "PENDING").toLowerCase();
        
        tr.innerHTML = `
            <td><strong>#${o.id}</strong></td>
            <td>
                <div style="font-weight:700;">${escapeHtml(o.customerName)}</div>
                <div class="muted">${o.customerPhone}</div>
            </td>
            <td><div class="muted" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${o.itemsDescription || "Order Items..."}</div></td>
            <td><span class="price-text">${money(o.total)}</span></td>
            <td><span class="status-pill ${statusClass}">${o.status}</span></td>
            <td>${(o.date || o.createdAt || "").slice(0,10)}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button class="btn ghost small" onclick="viewOrder('${o.id}')">👁️</button>
                    <button class="btn ghost small" onclick="deleteOrder('${o.id}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCustomerGrid(){
    const grid = $("customerGrid");
    if(!grid) return;
    grid.innerHTML = "";

    const q = $("customerSearch").value.toLowerCase();
    let filtered = state.customers.filter(c => {
        const hay = `${c.name} ${c.phone}`.toLowerCase();
        return !q || hay.includes(q);
    });

    filtered.forEach(c => {
        const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);
        const card = document.createElement("div");
        card.className = "customer-card";
        card.innerHTML = `
            <div class="customer-header">
                <div class="customer-avatar">${initials}</div>
                <div>
                    <div style="font-weight:700; font-size:15px;">${escapeHtml(c.name)}</div>
                    <div class="muted" style="font-size:12px;">${escapeHtml(c.phone)}</div>
                </div>
            </div>
            <div class="customer-info-row">
                <div class="c-metric">
                    <label>Total Orders</label>
                    <div class="val">${c.totalOrders}</div>
                </div>
                <div class="c-metric">
                    <label>Total Spend</label>
                    <div class="val currency">${money(c.totalSpend)}</div>
                </div>
            </div>
            <div class="customer-contact">
                <div class="contact-line">📞 ${c.phone}</div>
                <div class="contact-line">📍 ${escapeHtml(c.address || "No location set")}</div>
            </div>
            <div class="customer-actions">
                <button class="btn ghost small" style="width:100%;" onclick="viewCustomerOrders('${c.phone}')">View Orders (${c.totalOrders})</button>
                <button class="btn ghost small" onclick="deleteCustomer('${c.phone}')">🗑️</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Actions ---
async function viewOrder(id){
    try {
        const o = await apiCall(`/api/orders/${id}`);
        if(!o) return;
        
        $("ovId").textContent = o.id;
        $("ovDate").textContent = (o.date || o.createdAt || "").slice(0,10);
        $("ovCustomer").textContent = o.customerName;
        $("ovContact").textContent = o.customerPhone;
        $("ovPay").textContent = o.paymentMethod || "N/A";
        $("ovTotal").textContent = money(o.total);
        $("ovAddress").textContent = o.customerAddress;
        
        let itemsHtml = "N/A";
        if(o.items && o.items.length > 0){
            itemsHtml = o.items.map(it => `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
                    <span>${escapeHtml(it.product?.name || "Product")} × ${it.quantity}</span>
                    <strong>${money(it.price * it.quantity || it.lineTotal)}</strong>
                </div>
            `).join("");
        }
        $("ovItems").innerHTML = itemsHtml;
        
        const timeline = $("ovTimeline");
        if (o.statusHistory && o.statusHistory.length > 0) {
            timeline.innerHTML = o.statusHistory.map(h => `
                <div class="info" style="margin-bottom:8px;">
                    <div class="dot active"></div>
                    <div>
                        <strong>${h.status}</strong>
                        <div class="muted" style="font-size:11px;">${escapeHtml(h.comment || "Status updated.")}</div>
                        <div class="muted small">${(h.createdAt || "").slice(0,16).replace("T", " ")}</div>
                    </div>
                </div>
            `).join("");
        } else {
            timeline.innerHTML = `<div class="muted">No history found. Current: ${o.status}</div>`;
        }

        // Handle Bank Slip Logic
        const slipSec = $("ovSlipSection");
        const slipImg = $("ovSlipImageOuter");
        if (o.slipPath && o.slipPath.trim().length > 10) {
            slipSec.style.display = "block";
            
            let rawPath = o.slipPath;
            // Legacy Fix: If path is absolute (contains \ or /), extract only the upload part
            if (rawPath.includes("uploads") || rawPath.includes("uploads/")) {
                const parts = rawPath.split(/uploads[\\\/]/);
                rawPath = "uploads/" + parts[parts.length - 1];
            }

            let src = rawPath.startsWith("data:") ? rawPath : (rawPath.startsWith("/") ? rawPath : "/" + rawPath);
            src = encodeURI(src); 
            slipImg.innerHTML = `<img src="${src}" style="width:100%; display:block; object-fit:contain; max-height:400px;" onclick="window.open('${src}')" title="Click to view full size">`;
        } else {
            slipSec.style.display = "none";
        }
        
        $("ovNewStatus").value = o.status;
        $("btnUpdateStatus").onclick = () => updateOrderStatus(o.id, $("ovNewStatus").value);
        $("btnCloseOrderView").onclick = () => $("orderViewModal").classList.remove("open");
        
        $("orderViewModal").classList.add("open");
    } catch(err) {
        toast("Failed to load order details", "error");
    }
}

async function updateOrderStatus(id, newStatus){
    const comment = prompt("Enter status comment (optional):", "Updating status to " + newStatus);
    if (comment === null) return;

    try {
        await apiCall(`/api/orders/${id}/status`, "PUT", { status: newStatus, comment });
        toast("Status updated", "success");
        $("orderViewModal").classList.remove("open");
        await hydrate();
        renderAll();
    } catch(err){
        toast(err.message, "error");
    }
}

function openOrderModal(){
    $("orderModal").classList.add("open");
    $("orderForm").reset();
    $("omItemsBody").innerHTML = "";
    
    const cusSel = $("omCustomer");
    cusSel.innerHTML = '<option value="">— Choose Customer —</option>' + 
        state.customers.map(c => `<option value="${c.phone}" data-addr="${escapeHtml(c.address)}">${escapeHtml(c.name)} (${c.phone})</option>`).join("");
    
    addItemRow();
    updateOrderSummary();
}

function addItemRow(){
    const tr = document.createElement("tr");
    tr.className = "item-row";
    tr.innerHTML = `
        <td>
            <select class="input item-prod" required onchange="updateRowPrice(this)">
                <option value="">Select...</option>
                ${state.products.map(p => `<option value="${p.id}" data-price="${p.price}">${escapeHtml(p.name)}</option>`).join("")}
            </select>
        </td>
        <td><input type="number" class="input item-qty" value="1" min="1" required onchange="updateOrderSummary()"></td>
        <td><span class="item-price-label">Rs. 0.00</span></td>
        <td><button type="button" class="icon-btn" onclick="removeRow(this)">✕</button></td>
    `;
    $("omItemsBody").appendChild(tr);
}

window.removeRow = (btn) => { btn.closest("tr").remove(); updateOrderSummary(); };
window.updateRowPrice = (sel) => {
    const row = sel.closest("tr");
    const price = sel.options[sel.selectedIndex].dataset.price || 0;
    row.querySelector(".item-price-label").textContent = money(price);
    updateOrderSummary();
};

function updateOrderSummary(){
    let subtotal = 0;
    document.querySelectorAll(".item-row").forEach(row => {
        const sel = row.querySelector(".item-prod");
        if(sel.value){
            const price = parseFloat(sel.options[sel.selectedIndex].dataset.price);
            const qty = parseInt(row.querySelector(".item-qty").value) || 0;
            subtotal += (price * qty);
        }
    });
    $("omSubtotal").textContent = money(subtotal);
    $("omGrandTotal").textContent = money(subtotal);
}

async function deleteOrder(id){ if(confirm("Delete order?")) {
    try {
        await apiCall(`/api/orders/${id}`, "DELETE");
        toast("Order deleted", "success");
        await hydrate();
        renderAll();
    } catch(e) { toast("Failed to delete", "error"); }
}}

async function deleteCustomer(phone) {
    if(!confirm("⚠️ CAUTION: This will delete ALL orders associated with this customer. Proceed?")) return;
    try {
        const toDelete = state.orders.filter(o => o.customerPhone === phone);
        for(const o of toDelete) {
            await apiCall(`/api/orders/${o.id}`, "DELETE");
        }
        toast("Customer records cleared", "success");
        await hydrate();
        renderAll();
    } catch(e) { toast("Failed to clear records", "error"); }
}

function viewCustomerOrders(phone){ 
    $("orderSearch").value = phone; 
    renderOrders(); 
    document.querySelector('.tab-m[data-tab="orders"]')?.click(); 
}

// --- Initialization ---
function wireEvents(){
    document.querySelectorAll(".tab-m").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab-m").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".panel-modern").forEach(p => p.classList.remove("show"));
            tab.classList.add("active");
            $(`tab-${tab.dataset.tab}`).classList.add("show");
        });
    });

    $("orderSearch")?.addEventListener("input", renderOrders);
    $("statusFilter")?.addEventListener("change", renderOrders);
    $("customerSearch")?.addEventListener("input", renderCustomerGrid);
    
    $("btnNewOrder")?.addEventListener("click", openOrderModal);
    $("btnCloseOrderModal")?.addEventListener("click", () => $("orderModal").classList.remove("open"));
    $("btnCancelOrder")?.addEventListener("click", () => $("orderModal").classList.remove("open"));
    $("btnAddItemRow")?.addEventListener("click", addItemRow);

    $("omCustomer").addEventListener("change", (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        $("omAddress").value = opt.dataset.addr || "";
    });

    $("orderForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const items = [];
        document.querySelectorAll(".item-row").forEach(row => {
            const pid = row.querySelector(".item-prod").value;
            const qty = parseInt(row.querySelector(".item-qty").value);
            if(pid) items.push({ productId: parseInt(pid), quantity: qty });
        });

        if(items.length === 0) return toast("Add at least one item", "error");

        const selCus = $("omCustomer");
        const payload = {
            customerName: selCus.options[selCus.selectedIndex].text.split(" (")[0],
            customerPhone: selCus.value,
            customerAddress: $("omAddress").value,
            paymentMethod: $("omPay").value,
            items
        };

        try {
            await apiCall("/api/orders", "POST", payload);
            toast("Order created successfully", "success");
            $("orderModal").classList.remove("open");
            await hydrate();
            renderAll();
        } catch(err){
            toast(err.message, "error");
        }
    });

    // Tracking Form
    $("trackForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const tid = $("trackOrderId").value.trim();
        const o = state.orders.find(x => String(x.id) === tid);
        
        if(!o){
            toast("No matching order found.", "error");
            $("trackingEmpty").style.display = "flex";
            $("trackingBody").style.display = "none";
            return;
        }
        
        $("trackingEmpty").style.display = "none";
        $("trackingBody").style.display = "block";
        $("trkOrderTitle").textContent = `Order #${o.id}`;
        $("trkCustomer").textContent = o.customerName;
        $("trkTotal").textContent = money(o.total);
        
        const timeline = $("timeline");
        if(o.statusHistory && o.statusHistory.length > 0){
            timeline.innerHTML = o.statusHistory.map(h => `
                <div class="info" style="margin-bottom:8px;">
                    <div class="dot active"></div>
                    <div>
                        <strong>${h.status}</strong>
                        <div class="muted" style="font-size:11px;">${escapeHtml(h.comment || "Recorded")}</div>
                        <div class="muted small">${(h.createdAt || "").slice(0,16).replace("T", " ")}</div>
                    </div>
                </div>
            `).join("<div class=\"line\"></div>");
        } else {
            timeline.innerHTML = `
                <div class="info">
                    <div class="dot active"></div>
                    <div><strong>${o.status}</strong><div class="muted">Order confirmed.</div></div>
                </div>
            `;
        }
    });

    $("btnTrackClear")?.addEventListener("click", () => {
        $("trackForm").reset();
        $("trackingEmpty").style.display = "flex";
        $("trackingBody").style.display = "none";
    });
    
    const d = new Date();
    $("currentDate").textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

(async function init(){
    await hydrate();
    wireEvents();
    renderAll();
    
    window.viewOrder = viewOrder;
    window.deleteOrder = deleteOrder;
    window.deleteCustomer = deleteCustomer;
    window.viewCustomerOrders = viewCustomerOrders;
})();
