import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { generatePDF } from '../utils/pdfGenerator';
import { StringDiagram } from './results/StringDiagram';
import { generateConfigurationSummary, calculateInverterGroups } from '../utils/solarCalculator';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Area, ReferenceLine, BarChart, Legend, Cell, AreaChart } from 'recharts';
import { SystemConfig, SimulationResult, EconomicConfig, BOMItem, PVModule, Inverter, CalculationResult } from '../types';
import { PROCESS_STEPS, ProcessStep } from './results/ProcessGuideTab';

// --- Constants & Styles ---
// A4 @ 96 DPI: 794px x 1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PADDING_PX = 40;
const CONTENT_WIDTH = A4_WIDTH_PX - (PADDING_PX * 2);

// 공통 페이지 스타일
const PAGE_STYLE: React.CSSProperties = {
   width: `${A4_WIDTH_PX}px`,
   height: `${A4_HEIGHT_PX}px`,
   padding: `${PADDING_PX}px`,
   backgroundColor: 'white',
   position: 'relative',
   overflow: 'hidden',
   boxSizing: 'border-box',
   display: 'flex',
   flexDirection: 'column',
};

// --- Helper Functions ---
const chunkArray = <T,>(array: T[], size: number): T[][] => {
   const chunked: T[][] = [];
   for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
   }
   return chunked;
};

// --- Helper Components ---

const ReportHeader = ({ title, subTitle }: { title: string, subTitle: string }) => (
   <div className="border-b-2 border-slate-900 pb-4 mb-6 shrink-0">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">{title}</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">{subTitle}</p>
         </div>
         <div className="flex items-center gap-3">
            <img src="/report_logo.jpg" alt="Logo" className="h-10 w-auto object-contain" />
            <div className="text-right border-l border-slate-300 pl-3">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solar Array Architect</div>
               <div className="text-[10px] text-slate-300">Professional Engineering Report</div>
            </div>
         </div>
      </div>
   </div>
);

const ReportFooter = ({ page, total, confName }: { page: number, total: number, confName?: string }) => (
   <div className="absolute bottom-0 left-0 w-full px-10 pb-6">
      <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[9px] text-slate-400 font-medium">
         <span>{confName || "Project Solar"}</span>
         <span>{new Date().toLocaleDateString()} Generated</span>
         <span>Page {page} of {total}</span>
      </div>
   </div>
);

const DataRow = ({ label, value, unit = '', isLast = false, highlight = false }: { label: string, value: string | number, unit?: string, isLast?: boolean, highlight?: boolean }) => (
   <div className={`flex justify-between items-center py-2 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-bold font-mono ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>
         {typeof value === 'number' ? value.toLocaleString() : value}{unit}
      </span>
   </div>
);

// --- Page 1: Executive Summary ---
const PageOne = ({ config, module, inverter, summaryText, date, pageNum, totalPages }: { config: SystemConfig, module: PVModule, inverter: Inverter, summaryText: string, date: string, pageNum: number, totalPages: number }) => (
   <div style={PAGE_STYLE}>
      <ReportHeader title="종합 설계 보고서" subTitle="Executive Summary & Specifications" />

      {/* Hero Section */}
      <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 mb-8 flex justify-between items-center shrink-0">
         <div>
            <div className="inline-block px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded mb-2">PROJECT</div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-1 leading-tight">{config.name || "태양광 발전 프로젝트"}</h2>
            <p className="text-xs text-slate-500 font-medium">설계 기준일: {date}</p>
         </div>
         <div className="text-right">
            <div className="text-5xl font-black text-blue-600 tracking-tighter mb-2">
               {config.targetCapacity} <span className="text-2xl text-slate-400 font-medium">kW</span>
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase">Target Installation Capacity</div>
         </div>
      </div>

      {/* Project Overview Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8 flex-1">
         <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-900 pb-2 mb-4">설치 환경 조건 (Site Conditions)</h3>
            <DataRow label="설치 지역 최저 온도 (Winter)" value={config.ambientTempWinter} unit="°C" />
            <DataRow label="설치 지역 최고 온도 (Summer)" value={config.ambientTempSummer} unit="°C" />
            <DataRow label="DC 메인 케이블 길이" value={config.cableLength} unit="m" />
            <DataRow label="DC 케이블 단면적" value={config.cableCrossSection} unit="mm²" />
            <DataRow label="양면 모듈 이득 (Bifacial Gain)" value={config.bifacialGain || 0} unit="%" isLast />

            <div className="mt-6 text-xs text-slate-600 leading-relaxed text-justify bg-white p-4 border border-slate-100 rounded shadow-sm">
               <span className="font-bold text-slate-900 block mb-1">설계 요약:</span> {summaryText}
            </div>
         </div>

         <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-900 pb-2 mb-4">주요 기자재 (Main Equipment)</h3>

            {/* Module Card - Table Layout for PDF Stability */}
            <div className="mb-4 border border-slate-100 rounded p-3 shadow-sm bg-white flex items-center">
               <div className="w-16 h-20 bg-slate-50 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center mr-4">
                  {module.imageUrl ? <img src={module.imageUrl} className="w-full h-full object-cover" alt="Module" crossOrigin="anonymous" /> : <span className="text-[9px] text-slate-400">IMG</span>}
               </div>
               <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">PV Module</div>
                  <div className="text-sm font-bold text-slate-900 leading-tight mb-1 break-words" title={module.model}>{module.model}</div>
                  <div className="text-[10px] text-slate-500 mb-2 leading-none">{module.manufacturer}</div>
                  <table className="w-full text-[10px] text-slate-500 table-fixed">
                     <tbody>
                        <tr>
                           <td className="w-1/2 pr-1 whitespace-nowrap">Pmax: <b className="text-slate-800">{module.pmax}W</b></td>
                           <td className="w-1/2 whitespace-nowrap">Eff: <b className="text-slate-800">{module.efficiency}%</b></td>
                        </tr>
                        <tr>
                           <td className="pr-1 whitespace-nowrap">Voc: <b className="text-slate-800">{module.voc}V</b></td>
                           <td className="whitespace-nowrap">Isc: <b className="text-slate-800">{module.isc}A</b></td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Inverter Card - Table Layout for PDF Stability */}
            <div className="border border-slate-100 rounded p-3 shadow-sm bg-white flex items-center">
               <div className="w-16 h-20 bg-slate-50 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center mr-4">
                  {inverter.imageUrl ? <img src={inverter.imageUrl} className="w-full h-full object-contain" alt="Inv" crossOrigin="anonymous" /> : <span className="text-[9px] text-slate-400">IMG</span>}
               </div>
               <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Inverter</div>
                  <div className="text-sm font-bold text-slate-900 leading-tight mb-1 break-words" title={inverter.model}>{inverter.model}</div>
                  <div className="text-[10px] text-slate-500 mb-2 leading-none">{inverter.manufacturer}</div>
                  <table className="w-full text-[10px] text-slate-500 table-fixed">
                     <tbody>
                        <tr>
                           <td className="w-1/2 pr-1 whitespace-nowrap">Output: <b className="text-slate-800">{inverter.ratedOutputPower}kW</b></td>
                           <td className="w-1/2 whitespace-nowrap">Eff: <b className="text-slate-800">{inverter.efficiency}%</b></td>
                        </tr>
                        <tr>
                           <td className="pr-1 whitespace-nowrap">Vmax: <b className="text-slate-800">{inverter.maxInputVoltage}V</b></td>
                           <td className="whitespace-nowrap">MPPT: <b className="text-slate-800">{inverter.mpptCount}Ch</b></td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
   </div>
);

// --- Page 2: Engineering ---
const PageTwo = ({ results, module, inverter, config, pageNum, totalPages }: { results: CalculationResult, module: PVModule, inverter: Inverter, config: SystemConfig, pageNum: number, totalPages: number }) => {
   const { configuration, safety } = results;
   const inverterGroups = calculateInverterGroups(configuration.parallelStrings, results.inverterCount, configuration.seriesModules, module, inverter, results);

   return (
      <div style={PAGE_STYLE}>
         <ReportHeader title="기술적 검토 결과" subTitle="Engineering & Electrical Analysis" />

         {/* Array Config */}
         <div className="flex gap-8 mb-8 shrink-0">
            <div className="w-1/2 p-5 border border-slate-200 rounded-lg shadow-sm">
               <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 어레이 구성 (Array Configuration)
               </h3>
               <DataRow label="직렬 모듈 수 (Series)" value={configuration.seriesModules} unit=" EA" />
               <DataRow label="병렬 스트링 수 (Parallel)" value={configuration.parallelStrings} unit=" Circuits" />
               <DataRow label="총 모듈 수량" value={configuration.totalModules} unit=" EA" />
               <DataRow label="필요 인버터 수량" value={results.inverterCount} unit=" EA" />
               <DataRow label="DC/AC 비율 (부하율)" value={(results.dcAcRatio * 100).toFixed(1)} unit=" %" highlight />
               <DataRow label="설치 소요 면적 (모듈)" value={((module.width * module.height * configuration.totalModules) / 1000000).toFixed(1)} unit=" m²" isLast />
            </div>

            <div className="w-1/2 p-5 bg-slate-50 border border-slate-200 rounded-lg">
               <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> 안전성 검토 (Safety Check)
               </h3>
               <div className="space-y-3 mt-2">
                  {/* Safety Bars */}
                  <div>
                     <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-600">Max Voltage ({results.stringVoltageWinter.toFixed(0)}V)</span>
                        <span className="text-slate-400">Limit: {inverter.maxInputVoltage}V</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${safety.isVocSafe ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min((results.stringVoltageWinter / inverter.maxInputVoltage) * 100, 100)}%` }}></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-600">Max Current ({module.isc}A)</span>
                        <span className="text-slate-400">Limit: {inverter.maxShortCircuitCurrent}A</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${safety.isCurrentSafe ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min((module.isc / inverter.maxShortCircuitCurrent) * 100, 100)}%` }}></div>
                     </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-600">최종 판정</span>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${safety.isVocSafe && safety.isCurrentSafe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {safety.isVocSafe && safety.isCurrentSafe ? "적합 (PASSED)" : "부적합 (FAILED)"}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         {/* String Diagram */}
         <div className="mb-8 shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 border-l-4 border-slate-900 pl-2">System Single Line Diagram (SLD)</h3>
            <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-center bg-white h-[280px]">
               <div className="transform scale-[0.85] origin-center w-full">
                  <StringDiagram
                     seriesCount={configuration.seriesModules}
                     moduleModel={module.model}
                     inverterModel={inverter.model}
                     config={config}
                     inverterCount={results.inverterCount}
                     dcVoltsMin={results.stringVoltageSummer}
                     dcVoltsMax={results.stringVoltageWinter}
                     acVolts={inverter.ratedOutputVoltage}
                     isReport={true}
                  />
               </div>
            </div>
         </div>

         {/* Inverter Schedule Table - Fixed height to prevent overflow */}
         <div className="flex-1 overflow-hidden relative">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 border-l-4 border-slate-900 pl-2">인버터 회로 구성표 (Inverter Schedule)</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
               <table className="w-full text-[10px] text-center border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                     <tr>
                        <th className="py-2 px-2 text-left border-b border-slate-200">인버터 그룹</th>
                        <th className="py-2 border-b border-slate-200">수량</th>
                        <th className="py-2 border-b border-slate-200">스트링 구성 (SxP)</th>
                        <th className="py-2 border-b border-slate-200">총 모듈 수</th>
                        <th className="py-2 border-b border-slate-200">DC 입력 용량</th>
                        <th className="py-2 border-b border-slate-200">부하율</th>
                     </tr>
                  </thead>
                  <tbody>
                     {inverterGroups.slice(0, 12).map((group, idx) => ( // 상위 12개만 표시, 나머지는 생략 (설계상 이정도면 충분)
                        <tr key={idx} className="border-b border-slate-50 last:border-0">
                           <td className="py-2 px-2 text-left font-bold text-slate-800">{group.idRange}</td>
                           <td className="py-2">{group.count} Set</td>
                           <td className="py-2 font-mono">{configuration.seriesModules}S x {group.strings}P</td>
                           <td className="py-2">{group.modules} EA</td>
                           <td className="py-2 font-bold">{group.kw.toFixed(2)} kW</td>
                           <td className="py-2 text-slate-500">{group.dcAcRatio.toFixed(0)}%</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
};

// --- Page 3: Economics Overview (Updated with NPV/LCOE) ---
const PageThree = ({ sim, econ, config, pageNum, totalPages }: { sim: SimulationResult, econ: EconomicConfig, config: SystemConfig, pageNum: number, totalPages: number }) => {
   const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(val);
   const sensitivityData = sim?.sensitivityAnalysis || [];
   const equityRatio = econ.equityPercent ?? 100;

   return (
      <div style={PAGE_STYLE}>
         <ReportHeader title="수익성 분석 개요" subTitle="Economic Feasibility Overview" />

         {/* KPI Cards (Enhanced Layout) */}
         <div className="grid grid-cols-6 gap-3 mb-6 shrink-0">
            {/* Row 1: High Level */}
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-blue-50 text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">Net Profit (20yr)</div>
               <div className="text-lg font-black text-blue-700 mt-1">{formatMoney(sim.totalNetProfit)}</div>
               <div className="text-[9px] text-blue-400">총 누적 순수익</div>
            </div>
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-white text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">NPV</div>
               <div className="text-lg font-black text-slate-800 mt-1">{formatMoney(sim.npv || 0)}</div>
               <div className="text-[9px] text-slate-400">순현재가치</div>
            </div>
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-white text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">CAPEX</div>
               <div className="text-lg font-black text-slate-800 mt-1">{(sim.totalConstructionCost / 1000000).toFixed(0)}<span className="text-sm">백만</span></div>
               <div className="text-[9px] text-slate-400">총 투자비</div>
            </div>

            {/* Row 2: Ratios */}
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-white text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">ROI</div>
               <div className="text-lg font-black text-green-600 mt-1">{sim.roi.toFixed(1)}%</div>
               <div className="text-[9px] text-slate-400">투자수익률</div>
            </div>
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-white text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">LCOE</div>
               <div className="text-lg font-black text-amber-600 mt-1">{sim.lcoe ? sim.lcoe.toFixed(1) : 0}<span className="text-xs text-slate-500 font-normal">원/kWh</span></div>
               <div className="text-[9px] text-slate-400">균등화 발전원가</div>
            </div>
            <div className="col-span-2 p-3 border border-slate-200 rounded-lg bg-white text-center">
               <div className="text-[9px] font-bold text-slate-400 uppercase">Payback</div>
               <div className="text-lg font-black text-slate-800 mt-1">{sim.paybackPeriod.toFixed(1)}<span className="text-sm">년</span></div>
               <div className="text-[9px] text-slate-400">원금회수기간</div>
            </div>
         </div>

         {/* Analysis Logic Text */}
         <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span> 분석 산출 근거 (Analysis Logic)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-600 leading-relaxed">
               <div>
                  <strong>1. 세후 현금흐름 (Net Cash Flow):</strong>
                  <p>매출(SMP+REC)에서 운영비, 대출 원리금, 법인세(Tax)를 차감한 실제 현금흐름입니다. 운영비는 물가상승률({econ.inflationRate ?? 0}%)이 매년 반영됩니다.</p>
               </div>
               <div>
                  <strong>2. 자본 구조 (Capital Structure):</strong>
                  <p>총 사업비 {formatMoney(sim.totalConstructionCost)}원 중 자기자본 {equityRatio}%({formatMoney(sim.totalConstructionCost * (equityRatio / 100))}), 타인자본 {100 - equityRatio}%로 구성된 금융 모델입니다.</p>
               </div>
            </div>
         </div>

         {/* Sensitivity Analysis */}
         <div className="mb-6 shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-2">민감도 분석 (Sensitivity Analysis)</h3>
            <table className="w-full text-xs text-center border-collapse border-t-2 border-slate-800">
               <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                     <th className="py-2 border-b border-slate-200">Scenario</th>
                     <th className="py-2 border-b border-slate-200">Price Variation</th>
                     <th className="py-2 border-b border-slate-200">Total Net Profit</th>
                     <th className="py-2 border-b border-slate-200">ROI</th>
                     <th className="py-2 border-b border-slate-200">Risk Assessment</th>
                  </tr>
               </thead>
               <tbody>
                  {sensitivityData.length > 0 ? sensitivityData.map((row, idx) => (
                     <tr key={idx} className={`border-b border-slate-100 ${idx === 1 ? 'bg-blue-50/50' : ''}`}>
                        <td className="py-2 font-bold text-slate-800">{row.scenarioName}</td>
                        <td className={`py-2 font-mono ${row.smpVariation < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                           {row.smpVariation > 0 ? '+' : ''}{row.smpVariation}%
                        </td>
                        <td className="py-2 font-bold text-blue-700">{formatMoney(row.netProfit)}</td>
                        <td className="py-2 font-bold">{row.roi}%</td>
                        <td className="py-2 text-[10px]">
                           {row.netProfit > 0 ? <span className="text-green-600 font-bold">PROFITABLE</span> : <span className="text-red-500 font-bold">RISK</span>}
                        </td>
                     </tr>
                  )) : (
                     <tr><td colSpan={5} className="py-4 text-slate-400">분석 데이터 없음</td></tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Cumulative Cash Flow Chart */}
         <div className="flex-1 flex flex-col justify-center border border-slate-200 rounded-lg p-4 bg-white relative overflow-hidden">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center absolute top-4 left-0 right-0">Cumulative Cash Flow (20 Years)</h3>
            <div style={{ width: '100%', height: '100%' }} className="flex items-center justify-center pt-4">
               <ComposedChart width={CONTENT_WIDTH - 60} height={250} data={sim.yearlyData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} width={40} axisLine={false} tickLine={false} />
                  <ReferenceLine y={0} stroke="#334155" />
                  <Legend verticalAlign="top" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="cumulativeCashFlow" name="누적 현금" fill="#bfdbfe" stroke="#3b82f6" isAnimationActive={false} />
                  <Bar dataKey="netRevenue" name="연간 순이익" fill="#86efac" barSize={10} isAnimationActive={false} />
               </ComposedChart>
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
};

// --- Page 4: Financial Details (New) ---
const PageFinancialDetails = ({ sim, config, pageNum, totalPages }: { sim: SimulationResult, config: SystemConfig, pageNum: number, totalPages: number }) => {
   const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR').format(Math.round(val));
   const hasLoan = sim.yearlyData.length > 0 && (sim.yearlyData[0].loanPayment || 0) > 0;

   return (
      <div style={PAGE_STYLE}>
         <ReportHeader title="연도별 재무 상세" subTitle="Yearly Financial Details (20-Year Forecast)" />

         <div className="flex-1 overflow-hidden relative border-t-2 border-slate-800">
            <table className="w-full text-[9px] text-right border-collapse table-fixed">
               <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                     <th className="py-2 px-1 w-[6%] text-center">연차</th>
                     <th className="py-2 px-1 w-[10%] text-center">발전량<br />(MWh)</th>
                     <th className="py-2 px-1 w-[12%] text-center">매출<br />(Gross)</th>
                     <th className="py-2 px-1 w-[12%] text-center">운영비<br />(OPEX)</th>
                     {hasLoan && (
                        <>
                           <th className="py-2 px-1 w-[11%] text-center text-amber-600">이자비용</th>
                           <th className="py-2 px-1 w-[11%] text-center text-amber-700">원금상환</th>
                        </>
                     )}
                     <th className="py-2 px-1 w-[10%] text-center text-purple-600">법인세</th>
                     <th className="py-2 px-1 w-[13%] text-center text-green-700">순현금흐름<br />(Net)</th>
                     <th className="py-2 px-1 w-[15%] text-center text-blue-700">누적수익<br />(Cumulative)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {sim.yearlyData.map((row) => (
                     <tr key={row.year} className="hover:bg-slate-50">
                        <td className="py-2 px-1 text-center font-bold text-slate-900">{row.year}</td>
                        <td className="py-2 px-1 text-center text-slate-600">{(row.annualGeneration / 1000).toFixed(1)}</td>
                        <td className="py-2 px-1 pr-2 text-slate-800 font-medium">{formatMoney(row.grossRevenue)}</td>
                        <td className="py-2 px-1 pr-2 text-red-400">-{formatMoney(row.maintenanceCost)}</td>
                        {hasLoan && (
                           <>
                              <td className="py-2 px-1 pr-2 text-amber-600">-{formatMoney(row.interestPayment || 0)}</td>
                              <td className="py-2 px-1 pr-2 text-amber-700">-{formatMoney(row.principalPayment || 0)}</td>
                           </>
                        )}
                        <td className="py-2 px-1 pr-2 text-purple-500">-{formatMoney(row.corporateTax || 0)}</td>
                        <td className="py-2 px-1 pr-2 font-bold text-green-700">{formatMoney(row.netRevenue)}</td>
                        <td className={`py-2 px-1 pr-2 font-bold ${row.cumulativeCashFlow >= 0 ? 'text-blue-700' : 'text-red-400'}`}>
                           {formatMoney(row.cumulativeCashFlow)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
}

// --- Page 5: Generation Analysis (New) ---
const PageGenerationAnalysis = ({ sim, config, pageNum, totalPages }: { sim: SimulationResult, config: SystemConfig, pageNum: number, totalPages: number }) => {
   const monthlyData = (sim.monthlyGeneration || []).map((val, idx) => ({ month: idx + 1, gen: val }));
   const hourlyData = (sim.hourlyGeneration || []).map((val, idx) => ({ hour: idx, gen: val }));

   return (
      <div style={PAGE_STYLE}>
         <ReportHeader title="발전량 상세 분석" subTitle="Detailed Generation Analysis" />

         {/* Environmental Impact (ESG) */}
         <div className="bg-teal-50 border border-teal-100 rounded-lg p-5 mb-8 shrink-0 flex justify-around items-center text-center">
            <div>
               <div className="text-[10px] font-bold text-teal-600 uppercase mb-1">CO₂ Reduction</div>
               <div className="text-2xl font-black text-teal-800">{sim.environmentalImpact.co2Reduction.toLocaleString()} <span className="text-sm font-medium">tCO₂</span></div>
            </div>
            <div className="w-px h-10 bg-teal-200"></div>
            <div>
               <div className="text-[10px] font-bold text-teal-600 uppercase mb-1">Pine Trees Planted</div>
               <div className="text-2xl font-black text-teal-800">{sim.environmentalImpact.pineTreesPlanted.toLocaleString()} <span className="text-sm font-medium">Trees</span></div>
            </div>
            <div className="w-px h-10 bg-teal-200"></div>
            <div>
               <div className="text-[10px] font-bold text-teal-600 uppercase mb-1">Oil Substitution</div>
               <div className="text-2xl font-black text-teal-800">{sim.environmentalImpact.oilSubstitution.toLocaleString()} <span className="text-sm font-medium">TOE</span></div>
            </div>
         </div>

         <div className="flex-1 flex flex-col gap-8">
            {/* Monthly Generation Chart */}
            <div className="flex-1 border border-slate-200 rounded-lg p-4 flex flex-col items-center">
               <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 w-full text-left">월별 예상 발전량 (Monthly Generation)</h3>
               <div style={{ width: 650, height: 280 }}>
                  <BarChart width={650} height={280} data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                     <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                     <Bar dataKey="gen" fill="#6366f1" barSize={25} isAnimationActive={false} label={{ position: 'top', fontSize: 10, formatter: (v: number) => (v / 1000).toFixed(1) }} />
                  </BarChart>
               </div>
            </div>

            {/* Daily Profile Chart */}
            <div className="flex-1 border border-slate-200 rounded-lg p-4 flex flex-col items-center">
               <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 w-full text-left">시간대별 발전 패턴 (Hourly Profile)</h3>
               <div style={{ width: 650, height: 280 }}>
                  <AreaChart width={650} height={280} data={hourlyData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="hour" fontSize={11} interval={2} />
                     <YAxis fontSize={11} width={40} />
                     <Area type="monotone" dataKey="gen" name="시간당 발전량" stroke="#f59e0b" fill="#fcd34d" isAnimationActive={false} />
                  </AreaChart>
               </div>
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
};

// --- Page 6: Generation Data & Loss (New) ---
const PageGenerationData = ({ sim, config, econ, pageNum, totalPages }: { sim: SimulationResult, config: SystemConfig, econ: EconomicConfig, pageNum: number, totalPages: number }) => {
   const monthlyData = (sim.monthlyGeneration || []).map((val, idx) => ({
      month: idx + 1,
      gen: val,
      insolation: sim.monthlyAvgInsolation?.[idx] || 0
   }));
   const lossData = sim.lossDiagramData || [];
   const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR').format(Math.round(val));

   return (
      <div style={PAGE_STYLE}>
         <ReportHeader title="발전 데이터 상세" subTitle="Generation Data & Loss Diagram" />

         {/* Monthly Data Table */}
         <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-2 border-l-4 border-slate-900 pl-2">월별 상세 데이터 (Monthly Data)</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
               <table className="w-full text-[10px] text-right border-collapse">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                     <tr>
                        <th className="py-2 px-2 text-center border-b border-slate-200">월</th>
                        <th className="py-2 px-2 border-b border-slate-200">일사량 (hr)</th>
                        <th className="py-2 px-2 border-b border-slate-200">발전량 (kWh)</th>
                        <th className="py-2 px-2 text-slate-500 border-b border-slate-200">SMP 수익</th>
                        <th className="py-2 px-2 text-slate-500 border-b border-slate-200">REC 수익</th>
                        <th className="py-2 px-2 text-blue-700 border-b border-slate-200">총 예상 수익</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {monthlyData.map((row) => {
                        const smpRev = row.gen * econ.smp;
                        const recRev = (row.gen / 1000) * econ.recPrice * econ.recWeight;
                        return (
                           <tr key={row.month} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-center font-bold text-slate-700">{row.month}월</td>
                              <td className="py-2 px-2 text-slate-600">{row.insolation.toFixed(2)}</td>
                              <td className="py-2 px-2 font-bold text-slate-800">{row.gen.toLocaleString()}</td>
                              <td className="py-2 px-2 text-slate-500">{formatMoney(smpRev)}</td>
                              <td className="py-2 px-2 text-slate-500">{formatMoney(recRev)}</td>
                              <td className="py-2 px-2 font-bold text-blue-700">{formatMoney(smpRev + recRev)}</td>
                           </tr>
                        );
                     })}
                     <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <td className="py-2 px-2 text-center text-slate-900">합계</td>
                        <td className="py-2 px-2 text-slate-900">-</td>
                        <td className="py-2 px-2 text-slate-900">{sim.yearlyData[0]?.annualGeneration.toLocaleString() || 0}</td>
                        <td className="py-2 px-2 text-slate-900" colSpan={3}>{formatMoney(sim.yearlyData[0]?.grossRevenue || 0)}</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>

         {/* Loss Diagram */}
         <div className="border border-slate-200 rounded-lg p-4 flex flex-col mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-2">시스템 손실 다이어그램 (Loss Waterfall)</h3>
            <div className="flex items-center justify-start pl-4">
               <div style={{ width: '100%', height: 200 }}>
                  <BarChart width={600} height={200} data={lossData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} interval={0} />
                     <Bar dataKey="value" barSize={20} label={{ position: 'right', fontSize: 11, fontWeight: 'bold', fill: '#334155', formatter: (v: number) => v.toFixed(1) + '%' }} isAnimationActive={false} radius={[0, 4, 4, 0]}>
                        {lossData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </div>
            </div>
         </div>

         {/* Disclaimer Footer (New) */}
         <div className="mt-2">
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
               <strong className="block text-[9px] text-slate-500 mb-1">[면책 조항 (Disclaimer)]</strong>
               <p className="text-[8px] text-slate-400 text-justify leading-relaxed">
                  본 시뮬레이션 리포트는 입력된 가정치(기상 데이터, 장비 사양, 경제 지표 등)를 바탕으로 추정한 예상 결과이며, 실제 발전량 및 수익성을 보증하지 않습니다.
                  실제 결과는 현장의 기후 조건, 음영, 설비의 유지관리 상태, 계통 상황, 정부 정책 및 전력 시장 가격 변동 등 다양한 요인에 따라 달라질 수 있습니다.
                  따라서 본 리포트는 사업 타당성 검토를 위한 참고 자료로만 활용되어야 하며, 최종 투자는 전문가의 상세 검토를 거쳐 결정하시기 바랍니다.
                  Solar Array Architect는 본 리포트의 결과 활용에 따른 어떠한 법적 책임도 지지 않습니다.
               </p>
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
}

// --- Page 7+: BOM (Dynamic) ---
const PageBOM = ({ config, items, pageNum, totalPages, subIndex, totalSubPages }: { config: SystemConfig, items: BOMItem[], pageNum: number, totalPages: number, subIndex: number, totalSubPages: number }) => {
   return (
      <div style={PAGE_STYLE}>
         <ReportHeader
            title={`자재 명세서 (${subIndex + 1}/${totalSubPages})`}
            subTitle="Bill of Materials (BOM)"
         />

         <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-2">
               주요 기자재 내역 {totalSubPages > 1 && `(Part ${subIndex + 1})`}
            </h3>
            <div className="flex-1 border-t border-slate-800 relative">
               <table className="w-full text-[10px] text-left border-collapse table-fixed">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                     <tr>
                        <th className="p-2 w-[15%] border-b border-slate-200">Category</th>
                        <th className="p-2 w-[20%] border-b border-slate-200">Item Name</th>
                        <th className="p-2 w-[50%] border-b border-slate-200">Specification</th>
                        <th className="p-2 w-[7%] text-right border-b border-slate-200">Qty</th>
                        <th className="p-2 w-[8%] text-center border-b border-slate-200">Unit</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="p-2 font-medium text-slate-500 break-words align-top">{item.category}</td>
                           <td className="p-2 font-bold text-slate-800 break-words align-top">{item.item}</td>
                           <td className="p-2 text-slate-600 font-mono tracking-tight text-[9px] break-words whitespace-pre-wrap align-top">{item.spec}</td>
                           <td className="p-2 text-right font-bold whitespace-nowrap align-top">{typeof item.qty === 'number' ? item.qty.toLocaleString() : item.qty}</td>
                           <td className="p-2 text-center text-slate-400 whitespace-nowrap align-top">{item.unit}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
};

// --- Page 8+: Process Roadmap (Dynamic) ---
const PageProcess = ({ config, steps, pageNum, totalPages, subIndex, totalSubPages }: { config: SystemConfig, steps: ProcessStep[], pageNum: number, totalPages: number, subIndex: number, totalSubPages: number }) => {
   return (
      <div style={PAGE_STYLE}>
         <ReportHeader
            title={`사업 추진 절차 (${subIndex + 1}/${totalSubPages})`}
            subTitle="Project Implementation Roadmap"
         />

         {subIndex === 0 && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed shrink-0 shadow-sm">
               <strong className="block text-slate-900 mb-1">📌 가이드라인</strong>
               본 사업의 성공적인 수행을 위한 단계별 인허가 및 공사 절차 가이드라인입니다.
               주요 마일스톤(Milestone)을 준수하여 프로젝트 리스크를 최소화하시기 바랍니다.
            </div>
         )}

         <div className="flex-1 relative overflow-hidden px-6">
            {/* Timeline Line */}
            <div className="absolute left-10 top-4 bottom-4 w-0.5 bg-slate-200"></div>

            <div className="space-y-4"> {/* Reduced spacing between steps */}
               {steps.map((step, idx) => (
                  <div key={step.id} className="relative pl-24">
                     {/* Timeline Dot centered on line */}
                     <div className={`absolute left-7 top-1 w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center text-[11px] font-bold text-white z-10 ${step.color.replace('bg-', '!bg-')}`}>
                        {(subIndex * 4) + idx + 1}
                     </div>

                     <div className="flex items-start group">
                        <div className="w-28 flex-shrink-0 pt-1.5 absolute left-[-80px] text-right pr-6">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-slate-600 transition-colors">{step.phase}</span>
                        </div>
                        <div className="flex-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                           <h4 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                              {step.title}
                              <span className={`text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal`}>{step.duration}</span>
                           </h4>
                           <p className="text-xs text-slate-500 mb-2 leading-relaxed">{step.description}</p>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                              <ul className="text-[10px] text-slate-600 space-y-1">
                                 {step.details.map((d, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                       <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 flex-shrink-0"></span>
                                       <span className="leading-relaxed">{d}</span>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <ReportFooter page={pageNum} total={totalPages} confName={config.name} />
      </div>
   );
};


// --- Main Report Container ---

export const ReportSection = ({ onClose }: { onClose: () => void }) => {
   const { results, module, inverter, config, simulationResults, economicConfig, recalculateResults } = useStore();
   const [fileName, setFileName] = useState(`${config.targetCapacity}kW_태양광발전소설계`);
   const [isGenerating, setIsGenerating] = useState(false);
   const [dateStr, setDateStr] = useState('');

   useEffect(() => {
      recalculateResults(); // Ensure data consistency
      setDateStr(new Date().toLocaleDateString('ko-KR'));
   }, []);

   // 1. Process Steps Chunking
   // Reverted chunk size to 5 to prevent truncation
   const processChunks = useMemo<ProcessStep[][]>(() => chunkArray(PROCESS_STEPS, 4), []);

   // 2. BOM Chunking
   const bomChunks = useMemo<BOMItem[][]>(() => chunkArray(results.bom, 20), [results.bom]);

   // Calculate total pages
   // Fixed pages: 1(Exec) + 1(Eng) + 1(Econ) + 1(EconDetail) + 1(GenAnalysis) + 1(GenData) = 6
   const fixedPages = 6;
   const totalPages = fixedPages + bomChunks.length + processChunks.length;

   const handleDownload = async () => {
      if (!fileName) return alert("파일명 입력 필요");
      setIsGenerating(true);
      // UI 업데이트 (Gap 제거) 적용을 위한 지연
      setTimeout(async () => {
         const success = await generatePDF('report-content', fileName);
         if (!success) alert("PDF 생성 중 오류가 발생했습니다.");
         setIsGenerating(false);
      }, 500);
   };

   if (!results || !simulationResults) return null;

   const summaryText = generateConfigurationSummary(module, inverter, results.configuration, results.inverterCount);

   return (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur flex justify-center py-8 overflow-y-auto" onClick={onClose}>
         <div className="w-full max-w-[900px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4 md:gap-0">
               <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="bg-slate-900 text-white p-2 rounded shrink-0">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900">Report Preview</h2>
                     <p className="text-xs text-slate-500">A4 Standard Format ({totalPages} Pages)</p>
                  </div>
                  <button onClick={onClose} className="md:hidden ml-auto text-slate-400 hover:text-slate-600 p-2">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <input
                     type="text"
                     value={fileName}
                     onChange={e => setFileName(e.target.value)}
                     className="bg-slate-100 border-none rounded px-3 py-2 text-sm font-medium w-full sm:w-48"
                     placeholder="File Name"
                  />
                  <button
                     onClick={handleDownload}
                     disabled={isGenerating}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  >
                     {isGenerating ? "Generating..." : "Download PDF"}
                  </button>
                  <button onClick={onClose} className="hidden md:block text-slate-400 hover:text-slate-600 p-2">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
            </div>

            {/* Report Content Container */}
            <div className="flex justify-center bg-slate-500/50 p-8 rounded-lg min-h-screen overflow-auto">
               <div className={`origin-top transition-transform ${isGenerating ? '' : 'transform scale-95 md:scale-100'}`}>
                  <div
                     id="report-content"
                     className={`flex flex-col ${isGenerating ? 'gap-0 bg-white' : 'gap-8 bg-slate-500/10'}`}
                  >
                     {/* Page 1: Executive Summary */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageOne config={config} module={module} inverter={inverter} summaryText={summaryText} date={dateStr} pageNum={1} totalPages={totalPages} />
                     </div>

                     {/* Page 2: Engineering */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageTwo results={results} module={module} inverter={inverter} config={config} pageNum={2} totalPages={totalPages} />
                     </div>

                     {/* Page 3: Economics Overview */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageThree sim={simulationResults} econ={economicConfig} config={config} pageNum={3} totalPages={totalPages} />
                     </div>

                     {/* Page 4: Financial Details (New) */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageFinancialDetails sim={simulationResults} config={config} pageNum={4} totalPages={totalPages} />
                     </div>

                     {/* Page 5: Generation Analysis (New) */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageGenerationAnalysis sim={simulationResults} config={config} pageNum={5} totalPages={totalPages} />
                     </div>

                     {/* Page 6: Generation Data & Loss (New) */}
                     <div className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                        <PageGenerationData sim={simulationResults} config={config} econ={economicConfig} pageNum={6} totalPages={totalPages} />
                     </div>

                     {/* Dynamic BOM Pages */}
                     {bomChunks.map((chunk, idx) => (
                        <div key={`bom-${idx}`} className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                           <PageBOM
                              config={config}
                              items={chunk}
                              pageNum={fixedPages + 1 + idx}
                              totalPages={totalPages}
                              subIndex={idx}
                              totalSubPages={bomChunks.length}
                           />
                        </div>
                     ))}

                     {/* Dynamic Process Pages */}
                     {processChunks.map((chunk, idx) => (
                        <div key={`process-${idx}`} className={`${isGenerating ? '' : 'shadow-2xl'}`}>
                           <PageProcess
                              config={config}
                              steps={chunk}
                              pageNum={fixedPages + bomChunks.length + 1 + idx}
                              totalPages={totalPages}
                              subIndex={idx}
                              totalSubPages={processChunks.length}
                           />
                        </div>
                     ))}
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
};