/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class', // Habilitar dark mode con clase .dark

  theme: {
    extend: {
      // Colores personalizados del proyecto
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Color principal actual
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626', // Color danger actual
          700: '#b91c1c',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a', // Color success actual
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308', // Color warning actual
          600: '#ca8a04',
        },
      },

      // Animaciones personalizadas
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },

      // Keyframes para las animaciones
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },

      // Espaciado adicional
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },

      // Tamaños de fuente adicionales
      fontSize: {
        xxs: '0.625rem',
      },

      // Box shadows personalizados
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
        strong: '0 8px 24px rgba(0, 0, 0, 0.16)',
      },

      // Border radius adicionales
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },

  plugins: [],
};
