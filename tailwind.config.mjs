/**
 * Akrithos design tokens.
 *
 * This file is the single source of truth for brand color, spacing,
 * radius, font family, and type scale. Do not duplicate these values in
 * page components or CSS custom properties.
 */
export const tokens = Object.freeze({
  color: Object.freeze({
    inherit: "inherit",
    current: "currentColor",
    transparent: "transparent",
    paper: "#FFFFFF",
    ink: "#15181C",
    terracotta: "#BE4C33",
    bronze: "#A37139",
    // Night palette (2026 redesign): the same ink, with luminous versions of terracotta and bronze for dark surfaces.
    ember: "#E8714A",
    gold: "#D4A35F",
    night: Object.freeze({
      950: "#07080A",
      900: "#0C0E11",
      800: "#13161B",
      700: "#1C2027",
      600: "#2A2F38",
    }),
    stone: Object.freeze({
      50: "#F7F6F3",
      100: "#ECE9E3",
      400: "#A8A396",
      600: "#6B665A",
    }),
  }),
  spacing: Object.freeze({
    0: "0",
    hairline: "1px",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.5rem",
    6: "2rem",
    7: "3rem",
    8: "4rem",
    9: "6rem",
    10: "8rem",
    11: "10rem",
    12: "12rem",
    13: "36rem",
    showcase: "30rem",
    header: "6rem",
  }),
  radius: Object.freeze({
    none: "0",
    xs: "0.125rem",
    control: "0.375rem",
    card: "1rem",
    feature: "1.5rem",
    pill: "999px",
  }),
  fontFamily: Object.freeze({
    display: ['"Space Grotesk"', "Arial", "sans-serif"],
    sans: ['"Public Sans"', "Arial", "sans-serif"],
    mono: ['"IBM Plex Mono"', '"SFMono-Regular"', "Consolas", "monospace"],
  }),
  fontSize: Object.freeze({
    overline: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
    label: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
    body: ["1rem", { lineHeight: "1.625rem", letterSpacing: "-0.005em" }],
    lead: ["1.25rem", { lineHeight: "1.875rem", letterSpacing: "-0.015em" }],
    h3: ["1.5rem", { lineHeight: "1.875rem", letterSpacing: "-0.025em" }],
    h2: ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.04", letterSpacing: "-0.045em" }],
    h1: ["clamp(2.75rem, 7vw, 6rem)", { lineHeight: "0.96", letterSpacing: "-0.055em" }],
  }),
  shadow: Object.freeze({
    none: "none",
    card: "0 1px 0 rgb(21 24 28 / 0.05), 0 18px 52px rgb(21 24 28 / 0.08)",
    lift: "0 1px 0 rgb(21 24 28 / 0.04), 0 24px 72px rgb(21 24 28 / 0.12)",
  }),
});

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: tokens.color,
    spacing: tokens.spacing,
    borderRadius: tokens.radius,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.fontSize,
    boxShadow: tokens.shadow,
    screens: {
      sm: "40rem",
      md: "48rem",
      lg: "64rem",
      xl: "80rem",
      wide: "85rem",
      "2xl": "96rem",
      ultra: "120rem",
    },
    maxWidth: {
      full: "100%",
      content: "74rem",
      copy: "42rem",
    },
    extend: {},
  },
  plugins: [],
};

export default config;
