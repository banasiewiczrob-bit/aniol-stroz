const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'docs', 'daily-reflections.json');

function readManifest() {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return Array.isArray(raw) ? raw : raw.reflections || raw.items || raw.entries || raw.data || [];
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function inferRotationGroup(item) {
  if (isNonEmptyString(item.rotationGroup)) return item.rotationGroup.trim();
  if (isNonEmptyString(item.group)) return item.group.trim();
  if (isNonEmptyString(item.block)) return item.block.trim();
  if (isNonEmptyString(item.id)) {
    const match = /^([a-z0-9]+)-/i.exec(item.id.trim());
    if (match) return match[1].toLowerCase();
  }
  return 'default';
}

function isValidMonthDay(value) {
  if (!isNonEmptyString(value) || !/^\d{2}-\d{2}$/.test(value)) return false;
  const [month, day] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(2024, month - 1, day));
  return probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
}

function collectDuplicates(values) {
  const counts = new Map();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function main() {
  const items = readManifest();
  const errors = [];

  if (items.length === 0) {
    errors.push('Manifest nie zawiera żadnych refleksji.');
  }

  const duplicateIds = collectDuplicates(items.map((item) => item.id));
  const duplicateAudioPaths = collectDuplicates(items.map((item) => item.audioPath));
  const duplicateMonthDays = collectDuplicates(items.map((item) => item.monthDay));

  if (duplicateIds.length > 0) {
    errors.push(`Zduplikowane id: ${duplicateIds.map((item) => `${item.value} (${item.count})`).join(', ')}`);
  }
  if (duplicateAudioPaths.length > 0) {
    errors.push(`Zduplikowane audioPath: ${duplicateAudioPaths.map((item) => `${item.value} (${item.count})`).join(', ')}`);
  }
  if (duplicateMonthDays.length > 0) {
    errors.push(`Zduplikowane monthDay: ${duplicateMonthDays.map((item) => `${item.value} (${item.count})`).join(', ')}`);
  }

  items.forEach((item, index) => {
    const label = item.id || `#${index + 1}`;

    if (!isNonEmptyString(item.id)) {
      errors.push(`Brak id dla wpisu ${label}.`);
    }
    if (!isNonEmptyString(item.title)) {
      errors.push(`Brak title dla wpisu ${label}.`);
    }
    if (!isNonEmptyString(item.reflection)) {
      errors.push(`Brak reflection dla wpisu ${label}.`);
    }
    if (!isNonEmptyString(item.audioPath)) {
      errors.push(`Brak audioPath dla wpisu ${label}.`);
    }
    if (item.monthDay != null && !isValidMonthDay(item.monthDay)) {
      errors.push(`Nieprawidłowe monthDay dla wpisu ${label}: ${item.monthDay}`);
    }
    if (item.durationSec != null && !(typeof item.durationSec === 'number' && Number.isFinite(item.durationSec))) {
      errors.push(`Nieprawidłowe durationSec dla wpisu ${label}.`);
    }
    if (item.tags != null && !Array.isArray(item.tags)) {
      errors.push(`Pole tags nie jest tablicą dla wpisu ${label}.`);
    }
  });

  if (errors.length > 0) {
    console.error('Walidacja manifestu refleksji nie powiodła się:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const withQuestion = items.filter((item) => isNonEmptyString(item.question)).length;
  const withClosing = items.filter((item) => isNonEmptyString(item.closing)).length;
  const rotationGroups = [...new Set(items.map((item) => inferRotationGroup(item)))];

  console.log(`OK: ${items.length} refleksji, brak błędów strukturalnych.`);
  console.log(`Info: pytanie ma ${withQuestion}/${items.length} wpisów, domknięcie ma ${withClosing}/${items.length} wpisów.`);
  console.log(`Info: wykryte bloki rotacji: ${rotationGroups.join(', ')}.`);
}

main();
