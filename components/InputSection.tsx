import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { CollapsibleCard } from './ui/CollapsibleCard';
import { SystemConfigForm } from './forms/SystemConfigForm';
import { EconomicConfigForm } from './forms/EconomicConfigForm';
import { ModuleSelector } from './forms/ModuleSelector';
import { InverterSelector } from './forms/InverterSelector';
import { readTextFile } from '../utils/solarCalculator';

/**
 * [입력 패널 메인 컴포넌트]
 * 시스템 설계, 경제성 분석, 모듈/인버터 사양을 입력받는 좌측 패널입니다.
 * 리팩토링: 하위 폼 컴포넌트들을 조합하는 컨테이너 역할만 수행합니다.
 */
export const InputSection = () => {
  const {
    module, inverter, config, economicConfig,
    loadGlobalConfig, resetToFactoryDefault
  } = useStore();

  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'info' | 'success' | 'loading' } | null>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  // 1. 현재 설정을 configdata.json 파일로 다운로드
  const handleDownloadConfigData = () => {
    setStatusMsg({ text: '설정 파일 생성 중...', type: 'loading' });

    setTimeout(() => {
      try {
        const fullData = {
          module,
          inverter,
          config,
          economicConfig
        };
        const dataStr = JSON.stringify(fullData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "configdata.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatusMsg({ text: 'configdata.json 저장 완료', type: 'success' });
        setTimeout(() => setStatusMsg(null), 3000);
      } catch (e) {
        console.error("Save Error:", e);
        setStatusMsg({ text: '저장 실패', type: 'info' });
      }
    }, 500);
  };

  // 2. configdata.json 파일 업로드 및 적용
  const handleUploadConfigData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg({ text: '설정 불러오는 중...', type: 'loading' });

    try {
      const text = await readTextFile(file);
      const jsonData = JSON.parse(text);

      loadGlobalConfig(jsonData);

      setStatusMsg({ text: '설정 불러오기 완료!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error("Config Load Error:", err);
      alert("설정 파일을 불러오는 데 실패했습니다.");
      setStatusMsg(null);
    }

    if (configInputRef.current) configInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 h-full pr-2 pb-10">

      {/* 0. 설정 관리 (Configuration Management) */}
      <CollapsibleCard title="설정 관리 (Configuration)" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            현재 화면의 모든 설정값을 <span className="font-mono bg-slate-100 px-1">configdata.json</span> 파일로 저장하거나 불러옵니다.
          </p>

          <div className="flex flex-col gap-2">
            {/* 저장 버튼 */}
            <button
              onClick={handleDownloadConfigData}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              현재 설정을 기본값으로 저장
            </button>

            {/* 불러오기 버튼 */}
            <input
              type="file"
              accept=".json"
              ref={configInputRef}
              onChange={handleUploadConfigData}
              className="hidden"
            />
            <button
              onClick={() => configInputRef.current?.click()}
              className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              내 기본 값 불러오기
            </button>

            {/* 상태 메시지 */}
            {statusMsg && (
              <div className={`flex items-center justify-center gap-2 p-2 rounded animate-in fade-in zoom-in duration-200 ${statusMsg.type === 'loading' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                {statusMsg.type === 'loading' ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-xs font-bold">{statusMsg.text}</span>
              </div>
            )}

            <div className="flex flex-col mt-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (confirm("모든 설정을 공장 초기화 상태로 되돌리시겠습니까?")) resetToFactoryDefault();
                }}
                className="text-center text-xs text-red-500 hover:text-red-700 underline"
              >
                공장 초기화 (Reset Factory Defaults)
              </button>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* 1. 시스템 설계 조건 */}
      <SystemConfigForm />

      {/* 2. 수익성 분석 조건 */}
      <EconomicConfigForm />

      {/* 3. 태양광 모듈 */}
      <ModuleSelector />

      {/* 4. 인버터 */}
      <InverterSelector />

    </div>
  );
};
