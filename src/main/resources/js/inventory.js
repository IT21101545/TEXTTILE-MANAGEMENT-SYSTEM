/*******************************************************
 * ZEE FASHION - Textile Inventory Management
 * Enhanced Dashboard Implementation (Material Pull System)
 *******************************************************/

const MODE = "API"; 
const $ = (id) => document.getElementById(id);

const state = {
    products: [],    // Stores materials actually shown in dashboard
    master: [],      // Stores all materials for picker
    editingId: null,
    chart: null,
    logs: []
};

// --- Helper Functions ---
function toast(msg, type="") {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

function escapeHtml(s){
    return String(s ?? "")
        .replaceAll("&","&amp;").replaceAll("<","&lt;")
        .replaceAll(">","&gt;").replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function formatCurrency(val) {
    return 'Rs. ' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateActivityLog(action) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.logs.unshift({ time: now, action: action });
    if (state.logs.length > 8) state.logs.pop();
    
    const logList = $("activityLog");
    if(logList) logList.innerHTML = state.logs.map(log => `
        <li>
            <span class="time">${log.time}</span>
            <span class="action">${escapeHtml(log.action)}</span>
        </li>
    `).join("");
}

// --- API Endpoints ---
async function apiListMaterials(){
    const res = await fetch("/api/materials");
    const data = await res.json();
    return data;
}

async function apiCall(url, method="GET", body=null){
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Request failed");
    }
    return await res.json();
}

async function apiExposeMaterial(id, exposed){
    return await apiCall(`/api/materials/${id}/expose`, "POST", { exposed });
}

async function apiTransferStock(id, type, qty){
    const endpoint = type === "TO_INVENTORY" ? "transfer-to-inventory" : "transfer-to-shop";
    return await apiCall(`/api/materials/${id}/${endpoint}`, "POST", { qty: Number(qty) });
}

async function apiAdjustStock(id, action, qty, reason){
    return await apiCall(`/api/materials/${id}/stock`, "PATCH", { action: action.toUpperCase(), qty, reason });
}

// --- UI Logic ---
function renderKPIs(list){
    if($("kpiProducts")) $("kpiProducts").textContent = String(list.length);
    const totalInventory = list.reduce((s,m)=>s + (Number(m.supplierStock||0) + Number(m.stockQty||0) + Number(m.shopStock||0)), 0);
    if($("kpiStock")) $("kpiStock").textContent = totalInventory.toLocaleString();

    // Update Low Stock Items Sidebar
    const lowStockList = $("lowStockList");
    if (!lowStockList) return;
    
    const lowItems = list.filter(m => Number(m.stockQty || 0) <= Number(m.lowThreshold || 10));
    
    if (lowItems.length === 0) {
        lowStockList.innerHTML = '<div class="muted" style="text-align: center; padding: 20px;">All levels healthy</div>';
    } else {
        lowStockList.innerHTML = lowItems.slice(0, 5).map(m => {
            const current = Number(m.stockQty || 0);
            const type = current === 0 ? 'out' : 'low';
            return `
            <div class="low-stock-item ${type}">
                <div class="info">
                    <span class="name">${escapeHtml(m.name)}</span>
                    <span class="meta">I: ${m.stockQty} | S: ${m.supplierStock} | P: ${m.shopStock}</span>
                </div>
                <span class="badge ${current === 0 ? 'bad' : 'warn'}">${current === 0 ? 'OUT' : 'LOW'}</span>
            </div>
        `}).join("");
    }
}

function renderTable(list){
    const rows = list.filter(m => m.exposedInInventory);
    $("resultCount").textContent = `${rows.length} materials tracked`;

    const tbody = $("productTable").querySelector("tbody");
    tbody.innerHTML = "";

    rows.forEach((m, idx) => {
        const tr = document.createElement("tr");
        tr.style.animationDelay = `${idx * 0.05}s`;
        
        tr.innerHTML = `
            <td><code class="gold-text" style="background: rgba(201, 168, 76, 0.05); padding: 4px 10px; border-radius: 8px; font-size: 12px; border: 1px solid rgba(201,168,76,0.1);">${escapeHtml(m.code)}</code></td>
            <td>
                <div style="display:flex; flex-direction:column;">
                    <strong style="color: var(--ink);">${escapeHtml(m.name)}</strong>
                    <span class="muted" style="font-size: 11px;">${escapeHtml(m.description || 'No description')}</span>
                </div>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge ghost" style="min-width: 40px; text-align: center;">${m.supplierStock || 0}</span>
                    ${(m.supplierStock > 0) ? `<button class="btn small gold" onclick="openTransferModal('${m.id}', 'TO_INVENTORY')" title="Move to Inventory">↓ Inv</button>` : ''}
                </div>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge ${(m.stockQty || 0) <= (m.lowThreshold || 10) ? 'bad' : 'ok'}" style="min-width: 40px; text-align: center;">${m.stockQty || 0}</span>
                    ${(m.stockQty > 0) ? `<button class="btn small primary" onclick="openTransferModal('${m.id}', 'TO_SHOP')" title="Move to Shop">↓ Shop</button>` : ''}
                </div>
            </td>
            <td>
                <span class="badge ok" style="min-width: 40px; text-align: center;">${m.shopStock || 0}</span>
            </td>
            <td class="muted">${escapeHtml(m.unit)}</td>
            <td class="right">
                <div style="display:flex; gap:6px; justify-content: flex-end;">
                    <button class="btn ghost small" onclick="openProductModal('${m.id}')">✏️</button>
                    <button class="btn ghost small" onclick="untrackMaterial('${m.id}')" title="Hide Dashboard">✕</button>
                    <button class="btn danger small" onclick="deleteMaterial('${m.id}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openTransferModal(id, type){
    const m = state.products.find(x => String(x.id) === String(id));
    if(!m) return;

    $("transferWorkflowModal").classList.add("open");
    $("twId").value = id;
    $("twType").value = type;
    $("twQty").value = "";

    const isToInventory = type === "TO_INVENTORY";
    $("twTitle").textContent = isToInventory ? "Check-in to Inventory" : "Transfer to Shop";
    $("twSub").textContent = isToInventory ? "Move goods from Supplier Stock to main Inventory stage." : "Send materials from Inventory stage to the Shop Floor.";
    
    $("twSourceLabel").textContent = isToInventory ? "Supplier Stock (Source)" : "Inventory Stock (Source)";
    $("twSourceVal").textContent = isToInventory ? (m.supplierStock || 0) : (m.stockQty || 0);
    $("twFlowLabel").textContent = isToInventory ? `Moving ${m.name} ➔ Inventory` : `Moving ${m.name} ➔ Shop`;
}

function closeTransferModal(){
    $("transferWorkflowModal").classList.remove("open");
    $("transferWorkflowForm").reset();
}

function openProductModal(id = null){
    const modal = $("productModal");
    modal.classList.add("open");
    state.editingId = id;

    if(id){
        const m = state.products.find(x => x.id == id);
        if(!m) return;
        $("pmTitle").textContent = "Edit Material";
        $("pmId").value = m.id;
        $("pmName").value = m.name;
        $("pmSku").value = m.code;
        $("pmUnit").value = m.unit || "kg";
        $("pmStock").value = m.stockQty;
        $("pmLow").value = m.lowThreshold;
        $("pmPrice").value = m.price || 0;
        $("pmImageUrl").value = m.imageUrl || "";
        if($("pmDesc")) $("pmDesc").value = m.description || "";

        // Image Preview
        const preview = $("pmImagePreview");
        if (m.imageUrl) {
            preview.innerHTML = `<img src="${m.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            preview.innerHTML = `<span>📦</span><div style="font-size:10px; color:var(--muted); margin-top:4px;">Click / Paste</div>`;
        }


        // Shop Status
        const btnExpose = $("btnExposeToShop");
        if(m.linkedProductId){
            $("pmShopStatus").textContent = "Active in Customer Storefront";
            $("pmShopStatus").classList.remove("muted");
            $("pmShopStatus").style.color = "#27AE60"; // green
            if(btnExpose) {
                btnExpose.style.display = "block";
                btnExpose.innerHTML = "🔄 Update Storefront";
            }
            const btnTransfer = $("btnModalTransfer");
            if(btnTransfer) btnTransfer.style.display = (m.stockQty > 0) ? "block" : "none";
        } else {
            $("pmShopStatus").textContent = "Not listed in customer shop";
            $("pmShopStatus").classList.add("muted");
            $("pmShopStatus").style.color = "";
            if(btnExpose) {
                btnExpose.style.display = "block";
                btnExpose.innerHTML = "🚀 Expose to Shop";
            }
            if($("btnModalTransfer")) $("btnModalTransfer").style.display = "none";
        }
    } else {
        $("pmTitle").textContent = "New Material";
        $("productForm").reset();
        $("pmId").value = "";
        $("pmImagePreview").innerHTML = `<span>📦</span><div style="font-size:10px; color:var(--muted); margin-top:4px;">Click / Paste</div>`;
    }
}


function closeProductModal(){
    $("productModal").classList.remove("open");
}

/**************** MASTER PICKER ****************/
function openPickerModal(){
    $("pickerOverlay").classList.add("open");
    renderPickerList();
}

function closePickerModal(){
    $("pickerOverlay").classList.remove("open");
}

function renderPickerList(){
    const q = $("pickerSearch").value.trim().toLowerCase();
    const list = state.master.filter(m => {
        const hay = `${m.name} ${m.code}`.toLowerCase();
        return q ? hay.includes(q) : true;
    });

    const container = $("pickerList");
    if (list.length === 0) {
        container.innerHTML = `<div class="muted" style="padding:20px; text-align:center;">No materials found in master list.</div>`;
        return;
    }

    container.innerHTML = list.map(m => `
        <div class="picker-item">
            <div>
                <div style="font-weight:700; color: var(--ink);">${escapeHtml(m.name)}</div>
                <div class="muted" style="font-size:11px;">${m.code} | ${m.unit}</div>
                <div style="font-size:10px; color:var(--gold); font-weight: 700; margin-top: 4px;">STOCK: S:${m.supplierStock} I:${m.stockQty} P:${m.shopStock}</div>
            </div>
            <button class="btn ${m.exposedInInventory ? 'ghost' : 'primary'} small" 
                    offset="0"
                    onclick="toggleMaterialTracking('${m.id}', ${!m.exposedInInventory})"
                    ${m.exposedInInventory ? 'disabled' : ''}>
                ${m.exposedInInventory ? 'Tracked' : 'Track'}
            </button>
        </div>
    `).join("");
}

async function toggleMaterialTracking(id, stateBool){
    try {
        await apiExposeMaterial(id, stateBool);
        toast(stateBool ? "Material added to dashboard" : "Material hidden", "success");
        await renderAll();
        renderPickerList();
    } catch(err) {
        toast(err.message, "error");
    }
}

async function untrackMaterial(id){
    if(!confirm("Stop tracking this material on the dashboard? (Stock remains in system)")) return;
    await toggleMaterialTracking(id, false);
}

// --- Save Handler ---
async function apiSaveMaterial(mData){
    const url = mData.id ? `/api/materials/${mData.id}` : "/api/materials";
    return await apiCall(url, mData.id ? "PUT" : "POST", mData);
}

async function renderAll(){
    try {
        const list = await apiListMaterials();
        state.master = list;
        state.products = list; 
        
        const exposed = list.filter(m => m.exposedInInventory);
        renderKPIs(exposed);
        renderTable(list);
        updateActivityLog("Dashboard updated");
    } catch (err) {
        toast("Failed to load inventory data", "error");
    }
}

function wireEvents(){
    $("btnNewProduct")?.addEventListener("click", () => openProductModal());
    $("btnCloseModal")?.addEventListener("click", closeProductModal);
    $("btnCancel")?.addEventListener("click", closeProductModal);

    $("productForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mData = {
            id: $("pmId").value || null,
            name: $("pmName").value.trim(),
            code: $("pmSku").value.trim(),
            unit: $("pmUnit").value,
            stockQty: parseInt($("pmStock").value) || 0,
            lowThreshold: parseInt($("pmLow").value) || 0,
            price: parseFloat($("pmPrice").value) || 0,
            imageUrl: $("pmImageUrl").value.trim(),
            description: $("pmDesc") ? $("pmDesc").value.trim() : "",
            exposedInInventory: true // Auto-expose if created/edited from here
        };


        if (!mData.name || !mData.code) {
            toast("Name and Code are required", "error");
            return;
        }

        try {
            const saved = await apiSaveMaterial(mData);
            toast("Material saved successfully", "success");
            
            // AUTO-SYNC Storefront if linked
            if (saved && saved.id) {
                try {
                    await fetch(`/api/products/expose/${saved.id}`, { method: 'POST' });
                    console.log("Storefront synced automatically");
                } catch(syncErr) {
                    console.warn("Auto-sync failed", syncErr);
                }
            }

            closeProductModal();
            renderAll();
        } catch(err){
            toast(err.message, "error");
        }
    });

    $("btnRefresh")?.addEventListener("click", () => {
        renderAll();
        updateActivityLog("Data refreshed");
    });
    
    $("btnShowPicker")?.addEventListener("click", openPickerModal);
    $("btnClosePicker")?.addEventListener("click", closePickerModal);
    $("btnFinishPicker")?.addEventListener("click", closePickerModal);
    $("pickerSearch")?.addEventListener("input", renderPickerList);

    $("btnResetShop")?.addEventListener("click", async () => {
        if(!confirm("⚠️ WARNING: This will permanently delete ALL Shop Catalog data, Orders, and Feedback. Inventory materials will remain safe. Proceed?")) return;
        try {
            await fetch("/api/products/clear", { method: "DELETE" });
            toast("Shop catalog cleared successfully", "success");
            renderAll();
        } catch(err) {
            toast("Failed to clear shop data", "error");
        }
    });

    $("btnExposeToShop")?.addEventListener("click", async () => {

        if(!state.editingId) return;
        try {
            const res = await fetch(`/api/products/expose/${state.editingId}`, { method: "POST" });
            if(!res.ok) throw new Error("Failed to expose to shop");
            toast("Material listed in storefront!", "success");
            closeProductModal();
            renderAll();
        } catch(err) {
            toast(err.message, "error");
        }
    });

    $("btnModalTransfer")?.addEventListener("click", () => {
        if(!state.editingId) return;
        closeProductModal();
        openTransferModal(state.editingId, 'TO_SHOP');
    });

    $("transferWorkflowForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = $("twId").value;
        const type = $("twType").value;
        const qty = parseInt($("twQty").value);
        const sourceVal = parseInt($("twSourceVal").textContent);

        if(!qty || qty <= 0) { toast("Qty must be > 0", "error"); return; }
        if(qty > sourceVal) { toast("Insufficient stock in source stage", "error"); return; }

        try {
            await apiTransferStock(id, type, qty);
            toast(`Successfully transferred ${qty} units`, "success");
            closeTransferModal();
            renderAll();
        } catch(err){
            toast(err.message, "error");
        }
    });
    
    $("btnCloseTransfer")?.addEventListener("click", closeTransferModal);
    $("transferWorkflowModal")?.addEventListener("click", (e) => {
        if(e.target.id === "transferWorkflowModal") closeTransferModal();
    });

    // Image Handlers
    $("pmFileInput")?.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            $("pmImageUrl").value = base64;
            $("pmImagePreview").innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover;">`;
        };
        reader.readAsDataURL(file);
    });

    // Paste Handle
    document.addEventListener("paste", function(e) {
        if (!$("productModal").classList.contains("open")) return;
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    $("pmImageUrl").value = base64;
                    $("pmImagePreview").innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover;">`;
                    toast("Image pasted successfully", "success");
                };
                reader.readAsDataURL(blob);
            }
        }
    });
}


async function deleteMaterial(id) {
    const m = state.products.find(x => x.id == id);
    if (!m) return;
    if (!confirm(`Are you sure you want to delete material "${m.name}"?`)) return;

    try {
        await apiCall(`/api/materials/${id}`, "DELETE");
        toast(`Material "${m.name}" deleted`, "success");
        renderAll();
    } catch (err) {
        toast(err.message, "error");
    }
}

// Initialize
(function init(){
    wireEvents();
    renderAll();
    updateActivityLog("Dashboard initialized");
    // Global Paste handling for Image (disabled for materials)
})();

// Global assignments
window.openProductModal = openProductModal;
window.deleteMaterial = deleteMaterial;
window.untrackMaterial = untrackMaterial;
window.toggleMaterialTracking = toggleMaterialTracking;
window.openTransferModal = openTransferModal;
