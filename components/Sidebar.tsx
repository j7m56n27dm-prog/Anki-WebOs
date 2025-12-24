
import React from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'decks', icon: 'fa-layer-group', label: 'Decks' },
    { id: 'add', icon: 'fa-plus', label: 'Add Card' },
    { id: 'browse', icon: 'fa-magnifying-glass', label: 'Browse' },
    { id: 'stats', icon: 'fa-chart-simple', label: 'Stats' },
  ];

  return (
    <div className="w-64 flex flex-col h-full bg-[#111111] border-r border-white/5 p-4 select-none flex-shrink-0 z-10 text-white">
      {/* macOS Traffic Lights */}
      <div className="flex gap-2 mb-8 mt-2 px-1">
        <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#FFBC2E]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#28C840]"></div>
      </div>

      <div className="px-3 mb-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">LIBRARY</div>
      
      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile Box - Exactly like the screenshot */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="bg-[#1C1C1E] p-3.5 rounded-2xl flex items-center gap-3 border border-white/5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-inner">MD</div>
          <div>
            <div className="text-[13px] font-bold">Muhammad Daler</div>
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">PRO DEVELOPER</div>
          </div>
        </div>
        <div className="text-[10px] text-center font-bold text-slate-600 uppercase tracking-widest">
          ENGINE VERSION 3.2.0
        </div>
      </div>
    </div>
  );
};
