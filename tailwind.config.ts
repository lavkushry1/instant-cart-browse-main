import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		fontFamily: {
			sans: ['Roboto', 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					teal: '#06b6d4',
					light: '#f0fdfa',
					dark: '#0f766e',
					black: '#111827',
					gray: '#9ca3af',
					lightGray: '#f3f4f6'
				},
				flipkart: {
					blue: '#2874F0',         // Flipkart Primary Blue
					orange: '#FB641B',       // Secondary Orange (Buy Now buttons)
					yellow: '#FFE500',       // Accent Yellow
					green: '#388E3C',        // Success Green
					red: '#ff6161',          // Error Red
					dark: '#172337',         // Dark Blue (Footer background)
					gray: {
						background: '#f1f3f6',   // Main background color
						border: '#e0e0e0',       // Border color
						'secondary-text': '#878787', // Secondary text
						'primary-text': '#212121',   // Primary text (never pure black)
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out'
			},
			fontSize: {
				// Flipkart Typography System (matching PRD 3.2)
				'flipkart-header-sm': ['16px', { lineHeight: '1.2', fontWeight: '500' }],
				'flipkart-header-md': ['18px', { lineHeight: '1.2', fontWeight: '500' }],
				'flipkart-header-lg': ['20px', { lineHeight: '1.2', fontWeight: '500' }],
				'flipkart-body': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
				'flipkart-small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
				'flipkart-price-discounted': ['16px', { lineHeight: '1.2', fontWeight: '700' }],
				'flipkart-price-original': ['14px', { lineHeight: '1.2', fontWeight: '400' }],
				'flipkart-button': ['14px', { lineHeight: '1.2', fontWeight: '500' }],
			},
			boxShadow: {
				'flipkart-card': '0 2px 16px rgba(0,0,0,0.1)',
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
