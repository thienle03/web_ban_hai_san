// Khai báo biến toàn cục
let cartCount = 0;
let cartContainer = document.getElementById("cart-container");
let cartCountElement = document.getElementById("cart-count");
let cartItems = document.getElementById("cart-items");
let cartTotal = document.getElementById("cart-total");

let currentPageNew = 1; // Trang hiện tại cho "Hải Sản Mới"
let currentPageFeatured = 1; // Trang hiện tại cho "Sản Phẩm Nổi Bật"
const initialNewProducts = 10; // Hiển thị 10 sản phẩm đầu tiên
const midNewProducts = 20; // Hiển thị 20 sản phẩm sau lần nhấn "Xem thêm" đầu tiên
const additionalNewProducts = 5; // Hiển thị thêm 5 sản phẩm mỗi lần nhấn "Xem thêm" sau 20 sản phẩm
const minNewProducts = 5; // Hiển thị 5 sản phẩm khi thu gọn
const itemsPerPageFeatured = 5; // Số sản phẩm mỗi lần tải cho "Sản Phẩm Nổi Bật"

// Hàm tải sản phẩm mới từ backend với giới hạn 10 sản phẩm ban đầu
async function loadNewProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products/new');
        if (!response.ok) throw new Error('Lỗi khi tải sản phẩm');
        const newProducts = await response.json();

        const productList = document.getElementById('new-products');
        productList.innerHTML = ''; // Xóa danh sách cũ

        const initialProducts = newProducts.slice(0, initialNewProducts); // Chỉ lấy 10 sản phẩm đầu tiên
        initialProducts.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.setAttribute('data-id', product._id); // Thêm ID sản phẩm
            productDiv.setAttribute('onclick', `redirectToProductDetail('${product._id}')`); // Thêm sự kiện onclick
            productDiv.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Giá: ${product.price.toLocaleString()} VND/kg</p>
                <div class="buttons">
                    <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product._id}')">🛒</button>
                    <button class="buy-now" onclick="redirectToProductDetail('${product._id}')">Mua Ngay</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });

        // Hiển thị nút "Xem thêm" nếu có hơn 10 sản phẩm, và nút "Thu gọn" nếu có hơn 5 sản phẩm
        const loadMoreBtn = document.getElementById('loadMoreNew');
        const collapseBtn = document.getElementById('collapseNew');
        loadMoreBtn.style.display = (newProducts.length > initialNewProducts) ? 'block' : 'none';
        collapseBtn.style.display = (initialNewProducts > minNewProducts) ? 'block' : 'none';
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm mới:', error);
    }
}

// Hàm tải thêm sản phẩm mới khi nhấn "Xem thêm"
async function loadMoreProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products/new');
        if (!response.ok) throw new Error('Lỗi khi tải sản phẩm');
        const newProducts = await response.json();

        const productList = document.getElementById('new-products');
        const currentProductsCount = productList.children.length;

        let nextProducts;
        if (currentProductsCount < midNewProducts) {
            nextProducts = newProducts.slice(currentProductsCount, midNewProducts);
        } else {
            nextProducts = newProducts.slice(currentProductsCount, currentProductsCount + additionalNewProducts);
        }

        nextProducts.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.setAttribute('data-id', product._id); // Thêm ID sản phẩm
            productDiv.setAttribute('onclick', `redirectToProductDetail('${product._id}')`); // Thêm sự kiện onclick
            productDiv.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Giá: ${product.price.toLocaleString()} VND/kg</p>
                <div class="buttons">
                    <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product._id}')">🛒</button>
                    <button class="buy-now" onclick="redirectToProductDetail('${product._id}')">Mua Ngay</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });

        // Cập nhật nút "Xem thêm" và "Thu gọn"
        const loadMoreBtn = document.getElementById('loadMoreNew');
        const collapseBtn = document.getElementById('collapseNew');
        loadMoreBtn.style.display = (productList.children.length < newProducts.length) ? 'block' : 'none';
        collapseBtn.style.display = (productList.children.length > minNewProducts) ? 'block' : 'none';
    } catch (error) {
        console.error('Lỗi khi tải thêm sản phẩm mới:', error);
    }
}

// Hàm thu gọn về 5 sản phẩm đầu tiên
async function collapseProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products/new');
        if (!response.ok) throw new Error('Lỗi khi tải sản phẩm');
        const newProducts = await response.json();

        const productList = document.getElementById('new-products');
        productList.innerHTML = ''; // Xóa danh sách cũ

        const collapsedProducts = newProducts.slice(0, minNewProducts); // Chỉ lấy 5 sản phẩm đầu tiên
        collapsedProducts.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.setAttribute('data-id', product._id); // Thêm ID sản phẩm
            productDiv.setAttribute('onclick', `redirectToProductDetail('${product._id}')`); // Thêm sự kiện onclick
            productDiv.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Giá: ${product.price.toLocaleString()} VND/kg</p>
                <div class="buttons">
                    <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product._id}')">🛒</button>
                    <button class="buy-now" onclick="redirectToProductDetail('${product._id}')">Mua Ngay</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });

        // Cập nhật nút "Xem thêm" và "Thu gọn"
        const loadMoreBtn = document.getElementById('loadMoreNew');
        const collapseBtn = document.getElementById('collapseNew');
        loadMoreBtn.style.display = (newProducts.length > minNewProducts) ? 'block' : 'none';
        collapseBtn.style.display = 'none';
    } catch (error) {
        console.error('Lỗi khi thu gọn sản phẩm:', error);
    }
}

// Hàm tải sản phẩm nổi bật từ backend với phân trang
async function loadMoreFeaturedProducts(category = 'all', reset = false) {
    try {
        const response = await fetch(`http://localhost:5000/api/products/featured?category=${category}&page=${currentPageFeatured}&limit=${itemsPerPageFeatured}`);
        if (!response.ok) throw new Error(`Lỗi HTTP! status: ${response.status}, message: ${await response.text()}`);

        const { products, total } = await response.json();
        const productList = document.getElementById('featured-products');

        if (reset) {
            productList.innerHTML = ""; // Xóa danh sách cũ nếu lọc mới
            currentPageFeatured = 1; // Reset trang khi lọc
        }

        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            productDiv.setAttribute('data-id', product._id);
            productDiv.setAttribute('data-category', product.category || 'all');
            productDiv.setAttribute('onclick', `redirectToProductDetail('${product._id}')`);

            productDiv.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p><del>${(product.price + 20000).toLocaleString()} VND</del> <strong>${product.price.toLocaleString()} VND</strong></p>
                <p><strong>Shop:</strong> ${product.name_shop || 'Không có thông tin'}</p>
                <p><strong>Địa chỉ:</strong> ${product.address_shop || 'Không có thông tin'}</p>
                <div class="buttons">
                    <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product._id}')">🛒</button>
                    <button class="buy-now" onclick="redirectToProductDetail('${product._id}')">Mua Ngay</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });

        // Ẩn nút "Xem thêm" nếu đã tải hết sản phẩm
        const loadMoreBtn = document.getElementById('loadMoreFeatured');
        if (currentPageFeatured * itemsPerPageFeatured >= total) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
            currentPageFeatured++; // Tăng số trang để load thêm sản phẩm
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm nổi bật:', error);
        alert(`Lỗi khi tải sản phẩm nổi bật: ${error.message}`);
    }
}

// Hàm lọc sản phẩm nổi bật
function filterProducts(category) {
    currentPageFeatured = 1; // Reset trang khi lọc
    loadMoreFeaturedProducts(category, true); // Reset và tải lại với category mới
}

// Hàm chuyển hướng đến trang chi tiết sản phẩm với dữ liệu
function redirectToProductDetail(productId) {
    if (productId) {
        window.location.href = `../product-delist/index.html?id=${productId}`;
    } else {
        window.location.href = "../product-delist/index.html";
    }
}

// Thêm sản phẩm vào giỏ hàng từ server
async function addToCart(name, price, productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
            return;
        }

        const response = await fetch('http://localhost:5000/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1 // Mặc định thêm 1 sản phẩm
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể thêm sản phẩm vào giỏ hàng!');
        }

        const data = await response.json();
        alert(`Đã thêm 1 ${name} vào giỏ hàng!`);
        await updateCart(); // Cập nhật giỏ hàng ngay lập tức
        setTimeout(() => {
            window.location.href = '../cart-page/index.html';
        }, 100);
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

// Cập nhật và hiển thị giỏ hàng từ server
async function updateCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Chưa đăng nhập, không tải giỏ hàng.');
            cartCountElement.textContent = '0';
            cartContainer.style.display = 'none';
            return;
        }

        const response = await fetch('http://localhost:5000/api/cart', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (!response.ok) throw new Error('Không thể tải giỏ hàng!');
        const cart = await response.json();

        cartItems.innerHTML = '';
        let totalPrice = 0;

        if (cart.items.length === 0) {
            cartItems.innerHTML = '<li>Giỏ hàng trống!</li>';
            cartContainer.classList.add('empty');
            cartContainer.style.display = 'block'; // Hiển thị khi trống
        } else {
            cartContainer.classList.remove('empty');
            cart.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${item.productId.name} - ${item.quantity} x ${item.productId.price.toLocaleString()} VND
                    <button onclick="removeFromCart('${item.productId._id}')">❌</button>
                `;
                cartItems.appendChild(li);
                totalPrice += item.productId.price * item.quantity;
            });
            cartContainer.style.display = 'block';
        }

        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = cartCount;
        cartTotal.textContent = totalPrice.toLocaleString();
    } catch (error) {
        console.error('Lỗi khi tải giỏ hàng:', error);
        alert('Có lỗi khi tải giỏ hàng: ' + error.message);
        cartCountElement.textContent = '0';
        cartContainer.style.display = 'none';
    }
}

// Xóa sản phẩm khỏi giỏ hàng từ server
async function removeFromCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để xóa sản phẩm!");
            return;
        }

        const response = await fetch(`http://localhost:5000/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Không thể xóa sản phẩm!');
        await updateCart(); // Cập nhật giỏ hàng sau khi xóa
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Có lỗi khi xóa sản phẩm: ' + error.message);
    }
}

// Xóa toàn bộ giỏ hàng từ server
async function clearCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Vui lòng đăng nhập để xóa giỏ hàng!");
            return;
        }

        const response = await fetch('http://localhost:5000/api/cart/clear', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Không thể xóa giỏ hàng!');
        await updateCart(); // Cập nhật giỏ hàng sau khi xóa
    } catch (error) {
        console.error('Lỗi khi xóa giỏ hàng:', error);
        alert('Có lỗi khi xóa giỏ hàng: ' + error.message);
    }
}

// Hiện/Ẩn giỏ hàng
function toggleCart() {
    cartContainer.style.display = cartContainer.style.display === "block" ? "none" : "block";
}

// Chuyển đến trang profile
function redirectToProfile() {
    window.location.href = "../user-profile-page/index.html";
}

// Tải avatar người dùng
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

// Sự kiện khi trang tải xong
document.addEventListener("DOMContentLoaded", async function () {
    loadNewProducts(); // Tải 10 sản phẩm đầu tiên cho "Hải Sản Mới"
    loadMoreFeaturedProducts('all', true); // Tải 5 sản phẩm đầu tiên cho "Sản Phẩm Nổi Bật" với reset
    await updateCart(); // Tải giỏ hàng từ server
    loadProfileAvatar(); // Tải avatar
});