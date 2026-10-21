import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), 'VITE_');
const key = env.VITE_GOOGLE_CALENDAR_API_KEY;
const ids = (env.VITE_GOOGLE_CALENDAR_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
console.log({ keyPresent: Boolean(key), calendarCount: ids.length });
for (const [index, id] of ids.entries()) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
  url.search = new URLSearchParams({ key, singleEvents: 'true', orderBy: 'startTime', timeMin: new Date().toISOString(), maxResults: '10' });
  const response = await fetch(url, { headers: { Referer: process.argv[2] || 'http://127.0.0.1:5173/' } });
  const body = await response.json();
  console.log({ calendar: index + 1, status: response.status,
    message: body.error?.message?.replaceAll(key, '[redacted]'),
    reasons: body.error?.errors?.map(error => error.reason),
    upcoming: body.items?.map(event => ({ title: event.summary, start: event.start })) });
  if (!response.ok) break;
}
