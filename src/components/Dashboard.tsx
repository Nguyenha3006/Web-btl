import React, { useState, useEffect } from 'react';
import { 
  Plus, BookOpen, Layers, Clock, AlertCircle, LogOut, Check,
  Trash2, Edit2, Sparkles, RefreshCw, Bell, GraduationCap 
} from 'lucide-react';
import { Deck, UserNotification } from '../types';

interface DashboardProps {
  token: string;
  user: { id: string; email: string; name: string };
  onSelectDeck: (deck: Deck) => void;
  onLogout: () => void;
}

export default function Dashboard({ token, user, onSelectDeck, onLogout }: DashboardProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create / Edit Deck state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    totalDue: 0
  });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch decks
      const resDecks = await fetch('/api/decks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resDecks.ok) throw new Error('Không thể lấy danh sách bộ thẻ.');
      const dataDecks = await resDecks.json();
      setDecks(dataDecks);

      // Fetch user profile info to refresh notifications
      const resMe = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setNotifications(dataMe.user.notifications || []);
      }

    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  // Re-calculate stats whenever decks array changes
  useEffect(() => {
    const tDecks = decks.length;
    let tCards = 0;
    let tDue = 0;
    decks.forEach(d => {
      tCards += d.cardCount || 0;
      tDue += d.dueCount || 0;
    });
    setStats({
      totalDecks: tDecks,
      totalCards: tCards,
      totalDue: tDue
    });
  }, [decks]);

  // Create or Update Deck handler
  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;

    setSubmitting(true);
    const url = isEditing ? `/api/decks/${isEditing._id}` : '/api/decks';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: deckName, description: deckDescription })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể lưu bộ thẻ.');

      // Clear State
      setDeckName('');
      setDeckDescription('');
      setIsEditing(null);
      setShowModal(false);
      
      // Refresh
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Deck handler
  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    if (!confirm('Bạn có chắc chắn muốn xóa bộ thẻ này? Tất cả các thẻ flashcard bên trong sẽ bị xóa vĩnh viễn.')) return;

    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể xóa bộ thẻ.');
      
      // Refresh
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mark all notification alerts as read
  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch('/api/auth/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Backend Cron job simulation manually
  const handleTriggerCron = async () => {
    try {
      const res = await fetch('/api/cron/trigger', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      // Reload everything
      fetchUserData();
    } catch (e: any) {
      alert('Không thể kích hoạt cron quét: ' + e.message);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div id="dashboard-wrapper" className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      
      {/* Main Grid container */}
      <main id="dashboard-content" className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Banner Section */}
        <div id="banner-welcome" className="bg-white border border-slate-200 p-6 rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">Chào mừng quay lại, {user.name}! 👋</h2>
            <p className="text-xs text-slate-500 mt-1">Cơ chế lặp ngắt quãng Anki SM-2 cùng trợ lý AI đã sẵn sàng hỗ trợ bạn hôm nay.</p>
          </div>
          
          <button
            id="btn-trigger-manual-cron"
            onClick={handleTriggerCron}
            className="flex items-center gap-2 text-xs bg-slate-900 hover:bg-slate-850 text-white px-4 py-2.5 rounded font-bold cursor-pointer transition-all shadow-sm shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Kích hoạt Cron Quét Thẻ Sớm</span>
          </button>
        </div>

        {/* Stats Grid */}
        <section id="stats-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reviews Due</div>
            <div className="text-3xl font-black text-[#CC0000] mt-1">{stats.totalDue}</div>
            <div className="text-[10px] text-slate-400 mt-1 italic">Last cron sync: Vừa xong</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Decks</div>
            <div className="text-3xl font-black text-slate-800 mt-1">{stats.totalDecks}</div>
            <div className="text-[10px] text-green-600 mt-1 font-semibold">+2 this week</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mastery Rate</div>
            <div className="text-3xl font-black text-slate-800 mt-1">
              {stats.totalCards > 0 
                ? Math.round(((stats.totalCards - stats.totalDue) / stats.totalCards) * 100) 
                : 100}%
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-2">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                style={{ width: `${stats.totalCards > 0 ? Math.round(((stats.totalCards - stats.totalDue) / stats.totalCards) * 100) : 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Retention Score</div>
            <div className="text-3xl font-black text-slate-800 mt-1">
              {stats.totalDue > 10 ? 'Normal' : 'High'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 italic">Spaced Repetition Opt.</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Decks Display */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-[#CC0000]" />
                <span>Kho tri thức bộ thẻ học tập</span>
              </h3>
              
              <button
                id="btn-open-create-modal"
                onClick={() => {
                  setIsEditing(null);
                  setDeckName('');
                  setDeckDescription('');
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 text-xs bg-[#CC0000] hover:bg-red-850 text-white px-3 py-1.5 rounded font-bold cursor-pointer transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bộ thẻ mới</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#CC0000] rounded text-xs font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-xl">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-3" />
                <p>Đang liên kết cơ sở dữ liệu HustMemo...</p>
              </div>
            ) : decks.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 p-10 rounded-xl text-center">
                <p className="text-sm text-slate-500 mb-4">Bạn chưa sở hữu bộ thẻ học tập nào cả.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-slate-100 text-slate-850 border border-slate-200 hover:bg-slate-200 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  Tạo Bộ thẻ Đầu tiên Ngay!
                </button>
              </div>
            ) : (
              <div id="decks-grid" className="grid sm:grid-cols-2 gap-4">
                {decks.map(deck => (
                  <div
                    key={deck._id}
                    id={`deck-card-${deck._id}`}
                    onClick={() => onSelectDeck(deck)}
                    className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-[#CC0000]/60 transition-all shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {(deck.cardCount || 0)} thẻ học
                        </span>

                        {deck.dueCount && deck.dueCount > 0 ? (
                          <span className="text-[10px] bg-red-50 text-[#CC0000] border border-red-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full"></span>
                            {deck.dueCount} cần ôn
                          </span>
                        ) : (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-bold">
                            An toàn
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-slate-850 group-hover:text-[#CC0000] transition-colors line-clamp-1">
                        {deck.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 h-8 leading-relaxed">
                        {deck.description || 'Chưa cấu hình mô tả cho bộ thẻ này.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                      <span className="font-mono">{new Date(deck.createdAt).toLocaleDateString('vi-VN')}</span>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(deck);
                            setDeckName(deck.name);
                            setDeckDescription(deck.description);
                            setShowModal(true);
                          }}
                          className="p-1 px-2 text-slate-500 hover:text-[#CC0000] hover:bg-slate-100 rounded transition-all"
                          title="Sửa tên bộ thẻ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteDeck(deck._id, e)}
                          className="p-1 px-2 text-slate-500 hover:text-[#CC0000] hover:bg-red-50 rounded transition-all"
                          title="Xóa bộ thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Notifications and Cron Debug console */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#CC0000]" />
                  <span>Chuỗi hoạt động của bạn</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#CC0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h4>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-[10px] text-[#CC0000] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Dọn dẹp</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  Chưa ghi nhận thông báo nào từ hệ thống.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto high-density-scroll pr-1">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded border text-xs leading-relaxed transition-all ${
                        notif.read 
                          ? 'bg-slate-50 border-slate-100 text-slate-400' 
                          : notif.type === 'cron' 
                            ? 'bg-red-50/50 border-red-100 text-red-900 font-semibold shadow-xs' 
                            : 'bg-green-50/50 border-green-100 text-green-900 font-semibold shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          notif.type === 'cron' ? 'text-[#CC0000]' : 'text-green-600'
                        }`} />
                        <div>
                          <p>{notif.message}</p>
                          <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                            {new Date(notif.timestamp).toLocaleTimeString('vi-VN')} - {new Date(notif.timestamp).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Learning Tips Box */}
            <div className="bg-slate-900 text-white border border-slate-850 p-5 rounded-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#CC0000]/10 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
              <h5 className="font-bold text-xs text-[#CC0000] tracking-wider uppercase flex items-center gap-1 z-10">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Lời khuyên học từ AI</span>
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed z-10">
                "Việc lặp ngắt quãng có hiệu quả lớn nhất khi bạn giữ phong độ học hằng ngày. Kể cả chỉ dành 5 phút mỗi sáng khi vừa thức dậy sẽ giúp bộ não của bạn hấp thụ thông tin lên tới 95%!"
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Model Dialog for Create/Edit Deck */}
      {showModal && (
        <div id="modal-backdrop" className="fixed inset-0 bg-[#0f172aa0] backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="modal-card" className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full animate-slide-up shadow-2xl text-slate-900">
            <h4 className="font-bold text-base text-slate-850 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">
              {isEditing ? 'Cập nhật bộ thẻ của bạn' : 'Tạo thêm bộ kiến thức mới'}
            </h4>

            <form onSubmit={handleSaveDeck} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tên bộ thẻ (Hãy ghi tóm gọn)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh văn Bách Khoa, Cơ lý thuyết"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Ghi ghép các kiến thức mục tiêu tại đây..."
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-xs text-slate-400 font-bold px-4 py-2 hover:bg-slate-100 rounded transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-xs bg-slate-900 hover:bg-slate-850 text-white px-5 py-2 rounded font-bold transition-all cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
