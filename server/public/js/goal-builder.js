// server/public/js/goal-builder.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('goal-items');
  const addBtn = document.getElementById('add-goal-item');
  if (!container || !addBtn) return;

  const templateRow = container.querySelector('.goal-item-row');

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!templateRow) return;

    const clone = templateRow.cloneNode(true);
    clone.querySelectorAll('select, input').forEach((el) => {
      el.value = '';
      if (el.name === 'targetCounts[]') el.value = '10';
      if (el.name === 'weights[]') el.value = '1';
    });
    container.appendChild(clone);
  });
});
