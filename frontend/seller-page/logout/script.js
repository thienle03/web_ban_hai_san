document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#menu li").forEach(item => {
        item.addEventListener("click", function () {
            const url = item.getAttribute("data-url");
            if (url) {
                console.log("Chuyển hướng tới:", url);
                window.location.href = url; // Chuyển hướng trang
            }
        });
    });
});