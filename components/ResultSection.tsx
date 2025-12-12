import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { generateConfigurationSummary, calculateInverterGroups } from '../utils/solarCalculator';
import { BOMItem } from '../types';

// Sub-components
import { EngineeringView } from './results/EngineeringView';
import { EconomicsView } from './results/EconomicsView';
import { DetailedGenView } from './results/DetailedGenView';
import { ProcessGuideTab } from './results/ProcessGuideTab';
import { KPICard } from './dashboard/KPICard';
import { BOMDetailModal } from './dashboard/BOMDetailModal';

const formatLargeMoney = (val: number) => {
  if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)}만`;
  return val.toLocaleString();
};

/**
 * [결과 섹션 메인 컴포넌트]
 * 주요 역할: 상태 구독, 데이터 가공(Memoization), 탭 전환, 모달 관리
 * 렌더링 로직은 하위 뷰 컴포넌트로 위임하여 관심사를 분리함.
 */
export const ResultSection = () => {
  const { results, inverter, module, config, simulationResults, economicConfig } = useStore();
  const { configuration } = results;
  const [activeTab, setActiveTab] = useState<'engineering' | 'economics' | 'detailedGen' | 'process'>('engineering');
  const [selectedBOMItem, setSelectedBOMItem] = useState<BOMItem | null>(null);

  // --- Derived State (Memoized for Performance) ---

  const summaryText = useMemo(() =>
    generateConfigurationSummary(module, inverter, configuration, results.inverterCount),
    [module, inverter, configuration, results.inverterCount]);

  const inverterGroups = useMemo(() =>
    calculateInverterGroups(configuration.parallelStrings, results.inverterCount, configuration.seriesModules, module, inverter, results),
    [configuration, results.inverterCount, module, inverter, results]);

  const monthlyGenData = useMemo(() => (simulationResults.monthlyGeneration || []).map((val, idx) => ({
    month: `${idx + 1}월`,
    generation: val,
    insolation: simulationResults.monthlyAvgInsolation?.[idx] || 0,
  })), [simulationResults.monthlyGeneration, simulationResults.monthlyAvgInsolation]);

  const monthlyTableData = useMemo(() => (simulationResults.monthlyGeneration || []).map((val, idx) => ({
    month: idx + 1,
    gen: val,
    insolation: simulationResults.monthlyAvgInsolation?.[idx] || 0,
    smpRev: val * economicConfig.smp,
    recRev: (val / 1000) * economicConfig.recPrice * economicConfig.recWeight
  })), [simulationResults.monthlyGeneration, simulationResults.monthlyAvgInsolation, economicConfig]);

  const hourlyGenData = useMemo(() => (simulationResults.hourlyGeneration || []).map((val, idx) => ({
    hour: `${idx}시`,
    generation: val
  })), [simulationResults.hourlyGeneration]);

  const firstYearGen = simulationResults.yearlyData.length > 0 ? simulationResults.yearlyData[0].annualGeneration / 1000 : 0;
  const pr = simulationResults.lossDiagramData ? simulationResults.lossDiagramData[simulationResults.lossDiagramData.length - 1].value : 0;
  const totalModuleArea = (module.width * module.height * configuration.totalModules) / 1_000_000;
  const areaPyeong = totalModuleArea * 0.3025;

  return (
    <div className="space-y-6 h-full pb-4 relative">

      {/* 1. Executive Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="System Capacity"
          value={configuration.totalCapacity.toFixed(2)}
          unit="kW"
          subValue={`${configuration.totalModules} Modules / ${results.inverterCount} Inverters`}
          color="slate"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <KPICard
          label="Financials"
          value={formatLargeMoney(simulationResults.totalConstructionCost)}
          unit="원"
          subValue={`ROI ${simulationResults.roi.toFixed(1)}% | NPV ${formatLargeMoney(simulationResults.npv || 0)}`}
          color="primary"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          label="Performance (Year 1)"
          value={firstYearGen.toFixed(1)}
          unit="MWh"
          subValue={`Efficiency (PR): ${pr.toFixed(1)}%`}
          color="accent"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <KPICard
          label="ESG Impact"
          value={simulationResults.environmentalImpact.co2Reduction.toLocaleString()}
          unit="tCO₂"
          subValue={`소나무 ${simulationResults.environmentalImpact.pineTreesPlanted.toLocaleString()}그루 효과`}
          color="success"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* 2. Navigation Tabs */}
      <div className="sticky top-0 bg-slate-50 z-10 pt-1 pb-4 shadow-sm">
        <div className="flex space-x-1 rounded-xl bg-slate-200/50 p-1 overflow-x-auto backdrop-blur-sm">
          {[
            { id: 'engineering', label: '기술적 검토' },
            { id: 'economics', label: '수익성 분석' },
            { id: 'detailedGen', label: '상세 발전량' },
            { id: 'process', label: '사업 절차 (Process)', highlight: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] rounded-lg py-2.5 text-xs sm:text-sm font-medium leading-5 focus:outline-none transition-all duration-200 ${activeTab === tab.id
                  ? `bg-white shadow-sm ring-1 ring-black/5 ${tab.highlight ? 'text-indigo-600 font-bold' : 'text-slate-800 font-bold'}`
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Content Views */}
      <div className="min-h-[500px]">
        {activeTab === 'engineering' && (
          <EngineeringView
            config={config} module={module} inverter={inverter} results={results} inverterGroups={inverterGroups}
            summaryText={summaryText} totalModuleArea={totalModuleArea} areaPyeong={areaPyeong} onBOMSelect={setSelectedBOMItem}
          />
        )}

        {activeTab === 'economics' && <EconomicsView sim={simulationResults} econ={economicConfig} />}

        {activeTab === 'detailedGen' && (
          <DetailedGenView
            sim={simulationResults} econ={economicConfig}
            monthlyGenData={monthlyGenData} monthlyTableData={monthlyTableData} hourlyGenData={hourlyGenData}
          />
        )}

        {activeTab === 'process' && <ProcessGuideTab />}
      </div>

      {selectedBOMItem && <BOMDetailModal item={selectedBOMItem} onClose={() => setSelectedBOMItem(null)} />}
    </div>
  );
};
