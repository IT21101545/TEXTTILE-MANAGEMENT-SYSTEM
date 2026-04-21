function escapeHtml(s) {
    if (!s) return "";
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

let PRODUCT_CATALOG = [];

const CATEGORY_MAP = {
    'Cotton': { icon: '🧶', imgClass: 'fabric-1' },
    'Silk': { icon: '✨', imgClass: 'fabric-2' },
    'Linen': { icon: '🌿', imgClass: 'fabric-3' },
    'Velvet': { icon: '🧵', imgClass: 'fabric-4' },
    'Saree': { icon: '👘', imgClass: 'fabric-5' },
    'Shirt': { icon: '👕', imgClass: 'fabric-6' },
    'Trouser': { icon: '👖', imgClass: 'fabric-5' },
    'Default': { icon: '📦', imgClass: 'fabric-1' }
};

document.addEventListener("DOMContentLoaded", async () => {
    await fetchProducts();
    updateCartBadge();
    initNotifications();
    
    document.getElementById("catalogSearch")?.addEventListener("input", filterProducts);
    document.getElementById("catalogCategory")?.addEventListener("change", filterProducts);
});

/* ======================== NOTIFICATION SYSTEM ======================== */
async function initNotifications() {
    const uStr = localStorage.getItem("zeefashion_user");
    if (!uStr) return;
    const user = JSON.parse(uStr);
    
    const notifBtn = document.getElementById("notifBtn");
    const notifPanel = document.getElementById("notifPanel");
    
    if (!notifBtn || !notifPanel) return;

    // Toggle Panel
    notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle("open");
    });

    // Close on outside click
    document.addEventListener("click", () => {
        notifPanel.classList.remove("open");
    });
    notifPanel.addEventListener("click", (e) => e.stopPropagation());

    // Initial fetch
    await fetchCustomerNotifications(user.email);
    
    // Refresh every 30 seconds
    setInterval(() => fetchCustomerNotifications(user.email), 30000);
}

async function fetchCustomerNotifications(email) {
    if (!email) return;
    try {
        const res = await fetch(`/api/notifications/customer?email=${encodeURIComponent(email)}`);
        if (!res.ok) return;
        const data = await res.json();
        renderNotifList(data);
    } catch (err) {
        console.warn("Failed to fetch notifications", err);
    }
}

function renderNotifList(list) {
    const badge = document.getElementById("notifBadge");
    const container = document.getElementById("notifList");
    if (!container || !badge) return;

    if (list.length > 0) {
        badge.innerText = list.length;
        badge.style.display = "flex";
        
        container.innerHTML = list.map(n => {
            let timeStr = "Recently";
            if (n.createdAt) {
                const date = new Date(n.createdAt);
                timeStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            return `
                <div class="notif-item" onclick="markNotifRead(${n.id}, this)">
                    <div class="notif-msg">${escapeHtml(n.message)}</div>
                    <div class="notif-time">${timeStr}</div>
                </div>
            `;
        }).join("");
    } else {
        badge.style.display = "none";
        container.innerHTML = `<div class="notif-empty">No new notifications</div>`;
    }
}

async function markNotifRead(id, el) {
    try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        if (res.ok) {
            el.style.opacity = "0.5";
            el.style.pointerEvents = "none";
            // Refresh counts in background
            const uStr = localStorage.getItem("zeefashion_user");
            if (uStr) fetchCustomerNotifications(JSON.parse(uStr).email);
        }
    } catch (err) {
        console.error("Failed to mark as read", err);
    }
}

async function fetchProducts() {
    try {
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/products?t=${timestamp}`);
        if(!res.ok) throw new Error("API Connection Error");
        const data = await res.json();

        PRODUCT_CATALOG = data;
        
        populateCategories(data);
        renderProducts(PRODUCT_CATALOG);
    } catch (err) {
        console.error("Failed to fetch products:", err);
        const grid = document.getElementById("productGrid");
        if(grid) grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--muted);">Unable to load catalog. Please refresh.</div>`;
    }
}

function populateCategories(catalog) {
    const catSelect = document.getElementById("catalogCategory");
    if (!catSelect) return;

    // Get unique categories from data
    const categories = [...new Set(catalog.map(p => p.category).filter(Boolean))].sort();
    
    // Preserve "All Fabrics" and the current selection if possible
    const currentVal = catSelect.value;
    catSelect.innerHTML = '<option value="all">All Fabrics</option>';
    
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    });

    // Restore selection if it still exists
    if (categories.includes(currentVal)) {
        catSelect.value = currentVal;
    }
}

function filterProducts() {
    const q = document.getElementById("catalogSearch")?.value?.toLowerCase() || "";
    const cat = document.getElementById("catalogCategory")?.value?.toLowerCase() || "all";

    const filtered = PRODUCT_CATALOG.filter(p => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        
        const matchName = name.includes(q) || desc.includes(q);
        const matchCat = cat === "all" || pCat === cat;
        return matchName && matchCat;
    });

    renderProducts(filtered);
}

function renderProducts(catalog) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    
    // Add a tiny delay to ensure DOM stability
    setTimeout(() => {
        grid.innerHTML = "";

        if (!catalog || catalog.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--muted);">No fabrics found matching filters.</div>`;
            return;
        }

        catalog.forEach(p => {
            try {
                const meta = CATEGORY_MAP[p.category] || CATEGORY_MAP['Default'];
                const inStock = (p.stockQty ?? 0) > 0;
                const q = p.stockQty ?? 0;
                const stockLabel = inStock ? 
                    `<span style="color:#10B981; font-weight:600; font-size:0.85rem;">In Stock (${q}m)</span>` : 
                    `<span style="color:#EF4444; font-weight:600; font-size:0.85rem;">Out of Stock</span>`;

                const card = document.createElement("div");
                card.className = "product-card";
                
                // Use standard img tag for robust Base64 rendering
                let imageHtml = "";
                if (p.imageUrl && p.imageUrl.trim().length > 15) {
                    imageHtml = `<img src="${p.imageUrl}" class="rendered-image" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    imageHtml = `<div class="fallback-icon" style="display:flex; width:100%; height:100%; align-items:center; justify-content:center;">${meta.icon}</div>`;
                }

                card.innerHTML = `
                    <div class="product-image ${meta.imgClass}">${imageHtml}</div>
                    <div class="product-info">
                        <div class="product-category">${escapeHtml(p.category)}</div>
                        <h3 class="product-name">${escapeHtml(p.name)}</h3>
                        <p class="product-meta">${escapeHtml(p.description || "Premium fabric quality.")}</p>
                        <div style="margin-top:10px;">${stockLabel}</div>
                        <div class="product-footer">
                            <div class="product-price">Rs. ${parseFloat(p.price || 0).toLocaleString(undefined, {minimumFractionDigits:2})}/m</div>
                            <div style="display:flex; gap:8px;">
                                <button class="btn-add" style="background:var(--border); color:var(--text);" onclick="openProductModal('${p.id}')">
                                    View
                                </button>
                                <button class="btn-add" onclick="addToCart('${p.id}')" ${!inStock ? 'disabled' : ''}>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            } catch (cardErr) {
                console.error("Card rendering error:", cardErr, p);
            }
        });
    }, 10);
}

function addToCart(id) {
    const product = PRODUCT_CATALOG.find(p => p.id == id);
    if (!product || (product.stockQty ?? 0) <= 0) return;
    const meta = CATEGORY_MAP[product.category] || CATEGORY_MAP['Default'];

    const cartStr = localStorage.getItem("zeefashion_cart");
    let cart = cartStr ? JSON.parse(cartStr) : [];

    const existingItem = cart.find(i => i.id == id);
    if (existingItem) {
        if (existingItem.qty >= product.stockQty) {
            toast(`Only ${product.stockQty}m available for ${product.name}`, "error");
            return;
        }
        existingItem.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            color: 'Default',
            size: 'N/A',
            fabric: product.category,
            pricePerM: product.price,
            qty: 1,
            imgClass: meta.imgClass,
            icon: meta.icon,
            imageUrl: product.imageUrl
        });
    }

    localStorage.setItem("zeefashion_cart", JSON.stringify(cart));
    updateCartBadge();
    toast(`${product.name} added to cart!`, "success");
}

function updateCartBadge() {
    const cartStr = localStorage.getItem("zeefashion_cart");
    let cart = cartStr ? JSON.parse(cartStr) : [];
    const badge = document.getElementById("cartCount");
    if (badge) badge.innerText = cart.length;
}

function toast(msg, type=""){
    const t = document.getElementById("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ======================== PRODUCT MODAL & FEEDBACK ======================== */
let currentViewProductId = null;

async function openProductModal(id) {
    currentViewProductId = id;
    
    // Show modal instantly with cached data first
    const cached = PRODUCT_CATALOG.find(p => p.id == id);
    if(cached) renderModalContent(cached);

    // Fetch FRESH data from API for absolute accuracy
    try {
        const res = await fetch(`/api/products/${id}?t=${new Date().getTime()}`);
        if(res.ok) {
            const fresh = await res.json();
            renderModalContent(fresh);
            // also update catalog in background
            const idx = PRODUCT_CATALOG.findIndex(p => p.id == id);
            if(idx !== -1) PRODUCT_CATALOG[idx] = fresh;
        }
    } catch(err) {
        console.warn("Failed to fetch fresh product details", err);
    }

    document.getElementById("productModal").classList.add("open");
}

function renderModalContent(product) {
    const meta = CATEGORY_MAP[product.category] || CATEGORY_MAP['Default'];
    const inStock = (product.stockQty ?? 0) > 0;
    const q = product.stockQty ?? 0;
    const stockLabel = inStock ? 
        `<span style="color:#10B981; font-weight:600;">In Stock (${q}m)</span>` : 
        `<span style="color:#EF4444; font-weight:600;">Out of Stock</span>`;

    // Fill Product Info
    document.getElementById("modalProductName").innerText = product.name;
    document.getElementById("modalProductCategory").innerText = product.category;
    document.getElementById("modalProductDescription").innerText = product.description || "Premium fabric quality, perfect for various fashion applications.";
    document.getElementById("modalProductPrice").innerText = `Rs. ${parseFloat(product.price || 0).toLocaleString(undefined, {minimumFractionDigits:2})}/m`;
    document.getElementById("modalProductStock").innerHTML = stockLabel;
    
    // Set Image
    const imgContainer = document.getElementById("modalProductImage");
    if (product.imageUrl && product.imageUrl.trim().length > 15) {
        imgContainer.innerHTML = `<img src="${product.imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
    } else {
        imgContainer.innerHTML = `<div style="font-size:6rem;">${meta.icon}</div>`;
    }

    // Modal Add Button
    const addBtn = document.getElementById("modalAddBtn");
    addBtn.disabled = !inStock;
    addBtn.onclick = () => addToCart(product.id);

    // Initial Feedback Load
    renderModalFeedback(product.id);
}

function closeProductModal() {
    document.getElementById("productModal").classList.remove("open");
    currentViewProductId = null;
    document.getElementById("productFeedbackForm").reset();
}

async function renderModalFeedback(productId) {
    const listContainer = document.getElementById("modalFeedbackList");
    if (!listContainer) return;

    try {
        const res = await fetch(`/api/feedback/product/${productId}`);
        const feedbacks = await res.json();

        if (feedbacks.length === 0) {
            listContainer.innerHTML = `<div class="muted" style="text-align:center; padding:20px;">No reviews yet. Be the first to share your thoughts!</div>`;
            return;
        }

        listContainer.innerHTML = feedbacks.map(fb => {
            const stars = "⭐".repeat(fb.rating || 0);
            const date = fb.date || "Just now";
            const replyHtml = fb.reply ? `<div class="fb-reply"><strong>Staff Reply:</strong> ${fb.reply}</div>` : "";

            return `
                <div class="feedback-item">
                    <div class="fb-header">
                        <span class="fb-customer">${escapeHtml(fb.customer)}</span>
                        <span class="fb-date">${date}</span>
                    </div>
                    <div class="fb-rating">${stars}</div>
                    <div class="fb-text">${escapeHtml(fb.review)}</div>
                    ${replyHtml}
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Failed to load feedback:", err);
        listContainer.innerHTML = `<div class="muted">Error loading reviews.</div>`;
    }
}

async function handleProductFeedback(e) {
    e.preventDefault();
    if (!currentViewProductId) return;

    const rating = document.getElementById("fbRating").value;
    const text = document.getElementById("fbText").value.trim();

    if (!text) {
        toast("Please enter a message", "error");
        return;
    }

    // Get user info
    const uStr = localStorage.getItem("zeefashion_user");
    const user = uStr ? JSON.parse(uStr) : { name: "Guest Customer" };

    const payload = {
        productId: parseInt(currentViewProductId),
        customer: user.name,
        email: user.email || null,
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

        if (!res.ok) throw new Error("Submission failed");

        toast("Thank you! Your review has been submitted.", "success");
        document.getElementById("productFeedbackForm").reset();
        
        // Reload feedback list
        renderModalFeedback(currentViewProductId);
    } catch (err) {
        toast("Failed to submit feedback", "error");
    }
}
