// Hàm lấy dữ liệu từ API
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

// Hàm lấy ngày Thứ Hai của tuần hiện tại
function getMondayOfCurrentWeek() {
    const today = new Date();
    const day = today.getDay(); // 0 (Chủ Nhật) -> 6 (Thứ Bảy)

    // Nếu là Chủ Nhật (0), lùi về Thứ Hai tuần trước
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    return monday;
}

// Hàm tính doanh thu theo ngày thực tế
function calculateDailyRevenue(orders) {
    const revenueByDaily = {};
    const currentMonday = getMondayOfCurrentWeek();

    // Tạo 7 ngày từ Thứ 2 → Chủ Nhật
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentMonday);
        date.setDate(currentMonday.getDate() + i);

        const dateKey = date.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD
        revenueByDaily[dateKey] = 0;
    }

    // Lọc và tính tổng doanh thu theo ngày
    orders.forEach(order => {
        if (!order.createdAt || isNaN(new Date(order.createdAt))) {
            console.warn("Dữ liệu createdAt không hợp lệ:", order);
            return;
        }

        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];

        if (revenueByDaily.hasOwnProperty(orderDate)) {
            revenueByDaily[orderDate] += parseInt(order.total.replace(/\D/g, ""), 10);
        }
    });

    return revenueByDaily;
}

// Hàm cập nhật biểu đồ
async function updateSalesChart() {
    if (!window.salesChart) {
        console.error("Biểu đồ chưa được khởi tạo!");
        return;
    }

    // Lấy dữ liệu từ API
    const orders = await fetchOrders();

    // Tính doanh thu theo ngày
    const revenueByDate = calculateDailyRevenue(orders);
    console.log("📊 Doanh thu theo ngày:", revenueByDate);

    const filteredDates = Object.keys(revenueByDate).sort((a, b) => new Date(a) - new Date(b));

    const labels = filteredDates.map(date =>
        new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })
    );
    const data = filteredDates.map(date => revenueByDate[date] || 0);

    // Cập nhật dữ liệu biểu đồ
    window.salesChart.data.labels = labels;
    window.salesChart.data.datasets[0].data = data;
    window.salesChart.update();
}

// Hàm tạo biểu đồ
function createSalesChart() {
    const ctx = document.getElementById("salesChart").getContext("2d");

    window.salesChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Doanh thu theo ngày",
                data: [],
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Ngày" } },
                y: { beginAtZero: true, title: { display: true, text: "Doanh thu (VND)" } }
            }
        }
    });

    updateSalesChart();
}

// Gọi khi trang load
document.addEventListener("DOMContentLoaded", () => {
    createSalesChart();
});
