
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from './storage';
import { Deck, Note, Card, CardType, Rating, QueueType } from './types';
import { Sidebar } from './components/Sidebar';
import { DeckList } from './components/DeckList';
import { StudySession } from './components/StudySession';
import { AddNote } from './components/AddNote';
import { generateId, getClozeIndices } from './utils';
import { Scheduler } from './scheduler';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentView, setCurrentView] = useState('decks');
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [d, n, c] = await Promise.all([
        storage.getAll<Deck>('decks'),
        storage.getAll<Note>('notes'),
        storage.getAll<Card>('cards')
      ]);
      setDecks(d);
      setNotes(n);
      setCards(c);
    } catch (e) {
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await storage.init();
        const existing = await storage.getAll<Deck>('decks');
        if (existing.length === 0) {
          await storage.put('decks', {
            id: generateId(),
            name: 'Mening To\'plamim',
            description: 'Yangi bilimlarni shu yerda saqlang',
            createdAt: Date.now()
          });
        }
        await refreshData();
        setAppState('ready');
      } catch (e) {
        setAppState('error');
      }
    };
    boot();
  }, [refreshData]);

  const handleSaveNote = async (data: { id?: string, deckId: string, type: CardType, fields: any }) => {
    const noteId = data.id || generateId();
    const note: Note = {
      id: noteId,
      deckId: data.deckId,
      type: data.type,
      fields: data.fields,
      tags: [],
      createdAt: data.id ? (notes.find(n => n.id === data.id)?.createdAt || Date.now()) : Date.now()
    };

    await storage.put('notes', note);

    const oldCards = cards.filter(c => c.noteId === noteId);
    const newCardOrdinals = data.type === CardType.BASIC 
      ? [0] 
      : (getClozeIndices(data.fields.text || '').length > 0 ? getClozeIndices(data.fields.text || '') : [1]);

    for (const ord of newCardOrdinals) {
      const existingCard = oldCards.find(c => c.ordinal === ord);
      if (!existingCard) {
        await storage.put('cards', {
          id: generateId(), noteId, deckId: data.deckId, ordinal: ord,
          due: Date.now(), interval: 0, ease: 2500, repetitions: 0, lapses: 0, queue: QueueType.NEW
        });
      } else if (existingCard.deckId !== data.deckId) {
        await storage.put('cards', { ...existingCard, deckId: data.deckId });
      }
    }

    const toDelete = oldCards.filter(oc => !newCardOrdinals.includes(oc.ordinal));
    for (const cd of toDelete) await storage.delete('cards', cd.id);

    setEditingNote(null);
    await refreshData();
    setCurrentView('decks');
  };

  const handleReview = async (card: Card, rating: Rating) => {
    const updated = Scheduler.review(card, rating);
    await storage.put('cards', updated);
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Barcha kartalar o'chishiga rozimisiz?")) return;
    const relNotes = notes.filter(n => n.deckId === deckId);
    const relCards = cards.filter(c => c.deckId === deckId);
    for (const c of relCards) await storage.delete('cards', c.id);
    for (const n of relNotes) await storage.delete('notes', n.id);
    await storage.delete('decks', deckId);
    await refreshData();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Ushbu karta o'chirilsinmi?")) return;
    const relCards = cards.filter(c => c.noteId === noteId);
    for (const c of relCards) await storage.delete('cards', c.id);
    await storage.delete('notes', noteId);
    await refreshData();
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      (n.fields.front?.toLowerCase().includes(q)) || 
      (n.fields.back?.toLowerCase().includes(q)) || 
      (n.fields.text?.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const currentQueue = useMemo(() => {
    if (!activeDeck) return [];
    const now = Date.now();
    return cards
      .filter(c => c.deckId === activeDeck.id && c.due <= now)
      .sort((a, b) => (a.queue !== b.queue ? a.queue - b.queue : a.due - b.due));
  }, [activeDeck, cards]);

  if (appState === 'initializing') return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-[#111]">
      <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-600 rounded-full animate-spin mb-8 shadow-2xl shadow-blue-500/20"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Anki Pro Engine Yuklanmoqda...</p>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-white dark:bg-[#1E1E1E] transition-colors duration-500 ${isMobile ? 'flex-col' : 'flex-row'}`}>
      {!isMobile && (
        <Sidebar 
          currentView={currentView} 
          onViewChange={(v) => { setCurrentView(v); setActiveDeck(null); setEditingNote(null); }} 
        />
      )}
      
      <main className="flex-1 h-full overflow-hidden relative bg-[#F6F6F6] dark:bg-[#111]">
        {currentView === 'decks' && (
          <DeckList 
            decks={decks} cards={cards} 
            onStudy={(d) => { setActiveDeck(d); setCurrentView('study'); }} 
            onDeleteDeck={handleDeleteDeck}
            onAddDeck={async () => {
              const name = prompt('To\'plam nomi:');
              if (name?.trim()) {
                await storage.put('decks', { id: generateId(), name, description: '', createdAt: Date.now() });
                await refreshData();
              }
            }} 
          />
        )}
        
        {currentView === 'study' && activeDeck && (
          <StudySession 
            deckName={activeDeck.name} cards={currentQueue} notes={notes}
            onReview={handleReview} onEditNote={(n) => { setEditingNote(n); setCurrentView('add'); }}
            onFinish={() => { setActiveDeck(null); setCurrentView('decks'); refreshData(); }}
          />
        )}

        {currentView === 'add' && (
          <AddNote 
            decks={decks} editNote={editingNote || undefined}
            onSave={handleSaveNote} onCancel={() => { setEditingNote(null); setCurrentView('decks'); }}
          />
        )}

        {currentView === 'browse' && (
          <div className="h-full flex flex-col p-8 md:p-12 overflow-hidden animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <h1 className="text-4xl font-black tracking-tight">Ko'rib chiqish</h1>
               <div className="relative w-full md:w-96">
                  <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="Kartalardan qidirish..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
               {filteredNotes.length === 0 ? (
                 <div className="py-32 text-center opacity-20">
                    <i className="fa-solid fa-ghost text-9xl mb-6"></i>
                    <p className="font-black text-2xl uppercase tracking-widest">Hech narsa topilmadi</p>
                 </div>
               ) : (
                 filteredNotes.map(n => (
                   <div key={n.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform group">
                      <div className="flex-1">
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                           {decks.find(d => d.id === n.deckId)?.name || 'Noma\'lum'}
                         </div>
                         <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate max-w-2xl">
                           {n.type === CardType.BASIC ? n.fields.front : n.fields.text?.replace(/{{c\d+::(.*?)(?:::(.*?))?}}/g, '[$1]')}
                         </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingNote(n); setCurrentView('add'); }} className="p-3 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                            <i className="fa-solid fa-pen"></i>
                         </button>
                         <button onClick={() => handleDeleteNote(n.id)} className="p-3 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
                            <i className="fa-solid fa-trash"></i>
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {currentView === 'stats' && (
          <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
             <h1 className="text-4xl font-black tracking-tight mb-12">Statistika</h1>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[48px] border border-black/5 dark:border-white/5 shadow-sm">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                      <i className="fa-solid fa-copy text-xl"></i>
                   </div>
                   <div className="text-4xl font-black mb-1">{notes.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami notlar</div>
                </div>
                <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[48px] border border-black/5 dark:border-white/5 shadow-sm">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                      <i className="fa-solid fa-layer-group text-xl"></i>
                   </div>
                   <div className="text-4xl font-black mb-1">{cards.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami kartalar</div>
                </div>
                <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[48px] border border-black/5 dark:border-white/5 shadow-sm">
                   <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                      <i className="fa-solid fa-calendar-check text-xl"></i>
                   </div>
                   <div className="text-4xl font-black mb-1">{cards.filter(c => c.repetitions > 0).length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'rganilgan kartalar</div>
                </div>
             </div>

             <div className="bg-blue-600 p-12 rounded-[56px] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                <i className="fa-solid fa-brain absolute -bottom-10 -right-10 text-[200px] opacity-10 group-hover:scale-110 transition-transform"></i>
                <div className="relative z-10 max-w-xl">
                   <h3 className="text-3xl font-black mb-4 italic">"Ilm – boylikdan yaxshiroqdir, chunki ilm seni asraydi, boylikni esa sen asrashing kerak."</h3>
                   <p className="text-blue-100 font-bold opacity-60 uppercase tracking-widest text-xs">— Hazrat Ali (r.a.)</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {isMobile && (
        <div className="bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex justify-around py-5 pb-9 px-8 z-50 shadow-2xl">
          {[
            { id: 'decks', icon: 'fa-layer-group' },
            { id: 'add', icon: 'fa-plus' },
            { id: 'browse', icon: 'fa-magnifying-glass' },
            { id: 'stats', icon: 'fa-chart-simple' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setActiveDeck(null); setEditingNote(null); }}
              className={`p-4 rounded-3xl transition-all duration-300 ${currentView === item.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 scale-125 shadow-sm' : 'text-slate-400 opacity-60'}`}
            >
              <i className={`fa-solid ${item.icon} text-2xl`}></i>
            </button>
          ))}
        </div>
      )}

      {!isMobile && (
        <div className="absolute bottom-10 left-72 text-[10px] font-black text-slate-300 dark:text-slate-800 uppercase tracking-[0.6em] pointer-events-none select-none z-0">
          ANIMA SONOMA ENGINE ©️ MUHAMMAD DALER
        </div>
      )}
    </div>
  );
};

export default App;
