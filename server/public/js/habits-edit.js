document.addEventListener('DOMContentLoaded', () => {
  const freqSelect = document.getElementById('habit-frequency');
  const freqBlocks = document.querySelectorAll('.freq-fields');

  function updateFreqVisibility() {
    if (!freqSelect) return;
    const value = freqSelect.value || 'DAILY';

    freqBlocks.forEach((block) => {
      const freq = block.getAttribute('data-freq');
      block.classList.toggle('hidden', freq !== value);
    });
  }

  if (freqSelect) {
    freqSelect.addEventListener('change', updateFreqVisibility);
    updateFreqVisibility();
  }

  const container = document.getElementById('custom-dates-container');
  const addBtn = document.getElementById('add-custom-date');

  if (container && addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'date';
      input.name = 'scheduleDates';
      input.className = 'px-2 py-1 rounded border w-48 block';
      container.appendChild(input);
    });
  }
});
