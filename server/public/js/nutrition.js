document.addEventListener('DOMContentLoaded', () => {
  const macroCanvas = document.getElementById('macroChart');
  if (macroCanvas) {
    const summaryEl = macroCanvas.closest('[data-summary-json]');
    let summary;
    // Alternatively pass data directly via dataset or script tag:
    // here we read from a global variable injected in hbs if you prefer.
    try {
      summary = window.__NUTRITION_SUMMARY__;
    } catch {
      summary = null;
    }
    if (summary) {
      const ctx = macroCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Protein', 'Carbs', 'Fat'],
          datasets: [
            {
              data: [summary.protein, summary.carbs, summary.fat],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }
  }

  // Placeholder hooks for barcode / voice / photo logging:
  const barcodeBtn = document.getElementById('barcode-scan');
  if (barcodeBtn) {
    barcodeBtn.addEventListener('click', () => {
      alert('Barcode scanning not yet implemented. Integrate a JS scanner here.');
    });
  }
});
