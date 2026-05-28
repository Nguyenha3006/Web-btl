import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Sparkles, BookOpen, Trash2, Edit2, 
  Play, RefreshCw, AlertCircle, HelpCircle, FileText 
} from 'lucide-react';
import { Deck, Card } from '../types';

interface DeckDetailProps {
  token: string;
  deck: Deck;
  onBack: () => void;
  onStartStudy: (cardsToStudy: Card[]) => void;
}

export default function DeckDetail({ token, deck, onBack, onStartStudy }: DeckDetailProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Card form
  const [showCardForm, setShowCardForm] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState<Card | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [cardSubmitting, setCardSubmitting] = useState(false);

  // Gemini AI generation state
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<string[]>([]);

  // Educational messages for active AI generation loading states
  const loadingTips = [
    "Đang kết nối siêu trí tuệ AI Google Gemini 3.5 Flash...",
    "Đang cấu trúc mảng câu hỏi & câu trả lời khoa học...",
    "Đang sắp đặt chuẩn hóa sơ đồ ghi nhớ tối ưu...",
    "Đang lưu trữ dữ liệu trực tiếp vào hệ thống HustMemo...",
    "Hoàn thành xuất sắc! Đang sẵn sàng tải dữ liệu..."
  ];

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/decks/${deck._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể tải các thẻ ghi nhớ.');
      const data = await res.json();
      setCards(data.cards || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải thẻ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [deck, token]);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setCardSubmitting(true);
    const url = isEditingCard ? `/api/decks/cards/${isEditingCard._id}` : '/api/decks/cards';
    const method = isEditingCard ? 'PUT' : 'POST';
    const payload = isEditingCard 
      ? { question, answer } 
      : { deckId: deck._id, question, answer };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo thẻ.');

      // Clear Card Form state
      setQuestion('');
      setAnswer('');
      setIsEditingCard(null);
      setShowCardForm(false);
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thẻ ghi nhớ này? Hành động này không thể hoàn tác.')) return;

    try {
      const res = await fetch(`/api/decks/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể xóa thẻ.');
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Start Gemini AI Auto Generation
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    setAiMessages([loadingTips[0]]);
    
    // Rotate loading messages on an interval to maintain user comfort
    let quoteIndex = 0;
    const interval = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % loadingTips.length;
      setAiMessages(prev => [...prev, loadingTips[quoteIndex]]);
    }, 2800);

    try {
      const res = await fetch('/api/decks/cards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic: aiTopic, deckId: deck._id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đã xảy ra lỗi khi tạo thẻ bằng AI.');

      alert(data.message);
      setAiTopic('');
      setShowAiForm(false);
      fetchCards();
    } catch (err: any) {
      alert(err.message || 'Không thể gọi Gemini API.');
    } finally {
      clearInterval(interval);
      setAiLoading(false);
    }
  };

  // Filter cards due for study session
  const now = new Date();
  const dueCards = cards.filter(c => new Date(c.nextReview) <= now);

  return (
    <div id="deck-detail-wrapper" className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16">
      
      {/* Detail Header area */}
      <div id="detail-top-banner" className="bg-white border-b border-slate-200 px-6 py-6 font-sans">
        <div className="max-w-6xl mx-auto">
          <button
            id="btn-back-dashboard"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#CC0000] font-bold transition-all cursor-pointer mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Dashboard</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">{deck.name}</h2>
                <span className="text-xs bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded font-bold">
                  {cards.length} thẻ ghi nhớ
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
                {deck.description || 'Chưa cấu hình nội dung mô tả cho bộ thẻ học tập này.'}
              </p>
            </div>

            {/* Launch Study button */}
            <div className="flex items-center gap-3 shrink-0">
              {dueCards.length > 0 ? (
                <button
                  id="btn-start-study-due"
                  onClick={() => onStartStudy(dueCards)}
                  className="bg-[#CC0000] hover:bg-red-850 text-white px-5 py-3 rounded flex items-center gap-2 font-bold text-sm tracking-wide cursor-pointer transition-all shadow-md animate-pulse"
                >
                  <Play className="w-4.5 h-4.5 fill-current" />
                  <span>ÔN TẬP NGAY ({dueCards.length} Thẻ Quá Hạn)</span>
                </button>
              ) : (
                <button
                  id="btn-start-study-all"
                  onClick={() => onStartStudy(cards)}
                  disabled={cards.length === 0}
                  className="bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded flex items-center gap-2 font-bold text-sm tracking-wide cursor-pointer transition-all shadow-sm"
                >
                  <Play className="w-4.5 h-4.5" />
                  <span>Ôn tập toàn bộ bộ thẻ ({cards.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Action controls index */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              setIsEditingCard(null);
              setQuestion('');
              setAnswer('');
              setShowCardForm(prev => !prev);
              setShowAiForm(false);
            }}
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 text-slate-800 p-2.5 rounded border border-slate-200">
                <Plus className="w-5 h-5 text-[#CC0000]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800">Thêm thẻ ghi nhớ thủ công</h4>
                <p className="text-xs text-slate-500">Bạn tự nhập câu hỏi, định nghĩa tương ứng</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAiForm(prev => !prev);
              setShowCardForm(false);
            }}
            className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2.5 rounded">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800">Phát triển thông minh bằng AI Gemini</h4>
                <p className="text-xs text-slate-500">Tự động sinh 5 thẻ flashcards tức thì từ chủ đề đề xuất!</p>
              </div>
            </div>
          </button>
        </section>

        {/* Dynamic Input/AI Forms */}
        {showCardForm && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl mb-6 shadow-sm animate-slide-up">
            <h4 className="font-bold text-sm text-slate-850 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="w-5 h-5 text-[#CC0000]" />
              <span>{isEditingCard ? 'Cập nhật thẻ Flashcard' : 'Tạo thêm thẻ Flashcard mới'}</span>
            </h4>

            <form onSubmit={handleSaveCard} className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mặt trước - Câu hỏi / Thuật ngữ</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Điền từ khóa chính hoặc câu hỏi của bạn..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mặt sau - Đáp án / Định nghĩa</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Giải đáp khoa học của câu hỏi ở trên..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="text-xs text-slate-400 font-bold px-4 py-2 hover:bg-slate-100 rounded transition-all cursor-pointer"
                >
                  Đóng Form
                </button>
                <button
                  type="submit"
                  disabled={cardSubmitting}
                  className="text-xs bg-slate-900 hover:bg-slate-850 text-white px-5 py-2 rounded font-bold flex items-center gap-1 cursor-pointer"
                >
                  {cardSubmitting ? 'Đang viết...' : 'Xác nhận Lưu'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAiForm && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl mb-6 shadow-sm animate-slide-up">
            <h4 className="font-bold text-sm text-slate-850 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Dùng AI Học Tập Thông Minh</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">Gõ chủ đề học bách khoa cần ôn. Robot Gemini sẽ tự chọn lọc kiến thức nền tảng và dọn ra 5 thẻ chất lượng cao tức thì.</p>

            <form onSubmit={handleAiGenerate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chủ đề cần lấy thông tin ngắn gọn</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lịch sử đại học bách khoa hà nội, Giải tích 1 tích phân lớp 12, Cấu trúc mạng máy tính OSI"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="border border-slate-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAiForm(false)}
                  className="text-xs text-slate-400 font-bold px-4 py-2 hover:bg-slate-100 rounded transition-all cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="text-xs bg-slate-900 hover:bg-slate-850 text-white px-5 py-2 rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Cắt nghĩa và Tạo Thẻ Ngay</span>
                </button>
              </div>
            </form>

            {aiLoading && (
              <div className="mt-6 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center min-h-[140px]">
                <RefreshCw className="w-8 h-8 text-slate-900 animate-spin mb-4" />
                <div className="text-center flex flex-col gap-1 max-w-md">
                  {aiMessages.map((msg, idx) => (
                    <p key={idx} className={`text-xs ${idx === aiMessages.length - 1 ? 'text-slate-900 font-bold scale-103 animate-pulse' : 'text-slate-400'}`}>
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Cards list summary */}
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-5 h-5 text-slate-500" />
            <span>Thống kê danh sách thẻ Flashcard</span>
          </h3>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-xl">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
              <span>Đang kết nối kho dữ liệu thẻ...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-xl text-center shadow-xs">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">Chưa có Flashcard nào</h4>
              <p className="text-xs text-slate-500 mt-1.5">Hãy chọn nhập thủ công hoặc dùng siêu AI của bách khoa để viết thẻ tức thì nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map(card => {
                const isDue = new Date(card.nextReview) <= now;
                return (
                  <div
                    key={card._id}
                    className="bg-white border border-slate-200 hover:border-[#CC0000]/60 p-5 rounded-xl transition-all shadow-sm hover:shadow-md flex justify-between gap-4"
                  >
                    <div className="flex-grow flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        {isDue ? (
                          <span className="text-[10px] bg-red-50 text-[#CC0000] border border-red-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                            🔥 Quá hạn ôn
                          </span>
                        ) : (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Đã ghi nhớ
                          </span>
                        )}

                        <span className="text-[9px] text-slate-400 font-mono">
                          SM Factor: {card.efactor} • Reps: {card.repetition}
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mặt câu hỏi:</p>
                        <p className="text-sm font-bold text-slate-850 mt-1 line-clamp-2">{card.question}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đáp án tóm gọn:</p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{card.answer}</p>
                      </div>

                      <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 flex items-center gap-1 mt-auto">
                        <span>Lịch ôn lần sau:</span>
                        <strong className="text-slate-750">
                          {new Date(card.nextReview).toLocaleDateString('vi-VN')} - {new Date(card.nextReview).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-l border-slate-100 pl-3 shrink-0 justify-center">
                      <button
                        onClick={() => {
                          setIsEditingCard(card);
                          setQuestion(card.question);
                          setAnswer(card.answer);
                          setShowCardForm(true);
                          setShowAiForm(false);
                          // scroll to form
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="p-1 px-1.5 text-slate-400 hover:text-[#CC0000] hover:bg-slate-100 rounded transition-all"
                        title="Sửa thẻ ghi nhớ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card._id)}
                        className="p-1 px-1.5 text-slate-400 hover:text-[#CC0000] hover:bg-red-50 rounded transition-all"
                        title="Xóa thẻ ghi nhớ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

    </div>
  );
}
