document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});

// Lưu thông tin hồ sơ vào localStorage
function saveProfile() {
    let user = {
        name: document.getElementById("full-name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        avatar: document.getElementById("profile-avatar").src
    };
    localStorage.setItem("userProfile", JSON.stringify(user));
    alert("Thông tin đã được lưu!");
}

// Tải thông tin hồ sơ từ localStorage
function loadProfile() {
    let user = JSON.parse(localStorage.getItem("userProfile"));
    if (user) {
        document.getElementById("full-name").value = user.name;
        document.getElementById("email").value = user.email;
        document.getElementById("phone").value = user.phone;
        document.getElementById("address").value = user.address;
        document.getElementById("profile-avatar").src = user.avatar;
    }
}

// Đổi ảnh đại diện
document.getElementById("avatar-upload").addEventListener("change", function (event) {
    let reader = new FileReader();
    reader.onload = function () {
        document.getElementById("profile-avatar").src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
});
