/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
        /* Pokopia named tokens */
        pokopia: {
          orange:   'rgb(252,126,63)',
          greenbg:  'rgb(178,206,159)',
          lavender: 'rgb(223,185,248)',
          purple:   'rgb(181,121,227)',
          cyan:     'rgb(46,199,236)',
          green:    'rgb(48,168,60)',
          olive:    'rgb(135,135,72)',
          card:     'rgb(254,254,253)',
        },
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  safelist: [
    /* Pokopia feature colours */
    'bg-pokopia-orange', 'text-pokopia-orange',
    'bg-pokopia-greenbg', 'text-pokopia-greenbg',
    'bg-pokopia-lavender', 'text-pokopia-lavender',
    'bg-pokopia-purple', 'text-pokopia-purple',
    'bg-pokopia-cyan', 'text-pokopia-cyan',
    'bg-pokopia-green', 'text-pokopia-green',
    'bg-pokopia-olive', 'text-pokopia-olive',
    'bg-pokopia-card', 'text-pokopia-card',
    /* Compatibility badge colours (used dynamically) */
    'bg-green-100', 'text-green-800', 'border-green-200',
    'bg-cyan-100', 'text-cyan-800', 'border-cyan-200',
    'bg-violet-100', 'text-violet-800', 'border-violet-200',
    'bg-orange-100', 'text-orange-800', 'border-orange-200',
    /* Type badge colours */
    'bg-amber-100', 'text-amber-800', 'border-amber-200',
    'bg-stone-100', 'text-stone-700', 'border-stone-200',
    'bg-rose-100', 'text-rose-800', 'border-rose-200',
    'bg-emerald-100', 'text-emerald-800', 'border-emerald-200',
    'bg-blue-100', 'text-blue-800', 'border-blue-200',
    'bg-red-100', 'text-red-800', 'border-red-200',
    'bg-gray-100', 'text-gray-700', 'border-gray-200',
    'bg-lime-100', 'text-lime-800', 'border-lime-200',
    'bg-purple-100', 'text-purple-800', 'border-purple-200',
    'bg-yellow-100', 'text-yellow-800', 'border-yellow-200',
    'bg-pink-100', 'text-pink-800', 'text-pink-700', 'border-pink-200',
    'bg-violet-100', 'text-violet-800', 'border-violet-200',
    'bg-zinc-200', 'text-zinc-800', 'border-zinc-300',
    'bg-slate-100', 'text-slate-700', 'border-slate-200',
    'bg-sky-100', 'text-sky-800', 'border-sky-200',
    'bg-indigo-100', 'text-indigo-800', 'border-indigo-200',
    'bg-amber-50', 'text-amber-700',
    'bg-emerald-50', 'text-emerald-700',
  ],
  plugins: [require("tailwindcss-animate")],
}