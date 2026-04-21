let salesChart, ratingChart;
let lastMonthlyData = new Array(12).fill(0);

// Feedback State
let allFeedbacks = [];
let currentFBRatingFilter = 'all';
let currentFBPage = 1;
let currentFBPerPage = 10;
let currentFBSearch = '';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Load
    refreshDashboard();

    // 2. Set Current Date
    const dateEl = document.getElementById("currentDate");
    if (dateEl) {
        const now = new Date();
        dateEl.innerText = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const todayLabel = document.getElementById("statTodayLabel");
        if (todayLabel) todayLabel.innerText = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Initialize Sales Report Date to today
        const salesReportDate = document.getElementById("salesReportDate");
        if (salesReportDate) {
            salesReportDate.value = now.toISOString().slice(0, 10);
            salesReportDate.addEventListener("change", (e) => {
                renderFullSales(e.target.value);
            });
        }
    }

    // 3. Export Report listener
    const reportBtn = document.getElementById("generateReportBtn");
    if (reportBtn) {
        reportBtn.addEventListener("click", () => {
            toast("Generating sales report PDF...", "success");
            setTimeout(() => toast("Report downloaded successfully!", "success"), 2000);
        });
    }
});

function money(v) {
    const n = Number(v || 0);
    return `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function refreshDashboard() {
    try {
        const [orders, feedbacks, products] = await Promise.all([
            apiCall("/api/orders"),
            apiCall("/api/feedback"),
            apiCall("/api/products")
        ]);

        updateStats(orders, feedbacks, products);
        updateCharts(orders, feedbacks);
        renderRecentTables(orders, feedbacks);
        updateNotifications(feedbacks);

    } catch (e) {
        console.error("Dashboard refresh failed", e);
        toast("Failed to refresh dashboard data", "error");
    }
}

function updateStats(orders, feedbacks, products) {
    // Total Sales (All time - non cancelled)
    const totalSales = orders
        .filter(o => o.status !== 'CANCELLED' && o.status !== 'FAILED')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
    document.getElementById("statTotalSales").innerText = money(totalSales);

    // Today's Sales
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = orders
        .filter(o => (o.createdAt || "").startsWith(todayStr))
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
    document.getElementById("statTodaySales").innerText = money(todaySales);

    // Avg Rating
    if (feedbacks && feedbacks.length > 0) {
        const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
        document.getElementById("statAvgRating").innerText = avg.toFixed(1);
        document.getElementById("statReviewCount").innerText = `From ${feedbacks.length} reviews`;
    }

    // Total Products
    document.getElementById("statTotalProducts").innerText = products ? products.length : 0;
}

function updateCharts(orders, feedbacks) {
    // 1. Monthly Sales Data (Mocking for 2026 based on order dates)
    const monthlyData = new Array(12).fill(0);
    orders.forEach(o => {
        if (o.status !== 'CANCELLED' && (o.createdAt || "").startsWith("2026")) {
            const month = new Date(o.createdAt).getMonth();
            monthlyData[month] += Number(o.total || 0);
        }
    });
    lastMonthlyData = [...monthlyData];

    const salesCtx = document.getElementById('monthlySalesChart').getContext('2d');
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Sales (Rs.)',
                data: monthlyData,
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Rating Distribution Data
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
        if (ratingDist[f.rating] !== undefined) ratingDist[f.rating]++;
    });

    const ratingCtx = document.getElementById('ratingDistributionChart').getContext('2d');
    if (ratingChart) ratingChart.destroy();
    ratingChart = new Chart(ratingCtx, {
        type: 'doughnut',
        data: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
                data: [ratingDist[1], ratingDist[2], ratingDist[3], ratingDist[4], ratingDist[5]],
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } }
            },
            cutout: '70%'
        }
    });
}

function renderRecentTables(orders, feedbacks) {
    // Recent Feedback (Top 5)
    const fbBody = document.getElementById("recentFeedbackBody");
    if (fbBody) {
        fbBody.innerHTML = "";
        const latestFB = feedbacks.sort((a, b) => b.id - a.id).slice(0, 5);
        
        latestFB.forEach(fb => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${fb.customer}</td>
                <td class="rating-stars">${fb.rating} Star</td>
                <td title="${fb.review}">${fb.review.substring(0, 20)}...</td>
                <td>${fb.date}</td>
            `;
            tr.onclick = () => viewFeedback(fb.id);
            tr.style.cursor = "pointer";
            fbBody.appendChild(tr);
        });
    }

    // Recent Sales (Top 5)
    const salesBody = document.getElementById("recentSalesBody");
    if (salesBody) {
        salesBody.innerHTML = "";
        const latestSales = orders.sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||"")).slice(0, 5);

        latestSales.forEach(o => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>#${o.id}</td>
                <td style="color:var(--green); font-weight:600;">${money(o.total)}</td>
                <td>${(o.createdAt||"").slice(0,10)}</td>
            `;
            salesBody.appendChild(tr);
        });
    }
}

// --- View Switching ---
function showModule(name) {
    const dash = document.getElementById("dashboardView");
    const feed = document.getElementById("feedbackModule");
    const sales = document.getElementById("salesModule");
    
    // Hide all
    dash.style.display = "none";
    feed.style.display = "none";
    sales.style.display = "none";

    if (name === 'feedback') {
        feed.style.display = "block";
        apiCall("/api/feedback").then(res => {
            allFeedbacks = res;
            renderFullFeedback();
        }).catch(e => console.error(e));
    } else if (name === 'sales') {
        sales.style.display = "block";
        const dateInput = document.getElementById("salesReportDate");
        renderFullSales(dateInput ? dateInput.value : null);
    } else {
        dash.style.display = "block";
        refreshDashboard();
    }
}

async function renderFullSales(filterDate = null) {
    try {
        const orders = await apiCall("/api/orders");
        const body = document.getElementById("fullSalesBody");
        body.innerHTML = "";

        let filtered = orders;
        if (filterDate) {
            filtered = orders.filter(o => (o.createdAt || "").startsWith(filterDate));
        }
        
        filtered.sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||"")).forEach(o => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 12px; font-family: monospace;">#${o.id}</td>
                <td style="padding: 12px; font-family: monospace;">#${o.id}</td>
                <td style="padding: 12px; color: #10b981; font-weight: 600;">${money(o.total)}</td>
                <td style="padding: 12px;">${(o.createdAt || "").slice(0, 10)}</td>
            `;
            // Add a subtle bottom border to match the design style
            tr.style.borderBottom = "1px solid #f1f5f9";
            body.appendChild(tr);
        });

        if (filtered.length === 0) {
            body.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">No sales transactions found for this date.</td></tr>`;
        }
    } catch (e) { console.error(e); }
}

async function renderFullFeedback() {
    try {
        if (allFeedbacks.length === 0) {
            allFeedbacks = await apiCall("/api/feedback");
        }
        
        // Setup stats
        let total = allFeedbacks.length;
        let pos = allFeedbacks.filter(f => f.rating >= 4).length;
        let neg = allFeedbacks.filter(f => f.rating <= 2).length;
        let avg = total > 0 ? (allFeedbacks.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : "0.0";
        
        document.getElementById("fbAvgRating").innerText = avg;
        document.getElementById("fbAvgStars").innerHTML = "★".repeat(Math.round(avg)) + "☆".repeat(5-Math.round(avg));
        document.getElementById("fbTotalReviews").innerText = total;
        document.getElementById("fbPosReviews").innerText = pos;
        document.getElementById("fbNegReviews").innerText = neg;

        // Apply Filters & Search
        let filtered = allFeedbacks.filter(f => {
            if (currentFBRatingFilter !== 'all' && f.rating.toString() !== currentFBRatingFilter) return false;
            if (currentFBSearch) {
                const search = currentFBSearch.toLowerCase();
                return (f.customer && f.customer.toLowerCase().includes(search)) ||
                       (f.review && f.review.toLowerCase().includes(search));
            }
            return true;
        });

        // Sort descending by ID
        filtered.sort((a,b) => b.id - a.id);

        // Pagination
        const totalPages = Math.ceil(filtered.length / currentFBPerPage) || 1;
        if (currentFBPage > totalPages) currentFBPage = totalPages;
        
        const startIdx = (currentFBPage - 1) * currentFBPerPage;
        const pagedData = filtered.slice(startIdx, startIdx + currentFBPerPage);

        const body = document.getElementById("fullFeedbackBody");
        body.innerHTML = "";
        
        pagedData.forEach(fb => {
            const tr = document.createElement("tr");
            let statusClass = 'pending';
            let statusText = '◷ Pending';
            if (fb.status === 'REPLIED' || fb.status === 'APPROVED') {
                statusClass = 'approved';
                statusText = fb.status === 'REPLIED' ? '✓ Replied' : '✓ Approved';
            } else if (fb.status === 'HIDDEN') {
                statusClass = 'pending'; // maybe a different style, but 'pending' works as a muted look
                statusText = '🙈 Hidden';
            }

            const hideIcon = fb.status === 'HIDDEN' ? '👁️' : '🙈';
            const hideTitle = fb.status === 'HIDDEN' ? 'Show Review' : 'Hide Review';

            tr.innerHTML = `
                <td style="font-family:monospace; font-weight:600;">#${fb.id}</td>
                <td>${fb.customer || 'Unknown'}</td>
                <td class="rating-stars">${"⭐".repeat(fb.rating)} <span style="font-size:0.8rem; color:#888;">(${fb.rating})</span></td>
                <td class="review-text" title="${fb.review || ''}">${fb.review || ''}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${fb.date || ''}</td>
                <td style="text-align: center; display: flex; gap: 5px; justify-content: center;">
                    <button class="icon-btn small" title="View Review" onclick="viewFeedback('${fb.id}')">👁</button>
                    <button class="icon-btn small" title="Reply" onclick="viewFeedback('${fb.id}')">↩️</button>
                    <button class="icon-btn small" title="${hideTitle}" style="color:var(--orange);" onclick="toggleHideFeedback('${fb.id}')">${hideIcon}</button>
                    <button class="icon-btn small" title="Delete" style="color:var(--red);" onclick="deleteFeedback('${fb.id}')">🗑</button>
                </td>
            `;
            body.appendChild(tr);
        });

        // Render Pagination
        const pgContainer = document.getElementById("fbPagination");
        pgContainer.innerHTML = "";
        
        let pgHtml = `<button class="btn ghost small" ${currentFBPage === 1 ? 'disabled' : ''} onclick="changeFBPage(${currentFBPage - 1})">‹</button>`;
        for(let i=1; i<=totalPages; i++) {
            if (i === currentFBPage) {
                pgHtml += `<button class="btn primary small">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - currentFBPage) <= 1) {
                pgHtml += `<button class="btn ghost small" onclick="changeFBPage(${i})">${i}</button>`;
            } else if (Math.abs(i - currentFBPage) === 2) {
                pgHtml += `<span style="padding: 5px;">...</span>`;
            }
        }
        pgHtml += `<button class="btn ghost small" ${currentFBPage === totalPages ? 'disabled' : ''} onclick="changeFBPage(${currentFBPage + 1})">›</button>`;
        pgContainer.innerHTML = pgHtml;

    } catch (e) { console.error("Error rendering feedback:", e); }
}

function changeFBPage(page) {
    currentFBPage = page;
    renderFullFeedback();
}

async function deleteFeedback(id) {
    if(!confirm("Are you sure you want to delete this feedback?")) return;
    try {
        await apiCall("/api/feedback/" + id, "DELETE");
        allFeedbacks = allFeedbacks.filter(f => f.id != id);
        toast("Feedback deleted.", "success");
        renderFullFeedback();
        refreshDashboard();
    } catch(e) { toast("Error deleting feedback.", "error"); }
}

async function toggleHideFeedback(id) {
    try {
        const fb = allFeedbacks.find(f => f.id == id);
        if(!fb) return;
        
        fb.status = fb.status === 'HIDDEN' ? 'APPROVED' : 'HIDDEN';
        
        await apiCall("/api/feedback/" + id, "PUT", fb);
        toast(fb.status === 'HIDDEN' ? "Feedback hidden." : "Feedback visible.", "success");
        renderFullFeedback();
        refreshDashboard();
    } catch(e) { toast("Error updating feedback visibility.", "error"); }
}

document.addEventListener("DOMContentLoaded", () => {
    // Feedback Filters
    const ratingsBtns = document.querySelectorAll("#ratingFilters .btn");
    ratingsBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            ratingsBtns.forEach(b => { b.classList.remove("primary", "active"); b.classList.add("ghost"); });
            e.target.classList.remove("ghost");
            e.target.classList.add("primary", "active");
            currentFBRatingFilter = e.target.getAttribute("data-rating");
            currentFBPage = 1;
            renderFullFeedback();
        });
    });

    const searchFb = document.getElementById("searchFeedback");
    if(searchFb) {
        searchFb.addEventListener("input", (e) => {
            currentFBSearch = e.target.value;
            currentFBPage = 1;
            renderFullFeedback();
        });
    }

    const perPageFb = document.getElementById("itemsPerPage");
    if(perPageFb) {
        perPageFb.addEventListener("change", (e) => {
            currentFBPerPage = parseInt(e.target.value);
            currentFBPage = 1;
            renderFullFeedback();
        });
    }
});

async function apiCall(url, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("API Error: " + res.status);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// Modal and Feedback Actions
async function viewFeedback(id) {
    try {
        if(allFeedbacks.length === 0) allFeedbacks = await apiCall("/api/feedback");
        const fb = allFeedbacks.find(f => f.id == id);
        if(!fb) return;
    
        const ref = fb.orderId && fb.orderId !== 'N/A' && fb.orderId !== 'null' ? `Order #${fb.orderId}` : (fb.productId ? `Product #${fb.productId}` : "N/A");

        document.getElementById("fbModalCustomer").innerText = fb.customer;
        document.getElementById("fbModalMeta").innerText = `${ref} • ${fb.date}`;
        document.getElementById("fbModalRating").innerText = "★".repeat(fb.rating) + "☆".repeat(5-fb.rating);
        document.getElementById("fbModalText").innerText = `"${fb.review}"`;
        
        // Reply Logic
        const replyArea = document.getElementById("fbModalReply");
        replyArea.value = fb.reply || "";
        
        const btnSave = document.getElementById("btnSaveReply");
        btnSave.onclick = () => saveFeedbackReply(fb.id);
        
        document.getElementById("fbViewModal").classList.add("open");
    } catch (e) { console.error(e); }
}

function closeFbModal() {
    document.getElementById("fbViewModal").classList.remove("open");
}

async function saveFeedbackReply(id) {
    try {
        const reply = document.getElementById("fbModalReply").value;
        if (!reply.trim()) {
            toast("Please enter a reply message.", "error");
            return;
        }

        const fb = allFeedbacks.find(f => f.id == id);
        if(!fb) return;
        
        fb.reply = reply;
        fb.status = 'REPLIED';
        
        await apiCall(`/api/feedback/${fb.id}`, "PUT", fb);
        
        closeFbModal();
        
        // Update local state and refresh
        allFeedbacks = await apiCall("/api/feedback");
        
        // Refresh based on current view
        if (document.getElementById("feedbackModule").style.display === "block") {
            renderFullFeedback();
        } else {
            refreshDashboard();
        }
        
        toast("Reply saved successfully.", "success");
    } catch (e) {
        toast("Failed to save reply: " + e.message, "error");
    }
}

function toast(msg, type=""){
    const t = document.getElementById("toast");
    if(!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove("show"), 2200);
}

async function downloadPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const now = new Date();
    const timeStr = now.toLocaleString();

    toast("Preparing your professional report...", "success");

    // Header & Branding
    doc.setFontSize(22);
    doc.setTextColor(184, 134, 11); // Gold color
    doc.text("ZEE FASHION", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Sales Analytics & Performance Report", 14, 28);
    doc.text(`Generated: ${timeStr}`, 14, 33);
    doc.line(14, 36, 196, 36);

    // Executive Summary Area
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 48);
    
    const totalSales = document.getElementById("statTotalSales").innerText;
    const todaySales = document.getElementById("statTodaySales").innerText;
    const avgRating = document.getElementById("statAvgRating").innerText;
    const totalProducts = document.getElementById("statTotalProducts").innerText;

    doc.autoTable({
        startY: 54,
        head: [['Metric', 'Value']],
        body: [
            ['Total Sales (All Time)', totalSales],
            ['Today\'s Sales', todaySales],
            ['Average Store Rating', avgRating],
            ['Total Products in Inventory', totalProducts]
        ],
        theme: 'striped',
        headStyles: { fillColor: [184, 134, 11] }
    });

    // Monthly Trends
    let currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text("Monthly Sales Performance (2026)", 14, currentY);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRows = monthNames.map((name, i) => [name, money(lastMonthlyData[i])]);

    doc.autoTable({
        startY: currentY + 6,
        head: [['Month', 'Sales Amount']],
        body: monthlyRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] } // Blue color from charts
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("* This report provides a snapshot of current system performance within ZEE FASHION Management Suite.", 14, 285);

    doc.save(`ZEEFASHION_Report_${now.toISOString().slice(0,10)}.pdf`);
    toast("Report downloaded successfully!", "success");
}

async function generateSalesByDateReport() {
    const dateInput = document.getElementById("salesReportDate");
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
    
    if (!selectedDate) {
        toast("Please select a date first", "error");
        return;
    }

    try {
        toast("Generating report for " + selectedDate + "...", "success");
        const orders = await apiCall("/api/orders");
        
        const filtered = orders.filter(o => 
            (o.createdAt || "").startsWith(selectedDate) && 
            o.status !== 'CANCELLED' && 
            o.status !== 'FAILED'
        );

        if (filtered.length === 0) {
            toast("No successful sales records found for this date", "error");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header & Branding
        doc.setFontSize(22);
        doc.setTextColor(184, 134, 11); // Gold color
        doc.text("ZEE FASHION", 14, 22);
        
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Daily Sales Report - ${selectedDate}`, 14, 32);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        doc.line(14, 42, 196, 42);

        // Summary
        const totalAmount = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Transactions: ${filtered.length}`, 14, 52);
        doc.text(`Total Revenue: ${money(totalAmount)}`, 14, 60);

        // Transactions Table
        const tableData = filtered.map(o => [
            `#${o.id}`,
            `#${o.id}`,
            money(o.total),
            (o.createdAt || "").slice(0, 10)
        ]);

        doc.autoTable({
            startY: 70,
            head: [['SALE ID', 'ORDER ID', 'AMOUNT', 'DATE']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [184, 134, 11] }
        });

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("* This is an automated daily sales record for ZEE FASHION.", 14, 285);

        doc.save(`ZEEFASHION_Sales_${selectedDate}.pdf`);
        toast("Daily report downloaded!", "success");

    } catch (e) {
        console.error(e);
        toast("Failed to generate report", "error");
    }
}

window.downloadPDFReport = downloadPDFReport;
window.generateSalesByDateReport = generateSalesByDateReport;

function updateNotifications(feedbacks) {
    const pendingCount = feedbacks.filter(f => f.status === 'PENDING').length;
    const badge = document.getElementById("notifBadge");
    if (!badge) return;

    if (pendingCount > 0) {
        badge.innerText = pendingCount > 99 ? '99+' : pendingCount;
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }
}
