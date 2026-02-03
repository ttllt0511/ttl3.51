import { GoogleGenAI, Type } from "@google/genai";
import { WeatherInfo, NoteItem } from "../types";

// Base Client wrapper to handle initialization and common error logic
class GeminiClient {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      const apiKey = process.env.API_KEY;
      if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '' && !apiKey.includes('your_api_key')) {
        this.ai = new GoogleGenAI({ apiKey: apiKey });
      } else {
          console.warn("Gemini API Key is missing or invalid. AI features will be disabled.");
      }
    } catch (e) {
      console.error("Failed to initialize Gemini Client:", e);
      this.ai = null;
    }
  }

  get instance(): GoogleGenAI | null {
    return this.ai;
  }

  isAvailable(): boolean {
    return !!this.ai;
  }
}

const client = new GeminiClient();

export const getAIWeatherForecast = async (location: string, date: string): Promise<WeatherInfo | null> => {
  if (!client.isAvailable()) return null;
  
  try {
    const response = await client.instance!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify the major city where the location "${location}" is situated (e.g., if "Universal Studios Japan", city is "Osaka"). 
      Then provide a realistic weather forecast for that CITY on ${date}.
      
      CRITICAL: For the 'hourly' field, provide exactly 12 entries starting from 08:00 AM to 20:00 PM (or relevant day hours), with an interval of 1-2 hours.
      
      Return fields:
      - cityName: The name of the city in Traditional Chinese (e.g. 大阪市, 京都市, 龜岡市).
      - condition: Traditional Chinese weather keyword (e.g. 晴天, 多雲, 雨).
      - description: A brief, helpful daily summary in Traditional Chinese.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cityName: { type: Type.STRING },
            temp: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            highTemp: { type: Type.NUMBER },
            lowTemp: { type: Type.NUMBER },
            snowChance: { type: Type.STRING },
            rainChance: { type: Type.STRING },
            feelsLike: { type: Type.NUMBER },
            description: { type: Type.STRING },
            hourly: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  temp: { type: Type.NUMBER },
                  condition: { type: Type.STRING }
                },
                required: ["time", "temp", "condition"]
              }
            }
          },
          required: ["cityName", "temp", "condition", "highTemp", "lowTemp", "description", "hourly", "snowChance", "rainChance", "feelsLike"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text) as WeatherInfo;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
       console.warn("Gemini API Quota Exceeded. Switching to offline/mock mode.");
       return null;
    }
    console.error("Gemini Weather Error:", error);
    return null;
  }
};

export const analyzeExpenses = async (expensesText: string): Promise<string> => {
  if (!client.isAvailable()) {
    return "請設定 API Key 以啟用分析功能。";
  }

  try {
    const response = await client.instance!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these expenses and give a 1 sentence financial tip for a traveler in Traditional Chinese: ${expensesText}`,
    });
    return response.text || "記帳是個好習慣，繼續保持！";
  } catch (e: any) {
    if (e?.status === 429 || e?.message?.includes('429')) {
        return "預算分析目前不可用 (API 額度已滿)，但請繼續保持記帳！";
    }
    console.error("Gemini Expense Analysis Error:", e);
    return "無法分析支出。";
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  if (!client.isAvailable()) return null;

  try {
    const response = await client.instance!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert these GPS coordinates to a readable address in Traditional Chinese: Latitude ${lat}, Longitude ${lng}. Return ONLY the address string, nothing else.`,
    });
    return response.text?.trim() || null;
  } catch (e) {
    console.error("Reverse Geocode Error:", e);
    return null;
  }
};