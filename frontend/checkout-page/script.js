document.addEventListener("DOMContentLoaded", loadCartItems);

// Load sản phẩm từ giỏ hàng trên server hoặc query string
async function loadCartItems() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để xem giỏ hàng!");
            window.location.href = '../login/index.html';
            return;
        }

        // Lấy dữ liệu từ query string (nếu có)
        const urlParams = new URLSearchParams(window.location.search);
        const itemsStr = urlParams.get('items');
        const totalStr = urlParams.get('total');

        const orderItems = document.getElementById("order-items");
        const totalPriceElement = document.getElementById("total-price");
        let totalPrice = 0;
        let items = [];

        if (itemsStr && totalStr) {
            // Nếu có dữ liệu từ query string
            items = JSON.parse(decodeURIComponent(itemsStr));
            totalPrice = parseInt(totalStr) || 0;
        } else {
            // Nếu không, lấy từ server
            const cartResponse = await fetch('http://localhost:5000/api/cart', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!cartResponse.ok) throw new Error('Không thể tải giỏ hàng!');
            const cart = await cartResponse.json();

            if (!cart.items || cart.items.length === 0) {
                orderItems.innerHTML = '<li>Giỏ hàng trống!</li>';
                if (totalPriceElement) totalPriceElement.textContent = "0";
                return;
            }

            items = cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            }));

            cart.items.forEach(item => {
                totalPrice += item.productId.price * item.quantity;
            });
        }

        orderItems.innerHTML = "";
        items.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `${item.productId.name || 'Sản phẩm'} x${item.quantity} <span>${(item.price * item.quantity).toLocaleString()} VND</span>`;
            orderItems.appendChild(li);
        });

        if (totalPriceElement) {
            totalPriceElement.textContent = totalPrice.toLocaleString();
        }
    } catch (error) {
        console.error('Lỗi khi tải giỏ hàng:', error);
        alert('Có lỗi khi tải giỏ hàng: ' + error.message);
        document.getElementById("order-items").innerHTML = '<li>Giỏ hàng trống!</li>';
    }
}

// Xác nhận và gửi đơn hàng lên server
async function confirmOrder() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để xác nhận thanh toán!");
            return;
        }

        const name = document.getElementById("name").value;
        const address = document.getElementById("address").value;
        const phone = document.getElementById("phone").value;
        const note = document.getElementById("note").value;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        if (!name || !address || !phone) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        // Lấy dữ liệu giỏ hàng từ query string hoặc server
        const urlParams = new URLSearchParams(window.location.search);
        const itemsStr = urlParams.get('items');
        let items = [];

        if (itemsStr) {
            items = JSON.parse(decodeURIComponent(itemsStr));
        } else {
            const cartResponse = await fetch('http://localhost:5000/api/cart', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!cartResponse.ok) throw new Error('Không thể tải giỏ hàng!');
            const cart = await cartResponse.json();

            if (!cart.items || cart.items.length === 0) {
                alert("Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán!");
                return;
            }

            items = cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            }));
        }

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Gửi đơn hàng lên server
        const orderResponse = await fetch('http://localhost:5000/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                address: address,
                items: items,
                total: total,
                paymentMethod: paymentMethod,
                customerName: name,
                phone: phone,
                note: note
            })
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            throw new Error(`Không thể tạo đơn hàng: ${errorText}`);
        }

        const order = await orderResponse.json();

        // // Xóa giỏ hàng sau khi thanh toán
        // await fetch('http://localhost:5000/api/cart/clear', {
        //     method: 'DELETE',
        //     headers: { 'Authorization': 'Bearer ' + token }
        // });

        // Chuyển hướng đến trang xác nhận với mã đơn hàng
        window.location.href = `../payment/index.html?orderId=${order.order._id}`;
    } catch (error) {
        console.error('Lỗi khi xác nhận đơn hàng:', error);
        alert('Có lỗi khi xác nhận đơn hàng: ' + error.message);
    }
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
    loadCartItems();
    updateCartCount();
});