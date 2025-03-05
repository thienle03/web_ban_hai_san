document.addEventListener("DOMContentLoaded", async function () {
    // Gọi API để lấy danh sách đơn hàng
    async function fetchOrders() {
        try {
            const response = await fetch("http://localhost:5000/api/order", { // Sử dụng http thay vì https
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}` // Token từ localStorage
                }
            });

            if (!response.ok) {
                throw new Error(`Lỗi: ${response.status} - ${await response.text()}`);
            }

            const orders = await response.json();
            return orders;
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            alert("Có lỗi khi tải danh sách đơn hàng: " + error.message);
            return [];
        }
    }

    // Hàm hủy đơn hàng qua API
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
            console.log(`Đơn hàng ${orderId} đã được hủy`);
            alert("Đơn hàng đã được hủy thành công!");
        } catch (error) {
            console.error("Lỗi khi hủy đơn hàng:", error);
            alert("Có lỗi xảy ra khi hủy đơn hàng: " + error.message);
        }
    }

    // Xử lý menu
    document.querySelectorAll("#menu li").forEach(item => {
        item.addEventListener("click", function () {
            const url = item.getAttribute("data-url");
            if (url) window.location.href = url;
        });
    });

    // Tải và hiển thị đơn hàng
    const orders = await fetchOrders();
    const orderList = document.getElementById("order-list");

    if (orders.length > 0) {
        orderList.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.product}</td>
                <td>${order.total}</td>
                <td class="${order.status === 'Đã giao' ? 'delivered' : order.status === 'Đang giao hàng' ? 'shipping' : 'pending'}">
                    ${order.status}
                </td>
                <td>
                    <button class="detail-btn" data-id="${order.id}">👀 Xem</button>
                    <button class="cancel-btn" data-id="${order.id}">❌ Hủy</button>
                </td>
            </tr>
        `).join("");

        // Xử lý sự kiện hủy đơn hàng
        document.querySelectorAll(".cancel-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const orderId = btn.getAttribute("data-id");
                if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
                    await cancelOrder(orderId);
                    location.reload(); // Tải lại trang để cập nhật danh sách
                }
            });
        });
    } else {
        orderList.innerHTML = "<tr><td colspan='6'>Không có đơn hàng nào.</td></tr>";
    }
});