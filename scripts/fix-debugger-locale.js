const fs = require('node:fs');
const path = require('node:path');

const localesDir = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'debugger-frontend',
  'dist',
  'third-party',
  'front_end',
  'core',
  'i18n',
  'locales'
);

const fallbackLocaleFile = path.join(localesDir, 'en-US.json');
const polishLocaleFile = path.join(localesDir, 'pl.json');

if (!fs.existsSync(localesDir) || !fs.existsSync(fallbackLocaleFile)) {
  console.log('[fix-debugger-locale] Skipped: debugger locales not found.');
  process.exit(0);
}

if (!fs.existsSync(polishLocaleFile)) {
  fs.copyFileSync(fallbackLocaleFile, polishLocaleFile);
  console.log('[fix-debugger-locale] Created missing locale: pl.json');
} else {
  console.log('[fix-debugger-locale] pl.json already exists.');
}
