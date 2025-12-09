import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Healthcare Theme (Pastel Pink Style)
        traditional: {
          bg: "#FFF5F7", // Very Light Pinkish White
          text: "#4A4A4A", // Soft Dark Grey
          subtext: "#7D7D7D", // Medium Grey
          primary: "#FFB7B2", // Pastel Pink
          secondary: "#FFDAC1", // Pastel Peach/Rose
          accent: "#FF9AA2", // Soft Red/Pink
          muted: "#FDE2E4", // Muted Pink
          ai: "#FFB7B2", // AI Pink (Consistent with primary)
        },
        // Medical Theme (Unified Pastel Style)
        medical: {
          bg: "#FFF5F7",
          text: "#4A4A4A",
          subtext: "#7D7D7D",
          primary: "#FFB7B2",
          secondary: "#FFDAC1",
          accent: "#FF9AA2",
          muted: "#FDE2E4",
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
        'glass-dark': 'linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(20, 20, 20, 0.4))',
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"], // Keeping serif just in case for specific headers
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
