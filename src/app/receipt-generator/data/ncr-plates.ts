const NCR_SERIES = [
  ...Array.from({ length: 14 }, (_, i) => `DL${i + 1}`),
  'UP16',
  'UP14',
  'HR26',
  'HR55',
  'HR51',
];

const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

function randomLetters(count: number): string {
  let s = '';
  for (let i = 0; i < count; i++) {
    s += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return s;
}

function randomDigits(count: number): string {
  let s = '';
  for (let i = 0; i < count; i++) {
    s += String(Math.floor(Math.random() * 10));
  }
  return s;
}

function buildPlate(): string {
  const series = NCR_SERIES[Math.floor(Math.random() * NCR_SERIES.length)];
  const letterCount = Math.random() < 0.5 ? 2 : 3;
  return `${series}${randomLetters(letterCount)}${randomDigits(4)}`;
}

/** Compact NCR registration number, e.g. DL1TCY5678 (no spaces). */
export function randomNcrPlate(exclude?: string): string {
  const normalized = exclude?.replace(/\s+/g, '').toUpperCase();
  for (let attempt = 0; attempt < 24; attempt++) {
    const plate = buildPlate();
    if (plate !== normalized) return plate;
  }
  return buildPlate();
}
