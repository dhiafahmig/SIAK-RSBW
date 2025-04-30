// Fungsi untuk inisialisasi dark mode
export function initializeDarkMode(): void {
  const darkMode = localStorage.getItem('darkMode');
  console.log("Initializing dark mode from localStorage:", darkMode);
  
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
  console.log("toggleDarkMode called with:", { 
    isDark, 
    type: typeof isDark,
    valueAsNumber: isDark ? 1 : 0
  });

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('darkMode', JSON.stringify(isDark));
  console.log("darkMode saved to localStorage:", JSON.stringify(isDark));
}

// Fungsi untuk mendapatkan tema saat ini
export function getCurrentTheme(): boolean {
  const savedMode = localStorage.getItem('darkMode');
  console.log("getCurrentTheme from localStorage:", savedMode);
  return savedMode ? JSON.parse(savedMode) : false;
} 