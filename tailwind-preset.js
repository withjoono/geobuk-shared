/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "Noto Sans KR", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        olive: {
          50: "#f5f7f2", 100: "#e8eee0", 200: "#d1ddc1", 300: "#b3c49a", 400: "#8aa66a", 500: "#3e5622", 600: "#354a1d", 700: "#2c3e18", 800: "#233214", 900: "#1a2610",
        },
        ultrasonic: {
          50: "#eef0ff", 100: "#dde2ff", 200: "#c2c8ff", 300: "#9da3ff", 400: "#7670fc", 500: "#3b28cc", 600: "#3220b3", 700: "#2a1a96", 800: "#23167a", 900: "#1c1260",
        },
        wine: {
          50: '#fdf2f4', 100: '#f9dde3', 200: '#f0b3c0', 300: '#d6748a', 400: '#a34058', 500: '#3d0012', 600: '#30000e', 700: '#230007', 800: '#1a0005', 900: '#110003', 950: '#0a0002',
        },
        inferno: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#a40606", 600: "#8a0505", 700: "#700404", 800: "#5a0303", 900: "#450202",
        },
        ocean: {
          50: "#effefe", 100: "#c8fdfb", 200: "#91faf7", 300: "#53f0ed", 400: "#1edcda", 500: "#007c77", 600: "#006663", 700: "#055251", 800: "#094241", 900: "#0c3635",
        },
        grape: {
          50: "#fdf4fd", 100: "#fae8fa", 200: "#f4d0f3", 300: "#ebabe9", 400: "#de7adb", 500: "#7b1e7a", 600: "#671868", 700: "#551356", 800: "#440f45", 900: "#380c38",
        },
        energy: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3f8efc", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
        },
        pop: {
          50: "#fef1fa", 100: "#fee5f7", 200: "#ffcbf1", 300: "#ffa1e4", 400: "#ff6ad0", 500: "#ff3cc7", 600: "#ed1199", 700: "#ce0578", 800: "#aa0762", 900: "#8c0c53",
        },
        ice: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#00e5e8", 600: "#00b8ba", 700: "#0891a2", 800: "#0e7490", 900: "#155e75",
        },
        amethyst: {
          50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#4c1a57", 600: "#3f164a", 700: "#33123d", 800: "#280e31", 900: "#1f0b26",
        },
        golden: {
          50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#d7cf07", 600: "#b5ad05", 700: "#918a04", 800: "#726c03", 900: "#5c5702",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        scroll: {
          to: { transform: "translate(calc(-50% - 0.5rem))" },
        },
        marquee: {
          "100%": { transform: "translateY(-50%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scroll: "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "fade-in": "fade-in 0.5s linear forwards",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
