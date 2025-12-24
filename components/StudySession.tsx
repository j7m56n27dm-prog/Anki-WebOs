
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Note, Rating, CardType } from '../types';
import { Scheduler } from '../scheduler';
import { renderCloze, formatDuration, getRandomMotivation } from '../utils';

interface StudySessionProps {
  deckName: string;
  cards: Card[];
  notes: Note[];
  onReview: (card: Card, rating: Rating) => void;
  onFinish: () => void;
  onEditNote: (note: Note) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ deckName, cards, notes, onReview, onFinish, onEditNote }) => {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const currentCard = cards[index];
  const currentNote = notes.find(n => n.id === currentCard?.noteId);

  // Motivation data generated once session ends
  const motivation = useMemo(() => isFinished ? getRandomMotivation() : null, [isFinished]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRate = useCallback((r: Rating) => {
    if (!currentCard) return;
    onReview(currentCard, r);
    setShowAnswer(false);
    if (index < cards.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      setDuration(Date.now() - sessionStartTime);
      setIsFinished(true);
    }
  }, [currentCard, index, cards.length, onReview, sessionStartTime]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!showAnswer && (e.code === 'Space' || e.code === 'Enter')) {
        setShowAnswer(true);
        e.preventDefault();
      } else if (showAnswer) {
        if (e.key === '1') handleRate(Rating.AGAIN);
        if (e.key === '2') handleRate(Rating.HARD);
        if (e.key === '3') handleRate(Rating.GOOD);
        if (e.key === '4') handleRate(Rating.EASY);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [showAnswer, handleRate, isFinished]);

  if (isFinished && motivation) return (
    <div className="h-full flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in zoom-in-95 duration-700 overflow-y-auto">
      <div className="max-w-3xl w-full">
        <div className="relative mb-10 flex justify-center">
          <div className="w-32 h-32 bg-emerald-500/10 rounded-[48px] flex items-center justify-center border border-emerald-500/20 animate-bounce shadow-2xl shadow-emerald-500/10">
            <i className="fa-solid fa-award text-6xl text-emerald-500"></i>
          </div>
          <div className="absolute top-0 right-1/3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black border-4 border-[#F6F6F6] dark:border-[#111]">
            ✓
          </div>
        </div>

        <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white">MashaAllah!</h2>
        <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs md:text-sm mb-12">Siz bugungi vazifani muvaffaqiyatli yakunladingiz!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Sarf etilgan vaqt</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatDuration(duration)}</div>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">O'zlashtirilgan kartalar</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{cards.length} ta</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-10 md:p-14 rounded-[56px] border border-black/5 dark:border-white/5 shadow-2xl mb-12 relative overflow-hidden text-left group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <i className="fa-solid fa-quote-right absolute bottom-8 right-8 text-8xl text-blue-500/5 group-hover:scale-110 transition-transform"></i>
          
          <div className="relative z-10">
            <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-6 leading-tight italic">"{motivation.quote.text}"</div>
            <div className="text-lg md:text-xl text-slate-500 font-medium mb-8 border-l-4 border-blue-500/20 pl-6">{motivation.quote.translation}</div>
            <div className="flex justify-between items-end">
              <div className="text-[11px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em]">— {motivation.quote.source}</div>
              <div className="max-w-[200px] text-[10px] font-bold text-slate-400 text-right uppercase tracking-tighter">Tavsiya: {motivation.tip}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onFinish} 
          className="group bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-20 py-7 rounded-[36px] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-6 mx-auto"
        >
          <span>Asosiy sahifaga qaytish</span>
          <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
        </button>
        
        <p className="mt-12 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">Muhammad Daler Persistence Engine v3.5</p>
      </div>
    </div>
  );

  if (!currentCard || !currentNote) return (
    <div className="h-full flex items-center justify-center p-10 text-center animate-pulse">
      <div className="text-slate-400 font-black uppercase tracking-[0.4em]">Ma'lumotlar yuklanmoqda...</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-10 w-full max-w-5xl mx-auto select-none overflow-hidden">
      {/* Study Header */}
      <div className="flex justify-between items-center mb-8 md:mb-12">
         <button onClick={onFinish} className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm group">
            <i className="fa-solid fa-xmark text-xl group-hover:rotate-90 transition-transform"></i>
         </button>
         <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">{deckName}</div>
            <div className="font-black text-2xl tabular-nums flex items-center gap-3 justify-center">
              <span className="text-slate-900 dark:text-white">{index + 1}</span>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <span className="text-slate-400">{cards.length}</span>
            </div>
         </div>
         <button onClick={() => onEditNote(currentNote)} className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <i className="fa-solid fa-pen-to-square text-xl"></i>
         </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col justify-center min-h-0 perspective-1000">
        <div className="w-full h-full max-h-[600px] bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.04] rounded-[56px] md:rounded-[80px] shadow-2xl flex flex-col items-center justify-center text-center p-10 md:p-20 relative overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
          
          <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-6 py-6 flex flex-col items-center justify-center">
            {currentNote.type === CardType.BASIC ? (
              <div className="w-full space-y-16">
                <div className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-slate-100 animate-in fade-in duration-500">{currentNote.fields.front}</div>
                {showAnswer && (
                  <div className="animate-in fade-in slide-in-from-bottom-12 duration-700">
                    <div className="h-2 w-24 bg-blue-500/10 rounded-full mx-auto mb-16"></div>
                    <div className="text-5xl md:text-8xl font-black text-blue-600 dark:text-blue-500 tracking-tight">{currentNote.fields.back}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full space-y-12">
                 <div className="text-3xl md:text-5xl leading-relaxed font-bold text-slate-800 dark:text-slate-200 animate-in fade-in duration-500" 
                      dangerouslySetInnerHTML={{ __html: renderCloze(currentNote.fields.text || '', currentCard.ordinal, showAnswer) }} />
                 {showAnswer && (currentNote.fields.backExtra || currentNote.fields.back) && (
                   <div className="mt-16 p-10 bg-black/[0.02] dark:bg-white/[0.02] rounded-[48px] text-lg md:text-2xl font-medium text-slate-400 italic animate-in fade-in slide-in-from-bottom-8">
                     {currentNote.fields.backExtra || currentNote.fields.back}
                   </div>
                 )}
              </div>
            )}
          </div>
          
          <div className="absolute bottom-10 flex items-center gap-3 bg-blue-500/5 dark:bg-blue-500/10 px-5 py-2 rounded-full border border-blue-500/10">
            <i className="fa-solid fa-clock text-blue-500/40 text-xs"></i>
            <div className="text-[11px] font-black text-blue-500/70 uppercase tracking-widest tabular-nums">
              {formatDuration(currentTime - sessionStartTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      <div className="mt-12 mb-8 md:mb-0 min-h-[120px] flex items-center justify-center w-full">
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)} 
            className="w-full max-w-xl py-8 bg-slate-900 dark:bg-blue-600 text-white rounded-[40px] font-black text-3xl shadow-2xl hover:brightness-110 active:scale-95 transition-all animate-in slide-in-from-bottom-8 flex items-center justify-center gap-6"
          >
            <span>Javobni ko'rish</span>
            <i className="fa-solid fa-bolt-lightning text-xl text-yellow-400"></i>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl animate-in slide-in-from-bottom-12 duration-700">
            {[
              { r: Rating.AGAIN, label: 'Qayta', color: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
              { r: Rating.HARD, label: 'Qiyin', color: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
              { r: Rating.GOOD, label: 'Yaxshi', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
              { r: Rating.EASY, label: 'Oson', color: 'bg-blue-600', shadow: 'shadow-blue-500/30' },
            ].map(b => (
              <button 
                key={b.r} 
                onClick={() => handleRate(b.r)} 
                className={`${b.color} ${b.shadow} text-white py-6 md:py-10 rounded-[32px] md:rounded-[48px] font-black flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-90 shadow-2xl border-b-4 border-black/10`}
              >
                <span className="text-[11px] md:text-sm uppercase tracking-[0.2em] mb-2 opacity-90">{b.label}</span>
                <span className="text-[10px] md:text-xs opacity-50 font-black tabular-nums">{Scheduler.getEstimate(currentCard, b.r)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
