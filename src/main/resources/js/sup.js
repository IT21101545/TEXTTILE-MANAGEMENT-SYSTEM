/*******************************************************
 * Suppliers & Raw Materials UI (Demo localStorage)
 * Features:
 *  - Supplier CRUD
 *  - Raw Material CRUD + stock adjust (no negative)
 *  - Record Purchases (adds to material stock)
 *  - Purchase history + filters
 *  - Analytics (top supplier/material + monthly spend)
 *******************************************************/

const MODE = "API"; 
const LS_KEY = "zeefashion_suppliers_materials_v1";
const $ = (id) => document.getElementById(id);

const state = {
    suppliers: [],
    materials: [],
    purchases: [],
    editingSupplierId: null,
    editingPurchaseId: null,
    currentSuppliedMaterials: [], // Items currently in the Supplier Modal
    notifications: []
};

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

function money(v){
    const n = Number(v||0);
    return `Rs. ${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function nowStamp(){
    const d = new Date();
    return d.toISOString().slice(0,19).replace("T"," ");
}
function genId(prefix){
    return `${prefix}-${Math.floor(100000 + Math.random()*900000)}`;
}

/**************** DEMO SEED (NO OP IN API MODE) ****************/
function seedDemo(){
    if(MODE === "API"){
        toast("Cannot reset demo data in API mode", "error");
        return;
    }
}

async function hydrate(){
    const modePill = $("modePill");
    if(modePill) modePill.textContent = MODE === "DEMO" ? "Demo Mode" : "API Mode";
    if(MODE === "DEMO"){
        const raw = localStorage.getItem(LS_KEY);
        const db = raw ? JSON.parse(raw) : { suppliers: [], materials: [], purchases: [] };
        state.suppliers = db.suppliers || [];
        state.materials = db.materials || [];
        state.purchases = db.purchases || [];
    } else {
        try {
            state.suppliers = await apiCall("/api/suppliers");
            state.materials = await apiCall("/api/materials");
            state.purchases = await apiCall("/api/purchases");
        } catch(e) {
            toast("Failed to load data from server", "error");
        }
    }
}

/**************** FILTERS ****************/
function getSupplierFilters(){
    return {
        q: $("supplierSearch").value.trim().toLowerCase(),
        status: $("supplierStatusFilter").value
    };
}
function filterSuppliers(list){
    const { q, status } = getSupplierFilters();
    return list.filter(s=>{
        const hay = `${s.name} ${s.email} ${s.contact} ${s.address}`.toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(status !== "all" && s.status !== status) return false;
        return true;
    });
}

function getMaterialFilters(){
    return {
        q: $("materialSearch").value.trim().toLowerCase(),
        f: $("materialFilter").value
    };
}
function isLow(m){ 
    const stock = Number(m.stockQty || 0);
    const threshold = Number(m.lowThreshold || 10);
    return stock <= threshold && stock > 0; 
}
function isOut(m){ return Number(m.stockQty || 0) === 0; }

function filterMaterials(list){
    const { q, f } = getMaterialFilters();
    return list.filter(m=>{
        const hay = `${m.name} ${m.code || ""}`.toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(f === "low" && !isLow(m)) return false;
        if(f === "out" && !isOut(m)) return false;
        return true;
    });
}

function getPurchaseFilters(){
    return { q: "", from: "", to: "" };
}
function filterPurchases(list){
    const { q, from, to } = getPurchaseFilters();
    return list.filter(p=>{
        const sName = p.supplier ? p.supplier.name : "—";
        const mName = p.material ? p.material.name : "—";
        const mCode = p.material ? p.material.code : "";
        const pDate = (p.purchasedAt || "").slice(0, 10);

        const hay = `${p.invoice||""} #${p.id} ${pDate} ${sName} ${mName} ${mCode}`.toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(from && pDate < from) return false;
        if(to && pDate > to) return false;
        return true;
    });
}

function supplierBadge(status){
    if(status === "ACTIVE") return `<span class="badge ok">● ACTIVE</span>`;
    if(status === "INACTIVE") return `<span class="badge bad">● INACTIVE</span>`;
    return `<span class="badge warn">● ${escapeHtml(status)}</span>`;
}
function materialBadge(m){
    if(isOut(m)) return `<span class="badge bad">● OUT</span>`;
    if(isLow(m)) return `<span class="badge warn">● LOW</span>`;
    return `<span class="badge ok">● OK</span>`;
}

/**************** API HOOKS ****************/
async function apiCreateSupplier(payload){ 
    if(MODE === "DEMO") { state.suppliers.push(payload); localStorage.setItem(LS_KEY, JSON.stringify(state)); return; }
    const res = await apiCall("/api/suppliers", "POST", payload); 
    state.suppliers.push(res);
}
async function apiUpdateSupplier(id, payload){
    if(MODE === "DEMO") {
        const idx = state.suppliers.findIndex(s=>s.id===id);
        if(idx<0) throw new Error("Supplier not found");
        state.suppliers[idx] = {...state.suppliers[idx], ...payload, id};
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    const res = await apiCall(`/api/suppliers/${id}`, "PUT", payload);
    const idx = state.suppliers.findIndex(s=>s.id == id);
    if(idx>=0) state.suppliers[idx] = res;
}
async function apiDeleteSupplier(id){
    if(MODE === "DEMO") {
        state.suppliers = state.suppliers.filter(s=>s.id!==id);
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    await apiCall(`/api/suppliers/${id}`, "DELETE");
}

async function apiCreateMaterial(payload){ 
    if(MODE === "DEMO") { state.materials.push(payload); localStorage.setItem(LS_KEY, JSON.stringify(state)); return; }
    const res = await apiCall("/api/materials", "POST", payload); 
    state.materials.push(res);
}
async function apiUpdateMaterial(id, payload){
    if(MODE === "DEMO") {
        const idx = state.materials.findIndex(m=>m.id == id);
        if(idx<0) throw new Error("Material not found");
        state.materials[idx] = {...state.materials[idx], ...payload, id};
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    const res = await apiCall(`/api/materials/${id}`, "PUT", payload);
    const idx = state.materials.findIndex(m=>m.id == id);
    if(idx>=0) state.materials[idx] = res;
}
async function apiDeleteMaterial(id){
    if(MODE === "DEMO") {
        state.materials = state.materials.filter(m=>m.id!==id);
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    await apiCall(`/api/materials/${id}`, "DELETE");
}
async function apiAdjustMaterialStock(id, action, qty, reason=""){
    if(MODE === "DEMO") {
        const m = state.materials.find(x=>x.id===id);
        if(!m) throw new Error("Material not found");
        const q = Number(qty);
        if(action === "add" || action === "ADD") m.stockQty = (m.stockQty||0) + q;
        if(action === "remove" || action === "REMOVE") m.stockQty = (m.stockQty||0) - q;
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    const payload = { action: action.toUpperCase(), qty: Number(qty), reason };
    const res = await apiCall(`/api/materials/${id}/stock`, "PATCH", payload);
    const idx = state.materials.findIndex(m=>m.id == id);
    if(idx>=0) state.materials[idx] = res;
}

async function apiTransferStock(id, type, qty){
    const endpoint = type === "TO_INVENTORY" ? "transfer-to-inventory" : "transfer-to-shop";
    const res = await apiCall(`/api/materials/${id}/${endpoint}`, "POST", { qty: Number(qty) });
    const idx = state.materials.findIndex(m=>m.id == id);
    if(idx>=0) state.materials[idx] = res;
    return res;
}

async function apiCreatePurchase(payload){
    if(MODE === "DEMO") {
        state.purchases.push(payload);
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    // Transform to nested objects for JPA
    const apiPayload = {
        ...payload,
        supplier: { id: payload.supplierId },
        material: { id: payload.materialId },
        purchasedAt: payload.date ? (payload.date + "T00:00:00") : null
    };
    delete apiPayload.supplierId;
    delete apiPayload.materialId;
    delete apiPayload.date;

    const res = await apiCall("/api/purchases", "POST", apiPayload);
    state.purchases.push(res);
}
async function apiDeletePurchase(id){
    if(MODE === "DEMO") {
        state.purchases = state.purchases.filter(x=>x.id!==id);
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        return;
    }
    await apiCall(`/api/purchases/${id}`, "DELETE");
}

/**************** NOTIFICATIONS ****************/
async function fetchNotifications(){
    if(MODE === "DEMO") return;
    try {
        state.notifications = await apiCall("/api/notifications");
        renderNotifications();
    } catch(e) {
        console.error("Failed to fetch notifications", e);
    }
}

async function markNotifAsRead(id){
    try {
        await apiCall(`/api/notifications/${id}/read`, "POST");
        state.notifications = state.notifications.filter(n => n.id !== id);
        renderNotifications();
    } catch(e) {
        toast("Failed to dismiss notification", "error");
    }
}

/**************** RENDER ****************/
function renderAll(){
    renderSuppliers();
    renderMaterials();
    renderPurchases();
    renderSelectOptions();
    renderAnalytics();
    renderNotifications();
}

function renderSupplierKPIs(){
    $("kpiSuppliers").textContent = String(state.suppliers.length);
    $("kpiSuppliersActive").textContent = String(state.suppliers.filter(s=>s.status==="ACTIVE").length);

    // last 30 days stats
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
    const recent = state.purchases.filter(p => new Date(p.date) >= cutoff);
    $("kpiPurch30").textContent = String(recent.length);
    const spend = recent.reduce((s,p)=>s+Number(p.total||0),0);
    $("kpiSpend30").textContent = money(spend);
}

function renderSuppliers(){
    renderSupplierKPIs();

    const tbody = $("suppliersTable").querySelector("tbody");
    tbody.innerHTML = "";

    const rows = filterSuppliers(state.suppliers).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    $("supplierCount").textContent = `${rows.length} suppliers`;

    rows.forEach(s=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><strong>${escapeHtml(s.name)}</strong><div class="muted">#${escapeHtml(s.id)}</div></td>
      <td><span class="badge ghost">${escapeHtml(s.materialType || "General")}</span></td>
      <td><div>${escapeHtml(s.email)}</div><div class="muted">${escapeHtml(s.contact)}</div></td>
      <td>${escapeHtml(s.address)}</td>
      <td class="right"><strong>${s.totalSupplied || 0}</strong></td>
      <td>${supplierBadge(s.status)}</td>
      <td class="right">
        <button class="btn small ghost2" onclick="openSupplierModal('${s.id}')">Edit</button>
        <button class="btn small danger" onclick="deleteSupplier('${s.id}')">Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function renderMaterialKPIs(){
    const totalMaterials = state.materials.length;
    const totalStock = state.materials.reduce((s,m)=>s + (Number(m.supplierStock||0) + Number(m.stockQty||0) + Number(m.shopStock||0)),0);
    const lowStock = state.materials.filter(m => isLow(m)).length;
    const outOfStock = state.materials.filter(m => isOut(m)).length;
    $("kpiMaterials").textContent = String(totalMaterials);
    $("kpiMatStock").textContent = String(totalStock);
    $("kpiMatLow").textContent = String(lowStock);
    $("kpiMatOut").textContent = String(outOfStock);
}

function renderMaterials(){
    renderMaterialKPIs();

    const tbody = $("materialsTable").querySelector("tbody");
    tbody.innerHTML = "";

    const rows = filterMaterials(state.materials).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    $("materialCount").textContent = `${rows.length} materials`;

    rows.forEach(m=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><strong>${escapeHtml(m.name)}</strong></td>
      <td><code style="background: var(--gold-glow); color: var(--gold2); padding: 2px 6px; border-radius: 4px; font-weight: 700;">${escapeHtml(m.code || "N/A")}</code></td>
      <td>${escapeHtml(m.unit)}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <strong style="font-size:1.1rem;">${m.supplierStock || 0}</strong>
          ${(m.supplierStock > 0) ? `` : ''}
        </div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <strong style="font-size:1.1rem;">${m.stockQty || 0}</strong>
          ${(m.stockQty > 0) ? `<button class="btn small gold" onclick="openTransferModal('${m.id}', 'TO_SHOP')" style="padding:2px 6px; font-size:10px;" title="Send to Shop Floor">To Shop ↓</button>` : ''}
        </div>
      </td>
      <td>
        <strong style="font-size:1.1rem;">${m.shopStock || 0}</strong>
      </td>
      <td class="right">
        <button class="btn small gold" onclick="openStockModal('${m.id}')" title="Quick Adjust Stock">± Adjust</button>
        <button class="btn small ghost2" onclick="openMaterialModal('${m.id}')">Edit</button>
        <button class="btn small danger" onclick="deleteMaterial('${m.id}')">🗑️</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function renderPurchases(){
    const tbody = $("purchasesTable").querySelector("tbody");
    tbody.innerHTML = "";

    const rows = filterPurchases(state.purchases)
        .sort((a,b)=>(b.date + b.invoice).localeCompare(a.date + a.invoice));

    $("purchaseCount").textContent = `${rows.length} records`;

    rows.forEach(p=>{
        const sName = p.supplier ? p.supplier.name : "—";
        const mName = p.material ? p.material.name : "—";
        const mCode = p.material ? p.material.code : "";
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><strong>${escapeHtml(p.invoice)}</strong><div class="muted">${escapeHtml(p.id)}</div></td>
      <td>${escapeHtml(p.date)}</td>
      <td>${escapeHtml(sName)}</td>
      <td>${escapeHtml(mName)} <div class="muted">${escapeHtml(mCode)}</div></td>
      <td class="right"><strong>${Number(p.qty || 0)}</strong></td>
      <td class="right">${Number(p.unitPrice || 0).toFixed(2)}</td>
      <td class="right"><strong>${Number(p.total || 0).toFixed(2)}</strong></td>
      <td class="right">
        <button class="btn small danger" onclick="deletePurchase('${p.id}')">Delete</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function renderSelectOptions(){
    // purchase form selects
    const sSel = $("purSupplierId");
    const mSel = $("purMaterialId");

    sSel.innerHTML = state.suppliers
        .filter(s=>s.status==="ACTIVE")
        .sort((a,b)=>(a.name||"").localeCompare(b.name||""))
        .map(s=>`<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.contact)}</option>`)
        .join("");

    mSel.innerHTML = state.materials
        .sort((a,b)=>(a.code||"").localeCompare(b.code||""))
        .map(m=>`<option value="${m.id}">${escapeHtml(m.code || "N/A")} — ${escapeHtml(m.name)}</option>`)
        .join("");

    // if empty show placeholders
    if(state.materials.length===0){
        mSel.innerHTML = `<option value="">No materials</option>`;
    }
}

function renderFilteredMaterialOptions(supplierId) {
    const mSel = $("purMaterialId");
    const s = state.suppliers.find(x => x.id == supplierId);
    
    if (!s || !s.suppliedMaterials || s.suppliedMaterials.length === 0) {
        mSel.innerHTML = `<option value="">(No materials linked in profile)</option>`;
        return;
    }

    mSel.innerHTML = s.suppliedMaterials
        .sort((a,b)=>(a.code||"").localeCompare(b.code||""))
        .map(m=>`<option value="${m.id}">${escapeHtml(m.code || "N/A")} — ${escapeHtml(m.name)}</option>`)
        .join("");
}

/**************** ANALYTICS ****************/
function monthKey(dateStr){
    // YYYY-MM-DD -> YYYY-MM
    return (dateStr||"").slice(0,7);
}
function renderAnalytics(){
    const totalSpend = state.purchases.reduce((s,p)=>s+Number(p.total||0),0);
    $("anTotalSpend").textContent = money(totalSpend);
    $("anTotalPurch").textContent = String(state.purchases.length);

    // spend per supplier
    const supSpend = new Map();
    state.purchases.forEach(p=>{
        supSpend.set(p.supplierId, (supSpend.get(p.supplierId)||0) + Number(p.total||0));
    });
    const topSup = [...supSpend.entries()].sort((a,b)=>b[1]-a[1])[0];
    if(topSup){
        const s = state.suppliers.find(x=>x.id == topSup[0]);
        $("anTopSupplier").textContent = s?.name || "—";
        $("anTopSupplierSub").textContent = money(topSup[1]);
    }else{
        $("anTopSupplier").textContent = "—";
        $("anTopSupplierSub").textContent = "—";
    }

    // spend per material
    const matSpend = new Map();
    state.purchases.forEach(p=>{
        matSpend.set(p.materialId, (matSpend.get(p.materialId)||0) + Number(p.total||0));
    });
    const topMat = [...matSpend.entries()].sort((a,b)=>b[1]-a[1])[0];
    if(topMat){
        const m = state.materials.find(x=>x.id == topMat[0]);
        $("anTopMaterial").textContent = m?.name || "—";
        $("anTopMaterialSub").textContent = money(topMat[1]);
    }else{
        $("anTopMaterial").textContent = "—";
        $("anTopMaterialSub").textContent = "—";
    }


}

function renderNotifications(){
    const badge = $("notifBadge");
    const count = state.notifications.length;
    
    if(count > 0){
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }

    const list = $("notifList");
    if(count === 0){
        list.innerHTML = `<div class="notif-empty">No new alerts for suppliers.</div>`;
        return;
    }

    list.innerHTML = state.notifications.map(n => `
        <div class="notif-item">
            <div class="msg">${escapeHtml(n.message)}</div>
            <div class="meta">${new Date(n.createdAt).toLocaleString()}</div>
            <div class="actions">
                <button class="btn small ghost" onclick="markNotifAsRead(${n.id})">Dismiss</button>
            </div>
        </div>
    `).join("");
}

/**************** TABS ****************/
function setTab(name){
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("show"));
    $(`tab-${name}`).classList.add("show");
}

/**************** MODALS: SUPPLIER ****************/
function openSupplierModal(id=null){
    state.editingSupplierId = id;
    $("supplierModal").classList.add("open");

    const isEdit = !!id;
    $("smTitle").textContent = isEdit ? "Edit Supplier" : "New Supplier";
    $("smSub").textContent = isEdit ? "Update supplier information." : "Create supplier record.";
    $("btnSaveSupplier").textContent = isEdit ? "Update" : "Save";

    const s = isEdit ? state.suppliers.find(x=>x.id == id) : null;

    $("supId").value = s?.id || "";
    $("supName").value = s?.name || "";
    $("supEmail").value = s?.email || "";
    $("supPhone").value = s?.contact || "";
    $("supAddress").value = s?.address || "";
    $("supMaterialType").value = s?.materialType || "";
    $("supStatus").value = s?.status || "ACTIVE";
    $("supNotes").value = s?.description || "";
    $("supTotalVolume").value = s?.totalSupplied || 0;

    // Load materials for this supplier
    state.currentSuppliedMaterials = s ? (s.suppliedMaterials || []) : [];
    renderSupplierMaterialTags();
    populateMaterialPicker();
}

function renderSupplierMaterialTags() {
    const list = $("supMaterialsTagList");
    if (state.currentSuppliedMaterials.length === 0) {
        list.innerHTML = `<div class="muted" style="font-size: 0.85rem;">No materials linked yet.</div>`;
        return;
    }
    list.innerHTML = state.currentSuppliedMaterials.map(m => `
        <div class="badge ghost" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:var(--bg-soft); border:1px solid var(--border);">
            <strong>${escapeHtml(m.code)}</strong>
            <span>${escapeHtml(m.name)}</span>
            <button type="button" class="icon-btn" onclick="unlinkMaterialFromProfile(${m.id})" style="font-size:10px; padding:2px; color:var(--danger);">✕</button>
        </div>
    `).join("");
}

function populateMaterialPicker() {
    const selector = $("supMaterialPicker");
    const linkedIds = state.currentSuppliedMaterials.map(m => m.id);
    const available = state.materials.filter(m => !linkedIds.includes(m.id));
    
    selector.innerHTML = `<option value="">Select a material to add...</option>` +
        available.sort((a,b)=>a.name.localeCompare(b.name))
        .map(m => `<option value="${m.id}">${escapeHtml(m.code)} - ${escapeHtml(m.name)}</option>`).join("");
}

window.unlinkMaterialFromProfile = (id) => {
    state.currentSuppliedMaterials = state.currentSuppliedMaterials.filter(m => m.id != id);
    renderSupplierMaterialTags();
    populateMaterialPicker();
};

function closeSupplierModal(){
    $("supplierModal").classList.remove("open");
    state.editingSupplierId = null;
    state.currentSuppliedMaterials = [];
    $("supplierForm").reset();
}

/**************** MODALS: MATERIAL ****************/
function openMaterialModal(id=null){
    state.editingMaterialId = id;
    $("materialModal").classList.add("open");

    const isEdit = !!id;
    $("mmTitle").textContent = isEdit ? "Edit Material" : "New Material";
    $("mmSub").textContent = isEdit ? "Update material details." : "Create raw material record.";
    $("btnSaveMaterial").textContent = isEdit ? "Update" : "Save";

    const m = isEdit ? state.materials.find(x=>x.id == id) : null;

    $("matId").value = m?.id || "";
    $("matName").value = m?.name || "";
    $("matCode").value = m?.code || "";
    $("matUnit").value = m?.unit || "kg";
    // Show Supplier Stock as the editable 'Initial/Input' stock
    $("matStock").value = (m?.supplierStock ?? 0);
    $("matLow").value = (m?.lowThreshold ?? 10);
    $("matNotes").value = m?.description || "";
}
function closeMaterialModal(){
    $("materialModal").classList.remove("open");
    state.editingMaterialId = null;
    state._openedFromPurchase = false;
    $("materialForm").reset();
}

/**************** MODALS: STOCK ****************/
function openStockModal(matId){
    const m = state.materials.find(x=>x.id == matId);
    if(!m) return;

    $("stockModal").classList.add("open");
    $("stkMatId").value = m.id;
    $("stkMatTitle").textContent = `${m.name} (${m.code || "N/A"})`;
    // Adjustments now target Supplier Stock
    $("stkCurrent").textContent = String(m.supplierStock || 0);
    $("stkAction").value = "add";
    $("stkQty").value = "";
    $("stkReason").value = "";
}
function closeStockModal(){
    $("stockModal").classList.remove("open");
    $("stockForm").reset();
}

/**************** MODALS: PURCHASE ****************/
function openPurchaseModal(){
    if(state.suppliers.filter(s=>s.status==="ACTIVE").length === 0){
        toast("Create an ACTIVE supplier first", "error");
        setTab("suppliers");
        return;
    }
    if(state.materials.length === 0){
        toast("Create a material first", "error");
        setTab("materials");
        return;
    }

    $("purchaseModal").classList.add("open");
    $("purNotes").value = "";
    renderSelectOptions();
    
    // Initial filter if a supplier is already selected (auto-picked by browser/render)
    if($("purSupplierId").value) {
        renderFilteredMaterialOptions($("purSupplierId").value);
    }
}
function closePurchaseModal(){
    $("purchaseModal").classList.remove("open");
    $("purchaseForm").reset();
}

/**************** MODALS: TRANSFER ****************/
function openTransferModal(id, type){
    const m = state.materials.find(x => x.id == id);
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

/**************** DELETE ACTIONS ****************/
async function deleteSupplier(id){
    const ok = confirm("Delete this supplier? (Cannot delete if supplier has purchases)");
    if(!ok) return;
    try{
        await apiDeleteSupplier(id);
        toast("Supplier deleted", "success");
        renderAll();
    }catch(err){
        toast(err.message || "Delete failed", "error");
    }
}

async function deleteMaterial(id){
    const ok = confirm("Delete this material? (Cannot delete if material has purchases)");
    if(!ok) return;
    try{
        await apiDeleteMaterial(id);
        toast("Material deleted", "success");
        renderAll();
    }catch(err){
        toast(err.message || "Delete failed", "error");
    }
}

async function deletePurchase(id){
    const ok = confirm("Delete this purchase? (Stock will be reduced)");
    if(!ok) return;
    try{
        await apiDeletePurchase(id);
        toast("Purchase deleted", "success");
        renderAll();
    }catch(err){
        toast(err.message || "Delete failed", "error");
    }
}

/**************** EVENTS ****************/
function wireEvents(){
    // tabs
    document.querySelectorAll(".tab").forEach(btn=>{
        btn.addEventListener("click", ()=>setTab(btn.dataset.tab));
    });

    // reset demo
    $("btnResetDemo")?.addEventListener("click", seedDemo);
 
    // open modals
    $("btnNewSupplier")?.addEventListener("click", ()=>openSupplierModal(null));
    $("btnNewPurchase")?.addEventListener("click", openPurchaseModal);
    $("btnQuickAddMaterial")?.addEventListener("click", ()=>{
        state._openedFromPurchase = true;
        openMaterialModal(null);
    });

    // close modals
    $("btnCloseSupplier").addEventListener("click", closeSupplierModal);
    $("btnCancelSupplier").addEventListener("click", closeSupplierModal);
    $("supplierModal").addEventListener("click",(e)=>{ if(e.target.id==="supplierModal") closeSupplierModal(); });

    $("btnCloseMaterial").addEventListener("click", closeMaterialModal);
    $("btnCancelMaterial").addEventListener("click", closeMaterialModal);
    $("materialModal").addEventListener("click",(e)=>{ if(e.target.id==="materialModal") closeMaterialModal(); });

    $("btnCloseStock").addEventListener("click", closeStockModal);
    $("btnCancelStock").addEventListener("click", closeStockModal);
    $("stockModal").addEventListener("click",(e)=>{ if(e.target.id==="stockModal") closeStockModal(); });

    $("btnClosePurchase").addEventListener("click", closePurchaseModal);
    $("btnCancelPurchase").addEventListener("click", closePurchaseModal);
    $("purchaseModal").addEventListener("click",(e)=>{ if(e.target.id==="purchaseModal") closePurchaseModal(); });

    // supplier save
    $("supplierForm").addEventListener("submit", async (e)=>{
        e.preventDefault();
        const payload = {
            name: $("supName").value.trim(),
            email: $("supEmail").value.trim(),
            contact: $("supPhone").value.trim(),
            address: $("supAddress").value.trim(),
            materialType: $("supMaterialType").value.trim(),
            status: $("supStatus").value,
            description: $("supNotes").value.trim(),
            suppliedMaterials: state.currentSuppliedMaterials.map(m => ({ id: m.id }))
        };
        if(!payload.name || !payload.email || !payload.contact || !payload.address){
            toast("Fill required supplier fields", "error"); return;
        }

        try{
            const isEdit = !!state.editingSupplierId;
            if(isEdit){
                await apiUpdateSupplier(state.editingSupplierId, payload);
                toast("Supplier updated", "success");
            }else{
                const newSup = MODE === "DEMO" ? { id: genId("s"), ...payload } : payload;
                if(MODE === "DEMO" && state.suppliers.some(s=>s.email.toLowerCase()===newSup.email.toLowerCase())){
                    toast("Supplier email already exists", "error"); return;
                }
                await apiCreateSupplier(newSup);
                toast("Supplier created", "success");
            }
            closeSupplierModal();
            renderAll();
        }catch(err){
            toast(err.message || "Save failed", "error");
        }
    });

    // material save
    $("materialForm").addEventListener("submit", async (e)=>{
        e.preventDefault();
        const payload = {
            name: $("matName").value.trim(),
            code: $("matCode").value.trim(),
            unit: $("matUnit").value,
            supplierStock: Number($("matStock").value),
            lowThreshold: Number($("matLow").value),
            description: $("matNotes").value.trim(),
        };

        if(!payload.name || !payload.code){
            toast("Fill required material fields", "error"); return;
        }
        if(payload.supplierStock < 0 || payload.lowThreshold < 0){
            toast("Negative values not allowed", "error"); return;
        }

        try{
            const isEdit = !!state.editingMaterialId;
            if(isEdit){
                await apiUpdateMaterial(state.editingMaterialId, payload);
                toast("Material updated", "success");
            }else{
                const newMat = MODE === "DEMO" ? { id: genId("M"), ...payload } : payload;
                if(MODE === "DEMO" && state.materials.some(m=>m.code.toLowerCase()===newMat.code.toLowerCase())){
                    toast("Material code already exists", "error"); return;
                }
                await apiCreateMaterial(newMat);
                toast("Material created", "success");
            }
            closeMaterialModal();
            renderAll();

            if (state._openedFromPurchase) {
                state._openedFromPurchase = false;
                openPurchaseModal();
                // Select the new material once hydrated/re-rendered
                setTimeout(() => {
                   const mSel = $("purMaterialId");
                   const newM = state.materials.sort((a,b)=>b.id-a.id)[0];
                   if (newM) mSel.value = newM.id;
                }, 100);
            }
        }catch(err){
            toast(err.message || "Save failed", "error");
        }
    });

    $("btnMainNewMaterial")?.addEventListener("click", () => openMaterialModal(null));
    $("btnModalQuickMaterial")?.addEventListener("click", () => openMaterialModal(null));

    $("btnAddPickedMaterial").addEventListener("click", () => {
        const id = $("supMaterialPicker").value;
        if (!id) return;
        const mat = state.materials.find(m => m.id == id);
        if (mat) {
            state.currentSuppliedMaterials.push(mat);
            renderSupplierMaterialTags();
            populateMaterialPicker();
        }
    });

    // stock adjust
    $("stockForm").addEventListener("submit", async (e)=>{
        e.preventDefault();
        const matId = $("stkMatId").value;
        const action = $("stkAction").value;
        const qty = Number($("stkQty").value);
        if(!qty || qty <= 0){ toast("Qty must be > 0", "error"); return; }

        try{
            const m = state.materials.find(x=>x.id == matId);
            if(!m) throw new Error("Material not found");
            const reason = $("stkReason").value.trim();

            if(action === "remove" && (Number(m.supplierStock||0) - qty) < 0){
                toast("Cannot remove more than current stock", "error");
                return;
            }
            await apiAdjustMaterialStock(matId, action, qty, reason);
            toast("Stock updated", "success");
            closeStockModal();
            renderAll();
        }catch(err){
            toast(err.message || "Stock update failed", "error");
        }
    });

    // purchase total auto calc
    function calcTotal(){
        const qty = Number($("purQty").value||0);
        const up = Number($("purUnitPrice").value||0);
        $("purTotal").value = (qty * up).toFixed(2);
    }
    $("purQty").addEventListener("input", calcTotal);
    $("purUnitPrice").addEventListener("input", calcTotal);

    $("purSupplierId").addEventListener("change", (e) => {
        renderFilteredMaterialOptions(e.target.value);
    });

    // purchase save
    $("purchaseForm").addEventListener("submit", async (e)=>{
        e.preventDefault();

        const payload = {
            date: $("purDate").value || todayISO(),
            invoice: $("purInvoice").value.trim(),
            supplierId: $("purSupplierId").value,
            materialId: $("purMaterialId").value,
            qty: Number($("purQty").value),
            unitPrice: Number($("purUnitPrice").value),
            total: Number($("purTotal").value),
            notes: $("purNotes").value.trim(),
        };

        if (MODE === "DEMO") {
            payload.id = genId("PCH");
        }

        if(!payload.invoice || !payload.supplierId || !payload.materialId){
            toast("Fill required purchase fields", "error"); return;
        }
        if(!payload.qty || payload.qty <= 0){
            toast("Qty must be > 0", "error"); return;
        }
        if(payload.unitPrice < 0 || payload.total < 0){
            toast("Negative values not allowed", "error"); return;
        }

        // invoice duplicate check (only in DEMO mode or as a client-side hint)
        if(MODE === "DEMO" && state.purchases.some(p=>p.invoice.toLowerCase()===payload.invoice.toLowerCase())){
            toast("Invoice already exists", "error"); return;
        }

        try{
            await apiCreatePurchase(payload);
            toast("Purchase recorded", "success");
            closePurchaseModal();
            setTab("purchases");
            renderAll();
        }catch(err){
            toast(err.message || "Purchase save failed", "error");
        }
    });

    // filters
    ["supplierSearch","supplierStatusFilter"].forEach(id=>$(id).addEventListener("input", renderSuppliers));
    ["materialSearch","materialFilter"].forEach(id=>$(id).addEventListener("input", renderMaterials));



    // Transfer Modal Events
    $("btnCloseTransfer").addEventListener("click", closeTransferModal);
    $("btnCancelTransfer").addEventListener("click", closeTransferModal);
    $("transferWorkflowForm").addEventListener("submit", async (e) => {
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
        } catch(err) {
            toast(err.message, "error");
        }
    });

    // Notification UI events
    $("notifBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        $("notifPanel").classList.toggle("open");
    });
    $("btnCloseNotif").addEventListener("click", () => {
        $("notifPanel").classList.remove("open");
    });
    document.addEventListener("click", (e) => {
        if(!$("notifPanel").contains(e.target) && e.target.id !== "notifBtn"){
            $("notifPanel").classList.remove("open");
        }
    });
}

// expose inline functions
window.openSupplierModal = openSupplierModal;
window.openMaterialModal = openMaterialModal;
window.openStockModal = openStockModal;
window.openTransferModal = openTransferModal;
window.deleteSupplier = deleteSupplier;
window.deleteMaterial = deleteMaterial;
window.deletePurchase = deletePurchase;
window.markNotifAsRead = markNotifAsRead;

/**************** INIT ****************/
async function init(){
    await hydrate();
    wireEvents();
    setTab("suppliers");
    await fetchNotifications();
    renderAll();
}
init();
