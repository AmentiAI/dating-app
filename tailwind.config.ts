import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fff8f5",
        surface: "#fffdfc",
        surface2: "#fff1ec",
        line: "#f0d9d1",
        ink: "#14234a",
        sub: "#4f5f82",
        muted: "#7f8bad",
        accent: "#e98ca0",
        accent2: "#f2b0a3",
        accent3: "#c6778b",
        gold: "#e2ab5f"
      },
      fontFamily: {
        sans: ["var(--font-dm)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "var(--font-dm)", "ui-serif", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 18px 50px -18px rgba(233,140,160,0.7)",
        card: "0 20px 45px -30px rgba(20,35,74,0.3), 0 0 0 1px rgba(20,35,74,0.04)"
      },
      backgroundImage: {
        "grad-aurora":
          "radial-gradient(at 10% 0%, rgba(233,140,160,0.35) 0%, transparent 40%), radial-gradient(at 90% 20%, rgba(242,176,163,0.38) 0%, transparent 45%), radial-gradient(at 50% 100%, rgba(198,119,139,0.22) 0%, transparent 50%)",
        "grad-pill": "linear-gradient(135deg, #e98ca0 0%, #f2b0a3 52%, #c6778b 100%)"
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
