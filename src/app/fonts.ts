import localFont from 'next/font/local'

// Self-hosted, preloaded, latin subset (the site is English). Archivo is variable on weight and width: the display
// type uses its 125 % width (tokens.css, --display-stretch).
export const archivo = localFont({
  src: '../fonts/archivo-latin.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
})

export const azeret = localFont({
  src: '../fonts/azeret-mono-latin.woff2',
  variable: '--font-azeret',
  weight: '100 900',
  display: 'swap',
  preload: false,
})
