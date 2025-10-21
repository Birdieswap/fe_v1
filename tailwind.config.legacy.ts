import type { Config } from "tailwindcss";

import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        light_pink: "#F83D97",
        light_pink_hover: "#F20A7A",
        light_primary: "#00C9CC",
        light-primary-hover: "#07ABAD",
        light_light_mint: "#E5FAFA",
        light_mid_mint: "#CCF9F7",
        light-mid-mint-2: "#B2EFF0",
        dark_pink: "#FF5AA9",
        dark_swap_bg: "#1F2234",
        dark-popup-bg: "#262B3B",
        dark_pink_hover: "#F072AF",
        dark_empty_state: "#226A75",
        dark_green_key: "#1BDFE1",
        dark_primary: "#68E0E0",
        dark_primary_hover: "#71E8E9",
        dark-mid-mint: "#1EA9AF",
        dark_mid_mint_2: "#226A75",
        dark-mid-mint-25: "#274B58",
        dark_mid_mint_3: "#164B58",
        dark-mid-mint-4: "#51A9AE",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        hoverOpacity: "1",
        disabledOpacity: "1",
      },
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#14192A",
            default: {
              100: "#F9FBFE",
              200: "#EFF0F5",
              300: "#ECEFF8",
              400: "#E4E6EF",
              500: "#C9CFE0",
              600: "#AAB1C7",
              700: "#929AB1",
              800: "#696C82",
              900: "#525567",
              DEFAULT: "#C9CFE0",
            },
            primary: {
              100: "#E5FAFA",
              200: "#CCF9F7",
              500: "#00C9CC",
              DEFAULT: "#00C9CC",
              foreground: "#FFFFFF",
            },
            success: {
              100: "#E5FAFA",
              200: "#CCF9F7",
              500: "#00C9CC",
              DEFAULT: "#00C9CC",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#02DFB8",
            },
            danger: {
              DEFAULT: "#FF0000",
            },
            warning: {
              DEFAULT: "#F83D97",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#14192A",
            foreground: "#FFFFFF",
            default: {
              900: "#F9FBFE",
              800: "#EFF0F5",
              700: "#ECEFF8",
              600: "#E4E6EF",
              500: "#C9CFE0",
              400: "#AAB1C7",
              300: "#929AB1",
              200: "#696C82",
              100: "#525567",
              DEFAULT: "#C9CFE0",
            },
            primary: {
              DEFAULT: "#68E0E0",
            },
            secondary: {
              DEFAULT: "#02DFB8",
            },
            danger: {
              DEFAULT: "#FF0000",
            },
          },
        },
      },
    }),
  ],
};

export default config;
