/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Custom color palette
          primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b',
          },
          // Custom dark theme colors
          dark: {
            100: '#d1d5db',
            200: '#9ca3af',
            300: '#6b7280',
            400: '#4b5563',
            500: '#374151',
            600: '#1f2937',
            700: '#111827',
            800: '#0f172a',
            900: '#0b0f1a',
          },
          // Uniswap theme colors
          uniswap: {
            pink: '#fc72ff',
            blue: '#0193ff',
            purple: '#8c6dfd',
          }
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
        boxShadow: {
          'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
          'button': '0 4px 12px rgba(79, 70, 229, 0.2)',
          'dropdown': '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-slow': 'bounce 2s infinite',
          'spin-slow': 'spin 3s linear infinite',
        },
        borderRadius: {
          'xl': '0.75rem',
          '2xl': '1rem',
          '3xl': '1.5rem',
        },
      },
    },
    plugins: [],
  }