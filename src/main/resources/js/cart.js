let STOCK = {}; // Map of productId -> stockQty

async function loadCurrentStock() {
    try {
        const res = await fetch("/api/products");
        const data = await res.json();
        data.forEach(p => {
            STOCK[p.id] = p.stockQty;
        });
    } catch (e) {
        console.error("Cart: failed to reload stock", e);
    }
}

let cart = [];
try {
    const raw = localStorage.getItem("zeefashion_cart");
    if(raw) cart = JSON.parse(raw);
} catch(e) {}

let selectedMethod = "COD"; // COD or BANK
let appliedCoupon = null; // { code, rate, min }

/* ======================== RENDER ======================== */
async function renderCart() {
    await loadCurrentStock();
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    if(!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        emptyCart?.classList.add('show');
        document.getElementById('checkoutBtn').disabled = true;
        document.getElementById('cartCount').textContent = 0;
        document.getElementById('itemCount').textContent = 0;
        document.getElementById('summaryCount').textContent = 0;
        updateSummary();
        return;
    }

    emptyCart?.classList.remove('show');
    document.getElementById('checkoutBtn').disabled = false;

    document.getElementById('cartCount').textContent = cart.length;
    document.getElementById('itemCount').textContent = cart.length;
    document.getElementById('summaryCount').textContent = cart.length;

    cart.forEach((item) => {
        const stock = STOCK[item.id] ?? 0;

        const stockLabel = stock === 0
            ? `<span class="stock-badge out">Out of Stock</span>`
            : (stock <= 5
                ? `<span class="stock-badge low">Only ${stock} left</span>`
                : `<span class="stock-badge in">In Stock</span>`);

        const itemTotal = (item.pricePerM * item.qty).toFixed(2);

        const div = document.createElement('div');
        div.className = 'cart-item';
        const imageContent = item.imageUrl ? 
            `<img src="${item.imageUrl}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" onerror="this.parentElement.innerHTML='<span class=\'fabric-icon\'>${item.icon}</span>';">` : 
            `<span class="fabric-icon">${item.icon}</span>`;

        div.innerHTML = `
      <div class="item-img ${item.imgClass}">${imageContent}</div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-tags">
          <span class="tag">🎨 ${item.color}</span>
          <span class="tag">📐 ${item.size}</span>
          <span class="tag">🧵 ${item.fabric}</span>
          ${stockLabel}
        </div>
        <div class="item-price-unit">Rs. ${item.pricePerM.toLocaleString()}.00 / meter</div>
        <div class="stock-warning ${item.qty > stock ? 'show' : ''}">⚠ Only ${stock} meters available</div>
      </div>
      <div class="item-controls">
        <div class="item-total">Rs. ${parseFloat(itemTotal).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
          <div class="qty-display">${item.qty}</div>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)" ${item.qty >= stock ? 'disabled' : ''}>+</button>
        </div>
        <button class="remove-btn" onclick="removeItem('${item.id}')">✕ Remove</button>
      </div>
    `;
        container.appendChild(div);
    });

    updateSummary();
}

/* ======================== SUMMARY ======================== */
function updateSummary() {
    const subtotal = cart.reduce((s, i) => s + i.pricePerM * i.qty, 0);
    const shipping = cart.length === 0 ? 0 : 350;
    const tax = subtotal * 0.08;

    // Manual Coupon Logic
    let discAmt = 0;
    const grossTotal = subtotal + shipping + tax;
    if (appliedCoupon) {
        if (grossTotal >= appliedCoupon.min) {
            discAmt = subtotal * appliedCoupon.rate;
        } else {
            appliedCoupon = null;
            showToast("Coupon removed: total bill must be above Rs. " + appliedCoupon.min.toLocaleString(), "error");
        }
    }

    const total = subtotal + shipping + tax - discAmt;

    const countEl = document.getElementById('summaryCount');
    if(countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);

    const subEl = document.getElementById('subtotal');
    if(subEl) subEl.textContent = `Rs. ${subtotal.toLocaleString(undefined,{minimumFractionDigits:2})}`;
    
    const shipEl = document.getElementById('shippingFee');
    if(shipEl) shipEl.textContent = `Rs. ${shipping.toFixed(2)}`;
    
    const taxEl = document.getElementById('taxAmount');
    if(taxEl) taxEl.textContent = `Rs. ${tax.toFixed(2)}`;
    
    const totEl = document.getElementById('totalAmount');
    if(totEl) totEl.textContent = `Rs. ${total.toLocaleString(undefined,{minimumFractionDigits:2})}`;
    
    const miniTot = document.getElementById('miniTotal');
    if(miniTot) miniTot.textContent = `Rs. ${total.toLocaleString(undefined,{minimumFractionDigits:2})}`;

    const miniItems = document.getElementById('miniItems');
    if (miniItems) {
        miniItems.innerHTML = cart.map(i => `
            <div class="mini-summary-row">
                <span>${i.name} × ${i.qty}</span>
                <span>Rs. ${(i.pricePerM * i.qty).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
            </div>
        `).join('');
    }
}

function applyCoupon() {
    const input = document.getElementById('couponInput');
    const code = input.value.trim().toUpperCase();
    const subtotal = cart.reduce((s, i) => s + i.pricePerM * i.qty, 0);

    let coupon = null;
    if (code === 'TEXTILE10') coupon = { code, rate: 0.10, min: 25000 };
    else if (code === 'TEXTILE20') coupon = { code, rate: 0.20, min: 70000 };
    else if (code === 'TEXTILE50') coupon = { code, rate: 0.50, min: 170000 };

    if (!coupon) {
        showToast("Invalid coupon code", "error");
        return;
    }

    const shipping = cart.length === 0 ? 0 : 350;
    const tax = subtotal * 0.08;
    const grossTotal = subtotal + shipping + tax;

    if (grossTotal < coupon.min) {
        showToast(`Total Bill must be above Rs. ${coupon.min.toLocaleString()} for this discount`, "error");
        return;
    }

    appliedCoupon = coupon;
    input.value = "";
    showToast(`✓ Coupon ${code} applied successfully!`, "success");
    updateSummary();
}

/* ======================== CART ACTIONS ======================== */
function updateQty(id, delta) {
    const item = cart.find(i => i.id == id);
    if (!item) return;

    const stock = STOCK[id] ?? 99;
    const newQty = item.qty + delta;

    if (newQty < 1) return;
    if (newQty > stock) {
        showToast(`⚠ Only ${stock} meters available for ${item.name}`, 'error');
        return;
    }

    item.qty = newQty;
    localStorage.setItem("zeefashion_cart", JSON.stringify(cart));
    renderCart();
    showToast('Cart updated', 'success');
}

function removeItem(id) {
    const item = cart.find(i => i.id == id);
    cart = cart.filter(i => i.id != id);
    localStorage.setItem("zeefashion_cart", JSON.stringify(cart));
    renderCart();
    showToast(`${item?.name || 'Item'} removed`, 'success');
}

function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    localStorage.removeItem("zeefashion_cart");
    renderCart();
    showToast('Cart cleared', 'success');
}

/* ======================== PAYMENT UI ======================== */
function openPayment() {
    if (cart.length === 0) return;
    updateSummary();
    document.getElementById('paymentModal').classList.add('open');
}

function closePayment() {
    document.getElementById('paymentModal').classList.remove('open');
    document.getElementById('paymentFormContent').classList.remove('hide');
    document.getElementById('processingScreen').classList.remove('show');
    document.getElementById('resultScreen').classList.remove('show');
}

function switchPay(method, btn) {
    selectedMethod = method;
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('tab-cod').style.display  = (method === "COD")  ? "block" : "none";
    document.getElementById('tab-bank').style.display = (method === "BANK") ? "block" : "none";
}

/* ========================
   PLACE ORDER (Option 1)
   - COD: order confirmed (payment pending)
   - BANK: order NOT confirmed until slip verified by admin
======================== */
async function placeOrder() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();
    const phone     = document.getElementById('phone').value.trim();
    const address   = document.getElementById('address').value.trim();

    if (!firstName || !email || !address) {
        showToast('Please fill in shipping details', 'error');
        return;
    }

    if (selectedMethod === "BANK") {
        const f = document.getElementById('slipFile').files[0];
        if (!f) {
            showToast('Please upload bank slip/proof', 'error');
            return;
        }
    }

    document.getElementById('paymentFormContent').classList.add('hide');
    document.getElementById('processingScreen').classList.add('show');

    try {
        const uStr = localStorage.getItem("zeefashion_user");
        const user = uStr ? JSON.parse(uStr) : {};

        const payload = {
          customerName: `${firstName} ${lastName}`,
          customerPhone: phone || "0000000000",
          customerAddress: address,
          customerEmail: user.email || email, // Fallback to provided email if any
          paymentMethod: selectedMethod,
          items: cart.map(i => ({ productId: i.id, quantity: i.qty }))
        };

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Order failed');
        }

        const data = await res.json(); // { id, totalAmount, ... }

        if (selectedMethod === "BANK") {
          const file = document.getElementById('slipFile').files[0];
          const fd = new FormData();
          fd.append("file", file);

          const up = await fetch(`/api/orders/${data.id}/payment-slip`, {
            method: "POST",
            body: fd
          });
          if (!up.ok) throw new Error("Payment slip upload failed");
        }

        showResult(data.id);

    } catch (e) {
        document.getElementById('processingScreen').classList.remove('show');
        document.getElementById('paymentFormContent').classList.remove('hide');
        showToast(e.message || 'Order failed', 'error');
    }
}

let currentOrderId = null;

function showResult(orderId) {
    currentOrderId = orderId;
    document.getElementById('processingScreen').classList.remove('show');
    document.getElementById('orderIdBadge').textContent = `ORDER #${orderId}`;

    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const msg = document.getElementById('resultMsg');
    const note = document.getElementById('resultNote');

    icon.textContent = "✅";
    title.style.color = "var(--green)";

    if (selectedMethod === "COD") {
        title.textContent = "Order Confirmed!";
        msg.innerHTML = "Cash on Delivery selected. Please pay when the order arrives.";
        note.textContent = "Your order will be processed immediately.";
    } else {
        title.textContent = "Order Placed!";
        msg.innerHTML = "Bank Transfer selected. Your order is <strong>NOT confirmed</strong> until admin verifies your slip.";
        note.textContent = "After verification, your order will be confirmed.";
    }

    document.getElementById('resultScreen').classList.add('show');

    // Clear cart after placing order
    cart = [];
    localStorage.removeItem("zeefashion_cart");
    renderCart();

    showToast('Order placed successfully', 'success');
}

/* ======================== FEEDBACK ======================== */
function openFeedback() {
    closePayment();
    document.getElementById('feedbackModal').classList.add('open');
}

function closeFeedback() {
    document.getElementById('feedbackModal').classList.remove('open');
}

async function submitFeedback(e) {
    e.preventDefault();
    const rating = document.getElementById('fbRating').value;
    const text = document.getElementById('fbText').value.trim();
    
    if(!text) return;
    
    // Get logged in user if any
    const uStr = localStorage.getItem('zeefashion_user');
    const user = uStr ? JSON.parse(uStr) : { name: "Guest Customer" };
    
    const payload = {
        orderId: currentOrderId ? currentOrderId.toString() : "N/A",
        customer: user.name,
        rating: parseInt(rating),
        review: text,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING'
    };

    try {
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error("Failed to submit feedback");
        
        closeFeedback();
        showToast('Thank you for your feedback (saved to database)!', 'success');
        document.getElementById('fbText').value = '';
    } catch(err) {
        showToast(err.message, 'error');
    }
}

/* ======================== TOAST ======================== */
function showToast(msg, type='') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* INIT */
renderCart();
