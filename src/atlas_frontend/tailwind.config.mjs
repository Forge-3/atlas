/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A1016",
        secondary: "#171F29",
        tertiary: "#FFFFFF",
        primaryText: "#FFFFFF",
        secondaryText: "#8D8D8D",
        lines: "#333C48",
        accent: "#02A6C2",
      },
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
        robotoMono: ["Roboto Mono", "monospace"],
        poppins: ["Poppins", "Roboto", "sans-serif"],
        montserrat: ["Montserrat", "Roboto", "sans-serif"],
      },
      fontSize: {
        h1: "5.667rem",
        h2: "3.333rem",
        h3: "1.167rem",
        p: "1.167rem",
        a: "1.167rem",
      },
      borderWidth: {
        1: "1px",
      },
      fontWeight: {
        h1: 600,
        h2: 500,
        h3: 400,
        p: 300,
      },
    },
  },
  plugins: [],
};
