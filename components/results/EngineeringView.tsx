import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StringDiagram } from './StringDiagram';
import { SafetyGauge } from '../dashboard/SafetyGauge';
import { BOMItem, InverterGroup, SystemConfig, CalculationResult, PVModule, Inverter } from '../../types';

interface EngineeringViewProps {
    config: SystemConfig;
    module: PVModule;
    inverter: Inverter;
    results: CalculationResult;
    inverterGroups: InverterGroup[];
    summaryText: string;
    totalModuleArea: number;
    areaPyeong: number;
    onBOMSelect: (item: BOMItem) => void;
}

export const EngineeringView = ({
    config, module, inverter, results, inverterGroups, summaryText, totalModuleArea, areaPyeong, onBOMSelect
}: EngineeringViewProps) => {
    const { configuration, safety, tempValues, bom } = results;

    const chartData = useMemo(() => [
        { name: 'Winter (-10°C)', voc: tempValues.vocWinter, vmp: tempValues.vmpWinter, stringVoc: results.stringVoltageWinter },
        { name: 'Summer (70°C)', voc: tempValues.vocSummer, vmp: tempValues.vmpSummer, stringVoc: results.stringVocSummer }
    ], [tempValues, results.stringVoltageWinter, results.stringVocSummer]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="border-b border-slate-200 pb-4 mb-2">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {config.name || "프로젝트명 미지정"}
                </h2>
                <div className="flex items-center gap-2 mt-1 ml-9">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">Target: {config.targetCapacity}kW</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-500">Design: {configuration.totalCapacity.toFixed(2)} kWp (DC) / {inverter.ratedOutputPower * results.inverterCount} kW (AC)</span>
                </div>
            </div>

            <Card className="border-l-4 border-l-accent shadow-sm">
                <CardContent className="pb-4 pt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">최적 어레이 구성 (Optimal Config)</h2>
                            <div className="text-4xl font-black text-slate-900 tracking-tight">{configuration.seriesModules} <span className="text-lg font-medium text-slate-500">직렬</span> <span className="text-slate-300 mx-1">x</span> {configuration.parallelStrings} <span className="text-lg font-medium text-slate-500">병렬</span></div>
                            <div className="mt-2 flex space-x-4 text-sm text-slate-600 font-medium">
                                <span>총 모듈: {configuration.totalModules}매</span><span className="text-slate-300">|</span><span>DC 용량: {configuration.totalCapacity.toFixed(2)} kW</span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center flex-wrap gap-4">
                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><span className="text-slate-400">📏 모듈 규격:</span><span className="font-mono font-bold">{module.width} x {module.height} mm</span></div>
                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><span className="text-slate-400">📐 소요 면적:</span><span className="font-bold text-slate-800">{totalModuleArea.toFixed(1)} m²</span><span className="text-slate-500">({areaPyeong.toFixed(1)}평)</span></div>
                            </div>
                        </div>
                        <div className="text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">안전성 검토</div>
                            {safety.isVocSafe && safety.isVmpMinSafe && safety.isStartUpSafe && safety.isVoltageDropSafe ? (
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-2xl font-black text-green-600">적합 (Pass)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-2xl font-black text-red-600">부적합 (Fail)</span>
                                </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">모든 전기적 안전 기준 충족</div>
                        </div>
                    </div>
                </CardContent>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        설계 논리 (Design Logic)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <strong className="block text-slate-800 mb-1 flex justify-between">
                                <span>1. 직렬(Series) 산정</span>
                                <span className="text-indigo-600">{configuration.seriesModules} EA</span>
                            </strong>
                            <p className="text-slate-500 leading-relaxed">겨울철 모듈 전압({tempValues.vocWinter.toFixed(1)}V)이 인버터 최대입력({inverter.maxInputVoltage}V)을 넘지 않는 최대 수량입니다.</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <strong className="block text-slate-800 mb-1 flex justify-between">
                                <span>2. 인버터(Inverter) 산정</span>
                                <span className="text-indigo-600">{results.inverterCount} EA</span>
                            </strong>
                            <p className="text-slate-500 leading-relaxed">목표 용량({config.targetCapacity}kW)을 인버터 정격({inverter.ratedOutputPower}kW)으로 나눈 필요 수량입니다.</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed flex items-start gap-2 pt-3 border-t border-slate-200/50">
                        <span className="flex-shrink-0 mt-0.5 text-lg">💡</span><span className="font-medium text-slate-800">{summaryText}</span>
                    </p>
                </div>
            </Card>

            <StringDiagram seriesCount={configuration.seriesModules} moduleModel={module.model} inverterModel={inverter.model} config={config} inverterCount={results.inverterCount} dcVoltsMin={results.stringVoltageSummer} dcVoltsMax={results.stringVoltageWinter} acVolts={inverter.ratedOutputVoltage} />

            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/30"><CardTitle className="text-base">인버터별 모듈 배치 및 회로 구성표 (Inverter Array Schedule)</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm text-center">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-1/6 text-left">인버터 그룹</th><th className="px-4 py-3 w-1/12">수량</th><th className="px-4 py-3 w-1/12">직렬 (S)</th><th className="px-4 py-3 w-1/12">스트링 (P)</th><th className="px-4 py-3 w-1/6">모듈 수량/용량</th><th className="px-4 py-3 w-1/6">입력 전류</th><th className="px-4 py-3 w-1/6">입력 전압</th><th className="px-4 py-3 w-1/12">비고</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {inverterGroups.length > 0 ? inverterGroups.map((group, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-4 font-bold text-slate-800 text-left group-hover:text-indigo-600 transition-colors">{group.idRange}</td>
                                    <td className="px-4 py-4 text-slate-600">{group.count}대</td>
                                    <td className="px-4 py-4 font-mono text-indigo-600 font-bold">{configuration.seriesModules}</td>
                                    <td className="px-4 py-4 font-mono font-bold text-slate-800"><span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{group.strings}</span></td>
                                    <td className="px-4 py-4"><div className="font-bold text-slate-800">{group.modules} 매</div><div className="text-[10px] text-slate-400 mt-0.5">({group.kw.toFixed(2)}kWp)</div></td>
                                    <td className="px-4 py-4 font-mono font-bold text-slate-700">{group.current.toFixed(1)} A</td>
                                    <td className="px-4 py-4 text-xs"><span className="block text-slate-500">Min: {results.stringVoltageSummer.toFixed(1)} V</span><span className="block font-bold text-slate-700">Max: {results.stringVoltageWinter.toFixed(1)} V</span></td>
                                    <td className="px-4 py-4 text-xs"><span className={`inline-block px-2 py-1 rounded-full font-medium ${group.note === 'High Load' ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{group.note}</span><div className="mt-1 text-[10px] text-slate-400">Load: {group.dcAcRatio.toFixed(0)}%</div></td>
                                </tr>
                            )) : <tr><td colSpan={8} className="py-8 text-slate-400 text-center">구성 데이터 없음</td></tr>}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">전압 온도 특성 (Voltage-Temp)</CardTitle></CardHeader>
                    <CardContent className="h-72 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} width={40} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend />
                                <Bar dataKey="voc" fill="#0ea5e9" name="모듈 Voc" radius={[4, 4, 0, 0]} barSize={40} /><Bar dataKey="stringVoc" fill="#6366f1" name="스트링 전압 (Voc)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">인버터 매칭 안전성 (Safety Margin)</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm pt-6 pb-6 px-6">
                            <SafetyGauge label="최대 입력 전압" current={results.stringVoltageWinter} limit={inverter.maxInputVoltage} unit="V" subLabel="Voc @ Winter" />
                            <SafetyGauge label="MPPT 동작 상한" current={tempValues.vmpWinter} limit={inverter.maxMpptVoltage} unit="V" subLabel="Vmp @ Winter" />
                            <SafetyGauge label="MPPT 동작 하한" current={results.stringVoltageSummer} limit={inverter.minMpptVoltage} unit="V" type="min" subLabel="Vmp @ Summer" />
                            <SafetyGauge label="허용 전류" current={module.isc} limit={inverter.maxShortCircuitCurrent} unit="A" subLabel="Isc" />
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">케이블 전압강하 (Voltage Drop)</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm pt-6 px-6">
                            <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-600 font-medium">선정 규격 / 길이</span><span className="font-bold text-slate-800">{config.cableCrossSection} mm² / {config.cableLength} m</span></div>
                            <SafetyGauge label="전압 강하율" current={safety.voltageDrop} limit={3} unit="%" subLabel="Limit: 3%" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="border-t-4 border-t-slate-500 shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">주요 자재 내역서 (BOM)</CardTitle>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Click items for details</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                <tr><th className="px-6 py-3 text-left w-1/6">분류</th><th className="px-6 py-3 text-left w-1/4">품명</th><th className="px-6 py-3 text-left w-1/3">규격</th><th className="px-6 py-3 text-right w-1/12">수량</th><th className="px-6 py-3 text-center w-1/12">단위</th><th className="px-6 py-3 text-left text-xs w-1/6">비고</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {bom && bom.length > 0 ? bom.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => onBOMSelect(item)}>
                                        <td className="px-6 py-3 text-slate-600 font-medium">{item.category}</td>
                                        <td className="px-6 py-3 text-slate-800 font-bold flex items-center gap-2 group-hover:text-accent transition-colors">
                                            {item.item}
                                            {item.details && <span className="text-[8px] text-accent border border-accent rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity">INFO</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 text-xs font-mono truncate max-w-xs">{item.spec}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-700">{typeof item.qty === 'number' ? item.qty.toLocaleString() : item.qty}</td>
                                        <td className="px-6 py-3 text-center text-slate-500">{item.unit}</td>
                                        <td className="px-6 py-3 text-slate-400 text-xs">{item.remark}</td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">자재 내역 없음</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
