/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dùng chung màu thương hiệu với web để app và web không lệch nhau
        brand: {
          DEFAULT: '#2C67C8',
          dark: '#1F4C99',
          light: '#EFF6FF',
        },
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        surface: '#FBFCFE',
        success: '#16A34A',
      },
    },
  },
  plugins: [],
};
