
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

  const handleSave = () => {
    if (type === CardType.BASIC && (!fields.front || !fields.back)) return alert('Savol va javobni to\'ldiring!');
    if (type === CardType.CLOZE && !fields.text) return alert('Matnni kiriting!');
    onSave({ id: editNote?.id, deckId, type, fields });
  };

  const wrapCloze = () => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = (fields.text || '').substring(start, end);
    const existing = getClozeIndices(fields.text || '');
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    const newText = (fields.text || '').substring(0, start) + `{{c${nextNum}::${selected}}}` + (fields.text || '').substring(end);
    setFields({ ...fields, text: newText });
  };

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black">Add New Note</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            {type === CardType.BASIC ? 'STANDARD FLASHCARD' : 'CLOZE DEletion'}
          </p>
        </div>
        
        {/* macOS Style Segmented Control */}
        <div className="flex bg-[#1C1C1E] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setType(CardType.BASIC)} 
            className={`px-6 py-2 rounded-lg text-[12px] font-bold transition-all ${type === CardType.BASIC ? 'bg-[#3A3A3C] text-blue-500' : 'text-slate-400'}`}
          >
            BASIC
          </button>
          <button 
            onClick={() => setType(CardType.CLOZE)} 
            className={`px-6 py-2 rounded-lg text-[12px] font-bold transition-all ${type === CardType.CLOZE ? 'bg-[#3A3A3C] text-blue-500' : 'text-slate-400'}`}
          >
            CLOZE+
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Destination Deck Selection */}
        <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">DESTINATION DECK</label>
          <div className="relative">
            <select 
              value={deckId} 
              onChange={(e) => setDeckId(e.target.value)} 
              className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-4 py-3 text-white font-bold appearance-none outline-none focus:border-blue-500/50"
            >
              {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
          </div>
        </div>

        {type === CardType.BASIC ? (
          <div className="space-y-6">
            <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">FRONT SIDE</label>
              <textarea 
                value={fields.front} 
                onChange={(e) => setFields({ ...fields, front: e.target.value })} 
                className="w-full bg-transparent text-xl font-bold min-h-[150px] outline-none resize-none placeholder:text-slate-800" 
                placeholder="Savolni kiriting..." 
              />
            </div>
            <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">BACK SIDE</label>
              <textarea 
                value={fields.back} 
                onChange={(e) => setFields({ ...fields, back: e.target.value })} 
                className="w-full bg-transparent text-xl font-bold min-h-[150px] outline-none resize-none placeholder:text-slate-800" 
                placeholder="Javobni kiriting..." 
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
             <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">TEXT FIELD</label>
                <button onClick={wrapCloze} className="text-[10px] font-bold bg-blue-600 px-3 py-1 rounded-md text-white hover:bg-blue-500">CLOZE [ ... ]</button>
             </div>
             <textarea 
               ref={textRef}
               value={fields.text} 
               onChange={(e) => setFields({ ...fields, text: e.target.value })} 
               className="w-full bg-transparent text-xl font-bold min-h-[250px] outline-none resize-none placeholder:text-slate-800" 
               placeholder="Matnni kiriting va {{c1::yashiriladigan qism}} ni belgilang..." 
             />
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleSave} 
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-blue-600/20"
          >
            {editNote ? 'Save Changes' : 'Create Card'}
          </button>
          <button 
            onClick={onCancel} 
            className="px-8 py-4 bg-[#2C2C2E] text-slate-400 rounded-xl font-bold hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
