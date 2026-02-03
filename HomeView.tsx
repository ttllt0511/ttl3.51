
import React, { useState, useMemo } from 'react';
import { CircleAlert } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { CurrencyConverter } from './CurrencyConverter';
import { EmergencyHelpModal } from './EmergencyHelpModal';
import { LocationCategory, Tab } from '../types';
import { useTravel } from '../context/TravelContext';

interface HomeViewProps {
  onTabChange: (tab: Tab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onTabChange 
}) => {
  // Defensive Destructuring to ensure arrays are never undefined
  const { 
    currentItinerary: itinerary = [], 
    sharedItineraryItems: sharedItinerary = [], 
    subRoomId, 
    subRoomNames = {} 
  } = useTravel();
  
  const subRoomName = subRoomId && subRoomNames[subRoomId] ? subRoomNames[subRoomId] : undefined;

  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // 2. Memoize expensive calculation logic
  const { todaysPlans, location, timeZone } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Additional safety check if context returns null (though destructuring above handles undefined)
    const safeItinerary = Array.isArray(itinerary) ? itinerary : [];
    const safeShared = Array.isArray(sharedItinerary) ? sharedItinerary : [];
    
    const myPlans = safeItinerary.filter(i => i.date === today);
    const sharedPlans = safeShared.filter(i => i.date === today);
    const sortedPlans = [...myPlans, ...sharedPlans].sort((a,b) => a.time.localeCompare(b.time));

    const mainActivity = sortedPlans.find(i => 
      i.category !== LocationCategory.TRANSPORT && 
      i.category !== LocationCategory.PREP
    ) || sortedPlans[0];

    return {
      todaysPlans: sortedPlans,
      location: mainActivity ? mainActivity.locationName : '東京',
      timeZone: mainActivity?.timeZone || 'Asia/Tokyo'
    };
  }, [itinerary, sharedItinerary]);

  return (
    <div className="space-y-6">
      <EmergencyHelpModal 
        isOpen={isEmergencyOpen} 
        onClose={() => setIsEmergencyOpen(false)}
        locationName={location}
        timeZone={timeZone}
      />

      {/* Soft Colored Header */}
      <div className={`p-6 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden transition-all duration-500 ${subRoomId ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-200/50' : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-200/50'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white">早安！</h1>
            <p className="text-white/80 font-medium text-sm mt-1">
               {subRoomId 
                 ? `現在是 ${subRoomName} 的私人時間` 
                 : '今天大家一起去哪裡？'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsEmergencyOpen(true)}
            className="group flex items-center gap-1.5 bg-white backdrop-blur-md px-3 py-2 rounded-2xl transition-all shadow-lg active:scale-95 border border-white/40 hover:bg-rose-50"
          >
             <CircleAlert size={20} className="text-rose-500 fill-rose-100" />
             <span className="text-xs font-black text-rose-500 pr-1">緊急求助</span>
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-2">
        {/* Weather Widget */}
        <WeatherWidget location={location} />
        
        <CurrencyConverter />

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-slate-800">今日行程</h2>
            <button 
              onClick={() => onTabChange('itinerary')}
              className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            >
              查看全部
            </button>
          </div>
          
          {todaysPlans.length > 0 ? (
            <div className="space-y-3">
              {todaysPlans.slice(0, 3).map((item, idx) => (
                <div key={item.id + idx} className={`flex items-center gap-4 p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border transition-all ${item.ownerName ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100'}`}>
                  <div className="text-center w-14 py-1 border-r border-slate-50">
                    <span className="block font-black text-blue-600 text-sm">{item.time}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-slate-800 truncate text-base">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.locationName}</p>
                      {item.ownerName && (
                        <span className="text-[9px] px-1.5 rounded bg-slate-200 text-slate-500 font-bold flex-shrink-0">
                          {item.ownerName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-sm p-10 rounded-[32px] text-center text-slate-400 border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold">今天尚無安排，放輕鬆！</p>
              <button 
                onClick={() => onTabChange('itinerary')} 
                className="mt-4 text-white font-black text-xs bg-slate-800 px-6 py-2.5 rounded-full hover:bg-slate-700 transition-all shadow-md"
              >
                規劃新行程
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
