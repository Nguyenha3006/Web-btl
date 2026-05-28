import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle, RefreshCw, Sparkles, HelpCircle, 
  ChevronRight, Smile, Meh, Frown, Award, GraduationCap 
} from 'lucide-react';
import { Card } from '../types';

interface StudySessionProps {
  token: string;
  cards: Card[];
  onBack: () => void;
}

export default function StudySession({ token, cards, onBack }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionResults, setSessionResults] = useState<Array<{ question: string; answer: string; rating: string; nextReview: string }>>([]);
  const [finished, setFinished] = useState(false);

  // If session is empty
  if (cards.length === 0) {
    return (
      <div id="session-empty" className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border p-8 rounded-2xl max-w-sm card-shadow">
          <HelpCircle className="w-12 h-12 text-[#95a5a6] mx-auto mb-4" />
          <h3 className="font-bold text-lg text-[#1a252f]">Chưa đến hạn ôn tập!</h3>
          <p className="text-xs text-[#7f8c8d] mt-2">Tuyệt vời! Toàn bộ các thẻ ghi nhớ của bạn trong bộ thẻ này đã ở trạng thái tối ưu và đã được ghi nhớ thành công.</p>
          <button
            onClick={onBack}
            className="mt-6 w-full bg-[#4a90e2] hover:bg-[#357abd] text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Quay lại bộ thẻ
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleGrade = async (quality: 'easy' | 'medium' | 'hard') => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/decks/cards/${currentCard._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quality })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể ghi nhận đánh giá.');

      // Record result
      setSessionResults(prev => [
        ...prev,
        {
          question: currentCard.question,
          answer: currentCard.answer,
          rating: quality === 'easy' ? 'Dễ' : quality === 'medium' ? 'Trung bình' : 'Khó',
          nextReview: data.card?.nextReview || new Date().toISOString()
        }
      ]);

      // Move to next card or finish
      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        // Timeout to allow flip transition back
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSubmitting(false);
        }, 150);
      } else {
        setFinished(true);
        setSubmitting(false);
      }

    } catch (err: any) {
      alert(err.message || 'Lỗi gửi đánh giá.');
      setSubmitting(false);
    }
  };

  return (
    <div id="session-container" className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Navbar header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#CC0000] font-bold cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát ôn tập</span>
        </button>

        <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
          <GraduationCap className="w-5 h-5 text-[#CC0000]" />
          <span>Phiên học thông minh SM-2</span>
        </span>

        {/* Floating progress counter */}
        <div className="text-xs bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1 rounded font-bold">
          {finished ? 'Đã hoàn tất' : `Tiến trình: ${currentIndex + 1} / ${cards.length}`}
        </div>
      </header>

      {/* Main session area */}
      <main className="max-w-3xl mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center">
        
        {!finished ? (
          <div className="flex flex-col gap-6 w-full max-w-xl mx-auto items-center">
            
            {/* Perspective card box */}
            <div 
              onClick={() => setIsFlipped(prev => !prev)}
              className="w-full aspect-[16/10] min-h-[240px] cursor-pointer group [perspective:1000px]"
            >
              <div 
                className={`relative w-full h-full rounded-xl border border-slate-200 shadow-md transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* FRONT SIDE */}
                <div className="absolute inset-0 bg-white rounded-xl p-6 flex flex-col justify-between [backface-visibility:hidden]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">HUSTMEMO - MẶT ĐỀ BÀI</span>
                    <span className="text-xs text-slate-800 font-bold">Chạm để lật thẻ</span>
                  </div>

                  <div className="flex-grow flex items-center justify-center text-center px-4">
                    <h3 className="text-lg md:text-xl font-black text-slate-800 leading-relaxed font-sans">
                      {currentCard.question}
                    </h3>
                  </div>

                  <div className="text-center text-[10px] text-slate-400">
                    Nhập/nhấn bất kỳ điểm nào trên thẻ để lật đáp án
                  </div>
                </div>

                {/* BACK SIDE */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl p-6 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] border-t-4 border-[#CC0000]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#CC0000] tracking-wider">HUSTMEMO - MẶT ĐÁP ÁN</span>
                    <span className="text-xs text-green-700 font-bold">Đã giải nghĩa đúng</span>
                  </div>

                  <div className="flex-grow flex items-center justify-center text-center px-4 overflow-y-auto">
                    <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed font-sans">
                      {currentCard.answer}
                    </p>
                  </div>

                  <div className="text-center text-[10px] text-slate-400">
                    Đối chiếu với đáp án chuẩn trong trí nhớ
                  </div>
                </div>

              </div>
            </div>

            {/* Hint message */}
            {!isFlipped ? (
              <p className="text-xs text-slate-400 animate-pulse font-medium">
                Hãy ôn lại câu trả lời trong đầu rồi lật thẻ mặt sau nhé!
              </p>
            ) : (
              <div className="w-full flex flex-col gap-3 animate-fade-in">
                <p className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bạn ghi nhớ tấm thẻ này ở mức độ nào?
                </p>

                {/* SM-2 evaluation system choices */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleGrade('hard')}
                    disabled={submitting}
                    className="bg-white hover:bg-red-50/50 border border-slate-200 hover:border-[#CC0000] p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 group disabled:opacity-50"
                  >
                    <div className="bg-red-50 text-[#CC0000] p-2 rounded">
                      <Frown className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-700 group-hover:text-[#CC0000]">Khó</span>
                    <span className="text-[9px] text-slate-400 block text-center">Ôn lại sớm</span>
                  </button>

                  <button
                    onClick={() => handleGrade('medium')}
                    disabled={submitting}
                    className="bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-500 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 group disabled:opacity-50"
                  >
                    <div className="bg-amber-50 text-amber-600 p-2 rounded">
                      <Meh className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-700 group-hover:text-amber-600">Trung bình</span>
                    <span className="text-[9px] text-slate-400 block text-center">Gần chính xác</span>
                  </button>

                  <button
                    onClick={() => handleGrade('easy')}
                    disabled={submitting}
                    className="bg-white hover:bg-green-50/50 border border-slate-200 hover:border-green-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 group disabled:opacity-50"
                  >
                    <div className="bg-green-50 text-green-600 p-2 rounded">
                      <Smile className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-slate-700 group-hover:text-green-600">Dễ</span>
                    <span className="text-[9px] text-slate-400 block text-center">Nhớ rất nhanh</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          
          /* Compilation Finish Summary */
          <div className="bg-white border border-slate-200 p-8 rounded-xl max-w-xl mx-auto shadow-sm animate-slide-up text-center flex flex-col items-center text-slate-900">
            <div className="bg-green-50 text-green-600 border border-green-200 p-4 rounded-full mb-4">
              <Award className="w-12 h-12" />
            </div>

            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Xuất Sắc! Hoàn Thành Phiên Ôn Tập 🎉</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Hệ thống đã cập nhật chu kỳ ôn tập Spaced Repetition thành công của toàn bộ thẻ học.</p>

            {/* Recap Table logic */}
            <div className="w-full mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden text-left max-h-60 overflow-y-auto high-density-scroll shadow-inner">
              <div className="bg-slate-50 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 grid grid-cols-3">
                <span className="col-span-2">Thẻ đã học</span>
                <span className="text-right">Đánh giá</span>
              </div>
              
              {sessionResults.map((res, index) => (
                <div key={index} className="p-3 border-b border-slate-100 text-xs grid grid-cols-3 hover:bg-slate-50 animate-fade-in">
                  <div className="col-span-2 pr-2">
                    <p className="font-bold text-slate-800 line-clamp-1">{res.question}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Đáp án: {res.answer}</p>
                  </div>
                  <span className={`text-right font-bold flex items-center justify-end text-[11px] ${
                    res.rating === 'Dễ' ? 'text-green-600' : res.rating === 'Trung bình' ? 'text-amber-600' : 'text-[#CC0000]'
                  }`}>
                    {res.rating}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onBack}
              className="mt-6 bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 px-6 rounded text-xs tracking-wider cursor-pointer transition-all w-full md:w-auto"
            >
              Quay lại danh mục học tập
            </button>
          </div>
        )}

      </main>

      {/* Footer system badges */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-[10px] text-slate-450 font-medium">
        HustMemo • Hệ thống Spaced Repetition thông minh hỗ trợ bởi thuật toán SM-2 chuẩn hóa của bách khoa.
      </footer>
    </div>
  );
}
