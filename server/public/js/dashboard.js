document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('calorieChart');
  if (!canvas) return;

  try {
    const res = await fetch('/dashboard/api/summary');
    const data = await res.json();

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Goal', 'Eaten', 'Burned', 'Remaining'],
        datasets: [
          {
            label: 'Calories',
            data: [data.goal, data.caloriesEaten, data.caloriesBurned, data.remaining],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  } catch (err) {
    console.error('Failed to load dashboard summary', err);
  }
});
