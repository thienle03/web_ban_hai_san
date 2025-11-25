// Hàm lấy danh sách đơn hàng từ API
async function fetchOrders() {
    try {
        const response = await fetch("http://localhost:5000/api/order/all", {
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

// Xác định khoảng tháng cần hiển thị
function getCurrentMonthRange() {
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth <= 6 ? [1, 6] : [7, 12];
}

// Tính doanh thu theo tháng
function calculateMonthlyRevenue(orders) {
    const revenueByMonth = {};
    const [startMonth, endMonth] = getCurrentMonthRange();
    const currentYear = new Date().getFullYear();

    // Khởi tạo doanh thu cho các tháng từ startMonth → endMonth
    for (let month = startMonth; month <= endMonth; month++) {
        revenueByMonth[month] = 0;
    }

    // Duyệt qua danh sách đơn hàng
    orders.forEach(order => {
        if (!order.createdAt || isNaN(new Date(order.createdAt))) {
            console.warn("Dữ liệu createdAt không hợp lệ:", order);
            return;
        }

        const orderDate = new Date(order.createdAt);
        const orderMonth = orderDate.getMonth() + 1;
        const orderYear = orderDate.getFullYear();

        if (orderYear === currentYear && orderMonth >= startMonth && orderMonth <= endMonth) {
            revenueByMonth[orderMonth] += parseInt(order.total.replace(/\D/g, ""), 10) || 0;
        }
    });

    return revenueByMonth;
}

// Cập nhật biểu đồ doanh thu
async function updateSalesChart() {
    if (!window.adminChart) {
        console.error("Biểu đồ chưa được khởi tạo!");
        return;
    }

    const orders = await fetchOrders();
    const revenueByMonth = calculateMonthlyRevenue(orders);
    console.log("📊 Doanh thu theo tháng:", revenueByMonth);

    // Đảm bảo có đủ tháng trong mảng labels
    const [startMonth, endMonth] = getCurrentMonthRange();
    const months = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => `Tháng ${startMonth + i}`);
    const data = months.map((_, i) => revenueByMonth[startMonth + i] || 0);

    // Cập nhật dữ liệu biểu đồ
    window.adminChart.data.labels = months;
    window.adminChart.data.datasets[0].data = data;
    window.adminChart.update();
}

// Tạo biểu đồ doanh thu
function createSalesChart() {
    const ctx = document.getElementById("adminChart").getContext("2d");

    window.adminChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Doanh thu theo tháng",
                data: [],
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Tháng" } },
                y: { beginAtZero: true, title: { display: true, text: "Doanh thu (VND)" } }
            }
        }
    });

    updateSalesChart();
}

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", createSalesChart);
