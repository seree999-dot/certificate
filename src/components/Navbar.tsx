import React from 'react';
import { Award, Palette, BarChart3, ShieldCheck, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'claim' | 'designer' | 'analytics' | 'admin';
  setActiveTab: (tab: 'claim' | 'designer' | 'analytics' | 'admin') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  isAdminUnlocked: boolean;
  connectedSheetId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  isAdminUnlocked,
  connectedSheetId,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('claim')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-kanit">
                  Certi<span className="text-amber-600">Flow</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                  Auto-Cert
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบตรวจสอบรายชื่อและออกเกียรติบัตรส่งอีเมลอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('claim')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'claim'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>รับเกียรติบัตร</span>
            </button>

            <button
              onClick={() => setActiveTab('designer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'designer'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>ปรับแต่งเทมเพลต</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-amber-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สถิติ & รายงาน</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ระบบแอดมิน</span>
              {isAdminUnlocked && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
          </nav>

          {/* User Auth & Workspace Indicator */}
          <div className="flex items-center gap-2.5">
            {connectedSheetId ? (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>เชื่อมต่อชีตแล้ว</span>
              </span>
            ) : (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>โหมดข้อมูลระบบ</span>
              </span>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 text-left">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block leading-tight">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                      {user.displayName || 'Google Account'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="ลงชื่อออก"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs py-1.5 px-3 h-9"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-medium">
                  {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/70">
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex flex-col items-center gap-0.5 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'claim' ? 'text-amber-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>รับเกียรติบัตร</span>
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex flex-col items-center gap-0.5 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'designer' ? 'text-amber-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span>เทมเพลต</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-0.5 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'analytics' ? 'text-amber-600 font-bold' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>สถิติ</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-0.5 text-xs py-1 px-2.5 rounded-lg ${
              activeTab === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>แอดมิน</span>
          </button>
        </div>

      </div>
    </header>
  );
};
