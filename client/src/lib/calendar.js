// ============================================================
// VENSA EVENT IMAGES
// ============================================================

// General / recurring events
import gbmImage from '../images/VENSA GBM.png';
import vensaBeachDay from '../images/VENSA Beach Day.png';
import bonfireImage from '../images/VENSA Bonfire.png';
import resumeWorkshopImage from '../images/VENSA Resume Workshop.png';
import pilatesImage from '../images/VENSA Pilates.png';
import eboardImage from '../images/VENSA Eboard.png';
import volunteerImage from '../images/VENSA Volunteering.jpeg';
import valentineBbqImage from '../images/VENSA Valentines BBQ.jpeg';
import pickleballImage from '../images/VENSA Pickleball.jpeg';
import tablingImage from '../images/VENSA Tabling.jpeg';
import totalBodyImage from '../images/VENSA Total Body.jpg';
import fiestaCaracasImage from '../images/Caracas en el 2000 fiesta.jpg';
import run5kImage from '../images/VENSA Pace 1.jpeg';
import vensaSpringImage from '../images/VENSA Springs.jpeg';
import gatorGamedayImage from '../images/UF Gator Gameday Logo.jpg';
import cafecitoImage from '../images/Cafecito Chats.png';
import careerShowcaseImage from '../images/UF Career Showcase Image.jpg';
import lakeDayImage from '../images/Lake Day photo.jpg';
import piscinadaImage from '../images/VENSA Piscinada.jpeg';

// Halloween events
import halloweenImage from '../images/VENSA Halloween.jpeg';
import trunkOrTreatImage from '../images/Trunk or Treat.jpeg';

// Default image
const vensaLogo = '/vensa-logo.png';

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const CALENDAR_IDS = import.meta.env.VITE_GOOGLE_CALENDAR_IDS?.split(',').map((id) => id.trim()).filter(Boolean) || [];

// Normalize punctuation, accents and spacing so phrases match whole words.
// Add future named events here, with specific phrases before broader event names.
export function normalizeEventTitle(title) {
  return String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const EVENT_IMAGE_RULES = [
  { matchers: ['trunk or treat'], image: trunkOrTreatImage },
  { matchers: ['halloween party', 'halloween'], image: halloweenImage },
  { matchers: ['career showcase'], image: careerShowcaseImage },
  { matchers: ['lake day'], image: lakeDayImage },
  { matchers: ['cafecito chats', 'cafecito'], image: cafecitoImage },
  { matchers: ['pickleball'], image: pickleballImage },
  { matchers: ['piscinada'], image: piscinadaImage },
  { matchers: ['total body'], image: totalBodyImage },
  { matchers: ['pilates'], image: pilatesImage },
  { matchers: ['resume workshop'], image: resumeWorkshopImage },
  { matchers: ['valentines bbq', 'valentine bbq'], image: valentineBbqImage },
  { matchers: ['caracas en el 2000'], image: fiestaCaracasImage },
  { matchers: ['vensa 5k', 'vensa pace', '5k'], image: run5kImage },
  { matchers: ['beach day'], image: vensaBeachDay },
  { matchers: ['springs trip', 'spring trip', 'springs'], image: vensaSpringImage },
  { matchers: ['tabling'], image: tablingImage },
  { matchers: ['bonfire'], image: bonfireImage },
  { matchers: ['general body meeting', 'gbm'], image: gbmImage },
  { matchers: ['executive board', 'e board', 'eboard'], image: eboardImage },
  { matchers: ['community service', 'volunteering', 'volunteer event', 'food bank', 'blood drive'], image: volunteerImage },
];

export function getEventImage(eventTitle) {
  const title = normalizeEventTitle(eventTitle);
  if (/\b(?:uf|florida) vs [a-z0-9]/.test(title)) return gatorGamedayImage;

  const paddedTitle = ` ${title} `;
  for (const rule of EVENT_IMAGE_RULES) {
    if (rule.matchers.some((phrase) => paddedTitle.includes(` ${phrase} `))) {
      return rule.image;
    }
  }
  return vensaLogo;
}

export function isEventArtwork(imageUrl) {
  return imageUrl === vensaLogo || imageUrl === gatorGamedayImage;
}

export async function fetchCalendarEvents({ throwOnError = false } = {}) {
  try {
    if (!API_KEY || !CALENDAR_IDS.length) throw new Error('Calendar configuration is missing.');
    console.log('API Key:', API_KEY ? 'Present' : 'Missing');
    console.log('Calendar IDs:', CALENDAR_IDS.length);
    
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 6); // Get events from 6 months ago
    
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 6); // Get events up to 6 months ahead

    // Fetch events from all calendars in parallel
    const allEventsPromises = CALENDAR_IDS.map(async (calendarId) => {
      try {
        const trimmedId = calendarId.trim();
        // Add fields parameter to include attachments
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(trimmedId)}/events?key=${API_KEY}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;

        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Failed to fetch from calendar:`, response.status);
          return null;
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error(`Error fetching calendar:`, error);
        return null;
      }
    });

    const allEventsArrays = await Promise.all(allEventsPromises);
    if (allEventsArrays.every((events) => events === null)) {
      throw new Error('Calendar requests failed.');
    }
    const allEvents = allEventsArrays.filter(Boolean).flat();
    
    // Sort all events by start time
    allEvents.sort((a, b) => {
      const startA = new Date(a.start.dateTime || a.start.date);
      const startB = new Date(b.start.dateTime || b.start.date);
      return startA - startB;
    });

    console.log('Total events fetched:', allEvents.length);
    return allEvents;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    if (throwOnError) throw new Error('Unable to load events right now. Please try again.');
    return [];
  }
}

export function parseCalendarEvent(event) {
  const start = event.start.dateTime || event.start.date;
  const end = event.end.dateTime || event.end.date;
  const parseEventDate = (value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value);
  };
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end);
  const isAllDay = Boolean(event.start.date && !event.start.dateTime);
  const title = event.summary || event.title || 'Event';
  const description = event.description || '';

  // Use a specific local event image, or the VENSA logo for unknown titles.
  const imageUrl = getEventImage(title);

  // Strip HTML tags from description before parsing
  // Remove anchor tags but keep only the inner text (not the href) to avoid duplication
  let cleanDescription = description
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1') // Replace <a href="...">text</a> with just text
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> with space
    .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags

  // Debug: Log the cleaned description to see what we're parsing
  if (cleanDescription.includes('FORM_URL')) {
    console.log('Cleaned description for', event.summary, ':', cleanDescription);
  }

  // Extract Google Form URL and Spreadsheet ID from description
  // Format: FORM_URL: https://forms.gle/xyz
  //         SPREADSHEET_ID: abc123def456
  let formUrl = null;
  let spreadsheetId = null;

  const formUrlMatch = cleanDescription.match(/FORM_URL:\s*(https?:\/\/[^\s]+)/i);
  const spreadsheetIdMatch = cleanDescription.match(/SPREADSHEET_ID:\s*([^\s]+)/i);

  if (formUrlMatch) {
    formUrl = formUrlMatch[1];
    console.log('Extracted formUrl:', formUrl);
  }
  if (spreadsheetIdMatch) {
    spreadsheetId = spreadsheetIdMatch[1];
    console.log('Extracted spreadsheetId:', spreadsheetId);
  }

  if (formUrlMatch) {
    formUrl = formUrlMatch[1].trim();
  }

  if (spreadsheetIdMatch) {
    spreadsheetId = spreadsheetIdMatch[1].trim();
  }

  return {
    id: event.id,
    title: title,
    description: description,
    location: event.location || 'TBD',
    imageUrl: imageUrl,
    imageType: isEventArtwork(imageUrl) ? 'artwork' : 'photo',
    startDate: startDate,
    endDate: endDate,
    startDateFormatted: startDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    startTime: isAllDay
      ? 'All day'
      : startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
    isAllDay,
    isPast: endDate < new Date(),
    isUpcoming: startDate > new Date(),
    formUrl: formUrl,
    spreadsheetId: spreadsheetId,
  };
}

export function separateEvents(events) {
  const now = new Date();
  const parsedEvents = events.map(parseCalendarEvent);
  
  // Upcoming events: events that START in the future
  const upcomingEvents = parsedEvents.filter(event => event.startDate > now);
  
  // Past events: events that have already started (even if still ongoing)
  const pastEvents = parsedEvents.filter(event => event.startDate <= now);

  console.log(`Found ${upcomingEvents.length} upcoming events and ${pastEvents.length} past events`);

  return {
    upcoming: upcomingEvents,
    past: pastEvents.reverse() // Most recent past events first
  };
}
