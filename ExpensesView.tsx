
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Expense, Currency, LocationCategory } from '../types';
import { MOCK_RATES, CATEGORY_COLORS } from '../constants';
import { Plus, Users, X, Camera, PieChart as PieChartIcon, ChevronRight, ArrowLeft, ArrowRightLeft, Wallet, Trash2, Loader2, Settings, Edit2, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTravel } from '../context/TravelContext';
import { calculateTotals, calculateSettlement, prepareChartData } from '../utils/finance';
import { useAutoCategory } from '../hooks/useAutoCategory';
import { compressImage } from '../utils/imageUtils';

interface SettlementRecord {
  twd: number;
  jpy: number;
}

export const ExpensesView: React.FC = () => {
  const { currentExpenses: expenses, currentMembers, actions: { updateExpenses: setExpenses, updateMembers } } = useTravel();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Member Management State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEditName, setMemberEditName] = useState<{old: string, new: string} | null>(null);
  const [newMemberInput, setNewMemberInput] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    currency: Currency.JPY,
    description: '',
    payer: '我',
    splitWith: ['我'],
    category: LocationCategory.FOOD,
    image: undefined
  });

  // 1. Use Custom Hook for Auto-Categorization
  const suggestedCategory = useAutoCategory(newExpense.description || '', newExpense.category as string);

  useEffect(() => {
    if (suggestedCategory && suggestedCategory !== newExpense.category) {
      setNewExpense(prev => ({ ...prev, category: suggestedCategory }));
    }
  }, [suggestedCategory]);

  // Use utilities for calculations
  const totals = useMemo(() => calculateTotals(expenses), [expenses]);
  const settlement = useMemo(() => calculateSettlement(expenses, currentMembers), [expenses, currentMembers]);
  const chartData = useMemo(() => prepareChartData(expenses), [expenses]);

  // Filtered List for Drill-down
  const filteredExpenses = useMemo(() => {
    let list = selectedCategory ? expenses.filter(e => e.category === selectedCategory) : expenses;
    return list.sort((a, b) => {
      // Sort by date desc, then by time created (id is timestamp) desc
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [expenses, selectedCategory]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file);
        setNewExpense(prev => ({ ...prev, image: compressed }));
      } catch (err) {
        alert("圖片處理失敗");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSaveExpense = () => {
    if (newExpense.amount && newExpense.description) {
      const payer = newExpense.payer || '我';
      const splitWith = (newExpense.splitWith && newExpense.splitWith.length > 0) 
        ? newExpense.splitWith 
        : [payer];

      const expenseData: Expense = {
        id: editingId || Date.now().toString(),
        amount: newExpense.amount,
        currency: newExpense.currency || Currency.JPY,
        description: newExpense.description,
        payer: payer,
        splitWith: splitWith,
        date: new Date().toISOString().split('T')[0],
        category: newExpense.category || LocationCategory.OTHER,
        image: newExpense.image
      };

      if (editingId) {
        setExpenses(prev => prev.map(exp => exp.id === editingId ? expenseData : exp));
      } else {
        setExpenses(prev => [...prev, expenseData]);
      }

      resetForm();
    }
  };

  const handleDeleteExpense = () => {
    if (editingId && window.confirm("確定要刪除這筆支出紀錄嗎？")) {
      setExpenses(prev => prev.filter(e => e.id !== editingId));
      resetForm();
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewExpense({ amount: 0, currency: Currency.JPY, description: '', payer: '我', splitWith: [...currentMembers], category: LocationCategory.FOOD, image: undefined });
  };

  const handleEdit = (expense: Expense) => {
    setNewExpense({
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description,
      payer: expense.payer,
      splitWith: expense.splitWith,
      category: expense.category,
      image: expense.image
    });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const toggleSplitFriend = (name: string) => {
    const current = newExpense.splitWith || [];
    if (current.includes(name)) {
      setNewExpense({ ...newExpense, splitWith: current.filter(n => n !== name) });
    } else {
      setNewExpense({ ...newExpense, splitWith: [...current, name] });
    }
  };

  // Member Management Logic
  const handleAddMember = () => {
     if (newMemberInput.trim() && !currentMembers.includes(newMemberInput.trim())) {
        updateMembers([...currentMembers, newMemberInput.trim()]);
        setNewMemberInput('');
     }
  };

  const handleDeleteMember = (name: string) => {
     if (window.confirm(`確定要移除成員 "${name}" 嗎？\n注意：相關的記帳紀錄不會被自動刪除，可能會導致帳務對不上。`)) {
        updateMembers(currentMembers.filter(m => m !== name));
     }
  };

  const handleRenameMember = (oldName: string) => {
     if (memberEditName?.old === oldName) {
        // Save
        if (memberEditName.new.trim() && memberEditName.new !== oldName) {
           const newName = memberEditName.new.trim();
           const newList = currentMembers.map(m => m === oldName ? newName : m);
           updateMembers(newList, oldName, newName); // Pass old/new to update expenses
        }
        setMemberEditName(null);
     } else {
        // Start Editing
        setMemberEditName({ old: oldName, new: oldName });
     }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      {/* Member Management Modal */}
      {showMemberModal && (
         <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-800">成員管理</h3>
                  <button onClick={() => setShowMemberModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={16} /></button>
               </div>
               
               <div className="space-y-3 mb-6">
                  {currentMembers.map(member => (
                     <div key={member} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {memberEditName?.old === member ? (
                           <input 
                              autoFocus
                              className="bg-white border border-blue-300 rounded px-2 py-1 text-sm font-bold w-full mr-2"
                              value={memberEditName.new}
                              onChange={e => setMemberEditName({ ...memberEditName, new: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleRenameMember(member)}
                           />
                        ) : (
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-slate-500 text-xs">
                                 {member.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-700">{member}</span>
                           </div>
                        )}
                        
                        <div className="flex gap-2">
                           <button onClick={() => handleRenameMember(member)} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded-lg">
                              {memberEditName?.old === member ? <CheckCircle2 size={16} /> : <Edit2 size={16} />}
                           </button>
                           {member !== '我' && (
                              <button onClick={() => handleDeleteMember(member)} className="text-rose-400 p-1.5 hover:bg-rose-100 rounded-lg">
                                 <Trash2 size={16} />
                              </button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>

               <div className="flex gap-2">
                  <input 
                     className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                     placeholder="輸入新成員名字"
                     value={newMemberInput}
                     onChange={e => setNewMemberInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                  />
                  <button onClick={handleAddMember} disabled={!newMemberInput.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                     新增
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Header Summary */}
      <div className="bg-slate-800 p-6 rounded-b-[40px] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <h2 className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">累計支出金額</h2>
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-blue-400 text-sm font-bold">NT$</span>
              <span className="text-3xl font-black">{(totals[Currency.TWD] || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-emerald-400 text-sm font-bold">JPY ¥</span>
              <span className="text-2xl font-black">{(totals[Currency.JPY] || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                setNewExpense(prev => ({...prev, splitWith: currentMembers}));
                setIsAdding(true);
              }
            }} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1 ${isAdding ? 'bg-white/10 text-white' : 'bg-blue-500 text-white'}`}
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? '取消' : '記一筆'}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* ADD/EDIT FORM */}
        {isAdding && (
          <div className="bg-white p-5 rounded-3xl shadow-xl border border-blue-50 space-y-4 animate-in slide-in-from-top-4 duration-300 relative z-20">
            <div className="flex justify-between items-center">
               <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">{editingId ? '編輯支出' : '新增支出'}</h4>
               {editingId && (
                 <button 
                   onClick={handleDeleteExpense} 
                   className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                 >
                   <Trash2 size={12} /> 刪除此筆
                 </button>
               )}
            </div>
            
            {/* Description & Category */}
            <div className="grid grid-cols-3 gap-3">
               <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
                  <input 
                    type="text" 
                    placeholder="例如: 一蘭拉麵" 
                    autoFocus={!editingId}
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">分類</label>
                  <select 
                     className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none appearance-none"
                     value={newExpense.category}
                     onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  >
                     {Object.values(LocationCategory).filter(c => c !== LocationCategory.PREP).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>
            
            {/* Amount & Currency */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">金額</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-full p-3 bg-slate-50 border-none rounded-2xl text-lg font-black outline-none" 
                  value={newExpense.amount || ''} 
                  onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                />
              </div>
              <div className="w-24 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">幣別</label>
                <select 
                  className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none" 
                  value={newExpense.currency} 
                  onChange={e => setNewExpense({...newExpense, currency: e.target.value as Currency})}
                >
                  <option value={Currency.JPY}>JPY</option>
                  <option value={Currency.TWD}>NTD</option>
                </select>
              </div>
            </div>

            {/* Payer & Split */}
            <div className="bg-slate-50 p-3 rounded-2xl space-y-3">
               <div className="flex justify-between items-center overflow-hidden">
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0 mr-2">誰付錢？</span>
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                     {currentMembers.map(f => (
                        <button 
                           key={f}
                           onClick={() => setNewExpense({...newExpense, payer: f})}
                           className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${newExpense.payer === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
                        >
                           {f}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-500">分帳給：</span>
                     <button onClick={() => setShowMemberModal(true)} className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-1 rounded-full font-bold">
                        <Settings size={10} /> 管理成員
                     </button>
                   </div>
                   
                   <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[50%] justify-end">
                      <button onClick={() => setNewExpense({...newExpense, splitWith: currentMembers})} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">全選</button>
                      {currentMembers.map(f => {
                         const isSelected = newExpense.splitWith?.includes(f);
                         return (
                            <button key={f} onClick={() => toggleSplitFriend(f)} className={`min-w-[1.5rem] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                               {f.substring(0,1)}
                            </button>
                         )
                      })}
                   </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} disabled={isCompressing} className={`flex-1 p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 ${newExpense.image ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
                 {isCompressing ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                 <span className="text-xs font-bold">{newExpense.image ? '更換圖片' : '收據'}</span>
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              
              <button onClick={handleSaveExpense} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98]">
                 {editingId ? '更新' : '儲存'}
              </button>
            </div>
          </div>
        )}

        {/* MAIN VIEW: Chart OR Detail List */}
        {!selectedCategory ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
             
             {/* 1. Pie Chart Overview */}
             {chartData.length > 0 ? (
               <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest w-full text-left mb-2">支出分佈 (約當台幣)</h3>
                  <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#cbd5e1'} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                           itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                           formatter={(value: number) => `NT$${Math.round(value).toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <PieChartIcon size={24} className="text-slate-300 opacity-50" />
                    </div>
                  </div>
               </div>
             ) : (
                <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-300">
                   <p className="text-xs font-bold">尚無支出資料</p>
                </div>
             )}

             {/* 2. Settlement / Split Calculation */}
             <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between mb-1">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                          <ArrowRightLeft size={14} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">分帳結算 (淨額)</h3>
                   </div>
                   <button onClick={() => setShowMemberModal(true)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                      <Settings size={14} />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(settlement).map(([name, r]) => {
                       const record = r as SettlementRecord;
                       const twdVal = Math.round(record.twd);
                       const jpyVal = Math.round(record.jpy);
                       
                       return (
                        <div key={name} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/50">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{name[0]}</div>
                              <span className="text-sm font-bold text-slate-700">{name}</span>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[10px] font-bold text-slate-400">NT$</span>
                                  <span className={`font-black ${twdVal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {twdVal > 0 ? '+' : ''}{twdVal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[10px] font-bold text-slate-400">JPY</span>
                                  <span className={`font-black ${jpyVal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {jpyVal > 0 ? '+' : ''}{jpyVal.toLocaleString()}
                                  </span>
                                </div>
                            </div>
                        </div>
                       );
                    })}
                </div>
                <div className="flex items-center justify-center gap-4 pt-1">
                   <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400">應收 (Receive)</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-bold text-slate-400">應付 (Pay)</span>
                   </div>
                </div>
             </div>

             {/* 3. Category List (Drill-down Entry) */}
             <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">分類明細</h3>
                {chartData.length > 0 ? (
                  chartData.map(d => {
                     const catExpenses = expenses.filter(e => (e.category || LocationCategory.OTHER) === d.name);
                     const count = catExpenses.length;
                     return (
                        <button 
                           key={d.name}
                           onClick={() => setSelectedCategory(d.name)}
                           className="w-full bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] || '#cbd5e1' }} />
                              <div className="text-left">
                                 <p className="text-sm font-black text-slate-700">{d.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold">{count} 筆消費</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-400">
                              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">
                                 查看
                              </span>
                              <ChevronRight size={16} />
                           </div>
                        </button>
                     );
                  })
                ) : null}
             </div>
          </div>
        ) : (
          /* DRILL-DOWN: Detail List (Compact) */
          <div className="animate-in slide-in-from-right-8 duration-300">
             <button 
               onClick={() => setSelectedCategory(null)}
               className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-4 pl-1"
             >
               <ArrowLeft size={14} /> 返回總覽
             </button>
             
             <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[selectedCategory] || '#cbd5e1' }} />
                <h3 className="text-lg font-black text-slate-800">{selectedCategory}</h3>
             </div>

             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {filteredExpenses.map((expense, idx) => {
                   const isLast = idx === filteredExpenses.length - 1;
                   return (
                      <div 
                        key={expense.id} 
                        className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group ${!isLast ? 'border-b border-slate-50' : ''}`}
                        onClick={() => handleEdit(expense)}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex flex-col items-center justify-center min-w-[36px] h-9 bg-slate-100 rounded-lg text-slate-500">
                               <span className="text-[9px] font-black uppercase leading-none">{expense.date.split('-')[1]}</span>
                               <span className="text-sm font-black leading-none">{expense.date.split('-')[2]}</span>
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate">{expense.description}</p>
                               <div className="flex items-center gap-1.5 mt-0.5">
                                 <span className="text-[10px] px-1.5 rounded-md bg-slate-100 text-slate-500 font-bold">{expense.payer}</span>
                                 {expense.image && <Camera size={10} className="text-emerald-500" />}
                                 {expense.splitWith.length > 1 && <Users size={10} className="text-blue-400" />}
                               </div>
                            </div>
                         </div>
                         <div className="text-right pl-2">
                            <span className={`text-sm font-black ${expense.currency === Currency.JPY ? 'text-slate-700' : 'text-blue-600'}`}>
                               {expense.currency === Currency.JPY ? '¥' : '$'}{expense.amount.toLocaleString()}
                            </span>
                         </div>
                      </div>
                   )
                })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
