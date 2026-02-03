
import { useState, useEffect } from 'react';
import { WeatherInfo, HourlyForecast } from '../types';
import { getAIWeatherForecast } from '../services/geminiService';

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 Hours

interface CacheData {
  timestamp: number;
  data: WeatherInfo;
}

export const useWeather = (location: string) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 2. AbortController for cleanup
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `weather_${location}_${today}_v5`; 

      // 1. Check Cache
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed: CacheData = JSON.parse(cachedRaw);
          const now = Date.now();
          
          if (now - parsed.timestamp < CACHE_DURATION) {
            if (!signal.aborted) {
              setWeather(parsed.data);
              setIsCached(true);
              setLoading(false);
            }
            if (!navigator.onLine) return; 
          }
        }
      } catch (e) {
        console.error("Cache read error", e);
      }

      if (signal.aborted) return;

      // 2. Fetch Fresh Data
      if (navigator.onLine) {
        try {
            // Note: getAIWeatherForecast currently doesn't accept a signal directly 
            // because @google/genai wraps fetch, but we can prevent state updates.
            const data = await getAIWeatherForecast(location, today);
            
            if (!signal.aborted) {
              if (data && data.hourly && data.hourly.length >= 1) {
                 setWeather(data);
                 setIsCached(false);
                 const cacheData: CacheData = {
                     timestamp: Date.now(),
                     data: data
                 };
                 localStorage.setItem(cacheKey, JSON.stringify(cacheData));
              } else if (!isCached && !weather) { 
                generateMockData(location);
              }
              setLoading(false);
            }
        } catch (err) {
            if (!signal.aborted && !weather) setError("無法取得天氣資訊");
        }
      } else if (!isCached && !signal.aborted) {
        setLoading(false);
      }
    };

    const generateMockData = (loc: string) => {
        if (signal.aborted) return;
        const currentHour = new Date().getHours();
        const mockHourly: HourlyForecast[] = Array.from({ length: 12 }).map((_, i) => {
           const h = (currentHour + i * 2) % 24;
           const hStr = `${h.toString().padStart(2, '0')}:00`;
           const condition = h > 18 || h < 6 ? 'Moon' : (Math.random() > 0.7 ? 'Cloudy' : 'Sun');
           return { 
             time: hStr, 
             temp: 15 - Math.floor(Math.random() * 5), 
             condition: condition 
           };
        });

        const mockData: WeatherInfo = {
          cityName: loc,
          temp: 15,
          condition: '局部多雲 (模擬)',
          snowChance: '0%',
          rainChance: '10%',
          feelsLike: 14,
          description: '目前無法連線至氣象中心，此為模擬數據。',
          highTemp: 23,
          lowTemp: 14,
          hourly: mockHourly
        };
        setWeather(mockData);
    };

    fetchWeather();

    // Cleanup function cancels the operation
    return () => {
      controller.abort();
    };
  }, [location]);

  return { weather, loading, isCached, error };
};
