/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#355070',
          600: '#2d4159',
          700: '#253242',
          800: '#1e232b',
          900: '#171a1f',
        },
        secondary: {
          50: '#faf9fb',
          100: '#f3f2f4',
          200: '#e6e4e8',
          300: '#d1ced6',
          400: '#b5b0bb',
          500: '#6d597a',
          600: '#624d6b',
          700: '#52415a',
          800: '#423549',
          900: '#322938',
        },
        accent: {
          50: '#fef7f7',
          100: '#fdeaea',
          200: '#fbd5d5',
          300: '#f7b3b3',
          400: '#f18a8a',
          500: '#e56b6f',
          600: '#d14a4e',
          700: '#b03d41',
          800: '#923539',
          900: '#783033',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #355070 0%, #6d597a 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6d597a 0%, #355070 100%)',
        'gradient-soft': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(53, 80, 112, 0.15)',
        'secondary': '0 4px 14px 0 rgba(109, 89, 122, 0.15)',
        'soft': '0 2px 8px 0 rgba(53, 80, 112, 0.08)',
      }
    },
  },
  plugins: [],
};
