
export enum Currency {
  JPY = 'JPY',
  TWD = 'TWD',
  USD = 'USD'
}

export enum LocationCategory {
  SIGHTSEEING = '觀光',
  FOOD = '美食',
  SHOPPING = '購物',
  HOTEL = '住宿',
  TRANSPORT = '交通',
  PREP = '行前準備',
  OTHER = '其他'
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  locationName: string;
  category: LocationCategory;
  date: string; // YYYY-MM-DD
  ticketImage?: string; // Base64 for tickets/QR codes
  timeZone?: string; // 'Asia/Taipei' | 'Asia/Tokyo'
  ownerId?: string; // ID of the sub-room or 'main'
  ownerName?: string; // Display name of the owner
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  payer: string;
  splitWith: string[];
  date: string;
  category: LocationCategory | string;
  image?: string; // Base64 receipt image
}

export type NoteCategory = 'shopping' | 'place';
export type ShoppingSubCategory = '藥妝' | '伴手禮' | '美食' | '雜物' | '其他';
export type PlaceSubCategory = '觀光' | '美食' | '購物' | '住宿' | '其他';

export interface NoteItem {
  id: string;
  text: string;
  isChecked: boolean;
  image?: string; // Base64
  category: NoteCategory;
  subCategory: string; // ShoppingSubCategory | PlaceSubCategory
}

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
}

export interface WeatherInfo {
  cityName?: string; // Resolved city name (e.g., "Osaka" from "USJ")
  temp: number;
  condition: string;
  snowChance: string;
  rainChance: string;
  feelsLike: number;
  description: string;
  highTemp: number;
  lowTemp: number;
  hourly: HourlyForecast[];
}

export type Tab = 'home' | 'itinerary' | 'notes' | 'expenses';

// Shared Mode Types
export interface SubRoom {
  id: string;
  name: string;
  itinerary: ItineraryItem[];
  notes: NoteItem[];
}

export interface RoomData {
  id: string;
  password?: string;
  mainItinerary: ItineraryItem[];
  expenses: Expense[];
  subRooms: Record<string, SubRoom>;
  mainNotes: NoteItem[]; // Notes for the main room (optional)
  members?: string[]; // Explicit member list
}
