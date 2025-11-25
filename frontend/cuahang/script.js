// Mảng lưu tất cả sản phẩm sau khi fetch
let products = [];

// Trạng thái hiện tại của bộ lọc và sắp xếp
let currentCategory = "all";
let currentSort = "none";

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('query');
let currentPage = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set search query in input if it exists
    const searchInput = document.getElementById('search-bar');
    if (searchQuery) {
        searchInput.value = searchQuery;
        performSearch();
    } else {
        loadAllProducts(); // Load all products if no search query
    }
    
    // Load user data
    loadProfileAvatar();
    updateCart();
});

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

// Hàm gọi API lấy danh sách sản phẩm
async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:5000/api/products");
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy sản phẩm: ${response.status}`);
    }
    let rawProducts = await response.json();

    // Gán trường category dựa trên tên sản phẩm
    products = rawProducts.map(product => {
      product.category = getCategoryFromName(product.name);
      return product;
    });

    render();
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
  }
}

// Hàm xác định danh mục dựa trên từ khóa trong tên sản phẩm
function getCategoryFromName(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("tôm")) {
    return "Tôm";
  } else if (lowerName.includes("hùm")) {
    return "Hùm";
  } else if (lowerName.includes("cua") || lowerName.includes("ghẹ")) {
    return "Cua và Ghẹ";
  } else if (lowerName.includes("cá")) {
    return "Cá biển";
  } else if (lowerName.includes("mực") || lowerName.includes("bạch tuộc")) {
    return "Mực và Bạch Tuộc";
  } else if (lowerName.includes("sò") || lowerName.includes("ốc")) {
    return "Sò và Ốc";
  }
  return "Khác";
}

// Hàm render: lọc, sắp xếp và hiển thị sản phẩm
function render() {
  let filteredProducts = currentCategory === "all"
    ? products
    : products.filter(product => product.category === currentCategory);

  if (currentSort === "low-to-high") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (currentSort === "high-to-low") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  filteredProducts.forEach(product => {
    const productElement = document.createElement("div");
    productElement.classList.add("product");
    productElement.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">${product.price.toLocaleString()} VND</p>
    `;
    // Khi bấm vào sản phẩm, mở modal hiển thị chi tiết sản phẩm
    productElement.addEventListener("click", () => openProductModal(product._id));
    productList.appendChild(productElement);
  });
}

// Hàm lọc theo danh mục
function filterProducts(category) {
  currentCategory = category;
  render();
}

// Hàm sắp xếp theo giá
function sortProducts() {
  const sortValue = document.getElementById("sort").value;
  currentSort = sortValue === "latest" ? "none" : sortValue;
  render();
}

// Hàm mở modal để hiển thị chi tiết sản phẩm
async function openProductModal(productId) {
  try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const product = await response.json();

    // Cập nhật nội dung modal với chi tiết sản phẩm
    document.getElementById("modal-product-img").src = `${product.imageUrl}`;
    document.getElementById("modal-product-title").textContent = product.name;
    document.getElementById("modal-product-description").textContent = product.description || "Không có mô tả.";
    document.getElementById("modal-product-price").textContent = `${product.price.toLocaleString()} VND/kg`;

    // Reset số lượng về 1
    document.getElementById("modal-quantity").value = 1;

    // Gán sự kiện cho nút Thêm vào giỏ hàng trong modal
    document.getElementById("modal-add-to-cart").onclick = () => addToCartFromModal(product._id);
    // Gán sự kiện cho nút Mua ngay trong modal
    document.getElementById("modal-buy-now").onclick = () => buyNowFromModal(product._id);

    // Hiển thị modal
    document.getElementById("product-modal").style.display = "block";
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    alert(`Lỗi khi tải chi tiết sản phẩm: ${error.message}`);
  }
}

// Hàm đóng modal
function closeModal() {
  document.getElementById("product-modal").style.display = "none";
}

// Hàm thêm sản phẩm vào giỏ hàng từ modal (không chuyển hướng)
async function addToCartFromModal(productId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    if (isNaN(quantity) || quantity < 1) {
      alert("Số lượng không hợp lệ!");
      return;
    }
    const response = await fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        productId: productId,
        quantity: quantity
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể thêm sản phẩm vào giỏ hàng!");
    }
    alert("Sản phẩm đã được thêm vào giỏ hàng!");
    closeModal();
    updateCartCount();
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    alert(`Lỗi: ${error.message}`);
  }
}

// Hàm mua ngay: thêm sản phẩm vào giỏ hàng và chuyển hướng sang trang giỏ hàng
async function buyNowFromModal(productId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    if (isNaN(quantity) || quantity < 1) {
      alert("Số lượng không hợp lệ!");
      return;
    }
    const response = await fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        productId: productId,
        quantity: quantity
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể thêm sản phẩm vào giỏ hàng!");
    }
    // Sau khi thêm thành công, chuyển hướng sang trang giỏ hàng để thanh toán
    window.location.href = "../cart-page/index.html";
  } catch (error) {
    console.error("Lỗi khi mua ngay:", error);
    alert(`Lỗi: ${error.message}`);
  }
}

// Hàm cập nhật số lượng giỏ hàng hiển thị ở header
async function updateCartCount() {
  try {
    const response = await fetch('http://localhost:5000/api/cart', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const cart = await response.json();
    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    document.getElementById("cart-count").textContent = count;
  } catch (error) {
    console.error(error);
    document.getElementById("cart-count").textContent = "0";
  }
}

// Perform search with filters
async function performSearch() {
    try {
        const category = document.getElementById('category-filter')?.value || '';
        const minPrice = document.getElementById('min-price')?.value || '';
        const maxPrice = document.getElementById('max-price')?.value || '';
        const sortBy = document.getElementById('sort-by')?.value || '';

        // Show loading state
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '<div class="loading">Đang tải...</div>';

        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12
        });

        if (searchQuery) params.append('query', searchQuery);
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);

        // Handle sorting
        if (sortBy === 'price-asc') {
            params.append('sortBy', 'price');
            params.append('sortOrder', 'asc');
        } else if (sortBy === 'price-desc') {
            params.append('sortBy', 'price');
            params.append('sortOrder', 'desc');
        } else if (sortBy === 'name') {
            params.append('sortBy', 'name');
            params.append('sortOrder', 'asc');
        }

        const response = await fetch(`http://localhost:5000/api/search?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
            displayProducts(data.data.products);
            updatePagination(data.data.pagination);
            updateSearchStats(data.data.pagination.totalItems);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Search error:', error);
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = `
            <div class="error-message">
                Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.
            </div>
        `;
    }
}

// Load all products when no search query
async function loadAllProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in grid
function displayProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" onclick="redirectToProductDetail('${product._id}')">
            <h3>${product.name}</h3>
            <div class="price">${product.price.toLocaleString()} VND</div>
            <div class="category">${product.category || 'Chưa phân loại'}</div>
            <div class="shop-info">
                <p class="shop-name">${product.name_shop || 'Shop chưa đặt tên'}</p>
                <p class="shop-address">${product.address_shop || 'Chưa có địa chỉ'}</p>
            </div>
            <div class="buttons">
                <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price}, '${product._id}')">
                    🛒 Thêm vào giỏ
                </button>
                <button class="buy-now" onclick="redirectToProductDetail('${product._id}')">
                    Mua Ngay
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Update search statistics
function updateSearchStats(totalItems) {
    const stats = document.getElementById('search-stats');
    if (stats) {
        stats.textContent = `Tìm thấy ${totalItems} sản phẩm${searchQuery ? ` cho "${searchQuery}"` : ''}`;
    }
}

// Update pagination
function updatePagination(pagination) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;

    paginationElement.innerHTML = '';

    // Previous page button
    if (pagination.currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '←';
        prevButton.onclick = () => {
            currentPage--;
            performSearch();
            window.scrollTo(0, 0);
        };
        paginationElement.appendChild(prevButton);
    }

    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === pagination.currentPage ? 'active' : '';
        pageButton.onclick = () => {
            if (i !== pagination.currentPage) {
                currentPage = i;
                performSearch();
                window.scrollTo(0, 0);
            }
        };
        paginationElement.appendChild(pageButton);
    }

    // Next page button
    if (pagination.hasMore) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '→';
        nextButton.onclick = () => {
            currentPage++;
            performSearch();
            window.scrollTo(0, 0);
        };
        paginationElement.appendChild(nextButton);
    }
}

// Apply filters
function applyFilters() {
    currentPage = 1; // Reset to first page when filters change
    performSearch();
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add event listeners for price inputs
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');
if (minPriceInput && maxPriceInput) {
    minPriceInput.addEventListener('input', debounce(() => applyFilters(), 500));
    maxPriceInput.addEventListener('input', debounce(() => applyFilters(), 500));
}

// Search function
function search() {
    const query = document.getElementById('search-bar').value.trim();
    if (query) {
        window.location.href = `?query=${encodeURIComponent(query)}`;
    }
}

// Redirect to product detail
function redirectToProductDetail(productId) {
    window.location.href = `../product-detail/index.html?id=${productId}`;
}

// Thiết lập sự kiện sau khi DOM tải xong
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  updateCartCount();

  // Sự kiện đóng modal khi bấm vào nút "×"
  document.getElementById("modal-close").addEventListener("click", closeModal);

  // Đóng modal khi click ra ngoài vùng nội dung modal
  window.addEventListener("click", function(event) {
    if (event.target === document.getElementById("product-modal")) {
      closeModal();
    }
  });
});