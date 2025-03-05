const products = [
    { id: 1, name: "Tôm Hùm Alaska", category: "Tôm hùm", price: 1200000, image: "assets/images/tom-hum.jpg" },
    { id: 2, name: "Cua Hoàng Đế", category: "Cua và Ghẹ", price: 1500000, image: "assets/images/cua-hoang-de.jpg" },
    { id: 3, name: "Cá Ngừ Đại Dương", category: "Cá biển", price: 700000, image: "assets/images/ca-ngu.jpg" },
    { id: 4, name: "Mực Nang", category: "Mực và Bạch Tuộc", price: 450000, image: "assets/images/muc-nang.jpg" },
    { id: 5, name: "Sò Điệp Nướng", category: "Sò và Ốc", price: 350000, image: "assets/images/so-diep.jpg" }
];

function displayProducts(filterCategory = "all") {
    const productList = document.getElementById("product-list");
    productList.innerHTML = "";

    const filteredProducts = filterCategory === "all" ? products : products.filter(p => p.category === filterCategory);

    filteredProducts.forEach(product => {
        const productElement = document.createElement("div");
        productElement.classList.add("product");
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">${product.price.toLocaleString()} VND</p>
        `;
        productList.appendChild(productElement);
    });
}

function filterProducts(category) {
    displayProducts(category);
}

function sortProducts() {
    const sortBy = document.getElementById("sort").value;
    
    if (sortBy === "low-to-high") {
        products.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-to-low") {
        products.sort((a, b) => b.price - a.price);
    }

    displayProducts();
}

document.addEventListener("DOMContentLoaded", () => {
    displayProducts();
});
