// server/public/js/nutrition-progress.js
document.addEventListener('DOMContentLoaded', async () => {
  const weightCanvas = document.getElementById('weightChart');
  const calorieCanvas = document.getElementById('calorieTrendChart');

  if (!weightCanvas || !calorieCanvas) return;

  try {
    const res = await fetch('/nutrition/api/trends');
    const { entries, weights } = await res.json();

    // Calories per day
    const calorieLabels = entries.map((e) =>
      new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    const calorieValues = entries.map((e) => e.calories);

    const ctxCalories = calorieCanvas.getContext('2d');
    new Chart(ctxCalories, {
      type: 'bar',
      data: {
        labels: calorieLabels,
        datasets: [
          {
            label: 'Calories',
            data: calorieValues,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    // Weight over time
    const weightLabels = weights.map((w) =>
      new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    const weightValues = weights.map((w) => w.weightKg);

    const ctxWeight = weightCanvas.getContext('2d');
    new Chart(ctxWeight, {
      type: 'line',
      data: {
        labels: weightLabels,
        datasets: [
          {
            label: 'Weight (kg)',
            data: weightValues,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false },
        },
      },
    });
  } catch (err) {
    console.error('Failed to load nutrition trends', err);
  }
});
