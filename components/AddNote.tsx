
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Deck, CardType, Note } from '../types';
import { getClozeIndices } from '../utils';

interface AddNoteProps {
  decks: Deck[];
  editNote?: Note;
  onSave: (noteData: { id?: string; deckId: string; type: CardType; fields: any }) => void;
  onCancel: () => void;
}

export const AddNote: React.FC<AddNoteProps> = ({ decks, editNote, onSave, onCancel }) => {
  const [deckId, setDeckId] = useState(editNote?.deckId || decks[0]?.id || '');
  const [type, setType] = useState<CardType>(editNote?.type || CardType.BASIC);
  const [fields, setFields] = useState(editNote?.fields || { front: '', back: '', text: '', backExtra: '' });
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editNote) {
      setDeckId(editNote.deckId);
      setType(editNote.type);
      setFields(editNote.fields);
    }
  }, [editNote]);

  const cardCount = useMemo(() => {
    if (type === CardType.BASIC) return 1;
    const indices = getClozeIndices(fields.text || '');
    return indices.length || (fields.text ? 1 : 0);
  }, [type, fields.text]);

  const handleSave = () => {
    if (type === CardType.BASIC && (!fields.front || !fields.back)) return alert('Old va orqa tomonni to\'ldiring!');
    if (type === CardType.CLOZE && !fields.text) return alert('Cloze matnini kiriting!');
    onSave({ id: editNote?.id, deckId, type, fields });
  };

  const wrapCloze = (sameIndex: boolean = false) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = (fields.text || '').substring(start, end);
    
    const existing = getClozeIndices(fields.text || '');
    let nextNum = 1;
    if (existing.length > 0) {
      nextNum = sameIndex ? Math.max(...existing) : Math.max(...existing) + 1;
    }

    const newText = (fields.text || '').substring(0, start) + `{{c${nextNum}::${selected}}}` + (fields.text || '').substring(end);
    setFields({ ...fields, text: newText });
    
    setTimeout(() => {
      el.focus();
      const newPos = start + `{{c${nextNum}::`.length + selected.length + 2;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {editNote ? 'Kartani tahrirlash' : 'Yangi karta qo\'shish'}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
            {type === CardType.CLOZE ? 'CLOZE+ ADVANCED ENGINE' : 'STANDART FLASHCARD'}
          </p>
        </div>
        
        {/* macOS Style Segmented Control */}
        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-full md:w-auto backdrop-blur-md border border-black/5 dark:border-white/5 shadow-inner">
          <button 
            onClick={() => setType(CardType.BASIC)} 
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black transition-all duration-300 ${type === CardType.BASIC ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            BASIC
          </button>
          <button 
            onClick={() => setType(CardType.CLOZE)} 
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black transition-all duration-300 ${type === CardType.CLOZE ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            CLOZE+
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Destination Deck Selection */}
        <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[32px] border border-black/[0.04] dark:border-white/[0.04] shadow-sm group">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">YO'NALTIRILGAN TO'PLAM</label>
          <div className="relative">
            <select 
              value={deckId} 
              onChange={(e) => setDeckId(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-5 py-4 text-[15px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-12 text-slate-800 dark:text-slate-100"
            >
              {decks.map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-[#1C1C1E]">{d.name}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
          </div>
        </div>

        {type === CardType.BASIC ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[40px] border border-black/[0.04] dark:border-white/[0.04] shadow-sm hover:shadow-md transition-shadow">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">OLD TOMONI (SAVOL)</label>
                <textarea 
                  value={fields.front} 
                  onChange={(e) => setFields({ ...fields, front: e.target.value })} 
                  className="w-full bg-transparent text-xl font-bold min-h-[220px] outline-none resize-none placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-snug" 
                  placeholder="Savolni kiriting..." 
                />
             </div>
             <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[40px] border border-black/[0.04] dark:border-white/[0.04] shadow-sm hover:shadow-md transition-shadow">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">ORQA TOMONI (JAVOB)</label>
                <textarea 
                  value={fields.back} 
                  onChange={(e) => setFields({ ...fields, back: e.target.value })} 
                  className="w-full bg-transparent text-xl font-bold min-h-[220px] outline-none resize-none placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-snug" 
                  placeholder="Javobni kiriting..." 
                />
             </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[48px] border border-black/[0.04] dark:border-white/[0.04] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CLOZE MATNI</label>
                   <div className="flex gap-3">
                      <button 
                        onClick={() => wrapCloze(true)} 
                        className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-black/5"
                      >
                        BIR XIL ID
                      </button>
                      <button 
                        onClick={() => wrapCloze(false)} 
                        className="text-[10px] font-black bg-blue-600 text-white px-5 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
                      >
                        [YANGI ID]
                      </button>
                   </div>
                </div>
                <textarea 
                  ref={textRef} 
                  value={fields.text} 
                  onChange={(e) => setFields({ ...fields, text: e.target.value })} 
                  className="w-full bg-transparent text-2xl font-bold min-h-[280px] outline-none resize-none placeholder:text-slate-200 dark:placeholder:text-slate-800 leading-relaxed" 
                  placeholder="Misol: Frantsiyaning poytaxti {{c1::Parij}}..." 
                />
                
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5">
                    <i className="fa-solid fa-circle-info text-blue-500"></i>
                    <span>Har bir <b>c1</b> bitta alohida kartani anglatadi.</span>
                  </div>
                  <div className="text-[11px] font-black text-blue-600 uppercase tracking-[0.1em] flex items-center gap-2">
                    GENERATSIYA QILINADIGAN KARTALAR: <span className="text-lg text-slate-800 dark:text-white bg-blue-500/10 px-3 py-0.5 rounded-lg">{cardCount}</span>
                  </div>
                </div>
             </div>

             <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[32px] border border-black/[0.04] dark:border-white/[0.04] shadow-sm">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">QO'SHIMCHA IZOH (MNEMONIKA)</label>
                <textarea 
                  value={fields.backExtra} 
                  onChange={(e) => setFields({ ...fields, backExtra: e.target.value })} 
                  className="w-full bg-transparent text-lg font-medium min-h-[100px] outline-none resize-none placeholder:text-slate-200 dark:placeholder:text-slate-800" 
                  placeholder="Javob bilan birga ko'rinadigan ma'lumot..." 
                />
             </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 pt-8">
          <button 
            onClick={handleSave} 
            className="flex-1 py-6 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-check-double"></i>
            {editNote ? 'Kartani yangilash' : 'Kartani yaratish'}
          </button>
          <button 
            onClick={onCancel} 
            className="px-10 py-6 bg-white dark:bg-[#2C2C2C] text-slate-400 rounded-[24px] font-black text-lg hover:text-rose-500 border border-black/[0.03] dark:border-white/[0.03] transition-all"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};
