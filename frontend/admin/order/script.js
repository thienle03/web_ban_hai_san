document.addEventListener("DOMContentLoaded", function () {
    // Điều hướng sidebar
    document.querySelectorAll(".sidebar ul li").forEach(item => {
        item.addEventListener("click", function () {
            const url = item.getAttribute("data-url");
            if (url) {
                window.location.href = url;
            }
        });
    });

});

document.addEventListener("DOMContentLoaded", async function () {
    async function fetchOrders() {
        try {
            const response = await fetch("http://localhost:5000/api/order/all", { 
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) throw new Error(`Lỗi: ${response.status}`);

            const data = await response.json();
            return Array.isArray(data.orders) ? data.orders : [];
        } catch (error) {
            console.error("❌ Lỗi khi lấy danh sách đơn hàng:", error);
            return [];
        }
    }

    async function cancelOrderAdmin(orderId) {
        console.log("🛑 Đang hủy đơn hàng:", orderId); // Kiểm tra ID trước khi gửi API

        try {
            const response = await fetch(`http://localhost:5000/api/order/admin/cancel-order/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

            alert("✅ Đơn hàng đã được hủy thành công!");
            await loadAndRenderOrders(); // Cập nhật lại danh sách đơn hàng
        } catch (error) {
            console.error("❌ Lỗi khi hủy đơn hàng:", error);
            alert("❌ Không thể hủy đơn hàng. Kiểm tra lại ID và API.");
        }
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    let isCancelEventBound = false; // Biến kiểm tra xem đã gán sự kiện chưa

function renderOrders(orders, elementId, allowedStatuses, buttons = []) {
    console.log(`🔍 Kiểm tra danh sách ${elementId}:`, orders);

    const orderList = document.getElementById(elementId);
    if (!orderList) {
        console.error(`❌ Không tìm thấy phần tử với ID: ${elementId}`);
        return;
    }

    const filteredOrders = orders.filter(order => allowedStatuses.includes(order.status));

    console.log(`📌 Đơn hàng ${elementId} sau khi lọc:`, filteredOrders);

    if (filteredOrders.length > 0) {
        orderList.innerHTML = filteredOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.product}</td>
                <td>${order.total}</td>
                <td>${order.shopName}</td>  
                <td>${order.shopAddress}</td> 
                <td>${order.status}</td>
                <td>${formatDate(order.createdAt)}</td>

                <td>
                    ${buttons.map(btn => `
                        <button class="${btn.class}" data-id="${order.id}">${btn.label}</button>
                    `).join(" ")}
                </td>
            </tr>
        `).join("");
    } else {
        orderList.innerHTML = "<tr><td colspan='8'>Không có đơn hàng nào.</td></tr>";
    }

    // 🚀 FIX: Xóa sự kiện cũ trước khi thêm mới
    if (!isCancelEventBound) {
        document.getElementById("order-list-1").addEventListener("click", function (event) {
            if (event.target.classList.contains("cancel-btn")) {
                const orderId = event.target.getAttribute("data-id");

                if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
                    cancelOrderAdmin(orderId);
                }
            }
        });

        isCancelEventBound = true; // Đánh dấu đã gán sự kiện
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
            console.log("📊 Tổng số đơn hàng:", totalOrders);

            // Tính tổng thu nhập của Admin
            const totalRevenue = orders.reduce((sum, order) => {
                const amount = parseInt(order.total.replace(/\D/g, ""), 10) || 0; // Chuyển "1 VND" thành số
                return sum + amount;
            }, 0);
            console.log("💰 Tổng thu nhập:", totalRevenue.toLocaleString() + " VND");

            // Tính doanh thu theo tháng
            const revenueByMonth = calculateMonthlyRevenue(orders);
            console.log("📅 Doanh thu theo tháng:", revenueByMonth);

            // Lưu dữ liệu vào localStorage
            localStorage.setItem("totalOrders", totalOrders);
            localStorage.setItem("totalRevenue", totalRevenue);
            localStorage.setItem("revenueByMonth", JSON.stringify(revenueByMonth));

            // Hiển thị danh sách đơn hàng
            renderOrders(orders, "order-list-1", ["Chờ xác nhận"], [
                { class: "cancel-btn", label: "X" }
            ]);
            renderOrders(orders, "order-list-2", ["Đang giao hàng"]);
            renderOrders(orders, "order-list-3", ["Đã giao"]);

        } catch (error) {
            console.error("❌ Lỗi khi tải đơn hàng:", error);
        }
    }

    function calculateMonthlyRevenue(orders) {
        const revenueByMonth = {};
        const currentYear = new Date().getFullYear();

        orders.forEach(order => {
            if (!order.createdAt || isNaN(new Date(order.createdAt))) {
                console.warn("Dữ liệu createdAt không hợp lệ:", order);
                return;
            }

            const orderDate = new Date(order.createdAt);
            const orderMonth = orderDate.getMonth() + 1; // Lấy tháng (1 - 12)
            const orderYear = orderDate.getFullYear();

            if (orderYear === currentYear) {
                if (!revenueByMonth[orderMonth]) {
                    revenueByMonth[orderMonth] = 0;
                }
                revenueByMonth[orderMonth] += parseInt(order.total.replace(/\D/g, ""), 10) || 0;
            }
        });

        return revenueByMonth;
    }

    // 🚀 Chạy khi load trang
    await loadAndRenderOrders();
});
