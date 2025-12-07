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
        // Healthcare Theme (Modern Dental)
        traditional: {
          bg: "#FFFFFF", // Clean White
          text: "#0F172A", // Slate 900 (Sharp, Professional)
          subtext: "#64748B", // Slate 500 (Modern Gray)
          primary: "#005F73", // Deep Teal/Navy (Trust & Professionalism)
          secondary: "#0A9396", // Medical Teal (Freshness)
          accent: "#94D2BD", // Soft Mint (Calm & Clean)
          muted: "#E2E8F0", // Slate 200 (Subtle Borders)
          ai: "#3B82F6", // AI Blue (Kept for consistency)
        },
        // Medical Theme (Modern/Clinic - Integrated with Traditional)
        medical: {
          bg: "#FFFFFF",
          text: "#111827",
          subtext: "#4B5563",
          primary: "#2C3E2C", // Unified with Traditional Primary
          secondary: "#10B981", // Emerald Green (kept for medical cues)
          accent: "#3B82F6", // Blue
          muted: "#F3F4F6",
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
