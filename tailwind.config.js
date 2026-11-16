/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        laguna: {
          50: "#EAF8F6",
          100: "#C9EFEA",
          200: "#97E0D6",
          300: "#5CCBBE",
          400: "#2DB1A3",
          500: "#109588",
          600: "#0B786F",
          700: "#0A5F5A",
          800: "#0A4A47",
          900: "#0A3634",
        },
        sol: {
          50: "#FFF8E1",
          100: "#FFEDB3",
          400: "#FFC233",
          500: "#F5A800",
          700: "#8F5B00",
          texto: "#6F4700",
        },
        sal: "#F3F7F6",
        bruma: "#E9F0EE",
        linea: "#DCE5E3",
        lineaFuerte: "#C3D0CD",
        tinta: "#0E1F1E",
        tinta2: "#4B5F5D",
        tinta3: "#7A8D8B",
        sistema: {
          error: "#D92D20",
          errorFondo: "#FEE4E2",
          exito: "#157A3E",
          exitoFondo: "#DCF5E5",
          info: "#1E4FD8",
          infoFondo: "#E0E9FF",
        },
      },
      borderRadius: {
        campo: "14px",
        tarjeta: "20px",
        hero: "28px",
      },
      backgroundImage: {
        marea:
          "linear-gradient(155deg, #0A3634 0%, #0A5F5A 55%, #109588 100%)",
      },
    },
  },
  plugins: [],
};
