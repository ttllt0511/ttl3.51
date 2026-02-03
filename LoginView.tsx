
import React, { useState } from 'react';
import { Users, Lock, LogIn, PlusCircle } from 'lucide-react';

interface LoginViewProps {
  onJoin: (roomId: string, password?: string) => void;
  onCreate: (roomId: string, password?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onJoin, onCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    
    if (isCreating) {
      onCreate(roomId, password);
    } else {
      onJoin(roomId, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-100 relative">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isCreating ? '創建新旅程' : '加入旅程'}
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              TabiMate AI 協作模式
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">房號 / 行程代碼</label>
              <div className="relative">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
                  placeholder="例如: japan-2024"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">密碼 (選填)</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
                  placeholder="設定或輸入密碼"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isCreating ? <PlusCircle size={20} /> : <LogIn size={20} />}
              {isCreating ? '建立房間' : '進入房間'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              {isCreating ? '已有房間？直接加入' : '還沒有行程？建立一個'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
