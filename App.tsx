
import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { ReportSection } from './components/ReportSection';

/**
 * 메인 애플리케이션 컴포넌트 (Main Application Component)
 * 
 * 전체 애플리케이션의 레이아웃과 주요 섹션을 구성합니다.
 * 반응형 디자인을 적용하여 데스크탑과 모바일 환경 모두를 지원합니다.
 * 
 * 주요 구성 요소:
 * 1. 헤더 (Header): 로고, 제목, 리포트/문의 버튼
 * 2. 메인 컨텐츠 (Main Content):
 *    - 좌측: 입력 패널 (InputSection) - 설계 변수 입력
 *    - 우측: 결과 대시보드 (ResultSection) - 실시간 분석 결과
 * 3. 모바일 네비게이션 (Mobile Nav): 탭 전환 (입력 <-> 결과)
 * 4. 모달 (Modals): 리포트 미리보기, 문의하기
 */
const App: React.FC = () => {
   // --- 상태 관리 (State Management) ---
   const [isContactOpen, setIsContactOpen] = useState(false); // 문의하기 모달 상태
   const [isReportOpen, setIsReportOpen] = useState(false);   // 리포트 모달 상태

   // 모바일 화면에서의 활성 탭 상태 ('input' 또는 'result')
   const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'result'>('input');

   return (
      <div className="flex flex-col min-h-screen pb-16 lg:pb-0">

         {/* --- 헤더 섹션 (Header Section) --- */}
         <header className="bg-slate-900/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-white/10">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-32 flex items-center justify-between">
               {/* 로고 및 타이틀 */}
               <div className="flex items-center space-x-6 group cursor-pointer">
                  <div className="transition-transform group-hover:scale-105 duration-300">
                     <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-bold tracking-tight text-white">
                        Solar Array Architect
                     </h1>
                     <p className="text-sm text-slate-400 font-medium tracking-wider uppercase">Professional PV Design Solution</p>
                  </div>
               </div>

               {/* 우측 상단 액션 버튼 그룹 */}
               <div className="flex items-center gap-3">
                  <button
                     onClick={() => setIsReportOpen(true)}
                     className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
                  >
                     <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <span className="hidden sm:inline">리포트</span>
                  </button>

                  <button
                     onClick={() => setIsContactOpen(true)}
                     className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                     <span className="hidden sm:inline">문의하기</span>
                  </button>
               </div>
            </div>
         </header>

         {/* --- 메인 컨텐츠 영역 (Main Content Area) --- */}
         <main className="flex-grow max-w-[1920px] w-full mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6">

            {/* 좌측: 입력 패널 (Input Panel) */}
            {/* 데스크탑에서는 항상 보이고, 모바일에서는 'input' 탭일 때만 보임 */}
            <section className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex-col gap-6 ${activeMobileTab === 'input' ? 'flex' : 'hidden lg:flex'}`}>
               <div className="glass-panel p-6 h-full overflow-y-auto custom-scrollbar">
                  <InputSection />
               </div>
            </section>

            {/* 우측: 결과 대시보드 (Result Dashboard) */}
            {/* 데스크탑에서는 항상 보이고, 모바일에서는 'result' 탭일 때만 보임 */}
            <section className={`flex-grow flex-col gap-6 min-w-0 ${activeMobileTab === 'result' ? 'flex' : 'hidden lg:flex'}`}>
               <div className="glass-panel p-6 h-full">
                  <ResultSection />
               </div>
            </section>

         </main>

         {/* --- 모바일 하단 네비게이션 (Mobile Bottom Navigation) --- */}
         <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
               onClick={() => setActiveMobileTab('input')}
               className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeMobileTab === 'input' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
               </svg>
               <span className="text-[10px] font-bold uppercase tracking-wide">설계 입력</span>
            </button>
            <div className="w-px h-8 bg-slate-200"></div>
            <button
               onClick={() => setActiveMobileTab('result')}
               className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeMobileTab === 'result' ? 'text-secondary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
               <span className="text-[10px] font-bold uppercase tracking-wide">분석 결과</span>
            </button>
         </div>

         {/* --- 모달 컴포넌트 (Modals) --- */}

         {/* 문의하기 모달 */}
         {isContactOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" onClick={() => setIsContactOpen(false)}>
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all border border-white/20" onClick={e => e.stopPropagation()}>
                  <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                     <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Contact Us</h3>
                     <p className="text-slate-300 text-sm relative z-10">태양광 발전 사업의 든든한 파트너</p>
                     <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     {/* Contact Items */}
                     <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-accent/30 hover:bg-accent/5 transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-accent mr-4 group-hover:scale-110 transition-transform shadow-sm">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div>
                           <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Company</p>
                           <p className="text-slate-800 font-bold text-lg">주식회사 댈리온</p>
                        </div>
                     </div>

                     <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-secondary/30 hover:bg-secondary/5 transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-secondary mr-4 group-hover:scale-110 transition-transform shadow-sm">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                           <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Email</p>
                           <p className="text-slate-800 font-bold text-lg">cso@delion.kr</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                     <button
                        onClick={() => setIsContactOpen(false)}
                        className="w-full btn-primary py-3.5 text-base shadow-lg"
                     >
                        닫기
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* 리포트 모달 */}
         {isReportOpen && (
            <ReportSection onClose={() => setIsReportOpen(false)} />
         )}

      </div>
   );
};

export default App;
