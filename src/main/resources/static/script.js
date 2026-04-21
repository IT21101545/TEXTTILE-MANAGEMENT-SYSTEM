const API = '';

let orders = [];
let customers = [];

async function parseError(res) {
    try {
        const j = await res.json();
        return j.error || res.statusText;
    } catch {
        return res.statusText;
    }
}

async function loadOrders() {
    const res = await fetch(`${API}/api/orders`);
    if (!res.ok) throw new Error(await parseError(res));
    orders = await res.json();
}

async function loadCustomers() {
    const res = await fetch(`${API}/api/customers`);
    if (!res.ok) throw new Error(await parseError(res));
    customers = await res.json();
}

async function loadStats() {
    const res = await fetch(`${API}/api/stats`);
    if (!res.ok) throw new Error(await parseError(res));
    const s = await res.json();
    const statsVals = document.querySelectorAll('.stat-value');
    if (statsVals.length >= 4) {
        statsVals[0].textContent = s.totalOrders;
        statsVals[1].textContent = s.completedOrders;
        statsVals[2].textContent = s.pendingOrders;
        statsVals[3].textContent = s.totalCustomers;
    }
}

function fillCustomerDropdown() {
    const sel = document.getElementById('new-order-customer');
    if (!sel) return;
    const keep = sel.querySelector('option[value=""]');
    sel.innerHTML = '';
    if (keep) sel.appendChild(keep);
    customers.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = String(c.customerID);
        opt.textContent = c.fullName || '';
        sel.appendChild(opt);
    });
}

function splitName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/);
    return { fname: parts[0] || '', lname: parts.slice(1).join(' ') || '' };
}

function initialsFromName(fullName) {
    const { fname, lname } = splitName(fullName);
    const a = (fname[0] || '').toUpperCase();
    const b = (lname[0] || '').toUpperCase();
    return (a + b) || '?';
}

const avatarClasses = ['av-1', 'av-2', 'av-3', 'av-4', 'av-5', 'av-6'];

function renderOrders(data) {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = data.map((o) => {
        const totalNum = typeof o.total === 'number' ? o.total : parseFloat(o.total);
        const safeTotal = Number.isFinite(totalNum) ? totalNum : 0;
        const statusClass = (o.status || '').toLowerCase().replace(/\s+/g, '-');
        return `
    <tr>
      <td><strong style="color:var(--gold)">${o.displayId || ('ORD-' + String(o.id).padStart(6, '0'))}</strong></td>
      <td>
        <div style="font-weight:500">${escapeHtml(o.customer)}</div>
        <div style="font-size:0.74rem;color:var(--text-muted)">${escapeHtml(o.phone || '')}</div>
      </td>
      <td>
        <div>${escapeHtml(o.items)}</div>
        <div style="font-size:0.74rem;color:var(--text-muted)">Qty: ${o.qty}</div>
      </td>
      <td class="amount-green">Rs. ${safeTotal.toLocaleString()}</td>
      <td><span class="status status-${statusClass}">● ${escapeHtml(o.status)}</span></td>
      <td>${escapeHtml(o.date || '')}</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn"        title="View"   onclick="viewOrder(${o.id})">👁</button>
          <button class="icon-btn edit"   title="Edit"   onclick="editOrder(${o.id})">✏️</button>
          <button class="icon-btn delete" title="Delete" onclick="deleteOrder(${o.id})">🗑</button>
        </div>
      </td>
    </tr>`;
    }).join('');
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderCustomers(data) {
    const grid = document.getElementById('customers-grid');
    grid.innerHTML = data.map((c, idx) => {
        const { fname, lname } = splitName(c.fullName);
        const initials = initialsFromName(c.fullName);
        const av = avatarClasses[idx % avatarClasses.length];
        const spend = typeof c.totalSpend === 'number' ? c.totalSpend : 0;
        return `
    <div class="customer-card">
      <div class="cust-top">
        <div class="cust-avatar ${av}">${escapeHtml(initials)}</div>
        <div>
          <div class="cust-name">${escapeHtml(fname)} ${escapeHtml(lname)}</div>
          <div class="cust-email">${escapeHtml(c.email || '')}</div>
        </div>
      </div>
      <div class="cust-stats">
        <div class="cust-stat">
          <div class="cust-stat-label">TOTAL ORDERS</div>
          <div class="cust-stat-value">${c.orderCount}</div>
        </div>
        <div class="cust-stat">
          <div class="cust-stat-label">TOTAL SPEND</div>
          <div class="cust-stat-value amount-green">Rs. ${spend.toLocaleString()}</div>
        </div>
      </div>
      <div class="cust-info">
        <span>📞 ${escapeHtml(c.phone || '')}</span>
        <span>📍 ${escapeHtml(c.city || '')}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" style="flex:1" onclick='viewCustomerOrders(${JSON.stringify(c.fullName || "")})'>View Orders (${c.orderCount})</button>
        <button class="icon-btn delete" title="Delete" onclick="deleteCustomer(${c.customerID})">🗑</button>
      </div>
    </div>`;
    }).join('');
}

function switchTab(tab, btn) {
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.getElementById('panel-' + tab).classList.add('active');
    btn.classList.add('active');
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

async function createOrder() {
    const customerId = document.getElementById('new-order-customer').value;
    const status = document.getElementById('new-order-status').value;
    const product = document.getElementById('new-order-product').value;
    const qty = parseInt(document.getElementById('new-order-qty').value, 10) || 1;
    const amount = parseFloat(document.getElementById('new-order-amount').value) || 0;
    const delivery = document.getElementById('new-order-date').value;
    const notes = document.getElementById('new-order-notes').value.trim();
    const orderDate = new Date().toISOString().split('T')[0];

    if (!customerId) {
        alert('Please select a customer.');
        return;
    }

    const body = {
        customerID: parseInt(customerId, 10),
        productDescription: product,
        quantity: qty,
        totalAmount: amount,
        status: status,
        orderDate: orderDate,
        deliveryDate: delivery || null,
        notes: notes || null,
    };

    const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        alert(await parseError(res));
        return;
    }

    closeModal('modal-new-order');
    await refreshData();
}

async function addCustomer() {
    const fname = document.getElementById('cust-fname').value.trim();
    const lname = document.getElementById('cust-lname').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const city = document.getElementById('cust-city').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    if (!fname || !lname) {
        alert('Please enter customer name.');
        return;
    }

    const fullName = `${fname} ${lname}`.trim();
    const body = {
        fullName: fullName,
        email: email || null,
        phone: phone || null,
        city: city || null,
        address: address || null,
    };

    const res = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        alert(await parseError(res));
        return;
    }

    closeModal('modal-new-customer');
    ['cust-fname', 'cust-lname', 'cust-email', 'cust-phone', 'cust-city', 'cust-address'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    await refreshData();
}

function viewOrder(orderId) {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const totalNum = typeof o.total === 'number' ? o.total : parseFloat(o.total);
    const safeTotal = Number.isFinite(totalNum) ? totalNum : 0;
    document.getElementById('view-order-title').textContent = `Order ${o.displayId || o.id}`;
    document.getElementById('view-order-content').innerHTML = `
    <div class="order-detail-row"><span>Customer</span><span>${escapeHtml(o.customer)}</span></div>
    <div class="order-detail-row"><span>Phone</span><span>${escapeHtml(o.phone || '')}</span></div>
    <div class="order-detail-row"><span>Items</span><span>${escapeHtml(o.items)}</span></div>
    <div class="order-detail-row"><span>Quantity</span><span>${o.qty}</span></div>
    <div class="order-detail-row"><span>Total Amount</span><span class="amount-green">Rs. ${safeTotal.toLocaleString()}</span></div>
    <div class="order-detail-row"><span>Status</span><span><span class="status status-${(o.status || '').toLowerCase().replace(/\s+/g, '-')}">● ${escapeHtml(o.status)}</span></span></div>
    <div class="order-detail-row"><span>Date</span><span>${escapeHtml(o.date || '')}</span></div>
  `;
    openModal('modal-view-order');
}

function editOrder(orderId) {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    document.getElementById('edit-order-idx').value = String(o.id);
    document.getElementById('edit-order-customer').value = o.customer;
    document.getElementById('edit-order-status').value = o.status;
    const totalNum = typeof o.total === 'number' ? o.total : parseFloat(o.total);
    document.getElementById('edit-order-amount').value = Number.isFinite(totalNum) ? totalNum : '';
    openModal('modal-edit-order');
}

async function saveEditOrder() {
    const id = parseInt(document.getElementById('edit-order-idx').value, 10);
    const status = document.getElementById('edit-order-status').value;
    const total = parseFloat(document.getElementById('edit-order-amount').value);
    const body = { status: status };
    if (Number.isFinite(total)) body.totalAmount = total;
    const res = await fetch(`${API}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        alert(await parseError(res));
        return;
    }
    closeModal('modal-edit-order');
    await refreshData();
}

async function deleteOrder(orderId) {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    if (!confirm('Delete order ' + (o.displayId || orderId) + '?')) return;
    const res = await fetch(`${API}/api/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) {
        alert(await parseError(res));
        return;
    }
    await refreshData();
}

async function deleteCustomer(customerID) {
    const c = customers.find((x) => x.customerID === customerID);
    if (!c) return;
    if (!confirm('Delete customer ' + (c.fullName || '') + '?')) return;
    const res = await fetch(`${API}/api/customers/${customerID}`, { method: 'DELETE' });
    if (!res.ok) {
        alert(await parseError(res));
        return;
    }
    await refreshData();
}

function viewCustomerOrders(name) {
    const custOrders = orders.filter((o) => o.customer === name);
    document.getElementById('view-order-title').textContent = name + "'s Orders";
    document.getElementById('view-order-content').innerHTML = custOrders.length
        ? custOrders
              .map((o) => {
                  const totalNum = typeof o.total === 'number' ? o.total : parseFloat(o.total);
                  const safeTotal = Number.isFinite(totalNum) ? totalNum : 0;
                  return `
        <div class="order-detail-row">
          <span><strong style="color:var(--gold)">${escapeHtml(o.displayId || o.id)}</strong> — ${escapeHtml(o.items)} (x${o.qty})</span>
          <span><span class="status status-${(o.status || '').toLowerCase().replace(/\s+/g, '-')}">● ${escapeHtml(o.status)}</span></span>
        </div>
        <div class="order-detail-row">
          <span>Amount</span>
          <span class="amount-green">Rs. ${safeTotal.toLocaleString()}</span>
        </div>`;
              })
              .join('')
        : '<p style="color:var(--text-muted);text-align:center;padding:20px">No orders found for this customer.</p>';
    openModal('modal-view-order');
}

function filterOrders(val) {
    const q = val.toLowerCase();
    const filtered = orders.filter(
        (o) =>
            String(o.displayId || '').toLowerCase().includes(q) ||
            String(o.id).includes(q) ||
            (o.customer || '').toLowerCase().includes(q) ||
            (o.items || '').toLowerCase().includes(q)
    );
    renderOrders(filtered);
}

function filterOrdersByStatus(val) {
    const filtered = val ? orders.filter((o) => (o.status || '').toLowerCase() === val.toLowerCase()) : orders;
    renderOrders(filtered);
}

function filterCustomers(val) {
    const q = val.toLowerCase();
    const filtered = customers.filter(
        (c) =>
            (c.fullName || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.city || '').toLowerCase().includes(q)
    );
    renderCustomers(filtered);
}

async function refreshData() {
    try {
        await loadOrders();
        await loadCustomers();
        await loadStats();
        fillCustomerDropdown();
        renderOrders(orders);
        renderCustomers(customers);
    } catch (e) {
        console.error(e);
        alert('Could not load data: ' + (e.message || e));
    }
}

const now = new Date();
document.getElementById('date-display').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 3);
const nd = document.getElementById('new-order-date');
if (nd && typeof nd.valueAsDate !== 'undefined') {
    nd.valueAsDate = tomorrow;
}

refreshData();
