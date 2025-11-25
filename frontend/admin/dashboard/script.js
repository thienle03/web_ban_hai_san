document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra token đăng nhập
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn cần đăng nhập để truy cập trang này!");
      window.location.href = "../Auth/login.html";
      return;
    }
  
    // Điều hướng sidebar
    document.querySelectorAll(".sidebar ul li").forEach(item => {
      item.addEventListener("click", function () {
        const url = item.getAttribute("data-url");
        if (url) {
          window.location.href = url;
        }
      });
    });
  
    // Gọi ngay các hàm lấy số liệu khi trang load
    fetchUsersCount();
    fetchSellersCount();
    fetchProductsCount();
    // Các hàm fetch cho btn-orders và btn-revenue có thể bổ sung tương tự nếu có API
  
    // Tạo biểu đồ doanh thu
    createChart();
  });

  document.addEventListener("DOMContentLoaded", function () {
    // Hiển thị số lượng đơn hàng từ localStorage
    document.getElementById("total_orders").textContent = localStorage.getItem("totalOrders") || 0;

    // Hiển thị tổng doanh thu từ localStorage
    const revenue = localStorage.getItem("totalRevenue");
    document.getElementById("totalRevenue").textContent = parseInt(revenue || 0).toLocaleString() + " VND";

    // Gọi hàm tải dữ liệu
    loadDashboardData();
});
  
  // Hàm lấy số lượng người dùng từ API và cập nhật giao diện
  async function fetchUsersCount() {
    try {
      const token = localStorage.getItem("token");
      const API_URL = "http://localhost:5000/api/user/all"; // API lấy danh sách người dùng
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách người dùng!");
      }
      // Giả sử API trả về mảng người dùng hoặc có trong data.users
      const userList = data.users || data;
      const count = userList.length;
      document.getElementById("count-users").textContent = count;
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      alert(error.message || "Lỗi kết nối đến server!");
    }
  }
  
  // Hàm lấy số lượng người bán từ API và cập nhật giao diện
  async function fetchSellersCount() {
    try {
      const token = localStorage.getItem("token");
      const API_URL = "http://localhost:5000/api/user/sellers"; // API lấy danh sách người bán
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Lỗi khi tải danh sách người bán!");
      }
      // Giả sử danh sách người bán nằm trong data.data
      const sellers = data.data || [];
      const count = sellers.length;
      document.getElementById("count-sellers").textContent = count;
    } catch (error) {
      console.error("Lỗi khi tải danh sách người bán:", error);
      alert(error.message || "Lỗi kết nối đến server!");
    }
  }
  
  // Hàm lấy số lượng sản phẩm từ API và cập nhật giao diện
  async function fetchProductsCount() {
    try {
      const token = localStorage.getItem("token");
      const API_URL = "http://localhost:5000/api/products"; // API lấy danh sách sản phẩm
      console.log("Gửi yêu cầu đến: " + API_URL);
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.log("Phản hồi lỗi:", text);
        throw new Error(`Lỗi HTTP ${response.status}: ${text}`);
      }
      const products = await response.json();
      if (!products || !Array.isArray(products)) {
        console.error("Dữ liệu sản phẩm không hợp lệ:", products);
        throw new Error("Dữ liệu trả về không chứa danh sách sản phẩm!");
      }
      const count = products.length;
      document.getElementById("count-products").textContent = count;
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error.message);
      alert(`Không thể tải danh sách sản phẩm: ${error.message}`);
    }
  }
  
// ✅ Hàm lấy danh sách tất cả đơn hàng
async function loadDashboardData() {
  try {
      const token = localStorage.getItem("token");
      if (!token) {
          alert("Bạn chưa đăng nhập!");
          window.location.href = "../login/index.html";
          return;
      }

      // 📌 GỌI ĐÚNG API ĐƠN HÀNG
      const response = await fetch("http://localhost:5000/api/order/all", {
          method: "GET",
          headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          if (response.status === 401) {
              alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
              window.location.href = "../login/index.html";
              return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Lỗi tải đơn hàng");
      }

      const data = await response.json();
      const orders = data.orders || [];

      console.log("🛒 Tổng số đơn hàng:", orders.length);

      // Cập nhật dữ liệu lên giao diện
      updateDashboardStats(orders);
  } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      document.getElementById("total_orders").textContent = "Lỗi";
  }
}

// ✅ Cập nhật số đơn hàng & tổng doanh thu
function updateDashboardStats(orders) {
  const totalOrders = orders.length;

  // Tính tổng doanh thu
  const totalRevenue = orders.reduce((sum, order) => {
      const amount = parseInt(order.total.replace(/\D/g, ""), 10) || 0;
      return sum + amount;
  }, 0);

  // Lưu vào localStorage
  localStorage.setItem("totalOrders", totalOrders);
  localStorage.setItem("totalRevenue", totalRevenue);

  // Hiển thị lên giao diện
  document.getElementById("total_orders").textContent = totalOrders;
  document.getElementById("totalRevenue").textContent = totalRevenue.toLocaleString() + " VND";
}
  