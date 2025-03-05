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

    // Gọi hàm lấy và hiển thị danh sách người bán
    fetchSellers();
});

// Hàm lấy và hiển thị danh sách người bán
async function fetchSellers() {
    try {
        // Lấy token từ localStorage (giả sử được lưu sau khi đăng nhập)
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập để xem danh sách người bán!");
            window.location.href = "../login/index.html"; // Chuyển hướng đến trang đăng nhập
            return;
        }

        // Gửi yêu cầu đến API
        const response = await fetch("http://localhost:5000/api/user/sellers", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        // Kiểm tra phản hồi
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Lỗi khi lấy danh sách người bán");
        }

        const result = await response.json();
        const sellers = result.data; // Danh sách người bán từ API

        // Tìm phần tbody trong bảng
        const tbody = document.querySelector("tbody");
        if (!tbody) {
            console.error("Không tìm thấy tbody trong HTML!");
            return;
        }

        // Xóa nội dung cũ trong bảng
        tbody.innerHTML = "";

        // Thêm từng người bán vào bảng
        sellers.forEach(seller => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${seller._id}</td>
                <td>${seller.name}</td>
                <td>${seller.email}</td>
                <td>${seller.phone || "Chưa cập nhật"}</td>
                <td>${seller.status || "Đang hoạt động"}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người bán:", error);
        alert(error.message || "Không thể tải danh sách người bán!");
    }
}