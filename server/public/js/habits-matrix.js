// server/public/js/habits-matrix.js
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('habitMatrixChart');
  const data = window.__HABIT_MATRIX_DAILY__;

  if (!canvas || !Array.isArray(data) || !data.length) return;

  const ctx = canvas.getContext('2d');

  const labels = data.map((d) => d.label);
  const percents = data.map((d) => d.percent);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '% habits done',
          data: percents,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });
});
