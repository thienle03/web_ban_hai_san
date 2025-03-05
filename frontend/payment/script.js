document.addEventListener("DOMContentLoaded", loadConfirmation);

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
            headers: { 'Authorization': 'Bearer ' + token }
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
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = '0';
            }
            return;
        }

        const response = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            const cart = await response.json();
            const count = cart.items.reduce((total, item) => total + item.quantity, 0);
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = count;
            }
        } else {
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật số lượng giỏ hàng:', error);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = '0';
        }
    }
}

// Gọi khi trang tải
document.addEventListener("DOMContentLoaded", () => {
    loadConfirmation();
    updateCartCount();
});