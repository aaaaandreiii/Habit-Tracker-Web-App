// server/public/js/theme.js
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);

    if (btn) {
      btn.textContent = isDark ? '🌙 Dark' : '☀️ Light';
    }

    localStorage.setItem('theme', theme);
  }

  // Initial theme
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else if (window.matchMedia &&
             window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  // Toggle on click
  if (btn) {
    btn.addEventListener('click', () => {
      const currentlyDark = root.classList.contains('dark');
      applyTheme(currentlyDark ? 'light' : 'dark');
    });
  }
})();
