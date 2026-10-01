import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60-30-10 Color System
        canvas: {
          DEFAULT: "#F8FAFC", // 60% dominant light foundation
          subtle: "#F1F5F9",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        brand: {
          DEFAULT: "#0F766E", // 30% structural secondary deep teal/emerald
          dark: "#115E59",
          light: "#CCFBF1",
          surface: "#F0FDFA",
        },
        accent: {
          DEFAULT: "#D97706", // 10% high-energy warm saffron/amber accent
          hover: "#B45309",
          light: "#FEF3C7",
          glow: "#FDE68A",
        },
        slateText: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
