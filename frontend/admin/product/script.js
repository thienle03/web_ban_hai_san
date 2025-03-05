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

    // Gọi hàm lấy và hiển thị danh sách sản phẩm
    fetchProducts();
});

// Hàm lấy và hiển thị danh sách sản phẩm
async function fetchProducts() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập để xem danh sách sản phẩm!");
            window.location.href = "../login/index.html";
            return;
        }

        console.log("Gửi yêu cầu đến: http://localhost:5000/api/products");
        const response = await fetch("http://localhost:5000/api/products", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.log("Phản hồi lỗi:", text);
            throw new Error(`Lỗi HTTP ${response.status}: ${text}`);
        }

        const result = await response.json();
        console.log("Dữ liệu nhận được:", result);

        // Dùng result trực tiếp vì nó là mảng
        const products = result;
        if (!products || !Array.isArray(products)) {
            console.error("Dữ liệu sản phẩm không hợp lệ:", products);
            throw new Error("Dữ liệu trả về không chứa danh sách sản phẩm!");
        }

        const tbody = document.querySelector("tbody");
        if (!tbody) {
            console.error("Không tìm thấy tbody trong HTML!");
            return;
        }

        tbody.innerHTML = "";
        if (products.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5'>Không có sản phẩm nào!</td></tr>";
        } else {
            products.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product._id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.price.toLocaleString("vi-VN")} VND</td>
                    <td>${product.stock}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error.message);
        alert(`Không thể tải danh sách sản phẩm: ${error.message}`);
    }
}