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

    const chartElement = document.getElementById("revenueChart");
    let revenueChart = null;

    // Hàm tạo biểu đồ
    function createChart() {
        // Kiểm tra nếu phần tử canvas tồn tại
        if (!chartElement) {
            console.error("Không tìm thấy phần tử canvas!");
            return;
        }

        var ctx = chartElement.getContext("2d");

        // Khởi tạo biểu đồ chỉ khi chưa được khởi tạo
        if (!revenueChart) {
            revenueChart = new Chart(ctx, {
                type: "bar", // Biểu đồ cột
                data: {
                    labels: [
                        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                    ],
                    datasets: [{
                        label: "Doanh thu (VND)",
                        data: [
                            75000000, 92000000, 110000000, 85000000, 95000000, 140000000, 
                            125000000, 155000000, 160000000, 145000000, 175000000, 200000000
                        ],
                        backgroundColor: "#1abc9c", // Màu cột
                        borderColor: "#1abc9c", // Màu viền
                        borderWidth: 2,
                        hoverBackgroundColor: "#16a085", // Màu khi hover
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true, // Đảm bảo giữ tỷ lệ cho canvas
                    animation: {
                        duration: 0, // Tắt animation để hiệu suất mượt mà hơn
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 70000000, // Giá trị tối thiểu vẫn như cũ
                            max: 205000000, // Giá trị tối đa vẫn như cũ
                            ticks: {
                                stepSize: 1000000, // Giảm khoảng cách giữa các mức tiền
                                callback: function(value) {
                                    return value.toLocaleString("vi-VN") + " VND";
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.raw.toLocaleString("vi-VN") + " VND";
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Tạo biểu đồ khi DOM đã sẵn sàng
    createChart();

    // Xử lý sự kiện resize với debounce để tối ưu hiệu suất
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Điều chỉnh kích thước canvas khi thay đổi kích thước cửa sổ
            chartElement.width = window.innerWidth * 0.8; // Điều chỉnh lại chiều rộng
            chartElement.height = window.innerHeight * 0.4; // Điều chỉnh lại chiều cao
            if (revenueChart) {
                revenueChart.resize(); // Resize lại biểu đồ sau khi thay đổi kích thước
            }
        }, 200); // Đợi một chút trước khi thực hiện resize để giảm tải
    });
});
