import janImg from '../assets/calendar/january.jpg';
import febImg from '../assets/calendar/february.jpg';
import marImg from '../assets/calendar/march.jpg';
import aprImg from '../assets/calendar/april.jpg';
import mayImg from '../assets/calendar/may.jpg';
import junImg from '../assets/calendar/june.svg';
import julImg from '../assets/calendar/july.svg';
import augImg from '../assets/calendar/august.svg';
import sepImg from '../assets/calendar/september.svg';
import octImg from '../assets/calendar/october.svg';
import novImg from '../assets/calendar/november.svg';
import decImg from '../assets/calendar/december.svg';

export interface CalendarPostcardData {
  monthIndex: number; // 0-11
  name: string;
  shortName: string;
  quote: string;
  image: string;
  imageAlt: string;
  tint: string;
}

export const MONTH_POSTCARDS: Record<number, CalendarPostcardData> = {
  0: {
    monthIndex: 0,
    name: 'January',
    shortName: 'Jan.',
    quote: 'new places, same you ♡',
    image: janImg,
    imageAlt: 'Airplane wing over warm pastel sunset clouds',
    tint: '#f4a261',
  },
  1: {
    monthIndex: 1,
    name: 'February',
    shortName: 'Feb.',
    quote: 'up, up & away ♡',
    image: febImg,
    imageAlt: 'Commercial airliner flying through sunny bright sky with cumulus clouds',
    tint: '#457b9d',
  },
  2: {
    monthIndex: 2,
    name: 'March',
    shortName: 'Mar.',
    quote: 'send flights only ♡',
    image: marImg,
    imageAlt: 'Airplane window view of turquoise ocean and coastline',
    tint: '#2a9d8f',
  },
  3: {
    monthIndex: 3,
    name: 'April',
    shortName: 'Apr.',
    quote: 'collect moments ♡',
    image: aprImg,
    imageAlt: 'Airliner on runway tarmac during golden hour sunset',
    tint: '#e76f51',
  },
  4: {
    monthIndex: 4,
    name: 'May',
    shortName: 'May.',
    quote: 'sky is not the limit ♡',
    image: mayImg,
    imageAlt: 'Airplane climbing high into deep blue sky leaving contrails',
    tint: '#1d3557',
  },
  5: {
    monthIndex: 5,
    name: 'June',
    shortName: 'Jun.',
    quote: 'farther together ♡',
    image: junImg,
    imageAlt: 'Airplane window framing pastel pink clouds and wingtip',
    tint: '#d6809e',
  },
  6: {
    monthIndex: 6,
    name: 'July',
    shortName: 'Jul.',
    quote: 'adventure awaits ♡',
    image: julImg,
    imageAlt: 'Passenger airplane cruising above summer cloudscape',
    tint: '#1f78b4',
  },
  7: {
    monthIndex: 7,
    name: 'August',
    shortName: 'Aug.',
    quote: 'good vibes, higher altitudes ♡',
    image: augImg,
    imageAlt: 'Airplane window view over emerald tropical coastline',
    tint: '#238443',
  },
  8: {
    monthIndex: 8,
    name: 'September',
    shortName: 'Sep.',
    quote: 'on my way ♡',
    image: sepImg,
    imageAlt: 'Airplane wing over mountain peaks bathed in sunrise glow',
    tint: '#8c6d87',
  },
  9: {
    monthIndex: 9,
    name: 'October',
    shortName: 'Oct.',
    quote: 'more skies, more stories ♡',
    image: octImg,
    imageAlt: 'Airplane silhouetted against giant golden sunset',
    tint: '#cc5a36',
  },
  10: {
    monthIndex: 10,
    name: 'November',
    shortName: 'Nov.',
    quote: 'same sky, new dreams ♡',
    image: novImg,
    imageAlt: 'Oval aircraft window framing wing in twilight dusk',
    tint: '#3d5a80',
  },
  11: {
    monthIndex: 11,
    name: 'December',
    shortName: 'Dec.',
    quote: 'endings are new beginnings ♡',
    image: decImg,
    imageAlt: 'Night flight view with starry sky, crescent moon and city lights',
    tint: '#0d1b2a',
  },
};

export function getPostcardForMonth(monthIndex: number): CalendarPostcardData {
  const safeIndex = ((monthIndex % 12) + 12) % 12;
  return MONTH_POSTCARDS[safeIndex] || MONTH_POSTCARDS[0];
}
