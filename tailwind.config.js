/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Explicitly mapping semantic names if we want, or just use the standard palette.
                // The user asked for Slate/Emerald/Rose.
                primary: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981', // Emerald-500
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },
                danger: {
                    50: '#fff1f2',
                    500: '#f43f5e', // Rose-500
                    900: '#881337',
                }
            },
        },
    },
    plugins: [],
}
