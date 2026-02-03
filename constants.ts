
import { Currency, LocationCategory, ItineraryItem, NoteItem, Expense } from './types';

export const MOCK_RATES: Record<string, number> = {
  [Currency.JPY]: 0.21, // 1 JPY = 0.21 TWD
  [Currency.TWD]: 1,
  [Currency.USD]: 31.5
};

// SIMULATION: Assume today is Day 2 of the trip (Yesterday was Day 1)
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const day1 = yesterday.toISOString().split('T')[0];
const day2 = today.toISOString().split('T')[0];

export const INITIAL_ITINERARY: ItineraryItem[] = [
  {
    id: 'day1-flight',
    date: day1,
    time: '10:00',
    title: '飛往日本',
    locationName: '桃園國際機場',
    category: LocationCategory.TRANSPORT,
    timeZone: 'Asia/Taipei'
  },
  {
    id: 'day1-arrival',
    date: day1,
    time: '14:00',
    title: '抵達關西機場',
    locationName: '關西國際機場, 大阪',
    category: LocationCategory.TRANSPORT,
    timeZone: 'Asia/Tokyo'
  },
  // Day 2 (Today) - Testing Automatic Time Zone Switch to JST
  {
    id: 'day2-morning',
    date: day2,
    time: '09:00',
    title: '環球影城 USJ',
    locationName: 'Universal Studios Japan, 大阪',
    category: LocationCategory.SIGHTSEEING,
    timeZone: 'Asia/Tokyo'
  },
  {
    id: 'day2-lunch',
    date: day2,
    time: '12:30',
    title: '瑪利歐主題午餐',
    locationName: 'Kinopio\'s Cafe',
    category: LocationCategory.FOOD,
    timeZone: 'Asia/Tokyo'
  },
  {
    id: 'day2-dinner',
    date: day2,
    time: '19:00',
    title: '道頓堀晚餐',
    locationName: '道頓堀, 大阪, 日本',
    category: LocationCategory.FOOD,
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    amount: 8400,
    currency: Currency.JPY,
    description: 'USJ 門票',
    payer: '我',
    splitWith: [],
    date: day2,
    category: LocationCategory.SIGHTSEEING
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  { id: 'n1', text: '記得買能量手環', isChecked: false, category: 'shopping', subCategory: '雜物' },
  { id: 'n2', text: '任天堂世界整理券', isChecked: true, category: 'place', subCategory: '觀光' },
];

export const SHOP_SUB_CATEGORIES = ['藥妝', '伴手禮', '美食', '雜物', '其他'];
export const PLACE_SUB_CATEGORIES = ['觀光', '美食', '購物', '住宿', '其他'];

export const CATEGORY_COLORS: Record<string, string> = {
  [LocationCategory.SIGHTSEEING]: '#60a5fa', // Sky Blue
  [LocationCategory.FOOD]: '#f87171', // Soft Red
  [LocationCategory.SHOPPING]: '#f472b6', // Soft Pink
  [LocationCategory.HOTEL]: '#fbbf24', // Amber
  [LocationCategory.TRANSPORT]: '#3b82f6', // Blue
  [LocationCategory.PREP]: '#94a3b8', // Slate
  [LocationCategory.OTHER]: '#cbd5e1', // Gray
  '藥妝': '#f472b6',
  '伴手禮': '#fb923c',
  '雜物': '#94a3b8'
};
