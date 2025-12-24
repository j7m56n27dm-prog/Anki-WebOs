
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
            description: '',
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
    const newCardOrdinals = data.type === CardType.BASIC ? [0] : getClozeIndices(data.fields.text || '');

    for (const ord of newCardOrdinals) {
      const existing = oldCards.find(c => c.ordinal === ord);
      if (!existing) {
        await storage.put('cards', {
          id: generateId(), noteId, deckId: data.deckId, ordinal: ord,
          due: Date.now(), interval: 0, ease: 2500, repetitions: 0, lapses: 0, queue: QueueType.NEW
        });
      } else if (existing.deckId !== data.deckId) {
        await storage.put('cards', { ...existing, deckId: data.deckId });
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

  const currentQueue = useMemo(() => {
    if (!activeDeck) return [];
    const now = Date.now();
    return cards
      .filter(c => c.deckId === activeDeck.id && c.due <= now)
      .sort((a, b) => (a.queue !== b.queue ? a.queue - b.queue : a.due - b.due));
  }, [activeDeck, cards]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => JSON.stringify(n.fields).toLowerCase().includes(q));
  }, [notes, searchQuery]);

  if (appState === 'initializing') return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111]">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yuklanmoqda...</p>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-[#111] text-white ${isMobile ? 'flex-col' : 'flex-row'}`}>
      {!isMobile && (
        <Sidebar 
          currentView={currentView} 
          onViewChange={(v) => { setCurrentView(v); setActiveDeck(null); setEditingNote(null); }} 
        />
      )}
      
      <main className="flex-1 h-full overflow-hidden relative">
        {currentView === 'decks' && (
          <DeckList 
            decks={decks} cards={cards} 
            onStudy={(d) => { setActiveDeck(d); setCurrentView('study'); }} 
            onDeleteDeck={async (id) => { if(confirm('O\'chirilsinmi?')) { await storage.delete('decks', id); refreshData(); } }}
            onAddDeck={async () => {
              const name = prompt('To\'plam nomi:');
              if (name?.trim()) {
                await storage.put('decks', { id: generateId(), name, description: '', createdAt: Date.now() });
                refreshData();
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
          <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black">Browse Cards</h1>
                <input 
                  type="text" 
                  placeholder="Qidirish..." 
                  className="bg-[#1C1C1E] border border-white/5 rounded-xl px-4 py-2 outline-none w-64 focus:border-blue-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex-1 overflow-y-auto space-y-3">
                {filteredNotes.map(n => (
                  <div key={n.id} className="bg-[#1C1C1E] p-4 rounded-xl flex items-center justify-between border border-white/5 group">
                     <div className="truncate flex-1 pr-4">
                        <div className="text-[10px] text-blue-500 font-bold uppercase">{decks.find(d => d.id === n.deckId)?.name}</div>
                        <div className="text-sm font-bold truncate">{n.type === CardType.BASIC ? n.fields.front : n.fields.text}</div>
                     </div>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingNote(n); setCurrentView('add'); }} className="p-2 text-blue-500"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={async () => { if(confirm('O\'chirilsinmi?')) { await storage.delete('notes', n.id); refreshData(); } }} className="p-2 text-rose-500"><i className="fa-solid fa-trash"></i></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {currentView === 'stats' && (
           <div className="p-12 h-full overflow-y-auto animate-in fade-in duration-500">
              <h1 className="text-4xl font-black mb-12">Statistika</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                 <div className="bg-[#1C1C1E] p-8 rounded-3xl border border-white/5">
                    <div className="text-4xl font-black text-blue-500 mb-2">{notes.length}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jami Notlar</div>
                 </div>
                 <div className="bg-[#1C1C1E] p-8 rounded-3xl border border-white/5">
                    <div className="text-4xl font-black text-emerald-500 mb-2">{cards.length}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jami Kartalar</div>
                 </div>
                 <div className="bg-[#1C1C1E] p-8 rounded-3xl border border-white/5">
                    <div className="text-4xl font-black text-orange-500 mb-2">{cards.filter(c => c.repetitions > 0).length}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">O'rganilgan</div>
                 </div>
              </div>
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                 <i className="fa-solid fa-brain absolute -bottom-10 -right-10 text-[180px] opacity-10"></i>
                 <h2 className="text-3xl font-black mb-4 italic">"Ilm olish farzdir."</h2>
                 <p className="text-blue-200 font-bold tracking-widest">— Hadisi Sharif</p>
              </div>
           </div>
        )}
      </main>

      {isMobile && (
        <div className="bg-[#1C1C1E] border-t border-white/5 flex justify-around py-4 pb-8">
           {['decks', 'add', 'browse', 'stats'].map(v => (
             <button key={v} onClick={() => setCurrentView(v)} className={`p-3 rounded-xl ${currentView === v ? 'text-blue-500 bg-white/5' : 'text-slate-500'}`}>
                <i className={`fa-solid ${v === 'decks' ? 'fa-layer-group' : v === 'add' ? 'fa-plus' : v === 'browse' ? 'fa-magnifying-glass' : 'fa-chart-simple'} text-xl`}></i>
             </button>
           ))}
        </div>
      )}

      {!isMobile && (
        <div className="absolute bottom-10 left-72 text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] pointer-events-none">
           ANIMA SONOMA ENGINE ©️ MUHAMMAD DALER
        </div>
      )}
    </div>
  );
};

export default App;
