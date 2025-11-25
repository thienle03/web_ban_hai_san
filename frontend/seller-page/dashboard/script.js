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

document.addEventListener("DOMContentLoaded", function () {
    // Hiển thị số lượng đơn hàng từ localStorage
    document.getElementById("total_orders").textContent = localStorage.getItem("totalOrders") || 0;
    document.getElementById("pending_orders").textContent = localStorage.getItem("pendingOrders") || 0;
    document.getElementById("shipping_orders").textContent = localStorage.getItem("shippingOrders") || 0;
    document.getElementById("completed_orders").textContent = localStorage.getItem("completedOrders") || 0;

    // Hiển thị tổng doanh thu từ localStorage
    console.log("📥 Đang lấy tổng doanh thu từ localStorage...");
    const revenue = localStorage.getItem("totalRevenue");
    console.log("💵 Tổng doanh thu trên Dashboard:", revenue);
    document.getElementById("totalRevenue").textContent = parseInt(revenue || 0).toLocaleString() + " VND";

    // Gọi hàm loadDashboardData để hiển thị tổng số sản phẩm
    loadDashboardData();
});

// Hàm load số lượng sản phẩm của seller
async function loadDashboardData() {
    
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập!");
            window.location.href = "../login/index.html";
            return;
        }

        const response = await fetch("http://localhost:5000/api/products/my-products", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
                window.location.href = "../login/index.html";
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || "Lỗi tải sản phẩm");
        }

        const products = await response.json();
        console.log("📦 Sản phẩm đã đăng bán:", products.length);

        localStorage.setItem("allProducts", products.length);
        document.getElementById("all_product").textContent = products.length;
    } catch (error) {
        console.error("Lỗi khi tải số lượng sản phẩm:", error);
        document.getElementById("all_product").textContent = "Lỗi";
    }
}
