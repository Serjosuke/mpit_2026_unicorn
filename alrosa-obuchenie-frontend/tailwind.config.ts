import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8fc5ff",
          400: "#5ea6ff",
          500: "#347eff",
          600: "#1f5df5",
          700: "#1948e1",
          800: "#1b3ab6",
          900: "#1c338f"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(52,126,255,0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(34,197,94,0.14), transparent 35%)"
      }
    }
  },
  plugins: []
};

export default config;
