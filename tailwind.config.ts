import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: "hsl(214.3, 31.8%, 91.4%)",
        input: "hsl(214.3, 31.8%, 91.4%)",
        ring: "hsl(222.2, 84%, 4.9%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(222.2, 84%, 4.9%)",
        primary: {
          DEFAULT: "hsl(222.2, 47.4%, 11.2%)",
          foreground: "hsl(210, 40%, 98%)"
        },
        secondary: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)"
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(210, 40%, 98%)"
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(215.4, 16.3%, 46.9%)"
        },
        accent: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)"
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(222.2, 84%, 4.9%)"
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(222.2, 84%, 4.9%)"
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
		fadeOut: {
			'0%': { opacity: '1' },
			'100%': { opacity: '0' },
		  },
        scaleIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
			'0%': { transform: 'translateX(-100%)' },
			'100%': { transform: 'translateX(100%)' }
		  },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
		fadeOut: 'fadeOut 0.3s ease-out forwards',
        scaleIn: 'scaleIn 0.5s ease-out',
        slideUp: 'slideUp 0.5s ease-out',
		shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config

export default config