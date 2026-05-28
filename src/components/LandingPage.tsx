import React, { useState } from 'react';
import { BookOpen, UserPlus, LogIn, GraduationCap, Layout, BrainCircuit, Activity } from 'lucide-react';

interface LandingPageProps {
  onAuthSuccess: (token: string, user: { id: string; email: string; name: string }) => void;
}

export default function LandingPage({ onAuthSuccess }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="landing-container" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header id="landing-header" className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div id="brand-logo" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#CC0000] rounded flex items-center justify-center font-black text-white text-lg">H</div>
          <span id="logo-text" className="font-sans font-bold text-xl tracking-tight text-slate-900">
            hust<span className="text-[#CC0000]">memo</span>
          </span>
        </div>
        <div id="nav-badge" className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          SM-2 Repetition Engine Active
        </div>
      </header>

      {/* Main Container */}
      <main id="landing-main" className="max-w-6xl mx-auto w-full px-8 py-12 flex-grow grid md:grid-cols-2 gap-12 items-center">
        {/* Left Hand: Explanatory Content */}
        <div id="landing-promo-col" className="flex flex-col gap-6 md:pr-4">
          <div id="promo-subtitle" className="inline-flex max-w-fit px-3 py-1 bg-[#fff5f5] border border-red-200 text-[#CC0000] rounded text-xs font-bold uppercase tracking-wider">
            Hệ thống ôn luyện tối ưu
          </div>
          <h1 id="promo-title" className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Ghi nhớ <span className="text-[#CC0000] relative">dài hạn</span> kiến thức học tập khoa học.
          </h1>
          <p id="promo-description" className="text-slate-600 text-base leading-relaxed">
            HustMemo là nền tảng tối ưu hóa học tập, áp dụng <strong className="text-slate-900 font-bold">Thuật toán lặp lại ngắt quãng (SM-2 Spec)</strong> để tự động tính thời gian ôn bài. Biến kiến thức ngắn hạn của bạn thành trí nhớ dài hạn bền vững.
          </p>

          {/* Feature Grid */}
          <div id="feature-grid" className="grid grid-cols-2 gap-4 pt-2">
            <div id="feature-card-1" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-slate-800 shrink-0">
                <BrainCircuit className="w-5 h-5 text-[#CC0000]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Thuật toán SM-2</h4>
                <p className="text-xs text-slate-500 mt-1">Tự tính ngày học tiếp theo theo độ nhớ</p>
              </div>
            </div>

            <div id="feature-card-2" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-slate-800 shrink-0">
                <Activity className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Chạy ngầm Cron</h4>
                <p className="text-xs text-slate-500 mt-1">Tự động báo cáo rảnh tay</p>
              </div>
            </div>

            <div id="feature-card-3" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 col-span-2">
              <div className="bg-slate-900 p-2.5 rounded text-[#CC0000] shrink-0">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Được hỗ trợ bởi AI Google Gemini</h4>
                <p className="text-xs text-slate-400 mt-1">Gõ chủ đề khoa bách khoa, AI tự động biên tập 5 thẻ Flashcard thông minh tức thì!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Interactive Login/SignUp Panel */}
        <div id="auth-panel-wrapper" className="flex justify-center">
          <div id="auth-card" className="bg-white p-8 rounded-xl border border-slate-200 shadow-md w-full max-w-md">
            <div id="auth-toggle-header" className="flex border-b border-slate-100 mb-6">
              <button
                id="btn-toggle-login"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 pb-3 text-center font-bold text-sm transition-colors cursor-pointer ${
                  isLogin ? 'border-b-2 border-[#CC0000] text-[#CC0000]' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Đăng nhập
              </button>
              <button
                id="btn-toggle-signup"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 pb-3 text-center font-bold text-sm transition-colors cursor-pointer ${
                  !isLogin ? 'border-b-2 border-[#CC0000] text-[#CC0000]' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Đăng ký tài khoản
              </button>
            </div>

            {error && (
              <div id="auth-error-alert" className="mb-4 p-3 bg-red-50 border-l-4 border-[#CC0000] text-[#CC0000] text-xs font-semibold rounded-r">
                {error}
              </div>
            )}

            <form id="auth-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <div id="form-group-name" className="flex flex-col gap-1.5">
                  <label htmlFor="fullname" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Họ và tên</label>
                  <input
                    id="fullname"
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-800"
                  />
                </div>
              )}

              <div id="form-group-email" className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email sinh viên</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@student.hust.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-800"
                />
              </div>

              <div id="form-group-password" className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Mật khẩu</label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC0000] focus:border-[#CC0000] bg-white text-slate-800"
                />
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang kết nối...</span>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Vào Hệ thống</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Đăng Ký Toàn Diện</span>
                  </>
                )}
              </button>
            </form>

            <div id="demo-guide" className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
              * Bảo mật chuẩn hóa an toàn ở cổng máy bách khoa.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="bg-slate-900 text-slate-400 px-8 py-6 text-center text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 <strong>HustMemo</strong>. Xây dựng cho chuyên đề Học tập thông minh bách khoa.
          </div>
          <div className="flex gap-4">
            <span className="text-slate-300 font-bold">Thuật toán SM-2</span>
            <span>•</span>
            <span>Cron Job Realtime System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
