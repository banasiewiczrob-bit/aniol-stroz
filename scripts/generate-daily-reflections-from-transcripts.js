const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'docs', 'daily-reflections.json');
const defaultOutputPath = path.join(__dirname, '..', 'exports', 'daily-reflections.from-transcripts.json');

function usage() {
  console.error(
    'Użycie: node scripts/generate-daily-reflections-from-transcripts.js "<katalog-z-transkrypcjami>" [ścieżka-wyjściowa]'
  );
  process.exit(1);
}

function readManifest() {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const reflections = Array.isArray(raw) ? raw : raw.reflections || raw.items || raw.entries || raw.data || [];
  const version = Array.isArray(raw) ? 1 : raw.version || 1;
  return { raw, reflections, version };
}

function stripTranscriptHeader(text) {
  return text
    .replace(/^\[[^\]]+\]\s*-\s*[^\n]+\n?/u, '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const rawParts = normalized.match(/[^.!?]+[.!?]?/gu) || [normalized];
  return rawParts.map((part) => part.trim()).filter(Boolean);
}

function stripTrailingPunctuation(text) {
  return text.replace(/[.!?]+$/u, '').trim();
}

function cleanTitle(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

function stripActionSuffix(text) {
  return text
    .replace(/\s*I niech to dziś będzie Twoim małym krokiem naprzód[.!?]?$/iu, '')
    .replace(/\s*I niech to będzie Twój mały krok na dziś[.!?]?$/iu, '')
    .replace(/\s*I to będzie mój mały krok na dziś(?:aj)?[.!?]?$/iu, '')
    .replace(/\s*I to będzie Twój mały krok na dziś(?:aj)?[.!?]?$/iu, '')
    .replace(/\s*Niech to będzie Twój mały krok na dziś[.!?]?$/iu, '')
    .trim();
}

function findSmallStepStart(text) {
  const markers = [
    'Dokończ zdanie',
    'Połóż dłoń',
    'Jedno pytanie',
    'Wypowiedz',
    'Rozpoznaj dziś',
    'Rozpoznaj',
    'Zapytaj siebie',
    'Dziś zadam sobie pytanie',
    'Powiedz sobie',
    'Powiedz w myślach',
    'Powiedz na głos',
    'Powiedz jedno zdanie',
    'Powiedz',
    'Zapisz lub powiedz',
    'Zapisz',
    'Nazwij',
    'Znajdź dziś',
    'Znajdź',
    'Jeśli stoisz przed decyzją',
    'Zrób sobie',
    'Zrób dziś',
    'Zrób',
    'Dwa oddechy',
    'Weź spokojny oddech',
    'Poczuj',
  ];

  const threshold = Math.floor(text.length * 0.55);
  let bestIndex = -1;

  for (const marker of markers) {
    const index = text.lastIndexOf(marker);
    if (index >= threshold && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  return bestIndex;
}

function buildEntryFromTranscript(item, transcriptText) {
  const cleanedTranscript = stripTranscriptHeader(transcriptText);
  const sentences = splitIntoSentences(cleanedTranscript);

  const title = cleanTitle(sentences[0] || item.title || '');
  const body = sentences.slice(1).join(' ').trim();
  const smallStepStart = findSmallStepStart(body);

  let reflection = body;
  let smallStep = '';

  if (smallStepStart >= 0) {
    reflection = body.slice(0, smallStepStart).trim();
    smallStep = stripActionSuffix(body.slice(smallStepStart).trim());
  }

  return {
    ...item,
    title: title || item.title || '',
    opening: '',
    reflection: reflection || item.reflection || '',
    question: '',
    smallStep,
    closing: '',
  };
}

function main() {
  const transcriptsDirArg = process.argv[2];
  const outputPathArg = process.argv[3];
  if (!transcriptsDirArg) usage();

  const transcriptsDir = path.resolve(process.cwd(), transcriptsDirArg);
  const outputPath = outputPathArg ? path.resolve(process.cwd(), outputPathArg) : defaultOutputPath;

  if (!fs.existsSync(transcriptsDir) || !fs.statSync(transcriptsDir).isDirectory()) {
    console.error(`Nie znaleziono katalogu z transkrypcjami: ${transcriptsDir}`);
    process.exit(1);
  }

  const { reflections, version } = readManifest();
  const missing = [];

  const nextReflections = reflections.map((item) => {
    const transcriptFile = path.join(transcriptsDir, `${item.id}.m4a.txt`);
    if (!fs.existsSync(transcriptFile)) {
      missing.push(item.id);
      return item;
    }

    const transcriptText = fs.readFileSync(transcriptFile, 'utf8');
    return buildEntryFromTranscript(item, transcriptText);
  });

  const nextManifest = {
    version,
    updatedAt: new Date().toISOString().slice(0, 10),
    reflections: nextReflections,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');

  console.log(`Zapisano manifest: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Przepisano z transkrypcji: ${nextReflections.length - missing.length}/${nextReflections.length}`);
  if (missing.length > 0) {
    console.log(`Brak transkrypcji dla: ${missing.join(', ')}`);
  }
}

main();
