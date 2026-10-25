import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { mute: "var(--mute)", brand: "#00D084" } } }, plugins: [] } satisfies Config;
