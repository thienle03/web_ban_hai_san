let cart = [];
let cartContainer = document.getElementById("cart-container");
let cartCount = document.getElementById("cart-count");
let cartItems = document.getElementById("cart-items");
let cartTotal = document.getElementById("cart-total");

//thong tin san pham
function redirectToDetail() {
    window.location.href = "../product-delist/index.html";
}

// Thêm sản phẩm vào giỏ hàng
function addToCart(name, price) {
    cart.push({ name, price });
    updateCart();
}

// Cập nhật giỏ hàng
function updateCart() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        let li = document.createElement("li");
        li.innerHTML = `<a href="../product-details/index.html?name=${encodeURIComponent(item.name)}">${item.name}</a> - ${item.price} VND 
                        <button onclick="removeFromCart(${index})">❌</button>`;
        cartItems.appendChild(li);
    });
    cartTotal.innerText = total;
    cartCount.innerText = cart.length;
}

// Xóa sản phẩm khỏi giỏ hàng
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Xóa toàn bộ giỏ hàng
function clearCart() {
    cart = [];
    updateCart();
}

// Hiện/Ẩn giỏ hàng
function toggleCart() {
    cartContainer.style.display = cartContainer.style.display === "block" ? "none" : "block";
}

//chuyen den trang profile
function redirectToProfile() {
    window.location.href = "../user-profile-page/index.html";
}
document.addEventListener("DOMContentLoaded", function () {
    loadProfileAvatar();
});

async function loadProfileAvatar() {
    const API_URL = "http://localhost:5000/api/user";
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const user = await response.json();

        if (response.ok) {
            const avatarPath = user.avatar
                ? `http://localhost:5000${user.avatar}`
                : "http://localhost:5000/uploads/default-avatar.png";

            document.getElementById("nav-avatar").src = avatarPath;
        }
    } catch (error) {
        console.error("Lỗi khi tải avatar:", error);
    }
}

