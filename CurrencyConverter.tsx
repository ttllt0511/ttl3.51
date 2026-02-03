import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Currency } from '../types';
import { MOCK_RATES } from '../constants';

export const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(100);
  const [from, setFrom] = useState<Currency>(Currency.JPY);
  const [to, setTo] = useState<Currency>(Currency.TWD);

  const rate = MOCK_RATES[from] / MOCK_RATES[to];
  const converted = (amount * rate).toFixed(2);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">即時匯率換算</h3>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 ml-1">{from}</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSwap} 
          className="mt-4 p-3 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors shadow-sm active:scale-95"
        >
          <ArrowRightLeft size={20} />
        </button>

        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 ml-1">{to}</label>
          <div className="w-full bg-blue-50/30 rounded-xl px-4 py-3 text-xl font-bold text-blue-600 border border-blue-50">
            {converted}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
        <span className="text-[10px] font-medium text-slate-400 italic">
          匯率來源：系統參考
        </span>
        <span className="text-xs font-bold text-slate-500">
          1 {from} ≈ {rate.toFixed(4)} {to}
        </span>
      </div>
    </div>
  );
};