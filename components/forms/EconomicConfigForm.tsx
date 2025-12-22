import React, { useState, useRef } from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { InputGroup } from '../ui/InputGroup';
import { Tooltip } from '../ui/Tooltip';
import { DEFAULT_MONTHLY_INSOLATION, DEFAULT_LOSS_FACTORS } from '../../constants';
import { parseTMYCSV, readTextFile } from '../../utils/solar/parsers';
import { LossFactors } from '../../types';

export const EconomicConfigForm = () => {
    const {
        economicConfig,
        economicConfigList,
        setEconomicConfig,
        addEconomicConfigs,
        inverter
    } = useStore();

    const [detailedInputMode, setDetailedInputMode] = useState<'manual' | 'csv'>('manual');
    const [uploadStatus, setUploadStatus] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
    const [lossOpen, setLossOpen] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const handleEconChange = (field: string, value: any) => {
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
                                    <div className="mt-3 text-xs font-medium text-slate-500 bg-slate-100 p-2 rounded flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            현재 {economicConfig.tmyData?.length.toLocaleString()}개 데이터 로드됨
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            * 대용량 데이터 보호를 위해 브라우저에 영구 저장되지 않으며, 새로고침 시 재업로드가 필요합니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup
                            label="일평균 발전시간"
                            value={economicConfig.dailyInsolation}
                            unit="hr"
                            step="0.01"
                            onChange={(v) => handleEconChange('dailyInsolation', v)}
                            tooltip="하루 평균 발전 가능 시간입니다. (예: 3.6hr) 한국 평균은 3.5~3.8시간이며, 지역별 일사량에 따라 차이가 납니다."
                        />
                        <InputGroup
                            label="종합 효율 (PR)"
                            value={economicConfig.systemEfficiency}
                            unit="%"
                            onChange={(v) => handleEconChange('systemEfficiency', v)}
                            tooltip="시스템 종합 성능 지수입니다. (예: 80%) 먼지, 배선, 인버터 손실 등을 제외한 실제 발전 효율을 나타냅니다."
                        />
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
                            <InputGroup label="오염 손실 (Soiling)" value={lossFactors.soiling} unit="%" step="0.1" onChange={(v) => handleLossChange('soiling', v)} tooltip="모듈 표면 오염 손실입니다. (예: 2.0%) 먼지, 눈, 조류 분변 등으로 인한 효율 저하를 반영합니다." />
                            <InputGroup label="음영 손실 (Shading)" value={lossFactors.shading} unit="%" step="0.1" onChange={(v) => handleLossChange('shading', v)} tooltip="그림자 손실입니다. (예: 3.0%) 주변 건물, 나무, 산 등에 의해 가려지는 정도를 설정합니다." />
                            <InputGroup label="입사각 손실 (IAM)" value={lossFactors.iamLoss} unit="%" step="0.1" onChange={(v) => handleLossChange('iamLoss', v)} tooltip="입사각 반사 손실입니다. (예: 2.5%) 태양의 각도에 따라 모듈 표면에서 반사되는 빛의 양입니다." />
                            <InputGroup label="모듈 불일치 (Mismatch)" value={lossFactors.mismatch} unit="%" step="0.1" onChange={(v) => handleLossChange('mismatch', v)} tooltip="모듈 간 출력 편차 손실입니다. (예: 2.0%) 개별 모듈의 미세한 성능 차이로 발생하는 손실입니다." />
                            <InputGroup label="초기 열화 (LID)" value={lossFactors.lid} unit="%" step="0.1" onChange={(v) => handleLossChange('lid', v)} tooltip="초기 빛 유도 성능 저하입니다. (예: 1.5%) 설치 초기 빛에 노출되면서 발생하는 성능 하락입니다." />
                            <InputGroup label="DC 배선 손실" value={lossFactors.dcWiring} unit="%" step="0.1" onChange={(v) => handleLossChange('dcWiring', v)} tooltip="DC 구간 전압 강하 손실입니다. (예: 1.5%) 모듈에서 인버터까지 배선 저항에 의한 손실입니다." />
                            <InputGroup label="AC 배선 손실" value={lossFactors.acWiring} unit="%" step="0.1" onChange={(v) => handleLossChange('acWiring', v)} tooltip="AC 구간 전압 강하 손실입니다. (예: 1.0%) 인버터에서 계통 연결점까지의 배선 손실입니다." />
                            <InputGroup label="가동률 손실 (Availability)" value={lossFactors.availability} unit="%" step="0.1" onChange={(v) => handleLossChange('availability', v)} tooltip="시스템 미가동 손실입니다. (예: 0.5%) 유지보수, 고장, 정전 등으로 발전이 중단되는 비율입니다." />
                            <div className="col-span-2 pt-2 mt-1 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">인버터 효율 손실: {(100 - inverter.efficiency).toFixed(1)}% (자동반영)</span>
                            </div>
                        </div>
                    )}
                </div>

                {economicConfig.analysisMode === 'detailed' && (
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup
                            label="종합 효율 (PR)"
                            value={economicConfig.systemEfficiency}
                            unit="%"
                            onChange={(v) => handleEconChange('systemEfficiency', v)}
                            tooltip="상세 손실 계수가 반영된 최종 시스템 성능 지수입니다. (예: 78.5%)"
                        />
                        <InputGroup
                            label="연간 효율 감소율"
                            value={economicConfig.annualDegradation}
                            unit="%"
                            step="0.01"
                            onChange={(v) => handleEconChange('annualDegradation', v)}
                            tooltip="모듈의 연간 성능 저하율입니다. (예: 0.5%) 매년 조금씩 줄어드는 발전량을 시뮬레이션에 반영합니다."
                        />
                    </div>
                )}

                {economicConfig.analysisMode === 'basic' && (
                    <InputGroup
                        label="연간 효율 감소율"
                        value={economicConfig.annualDegradation}
                        unit="%"
                        step="0.01"
                        onChange={(v) => handleEconChange('annualDegradation', v)}
                        tooltip="모듈의 연간 성능 저하율입니다. (예: 0.5%) 매년 조금씩 줄어드는 발전량을 시뮬레이션에 반영합니다."
                    />
                )}

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">전력 판매 및 글로벌 재무 (Revenue & Global)</div>
                    <div className="col-span-2 flex items-center gap-2 mb-1">
                        <input
                            type="checkbox"
                            id="ppaEnabled"
                            checked={economicConfig.ppaEnabled || false}
                            onChange={(e) => handleEconChange('ppaEnabled', e.target.checked)}
                            className="rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        <div className="flex items-center">
                            <label htmlFor="ppaEnabled" className="text-xs font-medium text-slate-700">PPA (전력판매계약) 적용</label>
                            <Tooltip content="발전 사업자가 전력 구매자와 직접 계약을 체결하여 고정 가격으로 전력을 판매하는 방식입니다. (예: RE100 기업 대상)" />
                        </div>
                    </div>
                    {economicConfig.ppaEnabled ? (
                        <>
                            <InputGroup
                                label="PPA 단가"
                                value={economicConfig.ppaRate || 0}
                                unit="원/kWh"
                                onChange={(v) => handleEconChange('ppaRate', v)}
                                tooltip="kWh당 고정 판매 가격입니다. (예: 170원) 계약 기간 동안 고정된 가격으로 수익을 계산합니다."
                            />
                            <InputGroup
                                label="PPA 연간 상승률"
                                value={economicConfig.ppaEscalation || 0}
                                unit="%"
                                step="0.1"
                                onChange={(v) => handleEconChange('ppaEscalation', v)}
                                tooltip="계약 단가의 연간 인상률입니다. (예: 1%) 물가 상승 등을 고려한 단가 조정을 반영합니다."
                            />
                        </>
                    ) : (
                        <>
                            <InputGroup
                                label="SMP 단가"
                                value={economicConfig.smp}
                                unit="원/kWh"
                                onChange={(v) => handleEconChange('smp', v)}
                                tooltip="전력 도매 가격입니다. (예: 130원) 시장 상황에 따라 변동하며, 수익의 기본이 됩니다."
                            />
                            <InputGroup
                                label="REC 단가"
                                value={economicConfig.recPrice}
                                unit="원/REC"
                                onChange={(v) => handleEconChange('recPrice', v)}
                                helperFormat="currency"
                                tooltip="에너지 공급 인증서 가격입니다. (예: 75,000원) SMP 외의 추가 수익원으로, 시장 입찰을 통해 결정됩니다."
                            />
                            <InputGroup
                                label="REC 가중치"
                                value={economicConfig.recWeight}
                                unit=""
                                step="0.1"
                                onChange={(v) => handleEconChange('recWeight', v)}
                                tooltip="REC 우대 비율입니다. (예: 1.5 - 건축물 활용 시) 설치 장소와 용량에 따라 정부가 부여하는 가중치입니다."
                            />
                        </>
                    )}
                    <InputGroup
                        label="투자 세액 공제 (ITC)"
                        value={economicConfig.itcPercent || 0}
                        unit="%"
                        step="1"
                        onChange={(v) => handleEconChange('itcPercent', v)}
                        tooltip="투자비 세액 공제 비율입니다. (예: 3%) 총 공사비 중 세금 혜택으로 돌려받는 금액을 반영합니다."
                    />
                    <InputGroup
                        label="할인율 (Discount Rate)"
                        value={economicConfig.discountRate || 4.5}
                        unit="%"
                        step="0.1"
                        onChange={(v) => handleEconChange('discountRate', v)}
                        tooltip="미래 가치의 현재 환산율입니다. (예: 4.5%) 물가 상승과 자본 비용을 고려하여 미래 수익을 현재 가치로 평가합니다."
                    />
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">투자 및 비용 (Cost)</div>
                    <InputGroup label="시공비 (단가)" value={economicConfig.installationCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('installationCostPerKw', v)} helperFormat="currency" tooltip="kW당 총 설치 비용입니다. (예: 1,200,000원) 자재비, 노무비, 인허가비 등을 포함한 초기 투자비입니다." />
                    <InputGroup label="유지보수비 (연간)" value={economicConfig.maintenanceCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('maintenanceCostPerKw', v)} helperFormat="currency" tooltip="연간 운영 관리 비용입니다. (예: 15,000원/kW) 안전관리비, 모듈 세척, 소모품 교체 비용 등을 포함합니다." />
                    <InputGroup label="부지 임대료 (연간)" value={economicConfig.leaseCostPerKw} unit="원/kW" onChange={(v) => handleEconChange('leaseCostPerKw', v)} helperFormat="currency" tooltip="연간 부지 사용료입니다. (예: 20,000원/kW) 남의 땅이나 지붕을 빌려 사업할 때 지불하는 비용입니다." />
                    <InputGroup label="물가상승률 (OPEX)" value={economicConfig.inflationRate ?? 0} unit="%" step="0.1" onChange={(v) => handleEconChange('inflationRate', v)} tooltip="운영비 연간 인상률입니다. (예: 2%) 인건비 및 물가 상승에 따른 관리비 증가를 반영합니다." />
                </div>

                {/* BESS 설정 */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-3 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            BESS (배터리 저장 장치)
                        </span>
                        <input
                            type="checkbox"
                            checked={economicConfig.bess?.enabled || false}
                            onChange={(e) => {
                                const currentBess = economicConfig.bess || { enabled: false, capacityKwh: 0, powerKw: 0, efficiency: 90, dod: 90, costPerKwh: 500000, cyclesPerYear: 350 };
                                setEconomicConfig({ bess: { ...currentBess, enabled: e.target.checked } });
                            }}
                            className="rounded border-slate-300 text-accent focus:ring-accent"
                        />
                    </div>
                    {economicConfig.bess?.enabled && (
                        <div className="p-3 bg-white grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                            <InputGroup
                                label="배터리 용량"
                                value={economicConfig.bess.capacityKwh}
                                unit="kWh"
                                onChange={(v) => setEconomicConfig({ bess: { ...economicConfig.bess!, capacityKwh: parseFloat(v) || 0 } })}
                                tooltip="배터리 총 저장 용량입니다. (예: 1,000kWh) 태양광 용량의 약 2~3배 정도로 설계하는 것이 일반적입니다."
                            />
                            <InputGroup
                                label="충방전 출력"
                                value={economicConfig.bess.powerKw}
                                unit="kW"
                                onChange={(v) => setEconomicConfig({ bess: { ...economicConfig.bess!, powerKw: parseFloat(v) || 0 } })}
                                tooltip="배터리 최대 입출력입니다. (예: 500kW) 인버터 용량과 매칭하여 설계합니다."
                            />
                            <InputGroup
                                label="충방전 효율"
                                value={economicConfig.bess.efficiency}
                                unit="%"
                                onChange={(v) => setEconomicConfig({ bess: { ...economicConfig.bess!, efficiency: parseFloat(v) || 0 } })}
                                tooltip="배터리 시스템 효율입니다. (예: 90%) 충전과 방전을 한 번 거칠 때 남는 에너지의 비율입니다."
                            />
                            <InputGroup
                                label="방전 심도 (DOD)"
                                value={economicConfig.bess.dod}
                                unit="%"
                                onChange={(v) => setEconomicConfig({ bess: { ...economicConfig.bess!, dod: parseFloat(v) || 0 } })}
                                tooltip="실제 가용 용량 비율입니다. (예: 90%) 배터리 수명을 위해 전체 용량 중 일부만 사용하도록 제한합니다."
                            />
                            <InputGroup
                                label="설치 단가"
                                value={economicConfig.bess.costPerKwh}
                                unit="원/kWh"
                                onChange={(v) => setEconomicConfig({ bess: { ...economicConfig.bess!, costPerKwh: parseFloat(v) || 0 } })}
                                helperFormat="currency"
                                tooltip="kWh당 배터리 설치 비용입니다. (예: 500,000원) 배터리 팩, PCS, 컨테이너 등을 포함한 비용입니다."
                            />
                        </div>
                    )}
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
                        tooltip="총 투자비 중 대출 비중입니다. (예: 70%) 자기자본 외에 은행 등에서 빌리는 자금의 비율입니다."
                    />

                    {loanPercent > 0 && (
                        <>
                            <InputGroup label="대출 이자율" value={economicConfig.loanInterestRate ?? 0} unit="%" step="0.1" onChange={(v) => handleEconChange('loanInterestRate', v)} tooltip="연간 대출 금리입니다. (예: 5.5%) 금융권과 협의된 연간 이자 비용 비율입니다." />
                            <InputGroup label="대출 기간" value={economicConfig.loanTerm ?? 0} unit="년" onChange={(v) => handleEconChange('loanTerm', v)} tooltip="대출 상환 기간입니다. (예: 12년) 원금과 이자를 모두 갚아야 하는 전체 기간입니다." />
                            <InputGroup label="거치 기간 (이자만 납부)" value={economicConfig.loanGracePeriod ?? 0} unit="년" onChange={(v) => handleEconChange('loanGracePeriod', v)} tooltip="원금 상환 유예 기간입니다. (예: 1년) 초기 수익으로 이자만 내며 자금 흐름을 확보하는 기간입니다." />
                        </>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase">세무 설정 (Tax & Depreciation)</div>
                    <InputGroup label="법인세율" value={economicConfig.corporateTaxRate ?? 0} unit="%" step="1" onChange={(v) => handleEconChange('corporateTaxRate', v)} tooltip="사업 소득세율입니다. (예: 10%) 순이익에 대해 국가에 납부하는 세금 비율입니다." />
                    <InputGroup label="감가상각 기간" value={economicConfig.depreciationPeriod ?? 0} unit="년" onChange={(v) => handleEconChange('depreciationPeriod', v)} tooltip="자산 비용 처리 기간입니다. (예: 20년) 초기 투자비를 매년 나누어 비용으로 인정받는 기간입니다." />
                </div>
            </div>
        </CollapsibleCard>
    );
};
