/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { generateDates, ReservationData } from './lib/dateUtils';
import VisitorForm from './components/VisitorForm';
import VisitorList, { VisitorEntry } from './components/VisitorList';
import PrintTable from './components/PrintTable';
import { sendToGoogleSheets } from './services/apiService';
import { ShieldCheck, Plus, ListFilter, LayoutDashboard, Search, Settings, ExternalLink, X, CheckCircle, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday } from 'date-fns';

export default function App() {
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzFkOIpl6JGXf0BsQvgIsb4K40Dpyi2Hx70CkPm2L21wF3Dthktp6vejAZRQaHiVWhP2Q/exec';
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [view, setView] = useState<'dashboard' | 'register'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('school_visitor_entries');
    const savedUrl = localStorage.getItem('google_sheets_api_url');
    
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error('Failed to load entries', e);
      }
    }
    
    // Prioritize saved URL, otherwise use default
    if (savedUrl) {
      setApiUrl(savedUrl);
    } else {
      setApiUrl(DEFAULT_API_URL);
    }
  }, []);

  const handleOpenSettings = () => {
    setIsPasswordModalOpen(true);
    setPasswordInput('');
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === '1004') {
      setIsSettingsOpen(true);
      setIsPasswordModalOpen(false);
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // Save entries to local storage
  useEffect(() => {
    localStorage.setItem('school_visitor_entries', JSON.stringify(entries));
  }, [entries]);

  // Save API URL to local storage
  const handleSaveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('google_sheets_api_url', url);
    setIsSettingsOpen(false);
  };

  const handleResetApp = () => {
    if (window.confirm('모든 설정과 예약 내역을 초기화하시겠습니까? 구글 시트의 원본 데이터는 삭제되지 않습니다.')) {
      setEntries([]);
      setApiUrl('');
      localStorage.removeItem('school_visitor_entries');
      localStorage.removeItem('google_sheets_api_url');
      setIsSettingsOpen(false);
      alert('초기화가 완료되었습니다.');
    }
  };

  const handleRegister = async (data: ReservationData[]) => {
    const source = { ...data[0] };
    const targetDates = generateDates(source);

    if (targetDates.length === 0) {
      alert('등록할 날짜가 없습니다. 요일을 확인해주세요.');
      return;
    }

    const newEntries: VisitorEntry[] = targetDates.map(date => ({
      id: `V-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      time: source.visitTime,
      teacherName: source.teacherName,
      visitorName: source.visitorName,
      visitorOrg: source.visitorOrg,
      reason: source.reason,
      hasVehicle: source.hasVehicle,
      carNumber: source.carNumber,
      remarks: source.remarks,
    }));

    // 1. Update local state IMMEDIATELY (Dashboard won't be 0)
    setEntries(prev => [...prev, ...newEntries]);
    setView('dashboard');
    
    // 2. Sync to Google Sheets in background
    if (apiUrl) {
      setIsSyncing(true);
      try {
        await sendToGoogleSheets(apiUrl, newEntries);
      } catch (error) {
        console.error('Background sync failed', error);
        // We still keep the entries locally
      } finally {
        setIsSyncing(false);
      }
    }
    
    alert('방문자 예약이 완료되었습니다!');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // Small delay to ensure any UI transitions are complete and focus is solid
      setTimeout(() => {
        window.focus();
        window.print();
      }, 300);
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayCount = entries.filter(e => e.date === todayStr).length;
  const filteredEntries = entries.filter(e => 
    e.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.carNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar / Desktop Rail */}
      <aside className="fixed left-0 top-0 h-screen w-20 hidden lg:flex flex-col items-center py-8 bg-slate-900 text-white z-20 print:hidden">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView('register')}
            className={`p-3 rounded-xl transition-all ${view === 'register' ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </nav>

        <button 
          onClick={handleOpenSettings}
          className="mt-auto p-3 text-slate-400 hover:text-white transition-all"
        >
          <Settings className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-20 min-h-screen pb-20 print:p-0">
        <header className="sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md border-b border-slate-200 z-10 print:hidden">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-end justify-between pb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">[똑똑 인비고] 교직원용 방문객 예약 관리</h1>
                <p className="text-slate-500 text-sm italic">Smart Visitor Registration System for INBIGO</p>
              </div>
              {apiUrl && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-bold text-[10px] uppercase tracking-widest h-fit mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Synced
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">오늘의 날짜</div>
                <div className="text-lg font-mono font-bold text-blue-600">{format(new Date(), 'yyyy.MM.dd (E)')}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-6 py-8 print:hidden">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Form Column - Bento style */}
                <div className="md:col-span-4 space-y-6">
                  <div className="bento-card h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                      <h2 className="font-bold text-lg">간편 방문 등록</h2>
                    </div>
                    <VisitorForm onSuccess={handleRegister} />
                    {isSyncing && (
                      <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                          <p className="font-bold text-slate-800">구글 시트로 데이터를 전송 중입니다...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* List & Info Column */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  {/* List Card */}
                  <div className="bento-card flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                          <h2 className="font-bold text-lg">오늘의 방문자 명단</h2>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative hidden xl:block">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="검색..."
                              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    <VisitorList entries={filteredEntries} onPrint={handlePrint} />
                  </div>

                  {/* Bottom Row Bento Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1A1C1E] rounded-2xl border border-slate-800 p-6 text-white flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Print Optimization</div>
                        <h3 className="text-lg font-bold">A4 인쇄 자동화 안내</h3>
                      </div>
                      <div className="text-sm text-slate-400 leading-relaxed">
                        상단의 'PDF 인쇄' 버튼을 누르면 오늘의 방문자 명단이 A4 용지 규격에 맞춰 깔끔하게 출력됩니다. 수위실 비치용으로 활용하세요.
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        <Printer className="w-3 h-3" />
                        인쇄 기능 활성화됨
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Database Status</div>
                        <h3 className="text-lg font-bold text-indigo-900">구글 시트 연동 현황</h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <div className="text-[10px] text-indigo-400 font-bold uppercase">오늘 신청건수</div>
                          <div className="text-3xl font-black text-indigo-700">{todayCount}건</div>
                        </div>
                        <div className="flex-1 border-l border-indigo-200 pl-6">
                          <div className="text-[10px] text-indigo-400 font-bold uppercase">연동 주소 설정</div>
                          <button 
                            onClick={handleOpenSettings}
                            className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${apiUrl ? 'text-emerald-600' : 'text-blue-600 underline'}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {apiUrl ? '상태: 연결됨' : '주소 입력하기'}
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-indigo-400 italic">복사한 '웹 앱 URL'을 설정 버튼을 눌러 입력하세요.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Register-only view for mobile or focused mode */
              <motion.div
                key="register"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                 <div className="bento-card">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                       <h2 className="font-bold text-xl">신규 방문 예약 등록</h2>
                    </div>
                    <button 
                      onClick={() => setView('dashboard')}
                      className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                    >
                      목록으로 돌아가기
                    </button>
                  </div>
                  <VisitorForm onSuccess={handleRegister} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    구글 시트 연동 설정
                  </h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">배포한 웹 앱 URL (복사한 주소)</label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all font-mono text-sm"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50 p-6 rounded-2xl space-y-3">
                    <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      연동 확인 체크리스트
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-2 leading-relaxed">
                      <li>• 스크립트 배포 시 <b>'액세스 권한'</b>을 <b>'모든 사용자(Anyone)'</b>로 하셨나요?</li>
                      <li>• 구글 시트의 첫 번째 시트 이름이 <b>'방문예약'</b>인가요?</li>
                      <li>• 헤더가 앱 가이드(11개)와 일치하게 작성되었나요?</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleResetApp}
                      className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-all"
                    >
                      초기화
                    </button>
                    <button
                      onClick={() => handleSaveApiUrl(apiUrl)}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                      설정 저장
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Password Modal */}
        <AnimatePresence>
          {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-8 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">관리자 인증</h3>
                  <p className="text-xs text-slate-400">설정 메뉴 접속을 위해 비밀번호를 입력하세요.</p>
                </div>
                
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center font-bold tracking-widest"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Print Area Specific Component */}
      </main>

      <PrintTable entries={entries.filter(e => e.date === format(new Date(), 'yyyy-MM-dd'))} />

      {/* Desktop Version/Copyright Footer */}
      <footer className="hidden lg:flex fixed bottom-4 right-6 text-[11px] text-slate-400 font-mono flex-col items-end pointer-events-none print:hidden">
        <div>v1.0.0</div>
        <div>© 2026 INBIGO. All Rights Reserved.</div>
      </footer>

      {/* Mobile Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-6 lg:hidden z-20 print:hidden">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button 
          onClick={() => setView('register')}
          className={`w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center -translate-y-4 shadow-lg shadow-slate-200 ${view === 'register' ? 'bg-blue-600 ring-4 ring-white' : ''}`}
        >
          <Plus className="w-6 h-6" />
        </button>
        <button 
          onClick={handleOpenSettings}
          className="text-slate-400"
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </footer>
    </div>
  );
}
