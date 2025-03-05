const API_URL = "http://localhost:5000/api/auth";

const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const container = document.getElementById("container");

// Chuyển đổi giữa đăng ký và đăng nhập
registerBtn.addEventListener("click", () => container.classList.add("active"));
loginBtn.addEventListener("click", () => container.classList.remove("active"));

// Hàm xử lý gửi request đến API
const sendRequest = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(`Response từ ${endpoint}:`, result);

    return { success: response.ok, data: result };
  } catch (error) {
    console.error(`Lỗi khi gọi API ${endpoint}:`, error);
    return { success: false, message: "Lỗi kết nối đến server!" };
  }
};

// Xử lý đăng ký (Sign Up)
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.querySelector(".sign-up input[name='name']").value;
  if (name.length < 6) {
    alert("Tên phải có ít nhất 6 ký tự!");
    return;
  }
  const email = document.querySelector(".sign-up input[name='email']").value;
  const password = document.querySelector(".sign-up input[name='password']").value;
  const phone = document.querySelector(".sign-up input[name='phone']").value;
  const address = document.querySelector(".sign-up input[name='address']").value;
  const role = document.querySelector(".sign-up select[name='role']").value.toLowerCase();

  const validRoles = ["user", "seller"];
  if (!validRoles.includes(role)) {
    alert("Vai trò không hợp lệ! Hãy chọn 'user' hoặc 'seller'.");
    return;
  }

  const { success, data } = await sendRequest("register", { name, email, password, phone, address, role });

  if (success) {
    alert("Đăng ký thành công! Hãy đăng nhập.");
    container.classList.remove("active");
    document.getElementById("registerForm").reset();
  } else {
    alert(data.message || "Đăng ký thất bại!");
  }
});

// Xử lý đăng nhập (Sign In)
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector(".sign-in input[name='email']").value;
  const password = document.querySelector(".sign-in input[name='password']").value;

  const { success, data } = await sendRequest("login", { email, password });

  if (success) {
    console.log("Dữ liệu người dùng trả về từ API:", data);

    // Kiểm tra nếu 'data.user' có tồn tại và có thuộc tính 'role'
    if (data.user && data.user.role) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Đăng nhập thành công!");

        // Kiểm tra vai trò của người dùng và điều hướng tương ứng
        const userRole = data.user.role;
        if (userRole === "admin") {
            window.location.href = "../admin/dashboard/index.html";
        } else if (userRole === "seller") {
            window.location.href = "../seller-page/dashboard/index.html";
        } else if (userRole === "user") {
            window.location.href = "../Page/index.html";
        } else {
            alert("Vai trò người dùng không hợp lệ!");
        }
    } else {
        // Xử lý khi dữ liệu người dùng không hợp lệ hoặc không có vai trò
        console.error("Dữ liệu người dùng không hợp lệ:", data.user);
        alert("Thông tin người dùng không hợp lệ!");
    }
} else {
    alert(data.message || "Sai thông tin đăng nhập!");
}


});
