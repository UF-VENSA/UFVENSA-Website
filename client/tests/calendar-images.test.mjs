import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from '../node_modules/vite/dist/node/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true }, appType: 'custom' });
const { getEventImage, normalizeEventTitle, parseCalendarEvent, separateEvents } = await server.ssrLoadModule('/src/lib/calendar.js');

test.after(async () => { await server.close(); });

const examples = [
  ['TRUNK OR TREAT', 'Trunk or Treat.jpeg'],
  ['Trunk-or-Treat', 'Trunk or Treat.jpeg'],
  ['Halloween Party', 'VENSA Halloween.jpeg'],
  ['Career Showcase', 'UF Career Showcase Image.jpg'],
  ['Lake Day', 'Lake Day photo.jpg'],
  ['Cafecito Chats', 'Cafecito Chats.png'],
  ['Pickleball Tournament', 'VENSA Pickleball.jpeg'],
  ['Piscinada', 'VENSA Piscinada.jpeg'],
  ['Total Body', 'VENSA Total Body.jpg'],
  ['Pilates', 'VENSA Pilates.png'],
  ['GBM', 'VENSA GBM.png'],
  ['General Body Meeting #1', 'VENSA GBM.png'],
  ['UF vs LSU', 'UF Gator Gameday Logo.jpg'],
  ['UF vs. Georgia', 'UF Gator Gameday Logo.jpg'],
  ['Florida vs Miami', 'UF Gator Gameday Logo.jpg'],
  ['Valentine’s BBQ', 'VENSA Valentines BBQ.jpeg'],
  ['Résumé Workshop', 'VENSA Resume Workshop.png'],
  ['Caracas en el 2000', 'Caracas en el 2000 fiesta.jpg'],
  ['VENSA Pace 5K', 'VENSA Pace 1.jpeg'],
  ['Beach Day', 'VENSA Beach Day.png'],
  ['Springs Trip', 'VENSA Springs.jpeg'],
  ['Tabling', 'VENSA Tabling.jpeg'],
  ['Bonfire', 'VENSA Bonfire.png'],
  ['E-Board Meeting', 'team 3.jpeg'],
  ['Career Showdown—Mentorship', 'VENSA Career Showdown Mentorship.png'],
  ['Community Service', 'VENSA Volunteering.jpeg'],
  ['15k fundraiser', '/vensa-logo.png'],
  ['Social Mixer in October', '/vensa-logo.png'],
  ['Professional Networking Class', '/vensa-logo.png'],
  ['Unknown random event', '/vensa-logo.png'],
];

test('calendar image imports exist with exact casing and are tracked by Git', () => {
  const source = readFileSync(new URL('../src/lib/calendar.js', import.meta.url), 'utf8');
  const filenames = readdirSync(new URL('../src/images/', import.meta.url));
  const tracked = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', 'src/images'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/);
  for (const match of source.matchAll(/from ['"]\.\.\/images\/([^'"]+)['"]/g)) {
    assert.ok(filenames.includes(match[1]), `Missing image or incorrect casing: ${match[1]}`);
    assert.ok(tracked.includes(`src/images/${match[1]}`), `Untracked image: ${match[1]}`);
  }
});

for (const [title, filename] of examples) {
  test(`maps ${title} to ${filename}`, () => {
    assert.ok(decodeURIComponent(getEventImage(title)).endsWith(filename));
  });
}

test('normalizes case, accents, punctuation and spacing', () => {
  assert.equal(normalizeEventTitle('  TRUNK-OR   TREAT  '), 'trunk or treat');
  assert.equal(normalizeEventTitle('Résumé Workshop'), 'resume workshop');
  assert.equal(normalizeEventTitle('Valentine’s BBQ'), 'valentines bbq');
});

test('calendar parsing retains schedule, location and RSVP metadata', () => {
  const raw = {
    id: 'event-1', summary: 'Halloween Party',
    start: { date: '2099-10-31' }, end: { date: '2099-11-01' },
    location: 'Reitz Union',
    description: 'Costumes welcome<br>FORM_URL: https://forms.gle/example SPREADSHEET_ID: sheet123',
  };
  const parsed = parseCalendarEvent(raw);
  assert.equal(parsed.isAllDay, true);
  assert.equal(parsed.startTime, 'All day');
  assert.equal(parsed.location, raw.location);
  assert.equal(parsed.formUrl, 'https://forms.gle/example');
  assert.equal(parsed.spreadsheetId, 'sheet123');
  assert.equal(parsed.imageType, 'photo');
  assert.equal(separateEvents([raw]).upcoming[0].id, raw.id);
});
