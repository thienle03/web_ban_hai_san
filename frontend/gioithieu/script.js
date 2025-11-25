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
  loadProfileAvatar();

