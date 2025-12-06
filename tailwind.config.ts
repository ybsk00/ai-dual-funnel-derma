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
        // Healthcare Theme (Traditional/Hanji)
        traditional: {
          bg: "#FDFBF7", // Hanji-like off-white
          text: "#2C2C2C", // Dark Gray (Ink)
          subtext: "#5A5A5A",
          primary: "#4A5D23", // Muted Green (Mugwort/Pine)
          secondary: "#8B4513", // Jujube/Brown
          accent: "#2F4F4F", // Dark Slate (Indigo-ish)
          muted: "#E8E4D9",
        },
        // Medical Theme (Modern/Clinic)
        medical: {
          bg: "#FFFFFF",
          text: "#111827", // Cool Gray 900
          subtext: "#4B5563", // Cool Gray 600
          primary: "#0EA5E9", // Sky Blue
          secondary: "#10B981", // Emerald Green
          accent: "#3B82F6", // Blue
          muted: "#F3F4F6", // Cool Gray 100
        },
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
