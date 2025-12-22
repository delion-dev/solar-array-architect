/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a', // slate-900
          light: '#334155',   // slate-700
          dark: '#020617',    // slate-950
        },
        secondary: {
          DEFAULT: '#f59e0b', // Solar Yellow (Amber 500)
          light: '#fbbf24',   // Amber 400
          dark: '#d97706',    // Amber 600
        },
        accent: '#0ea5e9', // sky-500
        surface: {
          glass: 'rgba(255, 255, 255, 0.7)',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#eab308',
      },
      backgroundImage: {
        'solar-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'primary-glow': '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
        'primary-glow-hover': '0 6px 20px rgba(0, 118, 255, 0.23)',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}