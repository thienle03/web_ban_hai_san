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

    // Lấy danh sách người dùng từ server
    loadUserList();
});

// 🔥 API Endpoint
const API_URL = "http://localhost:5000/api/user/all"; // Đảm bảo đường dẫn đúng với API của bạn
const token = localStorage.getItem("token");

if (!token) {
    alert("Bạn cần đăng nhập để truy cập trang này!");
    window.location.href = "../Auth/login.html";
}

async function loadUserList() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        console.log(data); // In ra dữ liệu nhận được từ API

        if (response.ok) {
            const userList = data.users|| data;
            const userListContainer = document.getElementById("user-list");
            userListContainer.innerHTML = "";

            userList.forEach((user) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${user._id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.status || "Chưa xác định"}</td>
                `;

                userListContainer.appendChild(row);
            });
        } else {
            alert(data.message || "Không thể tải danh sách người dùng!");
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách người dùng:", error);
        alert("Lỗi kết nối đến server!");
    }
}

