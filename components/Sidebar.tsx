
import React from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'decks', icon: 'fa-layer-group', label: 'To\'plamlar' },
    { id: 'add', icon: 'fa-plus', label: 'Karta qo\'shish' },
    { id: 'browse', icon: 'fa-magnifying-glass', label: 'Ko\'rib chiqish' },
    { id: 'stats', icon: 'fa-chart-simple', label: 'Statistika' },
  ];

  return (
    <div className="w-64 flex flex-col h-full bg-[#EBEBEB]/80 dark:bg-[#1E1E1E]/90 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 p-4 select-none flex-shrink-0 z-10">
      {/* macOS Traffic Lights */}
      <div className="flex gap-2 mb-10 mt-2 px-1">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-inner border border-black/10"></div>
        <div className="w-3 h-3 rounded-full bg-[#FFBC2E] shadow-inner border border-black/10"></div>
        <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-inner border border-black/10"></div>
      </div>

      <nav className="space-y-1.5 flex-1">
        <div className="px-3 mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] opacity-80">KUTUBXONA</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center text-[15px] ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}></i>
            <span className={currentView === item.id ? 'font-bold' : 'font-medium'}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Info - As requested in screenshot */}
      <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5 px-2 mb-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-black shadow-inner">MD</div>
           <div className="overflow-hidden">
              <div className="text-[12px] font-black text-slate-800 dark:text-slate-100 truncate">Muhammad Daler</div>
              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">PRO DEVELOPER</div>
           </div>
        </div>
        <div className="mt-4 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] text-center">
          ENGINE VERSION 3.5.0
        </div>
      </div>
    </div>
  );
};
