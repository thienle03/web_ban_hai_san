document.addEventListener("DOMContentLoaded", loadCart);

// Hàm kiểm tra URL để reload nếu cần
function checkReload() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reload') === 'true') {
        loadCart(); // Gọi loadCart khi có tham số reload
        // Xóa tham số reload khỏi URL để tránh reload lặp lại
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Gọi kiểm tra khi trang tải
checkReload();
async function loadCart() {
    try {
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) throw new Error('Không thể tải giỏ hàng!');
        const cart = await response.json();
        const cartTable = document.getElementById("cart-items");
        let totalPrice = 0;

        cartTable.innerHTML = "";
        if (cart.items.length === 0) {
            cartTable.innerHTML = '<tr><td colspan="6">Giỏ hàng trống!</td></tr>';
        } else {
            cart.items.forEach((item, index) => {
                const row = cartTable.insertRow();
                row.innerHTML = `
                    <td>${item.productId.name}</td>
                    <td><img src="${item.productId.image || 'https://source.unsplash.com/50x50/?seafood'}" alt="${item.productId.name}"></td>
                    <td>${item.productId.price.toLocaleString()} VND</td>
                    <td>
                        <button onclick="changeQuantity('${item.productId._id}', -1)">➖</button>
                        ${item.quantity}
                        <button onclick="changeQuantity('${item.productId._id}', 1)">➕</button>
                    </td>
                    <td>${(item.productId.price * item.quantity).toLocaleString()} VND</td>
                    <td><button onclick="removeItem('${item.productId._id}')">❌ Xóa</button></td>
                `;
                totalPrice += item.productId.price * item.quantity;
            });
        }

        document.getElementById("cart-total").innerText = totalPrice.toLocaleString() + " VND";
        updateCartCount();
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi tải giỏ hàng!");
    }
}

// Các hàm khác giữ nguyên...

async function changeQuantity(productId, change) {
    try {
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const cart = await response.json();
        const item = cart.items.find(i => i.productId._id === productId);

        if (!item) return;

        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }

        const updateResponse = await fetch('http://localhost:5000/api/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ productId, quantity: newQuantity })
        });

        if (!updateResponse.ok) throw new Error('Không thể cập nhật số lượng!');
        loadCart();
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi cập nhật số lượng!");
    }
}

async function removeItem(productId) {
    try {
        const response = await fetch(`http://localhost:5000/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) throw new Error('Không thể xóa sản phẩm!');
        loadCart();
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi xóa sản phẩm!");
    }
}

async function clearCart() {
    try {
        const response = await fetch('http://localhost:5000/api/cart/clear', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) throw new Error('Không thể xóa giỏ hàng!');
        loadCart();
    } catch (error) {
        console.error(error);
        alert("Có lỗi khi xóa giỏ hàng!");
    }
}

async function redirectToCheckout() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để thanh toán!");
            return;
        }

        console.log('Token:', token); // Debug token

        // Lấy thông tin giỏ hàng từ server
        const cartResponse = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!cartResponse.ok) {
            const errorText = await cartResponse.text();
            throw new Error(`Không thể tải giỏ hàng để thanh toán: ${errorText}`);
        }
        const cart = await cartResponse.json();

        console.log('Cart:', cart); // Debug dữ liệu giỏ hàng

        if (cart.items.length === 0) {
            alert("Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán!");
            return;
        }

        // Chuẩn bị dữ liệu items với price từ productId
        const itemsWithPrice = cart.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.price // Thêm price từ productId
        }));

        // Tính total từ itemsWithPrice để đảm bảo chính xác
        const total = itemsWithPrice.reduce((sum, item) => sum + item.price * item.quantity, 0);

        console.log('Items with Price:', itemsWithPrice, 'Total:', total); // Debug dữ liệu gửi lên

        // Chuyển hướng đến trang kiểm tra sản phẩm trước khi thanh toán
        window.location.href = '../checkout-page/index.html?total=' + total + '&items=' + encodeURIComponent(JSON.stringify(itemsWithPrice));
    } catch (error) {
        console.error('Lỗi khi thanh toán:', error);
        alert('Có lỗi khi thanh toán: ' + error.message);
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const cart = await response.json();
        const count = cart.items.reduce((total, item) => total + item.quantity, 0);
        if (document.getElementById("cart-count")) {
            document.getElementById("cart-count").textContent = count;
        }
    } catch (error) {
        console.error(error);
        if (document.getElementById("cart-count")) {
            document.getElementById("cart-count").textContent = "0";
        }
    }
}