/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // 确保 Tailwind 不会覆盖 Ant Design 的样式
  corePlugins: {
    preflight: false,
  },
} 