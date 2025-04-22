// Fungsi untuk inisialisasi dark mode
export function initializeDarkMode(): void {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Set tema saat file ini dimuat
initializeDarkMode();

// Fungsi untuk mengubah tema
export function toggleDarkMode(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('darkMode', JSON.stringify(isDark));
}

// Fungsi untuk mendapatkan tema saat ini
export function getCurrentTheme(): boolean {
  const savedMode = localStorage.getItem('darkMode');
  return savedMode ? JSON.parse(savedMode) : false;
} 