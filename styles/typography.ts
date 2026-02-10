export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const TYPE = {
  display: { fontFamily: FONT.bold, fontSize: 36, lineHeight: 42 },
  h1: { fontFamily: FONT.bold, fontSize: 32, lineHeight: 38 },
  h2: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: FONT.regular, fontSize: 18, lineHeight: 26 },
  bodyStrong: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 26 },
  bodySmall: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 18, letterSpacing: 0.4 },
  button: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 22 },
} as const;
