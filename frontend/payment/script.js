document.addEventListener("DOMContentLoaded", loadConfirmation);


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


// Load thông tin đơn hàng từ server dựa trên orderId trong URL
async function loadConfirmation() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để xem thông tin đơn hàng!");
            window.location.href = '../login/index.html';
            return;
        }

        // Lấy orderId từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        if (!orderId) {
            alert("Không tìm thấy mã đơn hàng!");
            window.location.href = '../Page/index.html';
            return;
        }

        // Lấy phần tử orderDetails và kiểm tra
        const orderDetails = document.getElementById("order-details");
        if (!orderDetails) {
            console.error("Phần tử #order-details không tồn tại trong HTML!");
            alert("Có lỗi khi tải thông tin đơn hàng. Vui lòng kiểm tra lại trang.");
            return;
        }

        // Gọi API để lấy thông tin đơn hàng
        const response = await fetch(`http://localhost:5000/api/order/${orderId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });
        if (!response.ok) throw new Error('Không thể tải thông tin đơn hàng!');
        const order = await response.json();

        console.log('Order Data:', order); // Debug dữ liệu đơn hàng

        // Hiển thị thông tin đơn hàng
        orderDetails.innerHTML = "<h3>Chi Tiết Đơn Hàng:</h3>";
        order.items.forEach(item => {
            orderDetails.innerHTML += `
                <p>${item.productId.name} - Số lượng: ${item.quantity} - Giá: ${item.price.toLocaleString()} VND</p>
            `;
        });

        // Cập nhật mã đơn hàng
        const orderIdElement = document.getElementById("order-id");
        if (orderIdElement) {
            orderIdElement.textContent = order._id;
        } else {
            console.error("Phần tử #order-id không tồn tại trong HTML!");
        }

        // Cập nhật số lượng giỏ hàng (sẽ là 0 vì đã xóa giỏ hàng)
        updateCartCount();
    } catch (error) {
        console.error('Lỗi khi tải thông tin xác nhận:', error);
        alert('Có lỗi khi tải thông tin xác nhận: ' + error.message);
        window.location.href = '../Page/index.html';
    }
}

// Hàm chuyển hướng đến trang giỏ hàng
function goToCart() {
    window.location.href = "../cart-page/index.html";
}

// Hàm quay về trang chủ
function backToHome() {
    window.location.href = "../Page/index.html";
}

// Hàm redirect đến trang profile (giả định)
function redirectToProfile() {
    window.location.href = "../profile/index.html"; // Thay bằng đường dẫn thực tế nếu có
}

// Cập nhật số lượng sản phẩm trong giỏ hàng trên header
async function updateCartCount() {
    console.log("🛒 Bắt đầu cập nhật số lượng giỏ hàng...");

    try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        console.log("🔑 Token lấy từ localStorage:", token);

        // Kiểm tra nếu không có token => Giỏ hàng trống
        if (!token) {
            console.warn("⚠️ Không tìm thấy token, không thể cập nhật giỏ hàng.");
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = '0';
                console.log("🛒 Đã đặt số lượng giỏ hàng về 0 do không có token.");
            } else {
                console.warn("⚠️ Phần tử #cart-count không tồn tại trong HTML.");
            }
            return;
        }

        // Kiểm tra phần tử cart-count có tồn tại không
        const cartCountElement = document.getElementById('cart-count');
        console.log("🔍 Phần tử #cart-count:", cartCountElement);

        if (!cartCountElement) {
            console.error("❌ Không tìm thấy phần tử #cart-count! Giỏ hàng sẽ không được cập nhật.");
            return;
        }

        // Gửi request đến API lấy giỏ hàng
        console.log("📡 Gửi yêu cầu lấy thông tin giỏ hàng từ API...");
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        console.log("📡 Phản hồi từ API:", response);

        // Nếu API trả về lỗi
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Lỗi khi lấy thông tin giỏ hàng:", errorText);
            cartCountElement.textContent = '0';
            return;
        }

        // Chuyển response thành JSON
        const cart = await response.json();
        console.log("📦 Dữ liệu giỏ hàng nhận được:", cart);

        // Kiểm tra nếu giỏ hàng trống
        if (!cart.items || cart.items.length === 0) {
            console.warn("🛒 Giỏ hàng trống, đặt số lượng về 0.");
            cartCountElement.textContent = '0';
            return;
        }

        // Tính tổng số lượng sản phẩm trong giỏ
        const count = cart.items.reduce((total, item) => total + item.quantity, 0);
        console.log(`✅ Tổng số lượng sản phẩm trong giỏ: ${count}`);

        // Cập nhật số lượng giỏ hàng trên UI
        cartCountElement.textContent = count;

    } catch (error) {
        console.error('🔥 Lỗi khi cập nhật số lượng giỏ hàng:', error);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) cartCountElement.textContent = '0';
    }
}


console.log("🔍 userId sau khi thanh toán:", localStorage.getItem("userId"));
document.addEventListener("DOMContentLoaded", () => {
    console.log("🔍 Kiểm tra Token từ localStorage...");

    const token = localStorage.getItem("token");
    console.log("Token:", token);

    if (token) {
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            console.log("Dữ liệu trong token:", tokenData);

            // Kiểm tra userId trong token
            if (tokenData.id) {
                console.log("✅ userId lấy từ token:", tokenData.id);
            } else {
                console.warn("⚠️ Không tìm thấy userId trong token!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi decode token:", error);
        }
    } else {
        console.warn("⚠️ Không tìm thấy token trong localStorage.");
    }
});

// Gọi khi trang tải
document.addEventListener("DOMContentLoaded", () => {
    loadConfirmation();
    updateCartCount();
});