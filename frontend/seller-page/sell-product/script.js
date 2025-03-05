document.addEventListener('DOMContentLoaded', function () {
    // Get seller info and token from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Debug: Log user and token info
    console.log('Current user:', user);
    console.log('Token exists:', !!token);

    // Kiểm tra quyền seller
    if (!user || user.role !== 'seller') {
        alert('Bạn cần đăng nhập với vai trò seller để truy cập trang này.');
        window.location.href = '../login/index.html';
        return;
    }

    const form = document.querySelector('#sellForm');
    const productList = document.getElementById('productList');

    // Xử lý gửi form để thêm sản phẩm
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form data
        const name = document.getElementById('productName').value.trim();
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productQuantity').value;
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim();
        const origin = document.getElementById('productOrigin').value.trim();
        const storage = document.getElementById('productStorage').value.trim();
        const weight = document.getElementById('productWeight').value.trim();

        if (!name || !price || !stock || !category) {
            alert('Vui lòng điền đầy đủ thông tin sản phẩm!');
            return;
        }
        if (isNaN(price) || isNaN(stock) || price <= 0 || stock <= 0) {
            alert('Giá và số lượng phải là số dương!');
            return;
        }

        const formData = new FormData(form);

        try {
            const response = await fetch('http://localhost:5000/api/products/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            console.log('Add product response:', result);

            if (response.ok) {
                alert(result.message);
                form.reset(); // Reset form sau khi thêm thành công
                loadProducts(); // Cập nhật danh sách sản phẩm
            } else {
                alert('Thêm sản phẩm thất bại: ' + result.message);
            }
        } catch (error) {
            console.error('Lỗi kết nối API:', error);
            alert('Có lỗi xảy ra khi kết nối đến server: ' + error.message);
        }
    });

    // Hàm load danh sách sản phẩm của seller
    async function loadProducts() {
        try {
            console.log('Fetching products with token:', token);

            const response = await fetch('http://localhost:5000/api/products/my-products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
                    window.location.href = '../login/index.html';
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi tải sản phẩm');
            }

            const products = await response.json();
            console.log('Loaded products:', products);

            productList.innerHTML = '';

            if (products.length === 0) {
                productList.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">Chưa có sản phẩm nào</td>
                    </tr>
                `;
                return;
            }

            products.forEach((product) => {
                productList.innerHTML += `
                    <tr>
                        <td><img src="http://localhost:5000${product.imageUrl}" alt="${product.name}" class="product-image"></td>
                        <td>${product.name}</td>
                        <td>${product.price.toLocaleString('vi-VN')} VND</td>
                        <td>${product.stock}</td>
                        <td>${product.category}</td>
                        <td>${product.origin || 'Không có'}</td>
                        <td>${product.storage || 'Không có'}</td>
                        <td>${product.weight || 'Không có'}</td>
                        <td>
                            <button onclick="editProduct('${product._id}')" class="edit-btn">✏️ Sửa</button>
                            <button onclick="deleteProduct('${product._id}')" class="delete-btn">❌ Xóa</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Lỗi tải sản phẩm:', error);
            productList.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-red-500">
                        Có lỗi xảy ra khi tải sản phẩm: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // Hàm xóa sản phẩm
    window.deleteProduct = async function (productId) {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    loadProducts(); // Cập nhật danh sách sau khi xóa
                } else {
                    alert('Lỗi xóa sản phẩm: ' + result.message);
                }
            } catch (error) {
                console.error('Lỗi xóa sản phẩm:', error);
                alert('Có lỗi xảy ra khi xóa sản phẩm: ' + error.message);
            }
        }
    };

    // Hàm chỉnh sửa sản phẩm (placeholder, cần tạo trang chỉnh sửa)
    window.editProduct = async function (productId) {
        alert('Chức năng đang được phát triển. Vui lòng sử dụng Postman hoặc backend để chỉnh sửa.');
        // Có thể chuyển hướng đến trang chỉnh sửa (edit-product.html) nếu cần
        // window.location.href = `edit-product.html?id=${productId}`;
    };

    // Load danh sách sản phẩm khi trang tải
    loadProducts();

    // Xử lý sidebar navigation
    document.querySelectorAll('#menu li').forEach(item => {
        item.addEventListener('click', function () {
            const url = this.getAttribute('data-url');
            if (url) {
                console.log('Chuyển hướng tới:', url);
                window.location.href = url; // Chuyển hướng trang
            }
        });
    });
});