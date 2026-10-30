import localFont from 'next/font/local'

// Self-hosted, preloaded, Latin subset (the site is English). Archivo is variable on weight and width, cut to what the
// pages use (weights 400 to 800, widths 100 % to 125 %, scripts/fonts/subset-archivo.py): it is on the path of the
// largest paint, 33 kB instead of 90.
export const archivo = localFont({
  src: '../fonts/archivo-latin.woff2',
  variable: '--font-archivo',
  weight: '400 800',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '100% 125%' }],
})

export const azeret = localFont({
  src: '../fonts/azeret-mono-latin.woff2',
  variable: '--font-azeret',
  weight: '100 900',
  display: 'swap',
  preload: false,
})
