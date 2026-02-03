
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Check, X, Image as ImageIcon, Trash2, ShoppingBag, List, Camera, LayoutGrid, AlertTriangle, Loader2 } from 'lucide-react';
import { NoteItem } from '../types';
import { SHOP_SUB_CATEGORIES } from '../constants';
import { useTravel } from '../context/TravelContext';
import { compressImage } from '../utils/imageUtils';

// 8c. Extract and Memoize List Item Component
const NoteListItem = React.memo<{
    note: NoteItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}>(({ note, onToggle, onDelete }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 transition-all overflow-hidden ${note.isChecked ? 'opacity-50' : ''}`}>
        <div className="p-4 flex items-center gap-3">
        <button onClick={() => onToggle(note.id)} className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${note.isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
            <Check size={12} strokeWidth={3} />
        </button>
        <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${note.isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{note.text}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{note.subCategory}</span>
                {note.image && <ImageIcon size={14} className="text-blue-400" />}
            </div>
            <button onClick={() => onDelete(note.id)} className="text-slate-200 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={16} /></button>
            </div>
        </div>
        </div>
    </div>
));

// 8c. Extract and Memoize Gallery Item Component with Lazy Loading
const NoteGalleryItem = React.memo<{
    note: NoteItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}>(({ note, onToggle, onDelete }) => (
    <div 
        className={`bg-white rounded-2xl border border-slate-100 overflow-hidden relative group transition-all ${note.isChecked ? 'opacity-60 grayscale' : 'shadow-sm hover:shadow-md'}`}
        onClick={() => onToggle(note.id)}
    >
        <div className="aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden">
        {note.image ? (
            <img 
              src={note.image} 
              className="w-full h-full object-contain" 
              alt={note.text} 
              loading="lazy" // 4. Lazy Loading
            />
        ) : (
            <ShoppingBag className="text-slate-300" size={32} />
        )}
        {/* Check Overlay */}
        {note.isChecked && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                <Check size={20} strokeWidth={3} />
            </div>
            </div>
        )}
        {/* Category Tag */}
        <div className="absolute top-2 left-2">
            <span className="text-[9px] font-bold bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-slate-600 shadow-sm border border-slate-100">
                {note.subCategory}
            </span>
        </div>
        {/* Delete Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="absolute top-2 right-2 p-1.5 bg-white/80 text-slate-400 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
        >
            <Trash2 size={12} />
        </button>
        </div>
        <div className="p-3">
        <p className={`text-xs font-bold leading-tight line-clamp-2 ${note.isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {note.text}
        </p>
        </div>
    </div>
));


export const NotesView: React.FC = () => {
  // Use Context Directly - No Props
  const { currentNotes: notes, actions: { updateNotes: setNotes } } = useTravel();
  
  const [newNoteText, setNewNoteText] = useState('');
  // Default to only shopping
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('全部');
  const [viewType, setViewType] = useState<'list' | 'gallery'>('list');
  const [newSubCategory, setNewSubCategory] = useState<string>(SHOP_SUB_CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subCategories = SHOP_SUB_CATEGORIES;
  
  // 8b. Memoize Filtering
  const filteredNotes = useMemo(() => notes.filter(n => 
    n.category === 'shopping' && 
    (selectedSubCategory === '全部' || n.subCategory === selectedSubCategory)
  ), [notes, selectedSubCategory]);

  const toggleCheck = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isChecked: !n.isChecked } : n));
  };

  const deleteNote = (id: string) => {
    if (window.confirm("確定要刪除此筆記嗎？")) {
       setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        // 1. Image Compression
        const compressedBase64 = await compressImage(file);
        setSelectedImage(compressedBase64);
      } catch (err) {
        console.error("Compression failed", err);
        alert("圖片處理失敗，請重試");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const addNote = () => {
    if (newNoteText.trim() || selectedImage) {
      setNotes(prev => [...prev, {
        id: Date.now().toString(),
        text: newNoteText || (selectedImage ? '圖片筆記' : ''),
        isChecked: false,
        category: 'shopping',
        subCategory: newSubCategory || subCategories[0],
        image: selectedImage || undefined
      }]);
      setNewNoteText('');
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto h-full flex flex-col bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">購物清單</h1>
        
        {/* View Toggle Controls */}
        <div className="flex bg-gray-200 p-1 rounded-lg text-xs font-bold">
          <button 
            onClick={() => setViewType('list')} 
            className={`px-3 py-1 rounded transition-all ${viewType === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
          >
            <List size={16} />
          </button>
          
          <button 
            onClick={() => setViewType('gallery')} 
            className={`px-3 py-1 rounded transition-all ${viewType === 'gallery' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>
      
      {/* Sub-category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button 
          onClick={() => setSelectedSubCategory('全部')} 
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${selectedSubCategory === '全部' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          全部
        </button>
        {subCategories.map(sub => (
          <button 
            key={sub}
            onClick={() => setSelectedSubCategory(sub)} 
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${selectedSubCategory === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Add New Input Area */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-3">
        {selectedImage && (
          <div className="relative inline-block mt-1">
            <img src={selectedImage} alt="Preview" className="h-20 w-20 object-contain rounded-xl border border-slate-100 shadow-sm bg-slate-50" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-slate-900 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="新增購買項目..."
            className="flex-1 p-2 bg-slate-50 border-none focus:ring-0 text-sm outline-none rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
          />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className={`p-2 rounded-xl transition-colors ${selectedImage ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {isCompressing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
          </button>
          <button onClick={addNote} className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-colors">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium ml-1">類別：</span>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {subCategories.map(sub => (
              <button 
                key={sub}
                onClick={() => setNewSubCategory(sub)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${newSubCategory === sub ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-hidden">
        {viewType === 'list' && (
          <div className="h-full overflow-y-auto space-y-3 pb-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <NoteListItem 
                    key={note.id} 
                    note={note} 
                    onToggle={toggleCheck} 
                    onDelete={deleteNote} 
                />
              ))
            ) : (
              <div className="text-center py-20 text-slate-300">目前沒有符合篩選的項目</div>
            )}
          </div>
        )}
        
        {viewType === 'gallery' && (
           <div className="h-full overflow-y-auto pb-4">
             {filteredNotes.length > 0 ? (
               <div className="grid grid-cols-2 gap-3">
                 {filteredNotes.map(note => (
                    <NoteGalleryItem 
                        key={note.id} 
                        note={note} 
                        onToggle={toggleCheck} 
                        onDelete={deleteNote} 
                    />
                 ))}
               </div>
             ) : (
                <div className="text-center py-20 text-slate-300">
                  <LayoutGrid size={48} className="mx-auto mb-2 opacity-20" />
                  目前沒有項目，切換到列表模式新增看看？
                </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};
