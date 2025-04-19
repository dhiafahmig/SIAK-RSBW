module.exports = {
  theme: {
    extend: {
      animation: {
        'fadeInOut': 'fadeIn 0.3s ease-in-out, fadeOut 0.3s ease-in-out 1.7s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translate(-50%, 0)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -20px)' },
        },
      },
    },
  },
  darkMode: 'class',
} 