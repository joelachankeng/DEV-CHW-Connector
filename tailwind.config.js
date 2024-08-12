/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      maxWidth: {
        "8xl": "90rem",
      },
      fontFamily: {
        sans: ['"Montserrat"', ...defaultTheme.fontFamily.sans],
      },
      screens: {
        smallest: "320px",
        xxs: "400px",
        xs: "480px",
        "tablet-lg": "992px",
      },
      colors: {
        chw: {
          "dark-green": "#032525",
          "dim-gray": "#686867",
          "light-purple": "#625DA6",
          "dark-purple": "#413D70",
          "black-shadows": "#C1BAB4",
          "floral-white": "#FFFAF3",
          "cream-01": "#FFF5E5",
          "yellow-100": "#FABE467A",
          yellow: "#FABE46",
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
