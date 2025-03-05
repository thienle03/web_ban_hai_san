document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});

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
            document.getElementById("full-name").value = user.name;
            document.getElementById("email").value = user.email;
            document.getElementById("phone").value = user.phone;
            document.getElementById("address").value = user.address;
            document.getElementById("profile-avatar").src = user.avatar 
                ? `http://localhost:5000${user.avatar}` 
                : "default-avatar.png";

            // 🔹 Lưu vào localStorage (tùy chọn)
            localStorage.setItem("userProfile", JSON.stringify(user));
        } else {
            alert(user.message || "Không thể tải hồ sơ!");
        }
    } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error);
        alert("Lỗi kết nối đến server!");
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
            localStorage.setItem("userProfile", JSON.stringify(result.user)); // Cập nhật localStorage
        } else {
            alert(result.message || "Cập nhật thất bại!");
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ:", error);
        alert("Lỗi kết nối đến server!");
    }
}

// 🚀 Upload avatar
document.getElementById("avatar-upload").addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const response = await fetch(`${API_URL}/upload-avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const result = await response.json();
        console.log("Avatar URL từ server:", result.avatarUrl); // Debug log

        if (response.ok && result.avatarUrl) {
            const avatarPath = result.avatarUrl.startsWith("/")
                ? `http://localhost:5000${result.avatarUrl}`
                : `http://localhost:5000/uploads/${result.avatarUrl}`;

            document.getElementById("profile-avatar").src = avatarPath;
            alert("Cập nhật avatar thành công!");
        } else {
            alert(result.message || "Lỗi khi cập nhật avatar!");
        }
    } catch (error) {
        console.error("Lỗi khi upload avatar:", error);
        alert("Lỗi kết nối đến server!");
    }
});


