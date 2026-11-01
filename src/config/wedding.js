/* wedding.js — the one place every name, date, address, link and number
 * lives. Nothing else in the site carries wedding information; every panel,
 * page texture, calendar file, map and share tag reads from here.
 *
 * Times are Pakistan time (Asia/Karachi, UTC+5) and are written with their
 * offset so they mean the same instant in every guest's timezone. Labels are
 * written out in full so no formatting step can change their meaning.
 */

export const WEDDING = {
  pageTitle: 'Mahnoor & Shirza | Wedding Invitation',

  /* 'bride-first' shows "Mahnoor & Shirza"; 'groom-first' shows
     "Shirza & Mahnoor". The page title above is kept as supplied either way. */
  nameOrder: 'bride-first',

  bride: { first: 'Mahnoor', full: 'Mahnoor Fiaz' },
  groom: { first: 'Shirza', full: 'Shirza Hashmi' },
  monogram: 'M & S',

  timezone: 'Asia/Karachi',
  utcOffset: '+05:00',

  bismillah: {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
  },

  verse: {
    reference: 'Surah Ar-Rum 30:21',
    arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً',
    translation: 'And of His signs is that He created for you mates from among yourselves, that you may find tranquillity in them; and He placed between you affection and mercy.',
  },

  invitation: 'Mr. & Mrs. Mirza Fiaz Ahmed request the honour of your presence and prayers at the wedding of their beloved daughter Mahnoor Fiaz with Shirza Hashmi',

  closing: [
    'With love and prayers: Mirza Fiaz Ahmed & Alia Fiaz',
    'Awaiting your presence: Ashar Fiaz, Haseeb Fiaz, Talha Fiaz',
    'Your presence and prayers mean the world to us',
  ],

  events: [
    {
      id: 'mehndi',
      name: 'Mehndi',
      accent: '#2f6b4a',
      dayLabel: 'Saturday, 26 December 2026',
      shortDayLabel: 'Saturday 26 December 2026',
      timeLabel: '7:00 pm to 10:00 pm',
      dinner: '9:00 pm',
      rukhsati: null,
      venue: 'Elegance Marquee, Khanna Pul, Islamabad',
      mapsAddress: 'Missile Chowk, beside KRL Community Hall Marquee Zone, Service Road W, Islamabad Expressway',
      directions: 'https://maps.google.com/?cid=3485907793680232015',
      embed: 'https://maps.google.com/maps?cid=3485907793680232015&output=embed',
      start: '2026-12-26T19:00:00+05:00',
      end: '2026-12-26T22:00:00+05:00',
    },
    {
      id: 'barat',
      name: 'Barat',
      accent: '#9b1c31',
      dayLabel: 'Sunday, 27 December 2026',
      shortDayLabel: 'Sunday 27 December 2026',
      timeLabel: '7:00 pm to 10:00 pm',
      dinner: '9:00 pm',
      rukhsati: '10:00 pm',
      venue: 'Zircon Marquee, Kuri Road, Islamabad',
      mapsAddress: 'Plot 1, Islamabad Expressway, near Barqi PSO pump, Nawaz, Islamabad',
      directions: 'https://maps.google.com/?cid=2306735650288776135',
      embed: 'https://maps.google.com/maps?cid=2306735650288776135&output=embed',
      start: '2026-12-27T19:00:00+05:00',
      end: '2026-12-27T22:00:00+05:00',
    },
  ],

  rsvp: {
    whatsappNumber: '923120874969',
    recipient: 'Ashar',
    maxGuests: 10,
  },

  contacts: [
    { name: 'Mirza Fiaz Ahmed', display: '0300 9563850', e164: '+923009563850' },
    { name: 'Ashar Fiaz', display: '0312 0874969', e164: '+923120874969' },
  ],

  /* The MP3 is supplied separately. Until a file exists at this path the
     music control stays hidden. */
  music: {
    src: '/audio/until-i-found-you.mp3',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
  },

  share: {
    description: 'Wedding of Mahnoor Fiaz and Shirza Hashmi. Mehndi: Saturday, 26 December 2026. Barat: Sunday, 27 December 2026. Islamabad.',
    /* 'names' uses the names-in-gold image at /og-image.jpg; 'none' sends
       text only. */
    image: 'names',
  },
};

/* "Mahnoor & Shirza" or "Shirza & Mahnoor", by nameOrder. */
export function coupleNames(sep = ' & ', { full = false } = {}) {
  const b = full ? WEDDING.bride.full : WEDDING.bride.first;
  const g = full ? WEDDING.groom.full : WEDDING.groom.first;
  return WEDDING.nameOrder === 'groom-first' ? `${g}${sep}${b}` : `${b}${sep}${g}`;
}

export const eventById = (id) => WEDDING.events.find((e) => e.id === id);
