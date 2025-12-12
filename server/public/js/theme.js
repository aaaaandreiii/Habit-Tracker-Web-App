(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function setBtnLabel(isDark) {
    if (!btn) return;
    btn.textContent = isDark ? '🌙 Dark' : '☀️ Light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    setBtnLabel(isDark);
  }

  // Respect what was already applied in <head> (no flash, consistent)
  const initial = root.classList.contains('dark') ? 'dark' : 'light';
  setBtnLabel(initial === 'dark');

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
    });
  }
})();
