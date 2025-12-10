// server/public/js/habits.js
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const editToggleBtn = document.getElementById('habit-edit-toggle');
  const sortSelect = document.getElementById('habit-sort-mode');
  const categoryFilter = document.getElementById('habit-filter-category');
  const timeFilter = document.getElementById('habit-filter-time');
  const listContainer = document.querySelector('.habit-list-container');
  const currentDateEl = document.getElementById('habit-current-date');
  const currentDate = currentDateEl ? currentDateEl.value : null;

  const wrappers = listContainer
    ? Array.from(listContainer.querySelectorAll('.habit-card-wrapper'))
    : [];

  // Initially: no drag unless Edit mode
  wrappers.forEach((w) => {
    w.draggable = false;
  });

  // ---- EDIT MODE TOGGLE ----
  if (editToggleBtn) {
    editToggleBtn.addEventListener('click', () => {
      const isOn = body.classList.toggle('habit-edit-mode');
      editToggleBtn.classList.toggle('bg-emerald-500', isOn);
      editToggleBtn.classList.toggle('text-white', isOn);
      editToggleBtn.textContent = isOn ? 'Done Editing' : 'Edit Habits';

      // Only allow drag in edit mode
      wrappers.forEach((w) => {
        w.draggable = isOn;
      });
    });
  }

  // ---- UTILS ----
  function getProgressScore(wrapper) {
    const type = wrapper.dataset.habitType;
    const target = Number(wrapper.dataset.habitTarget || 0);
    const input = wrapper.querySelector('.habit-value');
    const toggle = wrapper.querySelector('.habit-toggle');

    if (type === 'BOOLEAN') {
      if (!toggle) return 0;
      return toggle.classList.contains('bg-emerald-500') ? 1 : 0;
    }

    const value = input ? Number(input.value || 0) : 0;
    if (!target || target <= 0) return value;
    return value / target;
  }

  function applyFiltersAndSort() {
    if (!listContainer) return;

    const mode = sortSelect ? sortSelect.value : 'custom';
    const categoryVal = categoryFilter ? categoryFilter.value : '__all__';
    const timeVal = timeFilter ? timeFilter.value : '__all__';

    const allWrappers = Array.from(
      listContainer.querySelectorAll('.habit-card-wrapper')
    );

    // Remove existing category headers
    Array.from(
      listContainer.querySelectorAll('.habit-category-header')
    ).forEach((el) => el.remove());

    // Filter
    const visible = allWrappers.filter((w) => {
      const cat = w.dataset.category || '';
      const tod = w.dataset.timeOfDay || 'ANY';

      // Category filter
      if (categoryVal !== '__all__') {
        if (categoryVal === '__none__') {
          if (cat) return false;
        } else if (cat !== categoryVal) {
          return false;
        }
      }

      // Time of day filter
      if (timeVal !== '__all__') {
        if (timeVal === 'DAY' && tod !== 'DAY') return false;
        if (timeVal === 'NIGHT' && tod !== 'NIGHT') return false;
      }

      return true;
    });

    // Hide all
    allWrappers.forEach((w) => {
      w.style.display = 'none';
    });

    // Sort visible
    let sorted = [...visible];

    if (!mode || mode === 'custom') {
      sorted.sort((a, b) => {
        const ao = Number(a.dataset.habitSortOrder || 0);
        const bo = Number(b.dataset.habitSortOrder || 0);
        if (ao !== bo) return ao - bo;
        const aid = Number(a.dataset.habitId);
        const bid = Number(b.dataset.habitId);
        return aid - bid;
      });
    } else if (mode === 'name_asc' || mode === 'name_desc') {
      sorted.sort((a, b) => {
        const an = (a.dataset.habitName || '').toLowerCase();
        const bn = (b.dataset.habitName || '').toLowerCase();
        if (an < bn) return mode === 'name_asc' ? -1 : 1;
        if (an > bn) return mode === 'name_asc' ? 1 : -1;
        return 0;
      });
    } else if (mode === 'progress_desc' || mode === 'progress_asc') {
      sorted.sort((a, b) => {
        const ap = getProgressScore(a);
        const bp = getProgressScore(b);
        if (ap === bp) return 0;
        return mode === 'progress_desc' ? bp - ap : ap - bp;
      });
    } else if (mode === 'category') {
      sorted.sort((a, b) => {
        const ca = (a.dataset.category || 'Uncategorized').toLowerCase();
        const cb = (b.dataset.category || 'Uncategorized').toLowerCase();
        if (ca < cb) return -1;
        if (ca > cb) return 1;
        const an = (a.dataset.habitName || '').toLowerCase();
        const bn = (b.dataset.habitName || '').toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });
    }

    // Append and show
    if (mode === 'category') {
      let lastCat = null;
      sorted.forEach((w) => {
        const cat = w.dataset.category || 'Uncategorized';
        if (cat !== lastCat) {
          const header = document.createElement('div');
          header.className =
            'habit-category-header col-span-full text-[11px] text-slate-500 mt-2 mb-1';
          header.textContent = cat;
          listContainer.appendChild(header);
          lastCat = cat;
        }
        w.style.display = '';
        listContainer.appendChild(w);
      });
    } else {
      sorted.forEach((w) => {
        w.style.display = '';
        listContainer.appendChild(w);
      });
    }
  }

  if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSort);
  if (timeFilter) timeFilter.addEventListener('change', applyFiltersAndSort);

  // Initial layout
  applyFiltersAndSort();

  // ---- DRAG & DROP (custom order only, edit mode only) ----
  if (listContainer) {
    let dragSrcEl = null;

    listContainer.addEventListener('dragstart', (e) => {
      if (!body.classList.contains('habit-edit-mode')) return;
      const target = e.target.closest('.habit-card-wrapper');
      if (!target) return;

      dragSrcEl = target;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', target.dataset.habitId);
      target.classList.add('opacity-50');
    });

    listContainer.addEventListener('dragend', (e) => {
      if (!body.classList.contains('habit-edit-mode')) return;
      const target = e.target.closest('.habit-card-wrapper');
      if (target) {
        target.classList.remove('opacity-50');
      }
      dragSrcEl = null;
      saveOrderToServer();
    });

    listContainer.addEventListener('dragover', (e) => {
      if (!body.classList.contains('habit-edit-mode')) return;
      e.preventDefault();
      const target = e.target.closest('.habit-card-wrapper');
      if (!target || target === dragSrcEl) return;

      const rect = target.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const midpoint = rect.height / 2;

      if (offset > midpoint) {
        target.after(dragSrcEl);
      } else {
        target.before(dragSrcEl);
      }
    });

    function saveOrderToServer() {
      const wrappersNow = Array.from(
        listContainer.querySelectorAll('.habit-card-wrapper')
      );
      wrappersNow.forEach((el, idx) => {
        el.dataset.habitSortOrder = String(idx + 1);
      });

      const payload = {
        order: wrappersNow.map((el, idx) => ({
          habitId: Number(el.dataset.habitId),
          sortOrder: idx + 1,
        })),
      };

      fetch('/habits/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('Failed to save custom order', err);
      });
    }
  }

  // ==== QUICK LOGGING (BOOLEAN / QUANTITY / DURATION) ====

  // BOOLEAN HABITS: toggle on click
  const booleanButtons = document.querySelectorAll('.habit-toggle');
  booleanButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.habitId;
      const isActive = btn.classList.contains('bg-emerald-500');

      const newStatus = isActive ? 'MISSED' : 'COMPLETED';

      const payload = { status: newStatus };
      if (currentDate) payload.date = currentDate;

      const resp = await fetch(`/habits/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) return;

      btn.classList.toggle('bg-emerald-500', newStatus === 'COMPLETED');
      btn.classList.toggle('text-white', newStatus === 'COMPLETED');

      if (
        sortSelect &&
        (sortSelect.value === 'progress_desc' || sortSelect.value === 'progress_asc')
      ) {
        applyFiltersAndSort();
      }
    });
  });

  // QUANTITY / DURATION HABITS
  const plusButtons = document.querySelectorAll('.habit-plus');
  const minusButtons = document.querySelectorAll('.habit-minus');
  const valueInputs = document.querySelectorAll('.habit-value');

  function getInput(habitId) {
    return document.querySelector(`.habit-value[data-habit-id="${habitId}"]`);
  }

  function computeStatus(inputValue, targetValue) {
    const value = Number(inputValue) || 0;
    const target = Number(targetValue) || 0;

    if (!value) return 'MISSED';
    if (target && value >= target) return 'COMPLETED';
    return 'PARTIAL';
  }

  async function syncHabitValue(habitId, newValue) {
    const input = getInput(habitId);
    if (!input) return;

    const cleanValue = Math.max(0, Number(newValue) || 0);
    input.value = cleanValue;

    const status = computeStatus(cleanValue, input.dataset.targetValue);

    const payload = { status, value: cleanValue };
    if (currentDate) payload.date = currentDate;

    await fetch(`/habits/${habitId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (
      sortSelect &&
      (sortSelect.value === 'progress_desc' || sortSelect.value === 'progress_asc')
    ) {
      applyFiltersAndSort();
    }
  }

  function applyDelta(habitId, delta) {
    const input = getInput(habitId);
    if (!input) return;
    const current = Number(input.value || 0);
    const next = Math.max(0, current + delta);
    syncHabitValue(habitId, next);
  }

  function startHold(habitId, delta) {
    applyDelta(habitId, delta); // immediate step

    const interval = setInterval(() => applyDelta(habitId, delta), 120);

    const stop = () => {
      clearInterval(interval);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('mouseleave', stop);
      document.removeEventListener('touchend', stop);
    };

    document.addEventListener('mouseup', stop);
    document.addEventListener('mouseleave', stop);
    document.addEventListener('touchend', stop);
  }

  plusButtons.forEach((btn) => {
    const habitId = btn.dataset.habitId;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startHold(habitId, +1);
    });
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startHold(habitId, +1);
    });
  });

  minusButtons.forEach((btn) => {
    const habitId = btn.dataset.habitId;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startHold(habitId, -1);
    });
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startHold(habitId, -1);
    });
  });

  // Manual typing: save on change / blur
  valueInputs.forEach((input) => {
    const habitId = input.dataset.habitId;
    input.addEventListener('change', () => {
      syncHabitValue(habitId, input.value);
    });
    input.addEventListener('blur', () => {
      syncHabitValue(habitId, input.value);
    });
  });

    // ==== HABIT CARD WATER-FILL EFFECT ====

  const cardWrappers = document.querySelectorAll('.habit-card-wrapper');

  cardWrappers.forEach((wrapper) => {
    const card = wrapper.querySelector('.habit-card');
    const fill = wrapper.querySelector('.habit-card-fill');
    if (!card || !fill) return;

    // getProgressScore returns ~0..1 for most cases; clamp it
    const ratio = Math.max(0, Math.min(1, getProgressScore(wrapper)));
    const target = ratio; // 0..1

    // Start empty
    fill.style.transform = 'scaleX(0)';

    let done = false;
    let started = false;

    fill.addEventListener('transitionend', () => {
      done = true;
    });

    function fillToTarget(durationSeconds) {
      if (done) return;
      fill.style.transitionDuration = durationSeconds + 's';
      // Force layout so duration change is applied before transform
      void fill.offsetWidth;
      fill.style.transform = `scaleX(${target})`;
    }

    card.addEventListener('mouseenter', () => {
      if (done) return;
      started = true;
      // Nice slow fill
      fillToTarget(0.7);
    });

    card.addEventListener('mouseleave', () => {
      // If user leaves early, speed up and finish
      if (!started || done) return;
      fillToTarget(0.15);
    });

    // Touch devices – treat first tap as hover
    card.addEventListener(
      'touchstart',
      () => {
        if (done) return;
        started = true;
        fillToTarget(0.7);
      },
      { passive: true }
    );
  });

});
