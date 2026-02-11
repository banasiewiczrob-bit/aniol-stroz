export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const TYPE = {
  display: { fontFamily: FONT.bold, fontSize: 40, lineHeight: 46 },
  h1: { fontFamily: FONT.bold, fontSize: 36, lineHeight: 42 },
  h2: { fontFamily: FONT.semibold, fontSize: 28, lineHeight: 34 },
  h3: { fontFamily: FONT.semibold, fontSize: 23, lineHeight: 30 },
  body: { fontFamily: FONT.regular, fontSize: 20, lineHeight: 30 },
  bodyStrong: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 30 },
  bodySmall: { fontFamily: FONT.regular, fontSize: 18, lineHeight: 26 },
  caption: { fontFamily: FONT.medium, fontSize: 16, lineHeight: 22, letterSpacing: 0.35 },
  button: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 26 },
} as const;
