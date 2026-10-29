/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        "pm-verde": "#1B4332",
        "pm-ocre": "#C68B59",
        "pm-fondo": "#F8F9FA",
        "pm-texto": "#2B2D42",
      },
    },
  },
  plugins: [],
};
