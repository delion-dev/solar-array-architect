
import React, { useState } from 'react';

export interface DocItem {
  name: string;
  note?: string;
}

export interface ProcessStep {
  id: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  duration: string; // 소요 기간
  details: string[]; // 주요 업무 내용
  documents?: DocItem[]; // 필요 서류 목록
}

// 아이콘 컴포넌트들
const IconSearch = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconLicense = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconContract = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const IconBolt = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconConstruction = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCivilCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const IconRPS = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

// CSV 및 RECloud 자료 기반 프로세스 데이터 정의
export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step1',
    phase: '준비',
    title: '입지 선정 및 타당성 검토',
    description: '사업 부지의 일사량, 계통 연계 용량, 법적 규제 사항을 분석하여 사업성을 판단합니다.',
    icon: <IconSearch />,
    color: 'bg-blue-500',
    duration: '1-2주',
    details: [
      '일사량 및 지리적 여건 분석',
      '한전 계통 연계 용량 확인 (선로 여유분)',
      '개발행위 허가 가능 여부 검토 (지자체 조례)',
      '경제성(수익성) 시뮬레이션',
      '실시설계 진행 (허가용 도면 작성)',
      '발전사업/개발행위 허가 준비',
      '재생에너지 금융지원 사업 신청 및 공사계획 신고 준비',
      'EPC 공사계약을 위한 과업 지시 내용 확정'
    ]
  },
  {
    id: 'step2',
    phase: '허가 1',
    title: '발전사업 허가',
    description: '지자체(3MW 미만) 또는 산업부(3MW 이상)에 전기사업(발전사업) 허가를 신청합니다. (처리기간: 약 60일)',
    icon: <IconLicense />,
    color: 'bg-indigo-500',
    duration: '약 60일',
    details: [
      '사업 허가 신청서 작성 및 접수',
      '사업 계획 설명회 (필요 시)',
      '지자체 심의 및 허가증 발급'
    ],
    documents: [
      { name: '발전사업 허가 신청서' },
      { name: '사업계획서', note: '소요자금, 운영계획, 공사비 명세 포함' },
      { name: '송전관계 일람도 및 발전원가 명세서' },
      { name: '토지대장, 등기부등본, 지적도' },
      { name: '토지 사용 승낙서', note: '임대 사업 시 필수 (인감 첨부)' },
      { name: '자금 증빙 서류', note: '잔고증명서(총사업비의 10~20%) 또는 대출의향서' },
      { name: '설계 도서', note: '배치도, 모듈/인버터 사양서 등' }
    ]
  },
  {
    id: 'step3',
    phase: '허가 2',
    title: '개발행위 허가',
    description: '토지의 형질 변경 및 공작물 설치에 대한 허가를 득합니다. 가장 까다롭고 중요한 절차입니다.',
    icon: <IconLicense />,
    color: 'bg-indigo-600',
    duration: '3-4개월',
    details: [
      '토목/건축 설계 도서 작성',
      '소규모 환경영향평가 (면적에 따라)',
      '재해위험성 검토',
      '주민 수용성 확보 (민원 대응)'
    ],
    documents: [
      { name: '개발행위허가 신청서' },
      { name: '토목 설계 도서', note: '평면도, 종단면도, 구조물 계획도, 구적도 등' },
      { name: '피해방지 계획서', note: '토사 유출, 소음 등 환경 오염 방지 대책' },
      { name: '소규모 환경영향평가서', note: '대상 면적 해당 시' },
      { name: '예산 내역서', note: '토목 공사비 산출 근거' }
    ]
  },
  {
    id: 'step3_5',
    phase: '금융/계약',
    title: '자금 조달 및 공사 계약',
    description: '허가증을 기반으로 금융기관 PF(Project Financing) 대출을 일으키고 시공사(EPC)와 계약을 체결합니다.',
    icon: <IconContract />,
    color: 'bg-violet-600',
    duration: '1-2개월',
    details: [
      '금융기관 대출 신청 및 심사 (PF)',
      'EPC (설계·조달·시공) 계약 체결',
      '주요 기자재(모듈/인버터) 공급 계약',
      '서울보증보험 등 보증서 발급'
    ],
    documents: [
      { name: '발전사업 허가증 및 개발행위 허가증' },
      { name: 'EPC 공사 도급 계약서' },
      { name: '대출 신청서 및 사업 수지 분석표' },
      { name: '금융 자문 및 주선 약정서' }
    ]
  },
  {
    id: 'step4',
    phase: '착공 1',
    title: '공사계획 신고',
    description: '구체적인 시공 계획, 공사 기간, 감리 배치 현황을 인허가 관청에 신고하여 수리받습니다.',
    icon: <IconLicense />,
    color: 'bg-purple-500',
    duration: '약 14일',
    details: [
      '실시설계 및 구조안전검토 완료',
      '공사계획 신고 (지자체/산업부)',
      '감리원 배치 신고 (전력기술관리법)',
      '전기안전관리자 선임 신고'
    ],
    documents: [
      { name: '공사계획 신고서' },
      { name: '공사 계획서 및 공정표' },
      { name: '감리원 배치 확인서', note: '전력기술관리법 제12조 준수' },
      { name: '전기안전관리자 선임 신고서', note: '자체 또는 대행' },
      { name: '기술 시방서 및 상세 설계 도면', note: '단선결선도, 구조계산서, 시방서' },
      { name: '주요 기자재 시험성적서 및 인증서' }
    ]
  },
  {
    id: 'step4_2',
    phase: '착공 2',
    title: 'PPA 신청 및 계통연계',
    description: '한전(KEPCO)과 전력수급계약(PPA)을 맺고 송·배전 설비 이용을 신청하는 단계입니다.',
    icon: <IconBolt />,
    color: 'bg-purple-600',
    duration: '약 1개월',
    details: [
      '계통연계 용량 사전 점검 (154kV/22.9kV D.L 여유 확인)',
      '송·배전용 전기설비 이용신청 (신규/증설)',
      '전력수급계약(PPA) 신청서 접수',
      '기술 검토 및 표준시설부담금(한전 불입금) 납부'
    ],
    documents: [
      { name: '송·배전용 전기설비 이용신청서', note: '한전 양식' },
      { name: '전력수급계약 신청서 (PPA)' },
      { name: '발전사업 허가증 사본' },
      { name: '내선설계도면', note: '전력기술인 날인된 단선결선도' },
      { name: '사업자등록증 및 입금계좌 사본' }
    ]
  },
  {
    id: 'step5',
    phase: '시공',
    title: '설치 시공 (Construction)',
    description: '토목, 구조물, 전기 공사를 순차적으로 진행하며 한전 연계 공사도 병행됩니다.',
    icon: <IconConstruction />,
    color: 'bg-amber-500',
    duration: '2-3개월',
    details: [
      '토목 공사: 기초, 배수로, 바닥 정비',
      '구조물 설치: 포스맥(PosMAC) 지지대 조립',
      '전기 공사: 모듈 부착, 배선, 인버터/수배전반 설치',
      '한전 계통 연계 공사 (외선 소요 공사)'
    ]
  },
  {
    id: 'step5_5',
    phase: '준공검사',
    title: '개발행위 준공 검사',
    description: '토목 및 구조물 공사가 개발행위 허가 내용대로 완료되었는지 지자체의 확인을 받습니다.',
    icon: <IconCivilCheck />,
    color: 'bg-teal-500',
    duration: '약 14일',
    details: [
      '준공 측량 (지적 공사)',
      '준공 검사 신청서 제출 (지자체)',
      '현장 실사 (토목/건축 담당 공무원)',
      '준공 필증 수령'
    ],
    documents: [
      { name: '개발행위 준공검사 신청서' },
      { name: '준공 도서', note: '설계 변경 사항이 반영된 최종 도면 및 사진' },
      { name: '지적측량 성과도', note: '부지 경계 및 구조물 위치 확인용' },
      { name: '현장 사진 대장', note: '공사 전/중/후 비교 사진' }
    ]
  },
  {
    id: 'step6',
    phase: '사용전',
    title: '사용전 검사 (KESCO)',
    description: '한국전기안전공사(KESCO)로부터 전기 설비의 안전성을 검증받습니다. 합격 시 전력 공급이 가능해집니다.',
    icon: <IconCheck />,
    color: 'bg-emerald-500',
    duration: '약 7일',
    details: [
      '사용전 검사 신청 (희망일 7일 전)',
      '현장 검사 (절연, 접지, 보호협조 등)',
      '검사 확인증 발급 (전력수급계약 필수 서류)'
    ],
    documents: [
      { name: '사용전 검사 신청서' },
      { name: '개발행위 준공 필증 및 발전사업허가증' },
      { name: '자체 감리 기록부 및 감리 일지' },
      { name: '모듈/인버터 시험 성적서', note: '실제 설치된 시리얼 번호 리스트 필수' },
      { name: '전기안전관리자 선임 증명서' },
      { name: '준공 도면 및 사진' }
    ]
  },
  {
    id: 'step7',
    phase: '개시',
    title: '사업개시 신고',
    description: '지자체에 사업 개시를 공식적으로 신고하고 상업 운전을 시작합니다.',
    icon: <IconLicense />,
    color: 'bg-emerald-600',
    duration: '즉시',
    details: [
      '사업개시 신고서 제출 (지자체)',
      '한전 PPA 계약 체결 (상업운전 개시)',
      '사업자 등록 정정 (종목 추가 등)'
    ],
    documents: [
      { name: '사업개시 신고서' },
      { name: '전기 사용전 검사 확인증' },
      { name: '전력수급계약서 (PPA) 사본' },
      { name: '상업운전개시 확인서' },
      { name: '현장 설치 사진', note: '모듈, 인버터, 접속반, 수배전반 등' }
    ]
  },
  {
    id: 'step8',
    phase: '운영',
    title: 'RPS 설비확인 및 운영',
    description: '한국에너지공단에 설비를 등록하여 REC 발급 자격을 획득하고, 전력 거래 및 유지보수를 수행합니다.',
    icon: <IconRPS />,
    color: 'bg-green-600',
    duration: '상시',
    details: [
      'RPS 종합지원시스템 설비확인 신청 (1개월 내)',
      '설비 확인서 발급 (REC 발급 자격 획득)',
      '전력거래소 회원 가입 및 입찰 참여',
      'O&M (정기점검, 안전관리대행) 수행'
    ],
    documents: [
      { name: 'RPS 설비 확인 신청서', note: '사용전검사 후 1개월 이내 신청 필수' },
      { name: '발전사업허가증 및 사업자등록증' },
      { name: '사용전검사 확인증' },
      { name: '계약번호/고객번호 확인서', note: '한국전력공사 발급' },
      { name: '토지대장/등기부등본 및 현장 사진' },
      { name: '총 사업비 내역서', note: '세금계산서 포함' }
    ]
  }
];

export const ProcessGuideTab = () => {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setActiveStep(activeStep === id ? null : id);
  };

  const scrollToStep = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveStep(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              태양광 발전사업 절차 가이드 (Business Process)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 ml-8 max-w-3xl">
              사업 기획부터 인허가, 시공, 운영까지의 전체 프로세스를 안내해 드립니다.<br className="hidden sm:block" />
              아래의 단계별 카드를 클릭하여 상세 업무 내용과 필수 제출 서류를 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Bar (Horizontal Timeline) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
        <div className="flex justify-between min-w-[800px] relative px-4">
          {/* Horizontal Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8"></div>

          {PROCESS_STEPS.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => scrollToStep(step.id)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md transition-all duration-200 ${step.color} ${activeStep === step.id ? 'ring-2 ring-offset-1 ring-accent scale-110' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`}>
                {idx + 1}
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 bg-white px-1 whitespace-nowrap group-hover:text-slate-800">{step.phase}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical Timeline Details */}
      <div className="relative pl-4 sm:pl-8 py-4">
        {/* Vertical Line */}
        <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-8">
          {PROCESS_STEPS.map((step, index) => {
            const isActive = activeStep === step.id;

            return (
              <div key={step.id} id={step.id} className="relative group scroll-mt-24">
                {/* Timeline Node */}
                <div
                  className={`absolute left-0 sm:left-4 -ml-1.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white shadow-md z-10 transition-transform duration-200 cursor-pointer ${step.color} ${isActive ? 'scale-110 ring-4 ring-white' : 'group-hover:scale-110'}`}
                  onClick={() => toggleStep(step.id)}
                >
                  {step.icon}
                </div>

                {/* Content Card */}
                <div className="ml-12 sm:ml-20">
                  <div
                    onClick={() => toggleStep(step.id)}
                    className={`bg-white rounded-lg border transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md ${isActive ? 'border-accent ring-1 ring-accent' : 'border-slate-200'}`}
                  >
                    {/* Card Header */}
                    <div className="p-4 sm:p-5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${step.color} bg-opacity-10 text-slate-600`}>
                            Phase {index + 1}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">| {step.phase}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{step.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1 sm:line-clamp-none">{step.description}</p>
                      </div>
                      <div className="text-slate-400 ml-4">
                        <svg className={`w-5 h-5 transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isActive && (
                      <div className="px-5 pb-5 pt-0 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200 cursor-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Major Tasks */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              주요 업무
                            </h4>
                            <ul className="space-y-2">
                              {step.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Documents */}
                          {step.documents && step.documents.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3 text-indigo-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                필수 제출 서류
                              </h4>
                              <ul className="space-y-2">
                                {step.documents.map((doc, idx) => (
                                  <li key={idx} className="text-xs text-slate-600 border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                    <span className="font-semibold block text-slate-800">📄 {doc.name}</span>
                                    {doc.note && <span className="text-slate-400 pl-4 block">- {doc.note}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-100 p-4 rounded-lg text-center text-xs text-slate-500 mt-8">
        ※ 본 가이드는 일반적인 태양광 발전사업 절차를 기준으로 작성되었으며, 지자체 조례 및 현장 여건에 따라 실제 절차와 제출 서류는 달라질 수 있습니다.
        <br />참조: 신재생에너지 클라우드 플랫폼 (RECloud)
      </div>
    </div>
  );
};
