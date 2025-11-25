// Hàm lấy thông tin người dùng và cập nhật avatar
// Tải avatar người dùng
// Chuyển đến trang profile
function redirectToProfile() {
    window.location.href = "../user-profile-page/index.html";
  }
  async function loadProfileAvatar() {
    const API_URL = "http://localhost:5000/api/user";
    const token = localStorage.getItem("token");
  
    if (!token) {
        console.log("Không có token, dùng default avatar");
        document.getElementById("nav-avatar").src = "http://localhost:5000/uploads/default-avatar.png";
        return;
    }
  
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Tăng timeout lên 15 giây
  
            console.log(`Thử tải avatar lần ${attempt + 1}...`);
            const response = await fetch(`${API_URL}/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                signal: controller.signal
            });
  
            clearTimeout(timeoutId);
  
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
  
            const user = await response.json();
            console.log("Dữ liệu user từ server:", user); // Log để kiểm tra user.avatar
  
            const avatarUrl = user.avatar
                ? (user.avatar.startsWith('http') 
                    ? user.avatar.replace(/upload\//, 'upload/w_50,h_50,c_fill/') // Resize về 50x50px và fill
                    : `http://localhost:5000${user.avatar}`)
                : "http://localhost:5000/uploads/default-avatar.png";
  
            const navAvatar = document.getElementById("nav-avatar");
            navAvatar.src = avatarUrl;
            navAvatar.onerror = function() {
                console.error("Không tải được avatar, dùng default:", avatarUrl);
                this.src = "http://localhost:5000/uploads/default-avatar.png";
            };
            return; // Thoát nếu thành công
        } catch (error) {
            console.error(`Lỗi khi tải avatar (lần ${attempt + 1}):`, error);
            if (attempt === 1) {
                console.error("Không thể tải avatar sau 2 lần thử, dùng default avatar");
                document.getElementById("nav-avatar").src = "http://localhost:5000/uploads/default-avatar.png";
            }
        }
    }
  }
  loadProfileAvatar();


async function loadOrderHistory() {
    try {
        // Lấy token từ LocalStorage
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại!");
            return;
        }

        // Giải mã token để lấy userId
        const tokenData = JSON.parse(atob(token.split('.')[1])); // Decode JWT
        const userId = tokenData.id;

        if (!userId) {
            alert("Không tìm thấy thông tin tài khoản, vui lòng đăng nhập lại!");
            return;
        }

        // API endpoint để lấy lịch sử đơn hàng
        const apiUrl = `http://localhost:5000/api/order/user/${userId}`;
        console.log("🔍 Gọi API:", apiUrl);

        // Hiện loading
        document.getElementById("loading").style.display = "block";

        // Gọi API
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        // Ẩn loading sau khi nhận phản hồi
        document.getElementById("loading").style.display = "none";

        if (response.status === 403) {
            alert("Bạn không có quyền truy cập vào lịch sử đơn hàng.");
            return;
        }

        if (!response.ok) {
            alert("Có lỗi khi tải đơn hàng. Vui lòng thử lại!");
            return;
        }

        // Chuyển đổi dữ liệu JSON
        const data = await response.json();
        console.log("📦 Dữ liệu API:", data);

        // Truy xuất các bảng hiển thị đơn hàng
        const choXacNhan = document.querySelector("#cho-xac-nhan");
        const choGiaoHang = document.querySelector("#cho-giao-hang");
        const daGiao = document.querySelector("#da-giao");

        // Xóa dữ liệu cũ
        choXacNhan.innerHTML = "";
        choGiaoHang.innerHTML = "";
        daGiao.innerHTML = "";

        // Nếu không có đơn hàng
        if (!Array.isArray(data) || data.length === 0) {
            const emptyRow = "<tr><td colspan='2'>Không có đơn hàng.</td></tr>";
            choXacNhan.innerHTML = emptyRow;
            choGiaoHang.innerHTML = emptyRow;
            daGiao.innerHTML = emptyRow;
            return;
        }

        // Duyệt qua danh sách đơn hàng và hiển thị
        data.forEach(order => {
            console.log("🔍 Đơn hàng:", order);
        
            if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
                console.warn("⚠️ Đơn hàng không có sản phẩm:", order);
                return;
            }
        
            let totalPrice = 0; // Tổng tiền đơn hàng
            const productNames = order.items.map(item => {
                let productName = item.name || "Sản phẩm không xác định"; // Lấy tên lưu trong đơn hàng nếu có
                let productPrice = item.price || 0; // Lấy giá lưu trong đơn hàng
                let isDeleted = false; // Kiểm tra sản phẩm có bị xóa không
        
                if (item.productId && item.productId.name) {
                    // Sản phẩm vẫn còn tồn tại
                    productName = item.productId.name;
                    productPrice = item.productId.price || productPrice; // Ưu tiên giá mới nếu có
                } else {
                    // Sản phẩm đã bị xóa
                    isDeleted = true;
                }
        
                // Tính tổng tiền (dựa trên giá lúc mua)
                totalPrice += productPrice * item.quantity;
        
                return isDeleted 
                    ? `<span style="color: red;">${productName} (Hiện tại đang hết hàng) (x${item.quantity})</span>` 
                    : `${productName} (x${item.quantity})`;
            }).join(", ");
        
            // Tạo phần tử hiển thị đơn hàng
            const dataElement = document.createElement("tr");
            dataElement.innerHTML = `
                <td>${productNames}</td>
                <td>${totalPrice.toLocaleString()} VND</td>
            `;
        
            // Phân loại đơn hàng theo trạng thái
            switch (order.status) {
                case "pending":
                    choXacNhan.appendChild(dataElement);
                    break;
                case "shipping":
                    choGiaoHang.appendChild(dataElement);
                    break;
                case "completed":
                    daGiao.appendChild(dataElement);
                    break;
                default:
                    console.warn("🚨 Trạng thái không xác định:", order.status);
            }
        });
        
        
        
        
        

        console.log("✅ Lịch sử đơn hàng đã hiển thị thành công.");
    } catch (error) {
        console.error("🚨 Lỗi khi tải lịch sử đơn hàng:", error);
        alert("Có lỗi xảy ra khi tải đơn hàng. Vui lòng thử lại!");
    }
}

// Gọi hàm khi trang tải xong
document.addEventListener("DOMContentLoaded", loadOrderHistory);
