const ctx = document.getElementById('revenueChart').getContext('2d');
const revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
        datasets: [{
            label: 'Doanh thu (VND)',
            data: [5000000, 7000000, 6000000, 8000000, 7500000, 9000000],
            backgroundColor: '#007bff'
        }]
    }
});
