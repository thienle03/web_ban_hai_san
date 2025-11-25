document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#menu li").forEach(item => {
        item.addEventListener("click", function () {
            const url = item.getAttribute("data-url");
            if (url) {
                console.log("Chuyển hướng tới:", url);
                window.location.href = url; // Chuyển hướng trang
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    async function fetchOrders() {
        try {
            const response = await fetch("http://localhost:5000/api/order", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error(`Lỗi: ${response.status} - ${await response.text()}`);
            }

            const data = await response.json();
            console.log("📌 API trả về:", data);

            return Array.isArray(data) ? data : (data.orders || []);
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            alert("Có lỗi khi tải danh sách đơn hàng: " + error.message);
            return [];
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            console.log(`📤 Gửi trạng thái: ${newStatus} cho đơn hàng ID: ${orderId}`);

            const response = await fetch(`http://localhost:5000/api/order/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const responseData = await response.json();
            console.log("📥 Phản hồi API:", responseData);

            if (!response.ok) {
                throw new Error(responseData.message || "Không thể cập nhật trạng thái đơn hàng");
            }

            console.log("✅ Cập nhật thành công! Cập nhật giao diện...");
            await loadAndRenderOrders();

        } catch (error) {
            console.error("❌ Lỗi cập nhật đơn hàng:", error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    }

    async function cancelOrder(orderId) {
        try {
            const response = await fetch(`http://localhost:5000/api/order/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error("Không thể hủy đơn hàng");
            }

            alert("Đơn hàng đã được hủy thành công!");
            await loadAndRenderOrders();

        } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error);
            alert("Có lỗi xảy ra khi hủy đơn hàng: " + error.message);
        }
    }

    function renderOrders(orders, elementId, allowedStatuses, buttons) {
        console.log(`🔍 Kiểm tra danh sách ${elementId}:`, orders);
    
        const orderList = document.getElementById(elementId);
        const filteredOrders = orders.filter(order => allowedStatuses.includes(order.status));
    
        console.log(`📌 Đơn hàng ${elementId} sau khi lọc:`, filteredOrders);
    
        if (filteredOrders.length > 0) {
            orderList.innerHTML = filteredOrders.map(order => `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${order.products.map(p => p.name).join(", ")}</td>  <!-- Sửa ở đây -->
                    <td>${order.total}</td>
                    <td class="${order.status}">
                        ${order.status}
                    </td>
                    <td>
                        ${buttons.map(btn => `
                            <button class="${btn.class}" data-id="${order.id}">${btn.label}</button>
                        `).join(" ")}
                    </td>
                </tr>
            `).join("");
    
            document.querySelectorAll(".confirm-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    updateOrderStatus(btn.getAttribute("data-id"), "shipping");
                });
            });
    
            document.querySelectorAll(".delivered-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    updateOrderStatus(btn.getAttribute("data-id"), "completed");
                });
            });
    
            document.querySelectorAll(".cancel-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
                        cancelOrder(btn.getAttribute("data-id"));
                    }
                });
            });
    
        } else {
            orderList.innerHTML = "<tr><td colspan='6'>Không có đơn hàng nào.</td></tr>";
        }
    }
    

    async function loadAndRenderOrders() {
    try {
        console.log("🔄 Đang chạy loadAndRenderOrders...");
        const orders = await fetchOrders();

        if (!orders || orders.length === 0) {
            console.warn("⚠ Không có đơn hàng nào!");
            return;
        }

        // Đếm tổng số đơn hàng
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === "Chờ xác nhận").length;
        const shippingOrders = orders.filter(order => order.status === "Đang giao hàng").length;
        const completedOrders = orders.filter(order => order.status === "Đã giao").length;

        console.log("📊 Tổng số đơn hàng:", totalOrders);
        console.log("⏳ Đơn chờ xác nhận:", pendingOrders);
        console.log("🚚 Đơn đang giao:", shippingOrders);
        console.log("✅ Đơn đã giao:", completedOrders);

        
        const totalRevenue = orders.reduce((sum, order) => {
            const amount = parseInt(order.total.replace(/\D/g, ""), 10) || 0; // Lấy số từ chuỗi "1 VND"
            return sum + amount;
        }, 0);
        
        console.log("💰 Tổng thu nhập:", totalRevenue.toLocaleString() + " VND");

        // ✅ Sửa lỗi tính doanh thu theo tuần
        const revenueByDaily = calculateDailyRevenue(orders);
        console.log("📅 Doanh thu theo ngày:", revenueByDaily);

        // Lưu dữ liệu vào localStorage
        localStorage.setItem("totalOrders", totalOrders);
        localStorage.setItem("pendingOrders", pendingOrders);
        localStorage.setItem("shippingOrders", shippingOrders);
        localStorage.setItem("completedOrders", completedOrders);
        localStorage.setItem("totalRevenue", totalRevenue);
        localStorage.setItem("revenueByDaily", JSON.stringify(revenueByDaily));

        // Hiển thị danh sách đơn hàng
        renderOrders(orders, "order-list-1", ["Chờ xác nhận"], [
            { class: "confirm-btn", label: "Xác Nhận" },
            { class: "detail-btn", label: "👀 Xem" },
            { class: "cancel-btn", label: "X" }
        ]);
        renderOrders(orders, "order-list-2", ["Đang giao hàng"], [
            { class: "delivered-btn", label: "Đã Giao" },
            { class: "detail-btn", label: "👀 Xem" }
        ]);
        renderOrders(orders, "order-list-3", ["Đã giao"], [
            { class: "detail-btn", label: "👀 Xem" }
        ]);

    } catch (error) {
        console.error("❌ Lỗi khi tải đơn hàng:", error);
    }
}

// 🔢 Hàm sửa lỗi tính doanh thu theo tuần
function calculateDailyRevenue(orders) {
    const revenueByDay = {};
    const now = new Date();

    // Xác định ngày đầu tuần (Thứ 2)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    // Tạo doanh thu cho từng ngày trong tuần (Thứ 2 -> Chủ Nhật)
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);

        const dateKey = date.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD

        revenueByDay[dateKey] = orders
            .filter(order => {
                const createdAt = new Date(order.createdAt);
                return createdAt.toDateString() === date.toDateString();
            })
            .reduce((sum, order) => sum + (order.total || 0), 0);
    }

    return revenueByDay;
}


// 🚀 Chạy hàm khi load trang
await loadAndRenderOrders();

    
});
