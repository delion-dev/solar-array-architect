import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { InputGroup } from '../ui/InputGroup';
import { DEFAULT_MONTHLY_INSOLATION, DEFAULT_LOSS_FACTORS } from '../../constants';
import { LossFactors } from '../../types';
import { parseTMYCSV, readTextFile } from '../../utils/solarCalculator';

export const EconomicConfigForm = () => {
    const {
        economicConfig, economicConfigList, inverter,
        setEconomicConfig, addEconomicConfigs
    } = useStore();

    const [detailedInputMode, setDetailedInputMode] = useState<'manual' | 'csv'>('manual');
    const [uploadStatus, setUploadStatus] = useState<{ msg: string, type: 'success' | 'error' | null }>({ msg: '', type: null });
    const [lossOpen, setLossOpen] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (economicConfig.tmyData && economicConfig.tmyData.length > 0) {
            setDetailedInputMode('csv');
        } else {
            setDetailedInputMode('manual');
        }
    }, [economicConfig.tmyData]);

    const handleEconChange = (field: keyof typeof economicConfig, value: any) => {
        if (field === 'name') {
            setEconomicConfig({ name: value });
        } else if (field === 'analysisMode') {
            setEconomicConfig({ analysisMode: value });
        } else if (field === 'monthlyInsolation') {
            setEconomicConfig({ monthlyInsolation: value });
        } else if (field === 'tmyData') {
            setEconomicConfig({ tmyData: value });
        } else if (field === 'lossFactors') {
            setEconomicConfig({ lossFactors: value });
        } else {
            setEconomicConfig({ [field]: parseFloat(value) || 0 });
        }
    };

    const handleLossChange = (field: keyof LossFactors, value: string) => {
        const currentLoss = economicConfig.lossFactors || DEFAULT_LOSS_FACTORS;
        setEconomicConfig({
            lossFactors: {
                ...currentLoss,
                [field]: parseFloat(value) || 0
            }
        });
    };

    const handleMonthlyChange = (monthIndex: number, val: string) => {
        const newVal = parseFloat(val) || 0;
        const currentMonths = economicConfig.monthlyInsolation || DEFAULT_MONTHLY_INSOLATION;
        const newMonths = [...currentMonths];
        newMonths[monthIndex] = newVal;
        setEconomicConfig({ monthlyInsolation: newMonths });
    };

    const handleTMYUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus({ msg: '로딩중...', type: null });

        try {
            const text = await readTextFile(file);
            const tmyData = parseTMYCSV(text);

            if (tmyData.length > 0) {
                setEconomicConfig({ tmyData });
                setUploadStatus({ msg: `${tmyData.length.toLocaleString()}시간 데이터 로드 완료`, type: 'success' });
            } else {
                setUploadStatus({ msg: '데이터 파싱 실패 (CSV 형식 확인)', type: 'error' });
            }
        } catch (err) {
            console.error("CSV 읽기 실패:", err);
            setUploadStatus({ msg: '파일 읽기 오류', type: 'error' });
        }

        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    const avgMonthlyInsolation = (economicConfig.monthlyInsolation || DEFAULT_MONTHLY_INSOLATION)
        .reduce((a, b) => a + b, 0) / 12;

    const tmyDataExists = economicConfig.tmyData && economicConfig.tmyData.length > 0;
    const loanPercent = 100 - (economicConfig.equityPercent ?? 100);
    const lossFactors = economicConfig.lossFactors || DEFAULT_LOSS_FACTORS;

    return (
        <CollapsibleCard title="수익성 분석 조건 (Economics)">
            <PresetManager
                title="수익 조건 목록"
                items={economicConfigList}
                currentItem={economicConfig}
                onSelect={(c) => setEconomicConfig(c)}
                onImport={addEconomicConfigs}
                onSave={(name) => {
                    const newEcon = JSON.parse(JSON.stringify({ ...economicConfig, name }));
                    addEconomicConfigs([newEcon]);
                    setEconomicConfig(newEcon);
                }}
                getLabel={(c) => c.name || '이름 없음'}
                getId={(c) => c.name || 'unnamed'}
            />
            <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">설정 이름 (식별용)</label>
                <input
                    type="text"
                    value={economicConfig.name || ''}
                    onChange={(e) => handleEconChange('name', e.target.value)}
                    placeholder="예: 2024년 FIT (육지)"
                    className="mt-1 block w-full rounded-md border-slate-300 ring-1 ring-slate-300 px-3 py-1.5 text-sm focus:ring-accent placeholder:text-slate-300 input-field"
                />
            </div>

            <div className="space-y-4">
                {/* 분석 모드 선택 */}
                <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">분석 정밀도 (Precision)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleEconChange('analysisMode', 'basic')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${economicConfig.analysisMode === 'basic' || !economicConfig.analysisMode
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <span className={`text-sm font-bold ${economicConfig.analysisMode === 'basic' ? 'text-blue-700' : 'text-slate-700'}`}>기본 (Basic)</span>
                            <span className="text-[10px] text-slate-500 mt-1 text-center leading-tight">연평균 일사량 기준<br />약식 타당성 검토</span>
                        </button>
                        <button
                            onClick={() => handleEconChange('analysisMode', 'detailed')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${economicConfig.analysisMode === 'detailed'
                                    ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                        >
                            <span className={`text-sm font-bold ${economicConfig.analysisMode === 'detailed' ? 'text-purple-700' : 'text-slate-700'}`}>상세 (Detailed)</span>
                            <span className="text-[10px] text-slate-500 mt-1 text-center leading-tight">월별/시간별 데이터<br />정밀 시뮬레이션</span>
                        </button>
                    </div>
                </div>

                {/* 발전량 관련 조건 */}
                {economicConfig.analysisMode === 'detailed' ? (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 animate-in slide-in-from-top-2">
                        <div className="flex border-b border-slate-200 mb-3">
                            <button
                                className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors ${detailedInputMode === 'manual' ? 'border-purple-500 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setDetailedInputMode('manual')}
                            >
                                월별 수기 입력
                            </button>
                            <button
                                className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors ${detailedInputMode === 'csv' ? 'border-purple-500 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setDetailedInputMode('csv')}
                            >
                                TMY 파일 업로드
                            </button>
                        </div>

                        {detailedInputMode === 'manual' ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-600">월별 일사량 (hr/day)</span>
                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-500 font-medium">연평균: {avgMonthlyInsolation.toFixed(2)}hr</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(economicConfig.monthlyInsolation || DEFAULT_MONTHLY_INSOLATION).map((val, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <label className="text-[9px] text-slate-400 text-center mb-0.5">{idx + 1}월</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={val}
                                                onChange={(e) => handleMonthlyChange(idx, e.target.value)}
                                                className="text-center w-full rounded-md border-slate-300 text-xs py-1.5 px-1 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 shadow-sm input-field"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-3">
                                    <strong>TMY(Typical Meteorological Year)</strong> 데이터를 포함한<br />CSV 파일을 업로드하세요. (년,월,일,시간,풍속,전일사량)
                                </p>

                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        ref={csvInputRef}
                                        onChange={handleTMYUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    />
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-white group-hover:bg-slate-50 group-hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-2">
                                        <svg className="w-8 h-8 text-slate-400 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-xs font-medium text-slate-500 group-hover:text-purple-600">클릭하여 CSV 파일 선택</span>
                                    </div>
                                </div>

                                {uploadStatus.msg && (
                                    <div className={`mt-3 text-xs font-bold flex items-center justify-center gap-1 p-2 rounded ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                        {uploadStatus.type === 'success' ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {uploadStatus.msg}
                                    </div>
                                )}
                                {!uploadStatus.msg && tmyDataExists && (
                                    <div className="mt-3 text-xs font-medium text-slate-500 bg-slate-100 p-2 rounded flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        현재 {economicConfig.tmyData?.length.toLocaleString()}개 데이터가 로드됨
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="일평균 발전시간" value={economicConfig.dailyInsolation} unit="hr" step="0.01" onChange={(v) => handleEconChange('dailyInsolation', v)} />
                        <InputGroup label="종합 효율 (PR)" value={economicConfig.systemEfficiency} unit="%" onChange={(v) => handleEconChange('systemEfficiency', v)} />
                    </div>
                )}

                {/* 상세 손실 계수 입력 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setLossOpen(!lossOpen)}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600"
                    >
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            상세 손실 계수 설정 (Advanced Loss Factors)
                        </span>
                        <svg className={`w-3 h-3 transition-transform ${lossOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {lossOpen && (
                        <div className="p-3 bg-white grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                            <InputGroup label="오염 손실 (Soiling)" value={lossFactors.soiling} unit="%" step="0.1" onChange={(v) => handleLossChange('soiling', v)} />
                            <InputGroup label="음영 손실 (Shading)" value={lossFactors.shading} unit="%" step="0.1" onChange={(v) => handleLossChange('shading', v)} />
                            <InputGroup label="모듈 불일치 (Mismatch)" value={lossFactors.mismatch} unit="%" step="0.1" onChange={(v) => handleLossChange('mismatch', v)} />
                            <InputGroup label="초기 열화 (LID)" value={lossFactors.lid} unit="%" step="0.1" onChange={(v) => handleLossChange('lid', v)} />
                            <InputGroup label="DC 배선 손실" value={lossFactors.dcWiring} unit="%" step="0.1" onChange={(v) => handleLossChange('dcWiring', v)} />
                            <InputGroup label="AC 배선 손실" value={lossFactors.acWiring} unit="%" step="0.1" onChange={(v) => handleLossChange('acWiring', v)} />
                            <InputGroup label="가동률 손실 (Availability)" value={lossFactors.availability} unit="%" step="0.1" onChange={(v) => handleLossChange('availability', v)} />
                            <div className="col-span-2 pt-2 mt-1 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">인버터 효율 손실: {(100 - inverter.efficiency).toFixed(1)}% (자동반영)</span>
                            </div>
                        </div>
                    )}
                </div>

                {economicConfig.analysisMode === 'detailed' && (
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="종합 효율 (PR)" value={economicConfig.systemEfficiency} unit="%" onChange={(v) => handleEconChange('systemEfficiency', v)} />
                        <InputGroup label="연간 효율 감소율" value={economicConfig.annualDegradation} unit="%" step="0.01" onChange={(v) => handleEconChange('annualDegradation', v)} />
                    </div>
                )}

                {economicConfig.analysisMode === 'basic' && (
                    <InputGroup label="연간 효율 감소율" value={economicConfig.annualDegradation} unit="%" step="0.01" onChange={(v) => handleEconChange('annualDegradation', v)} />
                )}

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">전력 판매 단가</div>
                    <InputGroup label="SMP 단가" value={economicConfig.smp} unit="원/kWh" onChange={(v) => handleEconChange('smp', v)} />
                    <InputGroup label="REC 단가" value={economicConfig.recPrice} unit="원/REC" onChange={(v) => handleEconChange('recPrice', v)} helperFormat="currency" />
                    <InputGroup label="REC 가중치" value={economicConfig.recWeight} unit="" step="0.1" onChange={(v) => handleEconChange('recWeight', v)} />
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">투자 및 비용 (Cost)</div>
                    <InputGroup label="시공비 (단가)" value={economicConfig.installationCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('installationCostPerKw', v)} helperFormat="currency" />
                    <InputGroup label="유지보수비 (연간)" value={economicConfig.maintenanceCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('maintenanceCostPerKw', v)} helperFormat="currency" />
                    <InputGroup label="부지 임대료 (연간)" value={economicConfig.leaseCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('leaseCostPerKw', v)} helperFormat="currency" />
                    <InputGroup label="물가상승률 (OPEX)" value={economicConfig.inflationRate ?? 0} unit="%" step="0.1" onChange={(v) => handleEconChange('inflationRate', v)} />
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">금융 조건 (Finance)</div>
                    <InputGroup
                        label="대출 비율 (타인자본)"
                        value={loanPercent}
                        unit="%"
                        onChange={(v) => {
                            const val = parseFloat(v) || 0;
                            handleEconChange('equityPercent', 100 - val);
                        }}
                    />

                    {loanPercent > 0 && (
                        <>
                            <InputGroup label="대출 이자율" value={economicConfig.loanInterestRate ?? 0} unit="%" step="0.1" onChange={(v) => handleEconChange('loanInterestRate', v)} />
                            <InputGroup label="대출 기간" value={economicConfig.loanTerm ?? 0} unit="년" onChange={(v) => handleEconChange('loanTerm', v)} />
                            <InputGroup label="거치 기간 (이자만 납부)" value={economicConfig.loanGracePeriod ?? 0} unit="년" onChange={(v) => handleEconChange('loanGracePeriod', v)} />
                        </>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">세무 설정 (Tax & Depreciation)</div>
                    <InputGroup label="법인세율" value={economicConfig.corporateTaxRate ?? 0} unit="%" step="1" onChange={(v) => handleEconChange('corporateTaxRate', v)} />
                    <InputGroup label="감가상각 기간" value={economicConfig.depreciationPeriod ?? 0} unit="년" onChange={(v) => handleEconChange('depreciationPeriod', v)} />
                </div>
            </div>
        </CollapsibleCard>
    );
};
