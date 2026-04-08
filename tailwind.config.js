/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ozon: {
          bg: '#FFFFFF',
          card: {
            gray: '#F5F5F7',
            grayDark: '#E8E8EA',
            white: '#FFFFFF',
            whiteDark: '#F9F9FB',
            green: '#E8F5E9',
            greenDark: '#C8E6C9',
            blue: '#E3F2FD',
            blueDark: '#BBDEFB',
            orange: '#FFF3E0',
            orangeDark: '#FFE0B2',
            pink: '#FCE4EC',
            pinkDark: '#F8BBD9',
            red: '#FFEBEE',
            redDark: '#FFCDD2',
          },
          badge: {
            gray: '#D1D1D6',
            white: '#F0F0F2',
            green: '#A5D6A7',
            blue: '#90CAF9',
            orange: '#FFCC80',
            pink: '#F48FB1',
            red: '#EF9A9A',
          },
          dot: {
            gray: '#8E8E93',
            white: '#005BFF',
            green: '#4CAF50',
            blue: '#2196F3',
            orange: '#FF9800',
            pink: '#E91E63',
            red: '#F44336',
          },
          text: {
            primary: '#1A1A1A',
            secondary: '#8E8E93',
          },
          line: '#E5E5EA',
          dotBorder: '#C7C7CC',
        }
      },
      borderRadius: {
        'card': '20px',
        'inner': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
