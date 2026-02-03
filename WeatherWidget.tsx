import React from 'react';
import { CloudRain, Sun, Thermometer, Snowflake, Cloud, Moon, CloudSun, WifiOff, Droplets, AlertTriangle } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';

interface WeatherWidgetProps {
  location: string;
}

// 5b. Optimized Icon Lookup Map
// Fixed: Changed JSX.Element to React.ReactElement to avoid namespace errors
const WEATHER_ICONS: Record<string, (props: any) => React.ReactElement> = {
  'rain': (props) => <CloudRain {...props} className={props.className || "text-blue-500"} />,
  '雨': (props) => <CloudRain {...props} className={props.className || "text-blue-500"} />,
  'snow': (props) => <Snowflake {...props} className={props.className || "text-cyan-400"} />,
  '雪': (props) => <Snowflake {...props} className={props.className || "text-cyan-400"} />,
  'partly': (props) => <CloudSun {...props} className={props.className || "text-orange-400"} />,
  '多雲': (props) => <CloudSun {...props} className={props.className || "text-orange-400"} />,
  'cloud': (props) => <Cloud {...props} className={props.className || "text-slate-400"} />,
  '陰': (props) => <Cloud {...props} className={props.className || "text-slate-400"} />,
  'moon': (props) => <Moon {...props} className={props.className || "text-blue-400"} />,
  '夜': (props) => <Moon {...props} className={props.className || "text-blue-400"} />,
  'default': (props) => <Sun {...props} className={props.className || "text-yellow-400"} />
};

const getWeatherIcon = (condition: string, size: number = 24, className: string = "") => {
  const c = condition.toLowerCase();
  const key = Object.keys(WEATHER_ICONS).find(k => c.includes(k)) || 'default';
  const IconComponent = WEATHER_ICONS[key];
  return <IconComponent size={size} className={className} />;
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location }) => {
  // 5a. Use Custom Hook
  const { weather, loading, isCached, error } = useWeather(location);

  if (loading && !weather) {
    return <div className="animate-pulse h-64 bg-slate-100 border border-slate-200 rounded-3xl w-full"></div>;
  }

  if (error && !weather) {
     return (
        <div className="bg-slate-100 rounded-3xl p-6 text-center text-slate-400">
           <AlertTriangle className="mx-auto mb-2 text-rose-400" />
           <p className="text-xs font-bold">{error}</p>
        </div>
     );
  }

  if (!weather) return (
     <div className="bg-slate-100 rounded-3xl p-6 text-center text-slate-400">
        <WifiOff className="mx-auto mb-2" />
        <p className="text-xs font-bold">無法取得天氣資訊</p>
     </div>
  );

  return (
    <div className="bg-white text-slate-700 rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative font-sans transition-all hover:shadow-md">
      {/* Top Section */}
      <div className="relative z-10 text-center mb-6">
        <h3 className="text-xl font-bold mb-1 text-slate-700 flex items-center justify-center gap-2">
           {/* Display resolved city name, fallback to raw input location */}
           {weather.cityName || location}
           {isCached && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">已快取</span>}
        </h3>
        <div className="text-7xl font-light tracking-tighter mb-1 text-slate-900">
          {weather.temp}°
        </div>
        <div className="text-lg font-medium mb-4 text-slate-500">{weather.condition}</div>
        
        <div className="flex justify-center gap-4 text-lg font-bold text-slate-400">
          <span className="flex items-center gap-1"><span className="text-red-300">↑</span>{weather.highTemp}°</span>
          <span className="opacity-20">|</span>
          <span className="flex items-center gap-1"><span className="text-blue-300">↓</span>{weather.lowTemp}°</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-blue-50/40 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-blue-50">
          <Droplets size={18} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300">下雨機率</span>
          <span className="text-xs font-black text-slate-700">{weather.rainChance}</span>
        </div>
        <div className="bg-cyan-50/40 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-cyan-50">
          <Snowflake size={18} className="text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-300">下雪機率</span>
          <span className="text-xs font-black text-slate-700">{weather.snowChance}</span>
        </div>
        <div className="bg-orange-50/40 p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-orange-50">
          <Thermometer size={18} className="text-orange-400" />
          <span className="text-[10px] font-bold text-orange-300">體感</span>
          <span className="text-xs font-black text-slate-700">{weather.feelsLike}°</span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 text-sm leading-relaxed border border-slate-100 text-slate-500 text-center">
        <p>{weather.description}</p>
      </div>

      {/* Hourly Scroll */}
      <div className="border-t border-slate-50 pt-4">
        <div className="flex overflow-x-auto pb-2 gap-6 no-scrollbar snap-x px-2">
          {weather.hourly.map((hour, index) => (
            <div key={index} className="flex flex-col items-center min-w-[3.5rem] snap-start">
              <span className="text-[11px] font-bold text-slate-400 mb-3 whitespace-nowrap">{hour.time}</span>
              <div className="mb-3 transform transition-transform hover:scale-110">
                {getWeatherIcon(hour.condition, 28)}
              </div>
              <span className="text-lg font-black text-slate-800">{Math.round(hour.temp)}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};