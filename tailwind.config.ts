import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        field: "#0b3d0b",
        chalk: "#f4f4f0",
      },
    },
  },
  plugins: [],
};

export default config;
