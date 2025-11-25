document.addEventListener("DOMContentLoaded", function () {
    // Điều hướng sidebar
    document.querySelectorAll(".sidebar ul li").forEach(item => {
        item.addEventListener("click", function () {
            const url = item.getAttribute("data-url");
            if (url) {
                window.location.href = url;
            }
        });
    });

});
document.getElementById("logout-button").addEventListener("click", function () {
    localStorage.removeItem("token"); 
    localStorage.removeItem("userProfile"); 
    alert("Bạn đã đăng xuất thành công!");
    window.location.href = "../../login-page/index.html";
});