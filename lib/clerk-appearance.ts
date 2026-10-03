// Shared Clerk styling to match the dark navy/cyan site theme.
// Uses the current (2025-07+) Clerk variable names; the old colorText/
// colorInputBackground names are deprecated and ignored by newer clerk-js,
// which left the card text dark-on-dark.
export const clerkAppearance = {
  variables: {
    colorPrimary: '#00d4f5',
    colorPrimaryForeground: '#060d1a',
    colorBackground: '#0b1628',
    colorForeground: '#f0f4ff',
    colorMutedForeground: '#b4c5e0',
    colorMuted: '#111f36',
    colorNeutral: '#f0f4ff',
    colorBorder: 'rgba(0,212,245,0.25)',
    colorInput: '#060d1a',
    colorInputForeground: '#f0f4ff',
    colorRing: '#00d4f5',
    borderRadius: '2px',
  },
  elements: {
    card: { border: '1px solid rgba(0,212,245,0.25)', boxShadow: 'none' },
    formButtonPrimary: { color: '#060d1a', fontWeight: 700 },
  },
}
