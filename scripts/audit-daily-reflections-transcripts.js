const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'docs', 'daily-reflections.json');
const reportPath = path.join(__dirname, '..', 'exports', 'daily-reflections-transcript-audit.md');
const jsonPath = path.join(__dirname, '..', 'exports', 'daily-reflections-transcript-audit.json');

function readManifest() {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return Array.isArray(raw) ? raw : raw.reflections || raw.items || raw.entries || raw.data || [];
}

function usage() {
  console.error('Użycie: node scripts/audit-daily-reflections-transcripts.js "<katalog-z-transkrypcjami>"');
  process.exit(1);
}

function stripTranscriptHeader(text) {
  return text
    .replace(/^\[[^\]]+\]\s*-\s*[^\n]+\n?/u, '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForCompare(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[„”"'.,!?;:()[\]{}<>/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLeadSentence(text) {
  const cleaned = stripTranscriptHeader(text);
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/u);
  return match ? match[1].trim() : cleaned;
}

function readTranscriptDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const transcripts = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.txt')) continue;

    const filePath = path.join(dirPath, entry.name);
    const rawText = fs.readFileSync(filePath, 'utf8');
    const id = entry.name.replace(/\.m4a\.txt$/iu, '').replace(/\.txt$/iu, '');

    transcripts.set(id, {
      id,
      fileName: entry.name,
      filePath,
      rawText,
      cleanedText: stripTranscriptHeader(rawText),
      leadSentence: extractLeadSentence(rawText),
    });
  }

  return transcripts;
}

function buildManifestFullText(item) {
  return [item.title, item.opening, item.reflection, item.question, item.smallStep, item.closing]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();
}

function summarize(entries, missingTranscriptIds, extraTranscriptIds) {
  const titleExact = entries.filter((entry) => entry.titleMatches).length;
  const titleMismatch = entries.length - titleExact;
  const fullExact = entries.filter((entry) => entry.fullTextMatches).length;

  return {
    manifestCount: entries.length,
    transcriptCount: entries.length + extraTranscriptIds.length - missingTranscriptIds.length,
    matchedIds: entries.length - missingTranscriptIds.length,
    missingTranscriptIds,
    extraTranscriptIds,
    titleExact,
    titleMismatch,
    fullExact,
    fullMismatch: entries.length - fullExact,
  };
}

function formatTableCell(value) {
  return String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

function writeReport(report, summary) {
  const lines = [];
  lines.push('# Audyt transkrypcji refleksji');
  lines.push('');
  lines.push(`- Wygenerowano: ${new Date().toISOString()}`);
  lines.push(`- Manifest: \`${path.relative(process.cwd(), manifestPath)}\``);
  lines.push(`- Liczba wpisów w manifeście: ${summary.manifestCount}`);
  lines.push(`- Liczba plików txt: ${summary.transcriptCount}`);
  lines.push(`- Zgodny tytuł z audio: ${summary.titleExact}/${summary.manifestCount}`);
  lines.push(`- Rozjazd tytułu względem audio: ${summary.titleMismatch}/${summary.manifestCount}`);
  lines.push(`- Pełny tekst zgodny 1:1 po normalizacji: ${summary.fullExact}/${summary.manifestCount}`);
  lines.push('');
  lines.push('## Wnioski');
  lines.push('');
  lines.push('- Jeśli audio ma być źródłem prawdy, wszystkie 59 wpisów wymagają odświeżenia treści tekstowej z transkrypcji.');
  lines.push('- Tytuł jest już zgodny z początkiem audio tylko w części wpisów; reszta wymaga podmiany także w polu `title`.');
  lines.push('- Transkrypcje są ponumerowane zgodnie z technicznym `id`, więc można ich bezpiecznie używać jako podstawy do dalszych aktualizacji.');
  lines.push('');

  if (summary.missingTranscriptIds.length > 0) {
    lines.push('## Brakujące transkrypcje');
    lines.push('');
    for (const id of summary.missingTranscriptIds) {
      lines.push(`- ${id}`);
    }
    lines.push('');
  }

  if (summary.extraTranscriptIds.length > 0) {
    lines.push('## Dodatkowe transkrypcje bez wpisu w manifeście');
    lines.push('');
    for (const id of summary.extraTranscriptIds) {
      lines.push(`- ${id}`);
    }
    lines.push('');
  }

  lines.push('## Tytuły do podmiany');
  lines.push('');
  lines.push('| id | title w manifeście | początek audio |');
  lines.push('| --- | --- | --- |');

  const titleMismatches = report.entries.filter((entry) => !entry.titleMatches);
  for (const entry of titleMismatches) {
    lines.push(
      `| ${formatTableCell(entry.id)} | ${formatTableCell(entry.manifestTitle)} | ${formatTableCell(entry.transcriptLead)} |`
    );
  }

  lines.push('');
  lines.push('## Pełne porównanie 59 wpisów');
  lines.push('');
  lines.push('| id | status title | akcja | title w manifeście | początek audio |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const entry of report.entries) {
    const action = entry.titleMatches ? 'Przepisać treść z transkrypcji' : 'Podmienić title i treść z transkrypcji';
    lines.push(
      `| ${formatTableCell(entry.id)} | ${entry.titleMatches ? 'OK' : 'DO POPRAWY'} | ${action} | ${formatTableCell(entry.manifestTitle)} | ${formatTableCell(entry.transcriptLead)} |`
    );
  }

  lines.push('');
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const transcriptsDir = process.argv[2];
  if (!transcriptsDir) usage();

  const resolvedDir = path.resolve(process.cwd(), transcriptsDir);
  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    console.error(`Nie znaleziono katalogu z transkrypcjami: ${resolvedDir}`);
    process.exit(1);
  }

  const manifestItems = readManifest();
  const transcripts = readTranscriptDirectory(resolvedDir);

  const entries = manifestItems
    .map((item) => {
      const transcript = transcripts.get(item.id);
      const manifestFullText = buildManifestFullText(item);

      return {
        id: item.id,
        audioPath: item.audioPath || null,
        manifestTitle: item.title || '',
        transcriptFileName: transcript ? transcript.fileName : null,
        transcriptLead: transcript ? transcript.leadSentence : null,
        titleMatches: transcript
          ? normalizeForCompare(item.title || '') === normalizeForCompare(transcript.leadSentence)
          : false,
        fullTextMatches: transcript
          ? normalizeForCompare(manifestFullText) === normalizeForCompare(transcript.cleanedText)
          : false,
        manifestFullText,
        transcriptText: transcript ? transcript.cleanedText : null,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id, 'pl'));

  const manifestIds = new Set(entries.map((entry) => entry.id));
  const missingTranscriptIds = entries.filter((entry) => !entry.transcriptText).map((entry) => entry.id);
  const extraTranscriptIds = [...transcripts.keys()].filter((id) => !manifestIds.has(id)).sort((a, b) => a.localeCompare(b, 'pl'));
  const summary = summarize(entries, missingTranscriptIds, extraTranscriptIds);

  const report = {
    generatedAt: new Date().toISOString(),
    transcriptsDir: resolvedDir,
    summary,
    entries,
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeReport(report, summary);

  console.log(`Zapisano raport: ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Zapisano JSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(
    `Podsumowanie: ${summary.manifestCount} wpisów, ${summary.titleMismatch} tytułów do podmiany, ${summary.fullMismatch} wpisów do przepisania z audio.`
  );
}

main();
