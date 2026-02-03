
import React, { useState } from 'react';
import { Home, Calendar, ClipboardList, Wallet, Users, LogOut, ChevronDown, Plus, Trash2, HardDrive } from 'lucide-react';
import { Tab } from '../types';
import { useTravel } from '../context/TravelContext';
import { useStorageQuota } from '../hooks/useStorageQuota';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onTabChange, onLogout 
}) => {
  const { 
    roomId, 
    subRoomId, 
    subRoomNames, 
    actions: { switchSubRoom, createSubRoom, deleteSubRoom } 
  } = useTravel();
  
  const { percentage } = useStorageQuota();

  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  const currentName = subRoomId && subRoomNames[subRoomId] ? subRoomNames[subRoomId] : "母房間 (Main)";

  const handleCreateSub = () => {
    if (newSubName.trim()) {
      createSubRoom(newSubName.trim());
      setNewSubName('');
      setIsCreatingSub(false);
      setShowRoomMenu(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100/80 text-slate-900 overflow-hidden">
      {/* Decorative background blur objects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Storage Warning */}
      {percentage > 80 && (
        <div className="bg-red-500 text-white text-[10px] text-center font-bold py-1 px-4 z-[60]">
           <HardDrive size={10} className="inline mr-1" />
           儲存空間即將額滿 ({percentage.toFixed(0)}%)，請清理舊資料。
        </div>
      )}

      {/* Top Bar: Room Info & Identity */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex justify-between items-center z-50 relative">
         <div className="flex items-center gap-1.5" onClick={() => setShowRoomMenu(!showRoomMenu)}>
            <div className={`p-1.5 rounded-lg ${subRoomId ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
               <Users size={16} />
            </div>
            <div className="flex flex-col cursor-pointer">
               <span className="text-[10px] text-slate-400 font-bold leading-none uppercase tracking-wider">房間: {roomId}</span>
               <div className="flex items-center gap-1">
                 <span className="text-xs font-black text-slate-800">{currentName}</span>
                 <ChevronDown size={12} className="text-slate-400" />
               </div>
            </div>
         </div>
         <button onClick={onLogout} className="p-2 text-slate-300 hover:text-rose-400 transition-colors">
            <LogOut size={18} />
         </button>

         {/* Room Switcher Dropdown */}
         {showRoomMenu && (
            <div className="absolute top-full left-4 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2 space-y-1 z-[60]">
               <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                 切換身份 / 分開行動
               </div>
               
               <button 
                 onClick={() => { switchSubRoom(null); setShowRoomMenu(false); }}
                 className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${!subRoomId ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span>母房間 (所有人可見)</span>
                 {!subRoomId && <div className="w-2 h-2 rounded-full bg-blue-500" />}
               </button>

               {Object.entries(subRoomNames).map(([id, name]) => (
                 <div 
                   key={id}
                   className={`w-full flex items-center justify-between p-1 rounded-xl text-xs font-bold transition-colors group ${subRoomId === id ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                 >
                   <button 
                     onClick={() => { switchSubRoom(id); setShowRoomMenu(false); }}
                     className={`flex-1 flex items-center justify-between p-2 rounded-lg text-left ${subRoomId === id ? 'text-purple-600' : 'text-slate-600'}`}
                   >
                     <span>{name} 的房間</span>
                     {subRoomId === id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                   </button>
                   <button
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation(); 
                        deleteSubRoom(id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all focus:opacity-100"
                      title="刪除房間"
                   >
                      <Trash2 size={16} />
                   </button>
                 </div>
               ))}

               {isCreatingSub ? (
                 <div className="pt-2 border-t border-slate-50 mt-1 flex gap-2">
                    <input 
                      autoFocus
                      className="flex-1 bg-slate-50 rounded-lg px-2 py-1 text-xs border border-slate-200 outline-none"
                      placeholder="輸入名字..."
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateSub()}
                    />
                    <button onClick={handleCreateSub} className="p-1.5 bg-blue-600 text-white rounded-lg"><Plus size={14} /></button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsCreatingSub(true)}
                   className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50 mt-1"
                 >
                   <Plus size={14} /> 創建新子房間
                 </button>
               )}
            </div>
         )}
         {showRoomMenu && <div className="fixed inset-0 z-[55]" onClick={() => setShowRoomMenu(false)} />}
      </div>

      <main className="flex-1 overflow-y-auto pb-20 relative z-10">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200/60 px-4 py-2 flex justify-around items-center z-50 safe-area-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => onTabChange('home')} 
          icon={<Home size={22} />} 
          label="首頁" 
        />
        <NavButton 
          active={activeTab === 'itinerary'} 
          onClick={() => onTabChange('itinerary')} 
          icon={<Calendar size={22} />} 
          label="行程" 
        />
        <NavButton 
          active={activeTab === 'notes'} 
          onClick={() => onTabChange('notes')} 
          icon={<ClipboardList size={22} />} 
          label="購物" 
        />
        <NavButton 
          active={activeTab === 'expenses'} 
          onClick={() => onTabChange('expenses')} 
          icon={<Wallet size={22} />} 
          label="記帳" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 min-w-[56px] rounded-2xl transition-all duration-300 ${
      active ? 'text-blue-600 bg-blue-100/50 scale-105' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={active ? 'mb-0.5' : ''}>{icon}</div>
    <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
  </button>
);
