/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable class-based dark mode
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Light Mode
                primary: "#10B981", // Emerald 500
                secondary: "#3B82F6", // Blue 500
                background: "#F9FAFB", // Gray 50
                surface: "#FFFFFF",

                // Trading Colors (Premium) - Work in both modes
                trading: {
                    green: "#22C55E",      // Green 500
                    greenSoft: "#16A34A",  // Green 600
                    red: "#EF4444",        // Red 500
                    redSoft: "#DC2626",    // Red 600
                    accent: "#8B5CF6",     // Purple 500 (AI)
                    blue: "#3B82F6",       // Blue 500 (Indicators)
                }
            },
            boxShadow: {
                'dark-sm': '0 0 0 1px rgba(255,255,255,0.04)',
                'dark-md': '0 0 0 1px rgba(255,255,255,0.06)',
                'glow-green': '0 0 8px rgba(34,197,94,0.3)',
                'glow-red': '0 0 8px rgba(239,68,68,0.3)',
            }
        },
    },
    plugins: [],
}
