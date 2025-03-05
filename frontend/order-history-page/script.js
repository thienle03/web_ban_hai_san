async function loadOrderHistory(page = 1, limit = 10) {
    try {
        const token = localStorage.getItem("token");
        console.log("Token gửi đi:", token);

        const response = await fetch(`http://localhost:5000/api/order/id`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Response:", response.status);
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        console.log("Orders:", data);
        // Rest of the code...
    } catch (error) {
        console.error("Error:", error);
    }
}