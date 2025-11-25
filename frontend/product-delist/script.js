// Lấy ID sản phẩm từ URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

let cartCount = 0;

// Hàm lấy thông tin người dùng và cập nhật avatar
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Chưa đăng nhập, giữ avatar mặc định.');
            return;
        }

        const response = await fetch('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Không thể tải thông tin người dùng!');
        const user = await response.json();

        console.log('Dữ liệu người dùng:', user); // Log để debug

        // Cập nhật avatar
        const avatarUrl = user.avatar
            ? (user.avatar.startsWith('http') 
                ? user.avatar // Nếu đã là URL Cloudinary, giữ nguyên
                : `http://localhost:5000${user.avatar}`) // Nếu là đường dẫn cục bộ
            : 'http://localhost:5000/uploads/default-avatar.png'; // Fallback
        document.getElementById('nav-avatar').src = avatarUrl;
    } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        document.getElementById('nav-avatar').src = 'http://localhost:5000/uploads/default-avatar.png'; // Fallback
    }
}

// Hàm chuyển hướng đến trang hồ sơ
function redirectToProfile() {
    window.location.href = '/profile/index.html'; // Đường dẫn đến trang hồ sơ
}

// Hàm tải chi tiết sản phẩm
async function loadProductDetails() {
    try {
        if (!productId) {
            console.error('Không tìm thấy ID sản phẩm trong URL.');
            return;
        }

        const response = await fetch(`http://localhost:5000/api/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`);
        const product = await response.json();

        // Cập nhật thông tin sản phẩm trên trang
        document.getElementById('product-img').src = product.imageUrl;
        document.getElementById('product-title').textContent = product.name;
        document.getElementById('product-description').textContent = product.description || 'Không có mô tả.';
        document.getElementById('product-price').textContent = `${product.price.toLocaleString()} VND/kg`;

        // Cập nhật các thumbnail (Ảnh 1, Ảnh 2, Ảnh 3)
        const thumbnails = document.querySelectorAll('.thumbnail');
        if (product.imageUrl1) thumbnails[0].src = product.imageUrl1;
        if (product.imageUrl2) thumbnails[1].src = product.imageUrl2;
        if (product.imageUrl3) thumbnails[2].src = product.imageUrl3;

        // Cập nhật hình ảnh minh họa
        const infoImage = document.querySelector('.info-image');
        if (product.illustrationUrl) {
            infoImage.src = product.illustrationUrl;
        } else {
            infoImage.src = "https://source.unsplash.com/600x400/?seafood"; // Fallback nếu không có hình minh họa
        }

        // Cập nhật thông tin bổ sung
        document.getElementById('product-origin').textContent = product.origin || 'Không có';
        document.getElementById('product-storage').textContent = product.storage || 'Không có';
        document.getElementById('product-weight').textContent = product.weight || 'Không có';

        // Thêm sự kiện cho nút "Thêm vào giỏ hàng"
        document.getElementById('add-to-cart').addEventListener('click', () => addToCart(product.name, product.price, product._id));
    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        alert(`Lỗi khi tải chi tiết sản phẩm: ${error.message}`);
    }
}

// Hàm thay đổi hình ảnh chính khi nhấn vào thumbnail
function changeMainImage(src) {
    document.getElementById('product-img').src = src;
}

// Hàm chuyển hướng đến trang chi tiết sản phẩm khác
function redirectToProductDetail(productId) {
    if (productId) {
        window.location.href = `/product-details/index.html?id=${productId}`;
    } else {
        window.location.href = "/product-details/index.html";
    }
}

function goToCart() {
    window.location.href = "../cart-page/index.html"; // Đường dẫn đến trang giỏ hàng
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(name, price, productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
            return;
        }

        // Lấy số lượng từ ô input
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value);
        if (isNaN(quantity) || quantity < 1) {
            alert("Số lượng không hợp lệ!");
            return;
        }

        // Gửi yêu cầu đến API để thêm sản phẩm
        const response = await fetch('http://localhost:5000/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity // Gửi số lượng người dùng nhập
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể thêm sản phẩm vào giỏ hàng!');
        }

        const data = await response.json();
        cartCount++;
        alert("Sản phẩm đã được thêm vào giỏ hàng!");
        
        // Cập nhật số lượng giỏ hàng trên giao diện
        document.getElementById('cart-count').textContent = cartCount;
        
        // Tải lại trang (tùy chọn)
        location.reload();
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

// Cập nhật số lượng giỏ hàng và tải chi tiết sản phẩm khi trang tải
document.addEventListener("DOMContentLoaded", async function () {
    loadUserProfile(); // Tải avatar
    loadProductDetails(); // Tải chi tiết sản phẩm
    // Lấy số lượng giỏ hàng từ server
    try {
        const response = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (response.ok) {
            const cart = await response.json();
            cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cart-count').textContent = cartCount;
        }
    } catch (error) {
        console.error('Lỗi khi lấy số lượng giỏ hàng:', error);
        document.getElementById('cart-count').textContent = '0';
    }
});