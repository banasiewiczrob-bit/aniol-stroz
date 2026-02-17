export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const TYPE = {
  display: { fontFamily: FONT.bold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: FONT.bold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: FONT.semibold, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 25 },
  body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 18, letterSpacing: 0.25 },
  button: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 22 },
} as const;
