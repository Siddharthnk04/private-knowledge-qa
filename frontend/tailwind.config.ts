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
                background: "#f8fafc", // slate-50
                surface: "#ffffff",
                primary: "#4f46e5", // indigo-600
                "primary-hover": "#4338ca", // indigo-700
                "primary-foreground": "#ffffff",
                secondary: "#e0e7ff", // indigo-100
                "text-main": "#1e293b", // slate-800
                "text-muted": "#64748b", // slate-500
                "border-subtle": "#e2e8f0", // slate-200
                "focus-ring": "#6366f1", // indigo-500
            },
        },
    },
    plugins: [],
};
export default config;
