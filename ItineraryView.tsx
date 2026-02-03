import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Clock, Plus, Trash2, ExternalLink, ClipboardCheck, Circle, X, QrCode, Camera, CheckCircle2, Edit2, User, Loader2, GripVertical, ArrowDownUp, CalendarRange, CalendarDays } from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, DragControls } from 'framer-motion';
import { ItineraryItem, LocationCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { useTravel } from '../context/TravelContext';
import { compressImage } from '../utils/imageUtils';

interface SortableItemProps {
  item: ItineraryItem;
  onDelete?: (id: string) => void;
  onEdit?: (item: ItineraryItem) => void;
  onViewTicket: (img: string) => void;
  isReadOnly?: boolean;
  isDraggable?: boolean;
}

interface ItineraryCardProps extends SortableItemProps {
  dragControls?: DragControls;
}

// 1. Visual Card Component (No Reorder Logic)
const ItineraryCard: React.FC<ItineraryCardProps> = ({ item, onDelete, onEdit, onViewTicket, isReadOnly, isDraggable, dragControls }) => {
  return (
    <div className={`p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border transition-all flex gap-3 relative select-none ${isReadOnly ? 'bg-slate-50/80 border-slate-100 opacity-90' : 'bg-white border-slate-100 hover:shadow-md hover:border-blue-100 group/card'}`}>
        
        {/* Drag Handle */}
        {isDraggable && !isReadOnly && dragControls && (
          <div 
            className="flex items-center justify-center text-slate-300 touch-none cursor-grab active:cursor-grabbing hover:text-blue-400"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical size={20} />
          </div>
        )}

        {/* Read Only Tag / Owner Badge */}
        {isReadOnly && item.ownerName && (
          <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
            <User size={8} /> {item.ownerName}
          </div>
        )}

        {/* Time Stripe */}
        <div className={`w-1 rounded-full my-1 ${isReadOnly ? 'bg-slate-200' : 'bg-blue-400/30'}`} />

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-wrap">
               <div className={`flex items-center px-2 py-1 rounded-md text-xs font-bold ${isReadOnly ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                 <Clock size={12} className="mr-1" />
                 {item.time}
               </div>
               
               <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ color: CATEGORY_COLORS[item.category], backgroundColor: `${CATEGORY_COLORS[item.category]}15` }}>
                {item.category}
               </span>
            </div>

            {!isReadOnly && onEdit && (
              <button 
                 onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                 className="text-slate-300 hover:text-blue-500 p-1 hover:bg-blue-50 rounded-lg transition-colors"
              >
                 <Edit2 size={14} />
              </button>
            )}
          </div>

          {/* Title Row */}
          <div className="flex items-center gap-2">
              <h3 className={`text-lg font-black leading-snug truncate ${isReadOnly ? 'text-slate-600' : 'text-slate-800'}`}>{item.title}</h3>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationName)}`}
                target="_blank" rel="noopener noreferrer" 
                className="text-blue-300 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50 transition-colors"
                onPointerDown={(e) => e.stopPropagation()} 
              >
                <ExternalLink size={14} />
              </a>
          </div>
          
          {/* Location & Delete Row */}
          <div className="flex justify-between items-end mt-0.5">
             <div className="flex items-center text-slate-400 text-xs font-medium">
               <MapPin size={12} className="mr-1 flex-shrink-0" />
               <span className="truncate max-w-[180px] sm:max-w-xs">{item.locationName}</span>
             </div>
             
             {!isReadOnly && onDelete && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                 className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
               >
                  <Trash2 size={14} />
               </button>
             )}
          </div>
          
          {/* Ticket Button */}
          {item.ticketImage && (
            <div className="pt-2 border-t border-slate-50 mt-1">
               <button 
                 onClick={(e) => { e.stopPropagation(); onViewTicket(item.ticketImage!); }}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors w-fit border border-emerald-100"
               >
                 <QrCode size={12} />
                 查看門票
               </button>
            </div>
          )}
        </div>
      </div>
  );
};

// 2. Sortable Wrapper Component
const SortableItineraryItem: React.FC<SortableItemProps> = (props) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={props.item}
      id={props.item.id}
      dragListener={false}
      dragControls={controls}
      className="mb-3"
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      <ItineraryCard {...props} dragControls={controls} />
    </Reorder.Item>
  );
};

export const ItineraryView: React.FC = () => {
  // Use Context Directly - No Props needed
  const { currentItinerary: items, sharedItineraryItems: readOnlyItems, actions: { updateItinerary: setItems } } = useTravel();

  const safeItems = Array.isArray(items) ? items : [];
  const safeReadOnly = Array.isArray(readOnlyItems) ? readOnlyItems : [];
  const allItems = [...safeItems, ...safeReadOnly];
  
  const todayStr = new Date().toISOString().split('T')[0];
  const derivedDates: string[] = Array.from(new Set<string>(allItems.map(i => i.date))).sort();
  
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const allDates = Array.from(new Set([...derivedDates, ...extraDates])).sort();
  
  const firstDay: string = allDates.length > 0 ? allDates[0] : todayStr;
  
  const getInitialTab = () => {
    if (allDates.includes(todayStr)) return todayStr;
    return 'PREP';
  };

  const [activeTab, setActiveTab] = useState<string | 'PREP'>(getInitialTab());
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewTicket, setViewTicket] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [manualSortMode, setManualSortMode] = useState(false);
  
  // Date Range Modal State
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({
    time: '12:00',
    category: LocationCategory.SIGHTSEEING,
    date: activeTab === 'PREP' ? firstDay : activeTab,
    ticketImage: undefined,
    timeZone: 'Asia/Taipei'
  });

  const handleDelete = (id: string) => {
    if (window.confirm("確定要刪除此行程嗎？")) {
        setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  // Delete the entire date and its items
  const handleDeleteDate = () => {
    if (activeTab === 'PREP') return;
    
    const itemsOnDate = safeItems.filter(i => i.date === activeTab);
    const confirmMessage = itemsOnDate.length > 0 
        ? `確定要刪除 ${activeTab} 的所有行程嗎？\n這將會移除 ${itemsOnDate.length} 個行程項目。` 
        : `確定要移除日期 ${activeTab} 嗎？`;

    if (window.confirm(confirmMessage)) {
        // 1. Remove items
        if (itemsOnDate.length > 0) {
            setItems(prev => prev.filter(i => i.date !== activeTab));
        }
        // 2. Remove from extraDates
        setExtraDates(prev => prev.filter(d => d !== activeTab));
        // 3. Reset tab
        setActiveTab('PREP');
    }
  };

  const handleGenerateDates = () => {
    if (!dateRange.start || !dateRange.end) return;
    if (dateRange.start > dateRange.end) {
        alert("開始日期不能晚於結束日期");
        return;
    }

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const newDates: string[] = [];

    // Loop through dates
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        newDates.push(new Date(dt).toISOString().split('T')[0]);
    }

    setExtraDates(prev => {
        const combined = new Set([...prev, ...newDates]);
        return Array.from(combined).sort();
    });

    setShowDateRangeModal(false);
    // Optionally switch to the start date
    setActiveTab(dateRange.start);
  };

  const handleEditItem = (item: ItineraryItem) => {
    setNewItem({ ...item });
    setEditingItemId(item.id);
    setIsAdding(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file);
        setNewItem(prev => ({ ...prev, ticketImage: compressed }));
      } catch (err) {
        alert("圖片處理失敗");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.locationName && newItem.date) {
      if (editingItemId) {
         setItems(prevItems => prevItems.map(item => 
            item.id === editingItemId ? { ...item, ...newItem } as ItineraryItem : item
         ));
      } else {
         const item: ItineraryItem = {
            id: Date.now().toString(),
            time: newItem.time || '10:00',
            title: newItem.title,
            locationName: newItem.locationName,
            category: newItem.category || LocationCategory.SIGHTSEEING,
            date: newItem.date,
            description: newItem.description || '',
            ticketImage: newItem.ticketImage,
            timeZone: newItem.timeZone
         };
         setItems(prev => [...prev, item]);
      }
      
      // Ensure the tab we are adding to is visible
      if (newItem.date && !allDates.includes(newItem.date) && newItem.date !== 'PREP') {
          setExtraDates(prev => [...prev, newItem.date!]);
      }
      if (newItem.date !== activeTab && newItem.category !== LocationCategory.PREP) {
         setActiveTab(newItem.date!);
      }
      
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingItemId(null);
    setNewItem({ 
      time: '12:00', 
      category: activeTab === 'PREP' ? LocationCategory.PREP : LocationCategory.SIGHTSEEING, 
      date: activeTab === 'PREP' ? firstDay : activeTab,
      ticketImage: undefined,
      timeZone: 'Asia/Taipei'
    });
  };

  const handleAddDate = () => {
    const newDate = prompt("請輸入日期 (YYYY-MM-DD)", todayStr);
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
       if (!allDates.includes(newDate)) {
         setExtraDates(prev => [...prev, newDate]);
       }
       setActiveTab(newDate);
    }
  };

  // Get items for the current view.
  const myCurrentItems = useMemo(() => {
    return safeItems.filter(i => i.date === activeTab && i.category !== LocationCategory.PREP);
  }, [safeItems, activeTab]);

  const readOnlyCurrentItems = useMemo(() => {
    return safeReadOnly.filter(i => i.date === activeTab && i.category !== LocationCategory.PREP);
  }, [safeReadOnly, activeTab]);

  // Reorder Handler
  const handleReorder = (reorderedItems: ItineraryItem[]) => {
    const otherItems = safeItems.filter(i => i.date !== activeTab || i.category === LocationCategory.PREP);
    const newList = [...otherItems, ...reorderedItems];
    setItems(newList);
  };

  // Sorted view for non-manual mode
  const sortedView = useMemo(() => {
     if (manualSortMode) return myCurrentItems; // Use array order
     return [...myCurrentItems].sort((a, b) => a.time.localeCompare(b.time));
  }, [myCurrentItems, manualSortMode]);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Date Range Modal */}
      {showDateRangeModal && (
         <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                     <CalendarRange size={20} className="text-blue-500" />
                     一鍵規劃行程日期
                  </h3>
                  <button onClick={() => setShowDateRangeModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600">
                     <X size={16} />
                  </button>
               </div>
               
               <p className="text-sm text-slate-500 mb-4">設定您的旅程起訖日期，系統將自動為您建立期間的所有日期標籤。</p>

               <div className="space-y-3 mb-6">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-400 ml-1">開始日期 (Start)</label>
                     <input 
                        type="date" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-400 ml-1">結束日期 (End)</label>
                     <input 
                        type="date" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                     />
                  </div>
               </div>
               
               <button 
                  onClick={handleGenerateDates}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
               >
                  生成日期
               </button>
            </div>
         </div>
      )}

      {/* Ticket Viewer Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewTicket(null)}>
          <div className="bg-white p-2 rounded-2xl max-w-full max-h-[80vh] overflow-hidden shadow-2xl relative">
            <img src={viewTicket} alt="Ticket/QR Code" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            <div className="text-center py-2 font-bold text-slate-800">
              票券 QR Code
            </div>
            <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70" onClick={() => setViewTicket(null)}>
              <X size={20} />
            </button>
          </div>
          <p className="text-white mt-4 font-bold text-sm">點擊任意處關閉</p>
        </div>
      )}

      <header>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-900">行程規劃</h1>
          
          <div className="flex gap-2">
             {/* Delete Date Button (Only visible on specific dates) */}
             {activeTab !== 'PREP' && (
                <button 
                  onClick={handleDeleteDate}
                  className="text-xs font-bold px-3 py-1.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg flex items-center gap-1 transition-all hover:bg-rose-100"
                >
                   <Trash2 size={14} />
                   刪除這天
                </button>
             )}

             {/* Toggle Sort Mode */}
             {activeTab !== 'PREP' && (
               <button 
                 onClick={() => setManualSortMode(!manualSortMode)}
                 className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${manualSortMode ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
               >
                  <ArrowDownUp size={14} />
                  {manualSortMode ? '自訂排序' : '時間排序'}
               </button>
             )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar items-center">
          <button
            onClick={() => setActiveTab('PREP')}
            className={`flex-shrink-0 px-4 py-2 rounded-full border flex items-center gap-1.5 transition-all ${
              activeTab === 'PREP' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <ClipboardCheck size={16} />
            <span className="font-bold text-sm">行前準備</span>
          </button>

          {allDates.map(dStr => {
             const d = new Date(dStr);
             const isSelected = dStr === activeTab;
             const isToday = dStr === todayStr;
             return (
               <button
                 key={dStr}
                 onClick={() => setActiveTab(dStr)}
                 className={`flex-shrink-0 px-5 py-2 rounded-full border transition-all relative ${
                   isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'
                 }`}
               >
                 {isToday && !isSelected && (
                   <span className="absolute -top-1 -right-1 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                   </span>
                 )}
                 <span className="font-bold block text-sm">
                   {isToday ? '今天 ' : ''}
                   {d.toLocaleDateString('zh-TW', { day: 'numeric', month: 'numeric' })}
                 </span>
               </button>
             );
           })}
           
           <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 pl-2">
             <button onClick={handleAddDate} className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors">
                <Plus size={16} />
             </button>
             <div className="w-px h-4 bg-slate-200"></div>
             <button onClick={() => setShowDateRangeModal(true)} className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors" title="規劃日期範圍">
                <CalendarDays size={16} />
             </button>
           </div>
        </div>
      </header>

      {activeTab === 'PREP' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-blue-900">出發前 Check-list</h2>
              <p className="text-sm text-blue-700 opacity-80">確保所有重要物品與文件都已備妥。</p>
            </div>
          </div>

          <div className="grid gap-3">
            {safeItems.filter(i => i.category === LocationCategory.PREP).map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                    <Circle size={20} />
                  </div>
                  <span className="font-medium text-slate-700">{item.title}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative animate-in fade-in slide-in-from-right-4 duration-300">
          
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              {activeTab} {manualSortMode ? '自訂排序模式' : '時間軸模式'}
            </div>
            
            {sortedView.length === 0 && readOnlyCurrentItems.length === 0 && (
               <div className="text-center py-10 text-slate-300">目前沒有行程</div>
            )}

            {/* My Items (Draggable if Manual Mode) */}
            <Reorder.Group axis="y" values={sortedView} onReorder={handleReorder}>
              {sortedView.map(item => (
                <SortableItineraryItem 
                   key={item.id} 
                   item={item} 
                   isReadOnly={false}
                   isDraggable={manualSortMode}
                   onDelete={handleDelete}
                   onEdit={handleEditItem}
                   onViewTicket={setViewTicket} 
                />
              ))}
            </Reorder.Group>

            {/* Read Only Items (Static - No Reorder Context) */}
            {readOnlyCurrentItems.length > 0 && (
              <>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1 mt-6 mb-2">其他人的行程</div>
                {readOnlyCurrentItems.map(item => (
                   <div key={item.id} className="mb-3">
                     <ItineraryCard 
                        item={item} 
                        isReadOnly={true}
                        isDraggable={false}
                        onViewTicket={setViewTicket} 
                     />
                   </div>
                ))}
              </>
            )}
          </div>
          
        </div>
      )}

      {isAdding ? (
        <div className="fixed inset-x-4 bottom-24 bg-white p-6 rounded-3xl shadow-2xl border border-blue-100 space-y-4 animate-in slide-in-from-bottom-8 z-[60]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">
              {activeTab === 'PREP' ? '新增行前準備' : (editingItemId ? '編輯活動' : '新增當日活動')}
            </h3>
            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
          </div>
          
          <div className="space-y-3">
            {activeTab !== 'PREP' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">日期</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-bold" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">時間</label>
                    <input type="time" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-bold" value={newItem.time} onChange={e => setNewItem({...newItem, time: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">分類</label>
                    <select className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as LocationCategory})}>
                        {Object.values(LocationCategory).filter(c => c !== LocationCategory.PREP).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    </div>
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">時區</label>
                    <select 
                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-bold" 
                        value={newItem.timeZone || 'Asia/Taipei'} 
                        onChange={e => setNewItem({...newItem, timeZone: e.target.value})}
                    >
                        <option value="Asia/Taipei">🇹🇼 TWD</option>
                        <option value="Asia/Tokyo">🇯🇵 JST</option>
                    </select>
                    </div>
                </div>
              </>
            )}
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 ml-1">標題</label>
               <input type="text" placeholder="例如：參觀東京鐵塔" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-bold" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
            </div>
            {activeTab !== 'PREP' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">地點</label>
                  <input type="text" placeholder="例如：東京鐵塔" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-bold" value={newItem.locationName || ''} onChange={e => setNewItem({...newItem, locationName: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-400 ml-1">門票 QR Code / 圖片 (離線可看)</label>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isCompressing}
                       className={`flex-1 p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${newItem.ticketImage ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-400'}`}
                     >
                       {isCompressing ? <Loader2 className="animate-spin" size={18} /> : newItem.ticketImage ? (
                         <>
                           <CheckCircle2 size={18} />
                           <span className="text-xs font-bold">圖片已上傳</span>
                         </>
                       ) : (
                         <>
                           <Camera size={18} />
                           <span className="text-xs font-bold">上傳圖片</span>
                         </>
                       )}
                     </button>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       ref={fileInputRef} 
                       onChange={handleImageChange} 
                     />
                     {newItem.ticketImage && (
                       <button onClick={() => setNewItem({ ...newItem, ticketImage: undefined })} className="p-3 bg-red-50 text-red-500 rounded-xl">
                         <Trash2 size={18} />
                       </button>
                     )}
                   </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <button onClick={handleCloseModal} className="flex-1 py-3 font-bold text-gray-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">取消</button>
            <button onClick={handleAddItem} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
              {editingItemId ? '更新' : '儲存'}
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => {
            setIsAdding(true);
            setNewItem({
              ...newItem,
              category: activeTab === 'PREP' ? LocationCategory.PREP : LocationCategory.SIGHTSEEING,
              locationName: activeTab === 'PREP' ? '家' : '',
              ticketImage: undefined,
              timeZone: 'Asia/Taipei',
              date: activeTab === 'PREP' ? firstDay : activeTab
            });
          }} 
          className="w-full py-4 bg-white/50 border border-dashed border-blue-200 rounded-2xl text-blue-400 flex items-center justify-center font-bold hover:bg-white hover:border-blue-300 hover:text-blue-500 hover:shadow-sm transition-all"
        >
          <Plus size={20} className="mr-2" /> 新增{activeTab === 'PREP' ? '準備項目' : '行程'}
        </button>
      )}
    </div>
  );
};