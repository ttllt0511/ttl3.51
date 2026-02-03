import React, { useEffect, useState } from 'react';
import { MapPin, Building2, ShieldAlert, X, Ambulance, Navigation, RefreshCw, Lock, SignalLow } from 'lucide-react';
import { reverseGeocode } from '../services/geminiService';

interface EmergencyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  timeZone: string;
}

export const EmergencyHelpModal: React.FC<EmergencyHelpModalProps> = ({ isOpen, onClose, locationName, timeZone }) => {
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [gpsErrorType, setGpsErrorType] = useState<'permission' | 'unavailable' | 'timeout' | 'generic' | null>(null);

  useEffect(() => {
    if (isOpen) {
      detectLocation();
    } else {
      // Reset state when closed
      setGpsAddress(null);
      setGpsCoords(null);
      setLoadingGps(false);
      setGpsError(false);
      setGpsErrorType(null);
    }
  }, [isOpen]);

  const detectLocation = () => {
    setLoadingGps(true);
    setGpsError(false);
    setGpsErrorType(null);

    if (!navigator.geolocation) {
      setLoadingGps(false);
      setGpsError(true);
      setGpsErrorType('generic');
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsError(false);
        setGpsErrorType(null);
        
        // Use Gemini to get address
        try {
          const address = await reverseGeocode(latitude, longitude);
          setGpsAddress(address);
        } catch (e) {
          console.error("Failed to reverse geocode");
        } finally {
          setLoadingGps(false);
        }
    };

    const handleError = (err: GeolocationPositionError) => {
        console.error("GPS Error", err);
        setGpsError(true);
        if (err.code === err.PERMISSION_DENIED) {
            setGpsErrorType('permission');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
            setGpsErrorType('unavailable');
        } else if (err.code === err.TIMEOUT) {
            setGpsErrorType('timeout');
        } else {
            setGpsErrorType('generic');
        }
        setLoadingGps(false);
    };

    // First try with high accuracy
    navigator.geolocation.getCurrentPosition(
        handleSuccess, 
        (err) => {
            // If high accuracy fails with timeout or unavailable, retry with low accuracy
            if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
                 console.log("High accuracy GPS failed, retrying with low accuracy...");
                 navigator.geolocation.getCurrentPosition(
                     handleSuccess, 
                     handleError, 
                     { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
                 );
            } else {
                handleError(err);
            }
        }, 
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  // Simple heuristic for country based on timezone
  const isJapan = timeZone === 'Asia/Tokyo';
  const isTaiwan = timeZone === 'Asia/Taipei';

  // Default to standard GSM emergency number (112) if unknown, but Japan/Taiwan use 110/119.
  const policeNumber = isJapan || isTaiwan ? '110' : '112'; 
  const ambulanceNumber = isJapan || isTaiwan ? '119' : '112';
  const countryName = isJapan ? '日本' : isTaiwan ? '台灣' : '當地';

  // Helper for Google Maps links
  const getMapsLink = (query: string) => {
    if (gpsCoords) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=&center=${gpsCoords.lat},${gpsCoords.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + ' near ' + locationName)}`;
  };

  const getGpsErrorMessage = () => {
      switch (gpsErrorType) {
          case 'permission': return '位置權限被拒絕，請在設定中開啟。';
          case 'unavailable': return '無法取得位置資訊，請移動到空曠處。';
          case 'timeout': return '定位逾時，請檢查網路或GPS訊號。';
          default: return '定位失敗，請檢查網路連線。';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-rose-500 p-6 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-white/20 rounded-full backdrop-blur-md shadow-inner">
                        <ShieldAlert size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">緊急求助</h2>
                        <p className="text-rose-100 text-xs font-bold mt-0.5 flex items-center gap-1">
                          <MapPin size={10} />
                          {locationName} ({countryName})
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors relative z-10">
                    <X size={20} />
                </button>
            </div>

            {/* GPS Status Section */}
            <div className="px-6 pt-4 pb-0">
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                     <div className={`p-2 rounded-full flex-shrink-0 ${loadingGps ? 'bg-blue-100 text-blue-500 animate-pulse' : gpsError ? 'bg-rose-100 text-rose-500' : gpsAddress ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        {loadingGps ? <RefreshCw size={16} className="animate-spin" /> : gpsError ? <SignalLow size={16} /> : gpsAddress ? <Navigation size={16} className="fill-current" /> : <Navigation size={16} />}
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          {loadingGps ? 'GPS 定位中...' : gpsError ? '定位問題' : gpsAddress ? '目前位置 (已定位)' : '尚未定位'}
                        </p>
                        <p className={`text-xs font-bold truncate ${gpsError ? 'text-rose-500' : 'text-slate-800'}`}>
                          {loadingGps ? '正在獲取精確位置 (可能需要幾秒)...' : gpsError ? getGpsErrorMessage() : gpsAddress || '使用預設地點搜尋'}
                        </p>
                     </div>
                  </div>
                  {!loadingGps && (
                    <button onClick={detectLocation} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                       <RefreshCw size={14} />
                    </button>
                  )}
               </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <a href={`tel:${policeNumber}`} className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-3xl active:scale-95 transition-all hover:bg-rose-50 hover:border-rose-100 hover:shadow-lg hover:shadow-rose-100/50 group">
                        <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                             <ShieldAlert size={28} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">報警 Police</span>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-rose-600 transition-colors">{policeNumber}</span>
                    </a>
                    <a href={`tel:${ambulanceNumber}`} className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-100 rounded-3xl active:scale-95 transition-all hover:bg-rose-50 hover:border-rose-100 hover:shadow-lg hover:shadow-rose-100/50 group">
                        <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                             <Ambulance size={28} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">救護 Fire/Amb</span>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-rose-600 transition-colors">{ambulanceNumber}</span>
                    </a>
                </div>

                <div className="space-y-3 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0 hidden sm:block"></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      快速導航 {gpsAddress && <span className="text-emerald-500">(基於 GPS)</span>}
                    </h3>
                    
                    <a href={getMapsLink('hospital')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-slate-800 text-sm">最近的醫院</span>
                            <span className="text-[10px] text-slate-400 font-bold group-hover:text-blue-500">Google Maps 導航</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white text-slate-300 group-hover:text-blue-500 transition-colors">
                           <MapPin size={14} />
                        </div>
                    </a>

                    <a href={getMapsLink('police station')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-200 transition-colors">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-slate-800 text-sm">最近的派出所</span>
                            <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-600">Google Maps 導航</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white text-slate-300 group-hover:text-slate-500 transition-colors">
                           <MapPin size={14} />
                        </div>
                    </a>

                    <a href={getMapsLink('embassy')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:bg-purple-200 transition-colors">
                            <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-slate-800 text-sm">使領館 / 辦事處</span>
                            <span className="text-[10px] text-slate-400 font-bold group-hover:text-purple-500">Google Maps 導航</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white text-slate-300 group-hover:text-purple-500 transition-colors">
                           <MapPin size={14} />
                        </div>
                    </a>
                </div>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                 <p className="text-[10px] font-medium text-slate-400">若手機無法定位，請嘗試開啟 Wi-Fi 以增加精確度。</p>
            </div>
        </div>
    </div>
  );
};