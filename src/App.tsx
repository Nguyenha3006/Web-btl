import { useState, useEffect } from 'react';
import { ViewState, Deck, Card } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DeckDetail from './components/DeckDetail';
import StudySession from './components/StudySession';
import { GraduationCap, LogOut, Layers, HelpCircle, Activity, Menu, X } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cardsToStudy, setCardsToStudy] = useState<Card[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Automatically load authentication tokens from localStorage upon reload
  useEffect(() => {
    const savedToken = localStorage.getItem('hustmemo_token');
    const savedUser = localStorage.getItem('hustmemo_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: { id: string; email: string; name: string }) => {
    localStorage.setItem('hustmemo_token', newToken);
    localStorage.setItem('hustmemo_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('hustmemo_token');
    localStorage.removeItem('hustmemo_user');
    setToken(null);
    setUser(null);
    setSelectedDeck(null);
    setCardsToStudy([]);
    setView('landing');
  };

  const handleSelectDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView('deck-detail');
  };

  const handleStartStudy = (cards: Card[]) => {
    setCardsToStudy(cards);
    setView('study-session');
  };

  const handleFinishStudy = () => {
    // If we finished a study session, return to the deck details page. 
    // This will force the deck and cards array to reload their states from the database.
    setView('deck-detail');
  };

  // If not logged in, render the landing page directly
  if (view === 'landing' || !token || !user) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC]">
        <LandingPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div id="hustmemo-main-layout" className="flex min-h-screen bg-[#F8FAFC] text-slate-900 select-none font-sans overflow-hidden">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar: Navigation & Project Identity */}
      <aside 
        className={`bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 transition-all duration-300 z-50 md:z-20
          fixed inset-y-0 left-0 md:static md:flex
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-r-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between bg-[#CC0000]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-[#CC0000] text-lg">H</div>
            <span className="font-bold tracking-tight text-xl text-white">hustmemo</span>
          </div>
          {/* Mobile close sidebar button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-white/10 rounded text-white md:hidden cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Learning Center</div>
          
          <button
            onClick={() => {
              setView('dashboard');
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              view === 'dashboard' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              if (selectedDeck) {
                setView('deck-detail');
              } else {
                setView('dashboard');
              }
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              view === 'deck-detail' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            <span>Decks Explorer</span>
          </button>

          {view === 'study-session' && (
            <div className="flex items-center gap-3 p-3 bg-[#CC0000]/10 text-red-400 border border-[#CC0000]/20 rounded-lg text-xs font-bold animate-pulse">
              <span>⚡ Active Review session</span>
            </div>
          )}
        </nav>

        {/* System Monitor inside Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-xl space-y-3 border border-slate-800/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">System Status</span>
              <span className="flex items-center gap-1.5 text-green-400 font-semibold">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Active
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono leading-tight">
              Express Node.js • MongoDB • Cron
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Unified Layout Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger button to toggle sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-650 hover:text-[#CC0000] hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0"
              title={sidebarOpen ? "Đóng thanh điều hướng" : "Mở thanh điều hướng"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
              {view === 'dashboard' && 'Learning Overview'}
              {view === 'deck-detail' && 'Deck Details / Management'}
              {view === 'study-session' && 'Intelligent Study Center'}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] md:text-xs font-bold italic shrink-0">
              <span>🔥 14 Day Streak</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User display */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#CC0000] text-white flex items-center justify-center font-black text-xs shrink-0 select-none shadow-sm">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">Sinh viên HUST</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-[#CC0000] border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all rounded-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View Router render wrapper */}
        <div className="flex-1 overflow-y-auto high-density-scroll">
          {view === 'dashboard' && (
            <Dashboard 
              token={token} 
              user={user} 
              onSelectDeck={handleSelectDeck} 
              onLogout={handleLogout} 
            />
          )}

          {view === 'deck-detail' && selectedDeck && (
            <DeckDetail 
              token={token} 
              deck={selectedDeck} 
              onBack={() => setView('dashboard')} 
              onStartStudy={handleStartStudy} 
            />
          )}

          {view === 'study-session' && cardsToStudy && (
            <StudySession 
              token={token} 
              cards={cardsToStudy} 
              onBack={handleFinishStudy} 
            />
          )}
        </div>

        {/* Unified Activity Footer */}
        <footer className="h-10 bg-slate-50 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0">
          <div className="flex gap-6">
            <span>API Server: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">JWT_ACTIVE</span></span>
            <span className="hidden sm:inline">User Session Status: <span className="font-mono text-green-600">VALID</span></span>
          </div>
          <div className="italic">HustMemo Student Project © 2026 • Intelligent SM-2 Repetition Engine</div>
        </footer>
      </div>

    </div>
  );
}
