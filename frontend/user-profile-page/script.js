document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây
// 🔥 API Endpoint
const API_URL = "http://localhost:5000/api/user";
const token = localStorage.getItem("token");

if (!token) {
    alert("Bạn cần đăng nhập để truy cập trang cá nhân!");
    window.location.href = "../Auth/login.html";
}

// 🚀 Lấy thông tin hồ sơ từ server
async function loadProfile() {
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
            document.getElementById("full-name").value = user.name || "";
            document.getElementById("email").value = user.email || "";
            document.getElementById("phone").value = user.phone || "";
            document.getElementById("address").value = user.address || "";
            // Gán trực tiếp URL từ Cloudinary
            const avatarImg = document.getElementById("profile-avatar");
            avatarImg.src = user.avatar || "default-avatar.png";
            console.log("Avatar URL từ profile:", user.avatar);

            // Xử lý lỗi tải ảnh
            avatarImg.onerror = function () {
                console.error("Không tải được ảnh từ:", avatarImg.src);
                this.src = "default-avatar.png";
            };

            localStorage.setItem("userProfile", JSON.stringify(user));
        } else {
            alert(user.message || "Không thể tải hồ sơ!");
        }
    } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error.message);
        alert("Lỗi kết nối đến server: " + error.message);
    }
}

// 🚀 Lưu thông tin hồ sơ lên server
async function saveProfile() {
    let updatedUser = {
        name: document.getElementById("full-name").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
    };

    try {
        const response = await fetch(`${API_URL}/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedUser),
        });

        const result = await response.json();

        if (response.ok) {
            alert("Cập nhật thông tin thành công!");
            localStorage.setItem("userProfile", JSON.stringify(result.user));
        } else {
            alert(result.message || "Cập nhật thất bại!");
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ:", error.message);
        alert("Lỗi kết nối đến server: " + error.message);
    }
}

// 🚀 Upload avatar
document.getElementById("avatar-upload").addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
    
        console.log("Bắt đầu gửi request upload avatar...");
        const response = await fetch(`${API_URL}/upload-avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
            signal: controller.signal
        });
    
        console.log("Nhận được response:", response);
        clearTimeout(timeoutId);
        const result = await response.json();
        console.log("Dữ liệu trả về từ server:", result);
    
        if (response.ok && result.avatarUrl) {
            const avatarImg = document.getElementById("profile-avatar");
            avatarImg.src = result.avatarUrl;
            console.log("Cập nhật avatar URL thành công:", result.avatarUrl);
            alert("Cập nhật avatar thành công!");
            loadProfile();
        } else {
            console.error("Lỗi từ server:", result.message);
            alert(result.message || "Lỗi khi cập nhật avatar!");
        }
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        if (error.name === "AbortError") {
            console.log("Yêu cầu bị hủy do timeout.");
            alert("Yêu cầu timeout. Vui lòng thử lại!");
        } else {
            console.log("Lỗi khác:", error.message);
            //alert("Lỗi kết nối đến server: " + error.message);
        }
        // Kiểm tra lại profile để đảm bảo avatar được cập nhật
        //loadProfile();
    }
});
// 🚀 Đăng xuất
document.getElementById("logout-button").addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    alert("Bạn đã đăng xuất thành công!");
    window.location.href = "../login-page/index.html";
  });