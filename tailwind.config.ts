import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { mute: "var(--mute)", brand: "var(--brand)", brand2: "var(--brand2)" } } }, plugins: [] } satisfies Config;
