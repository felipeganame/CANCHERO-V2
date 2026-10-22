import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bordo: {
          DEFAULT: "#6B1E2E",
          dark: "#4A1420",
          mid: "#5C1A28",
          soft: "#F5E9EB",
        },
        naranja: {
          DEFAULT: "#F28A4F",
          strong: "#E8692C",
          text: "#B4471A",
          soft: "#FDEBDF",
        },
        ink: "#1C1416",
        muted: "#6B6466",
        line: "#E7E1E2",
        ground: "#FAF8F8",
        panel: "#F6F3F3",
        ok: { DEFAULT: "#1F6B45", soft: "#E4F3EA" },
        danger: { DEFAULT: "#A3281F", soft: "#FBE7E5" },
        busy: { DEFAULT: "#8A8285", soft: "#F1EEEE" },
      },
      fontFamily: {
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
