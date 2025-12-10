// server/public/js/theme.js
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');

  function applyTheme(theme) {
    const isDark = theme === 'dark';

    // Tailwind dark mode
    root.classList.toggle('dark', isDark);

    // For any libs that look at data-theme
    root.setAttribute('data-theme', theme);

    // Tell the browser how to render form controls, scrollbars, etc.
    root.style.colorScheme = isDark ? 'dark' : 'light';

    if (btn) {
      btn.textContent = isDark ? '🌙 Dark' : '☀️ Light';
    }

    localStorage.setItem('theme', theme);
  }

  // Ignore OS preference; default to dark if nothing stored
  const initial =
    stored === 'dark' || stored === 'light'
      ? stored
      : 'dark';

  applyTheme(initial);

  if (btn) {
    btn.addEventListener('click', () => {
      const currentlyDark = root.classList.contains('dark');
      applyTheme(currentlyDark ? 'light' : 'dark');
    });
  }
})();
