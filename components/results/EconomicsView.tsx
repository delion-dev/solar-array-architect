import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, ReferenceLine, Cell } from 'recharts';
import { KPICard } from '../dashboard/KPICard';
import { SimulationResult, EconomicConfig } from '../../types';

/**
 * [유틸리티: 금액 포맷팅]
 * 천 단위 콤마를 추가하여 한국 원화 형식으로 표시합니다.
 */
const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(val);

/**
 * [유틸리티: 큰 금액 단위 변환]
 * 억, 만 단위로 변환하여 차트 가독성을 높입니다.
 */
const formatLargeMoney = (val: number) => {
    if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
    if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)}만`;
    return val.toLocaleString();
};

/**
 * [수익성 분석 뷰 컴포넌트]
 * 20년간의 경제성 시뮬레이션 결과를 차트와 테이블로 시각화합니다.
 */
export const EconomicsView = ({ sim, econ }: { sim: SimulationResult, econ: EconomicConfig }) => {
    const sensitivityData = sim?.sensitivityAnalysis || [];
    const hasLoan = sim.yearlyData.length > 0 && (sim.yearlyData[0].loanPayment || 0) > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 1. 분석 개요 섹션 */}
            <Card className="border-l-4 border-l-success shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <CardContent className="p-6 relative z-10">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        분석 개요 및 산출 근거 (Analysis Logic)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <strong className="text-slate-900 block mb-2 text-sm font-bold flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-success/10 text-success flex items-center justify-center text-[10px]">01</span>
                                세후 현금흐름 (Net Cash Flow)
                            </strong>
                            <p className="leading-relaxed opacity-80">매출(SMP+REC)에서 운영비, 대출 원리금, 법인세를 차감한 실제 현금흐름입니다. 물가상승률({econ.inflationRate ?? 0}%)과 과설계 손실({econ.clippingLoss ?? 0}%)이 반영되었습니다.</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <strong className="text-slate-900 block mb-2 text-sm font-bold flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px]">02</span>
                                재무 지표 (Financial Metrics)
                            </strong>
                            <p className="leading-relaxed opacity-80">NPV는 할인율 {econ.discountRate ?? 4.5}%를 적용하여 산출하였으며, LCOE는 생애주기 총비용을 총발전량으로 나누어 계산했습니다.</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
                            <strong className="text-slate-900 block mb-2 text-sm font-bold flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px]">03</span>
                                설계 용량 기반 산정 (Design Capacity Based)
                            </strong>
                            <p className="leading-relaxed opacity-80">모든 수익성 지표는 사용자가 입력한 목표 용량이 아닌, 실제 모듈 배치와 인버터 매칭을 통해 산출된 <strong>설계 용량({(sim.systemCapacityKw || 0).toFixed(2)}kW)</strong>을 기준으로 계산되었습니다. 이는 실제 설치될 설비의 물리적 구성을 반영한 가장 정확한 분석 결과입니다.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. 핵심 KPI 카드 섹션 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="20년 누적 순수익" value={sim.totalNetProfit} unit="원" color="success" />
                <KPICard label="순현재가치 (NPV)" value={sim.npv || 0} unit="원" color="primary" />
                <KPICard label="투자 수익률 (ROI)" value={sim.roi.toFixed(1)} unit="%" color="accent" />
                <KPICard label="투자 회수 기간 (Payback)" value={sim.paybackPeriod > 0 ? sim.paybackPeriod.toFixed(1) : '>20'} unit="년" color="danger" />
                <KPICard label="균등화 발전원가 (LCOE)" value={sim.lcoe ? sim.lcoe.toFixed(1) : 0} unit="원/kWh" color="warning" />
                <KPICard label="IAM 손실률" value={sim.iamLossPercent || 0} unit="%" color="slate" />
                <KPICard label="과설계 손실 (Clipping)" value={sim.clippingLossPercent || 0} unit="%" color="slate" />
                <KPICard label="총 투자비 (CAPEX)" value={sim.totalConstructionCost} unit="원" color="slate" />
            </div>

            {/* 3. BESS 결과 섹션 (활성화 시) */}
            {sim.bessResult && (
                <Card className="border-l-4 border-l-amber-500 shadow-sm overflow-hidden bg-amber-50/30">
                    <CardHeader className="py-4 border-b border-amber-100">
                        <CardTitle className="text-base flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            BESS 시뮬레이션 결과 (Battery Performance)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">20년 총 방전량</span>
                                <div className="text-lg font-black text-amber-600">{(sim.bessResult.dischargedEnergyTotal20y).toFixed(1)} <span className="text-xs font-normal">MWh</span></div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">자가소비 증가분</span>
                                <div className="text-lg font-black text-amber-600">{sim.bessResult.selfConsumptionIncrease.toFixed(1)} <span className="text-xs font-normal">%</span></div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">피크 저감 편익</span>
                                <div className="text-lg font-black text-amber-600">{formatLargeMoney(sim.bessResult.peakShavingBenefit)} <span className="text-xs font-normal">원</span></div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">배터리 투자비</span>
                                <div className="text-lg font-black text-amber-600">{formatLargeMoney(sim.bessResult.bessCapex)} <span className="text-xs font-normal">원</span></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. 손실 Waterfall 차트 섹션 */}
            <Card className="shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100">
                    <CardTitle className="text-base flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                        시스템 손실 분석 (Loss Waterfall)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sim.lossDiagramData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} unit="%" domain={[0, 100]} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(val: number) => `${val.toFixed(1)}%`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {sim.lossDiagramData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-4 text-center leading-relaxed">
                        * Nominal(100%)에서 각 손실 요인이 순차적으로 적용된 최종 시스템 효율(PR)을 나타냅니다.
                    </p>
                </CardContent>
            </Card>

            {/* 5. 민감도 분석 섹션 */}
            {sensitivityData.length > 0 && (
                <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">사업 리스크 민감도 분석 (Sensitivity Analysis)</CardTitle></CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sensitivityData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" fontSize={11} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="scenarioName" type="category" width={120} fontSize={11} axisLine={false} tickLine={false} />
                                        <ReferenceLine x={sensitivityData[1].netProfit} stroke="#64748b" strokeDasharray="3 3" />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: number) => `${formatMoney(val)} 원`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                        <Bar dataKey="netProfit" name="총 순이익 (Net Profit)" barSize={30} radius={[0, 4, 4, 0]}>
                                            {sensitivityData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#f87171' : index === 2 ? '#4ade80' : '#60a5fa'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm shadow-sm">
                                    <strong className="block text-slate-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        리스크 분석 리포트
                                    </strong>
                                    <p className="text-slate-600 leading-relaxed">
                                        최악의 시나리오(SMP/REC 하락)에서도 <span className={sensitivityData[0].netProfit > 0 ? "font-bold text-green-600 bg-green-50 px-1 rounded" : "font-bold text-red-600 bg-red-50 px-1 rounded"}>{sensitivityData[0].netProfit > 0 ? "흑자 전환 가능" : "적자 위험 존재"}</span>합니다.
                                        <br />시나리오별 변동폭은 약 <span className="font-mono font-bold text-slate-800">{formatLargeMoney(sensitivityData[2].netProfit - sensitivityData[0].netProfit)}원</span>입니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. 수익/비용 및 현금흐름 차트 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">연간 수익/비용 구조</CardTitle></CardHeader>
                    <CardContent className="h-80 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sim.yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={formatLargeMoney} fontSize={11} width={60} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(value: any) => `${formatMoney(Number(value))} KRW`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="grossRevenue" name="총 매출" stackId="a" fill="#86efac" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="maintenanceCost" name="운영비" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="netRevenue" name="세후 현금흐름" stroke="#15803d" strokeWidth={3} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">누적 현금 흐름 (Cash Flow)</CardTitle></CardHeader>
                    <CardContent className="h-80 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sim.yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={formatLargeMoney} fontSize={11} width={60} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(value: any) => `${formatMoney(Number(value))} KRW`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <Area type="monotone" dataKey="cumulativeCashFlow" name="누적 수익" fill="#bfdbfe" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.5} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 5. 연도별 상세 데이터 테이블 섹션 */}
            <Card className="shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">연도별 재무 상세 (Financial Details)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-center">연차</th><th className="px-4 py-3 text-right">발전량(MWh)</th><th className="px-4 py-3 text-right">매출</th><th className="px-4 py-3 text-right text-red-400">운영비</th>
                                {hasLoan && <><th className="px-4 py-3 text-right text-amber-500">이자</th><th className="px-4 py-3 text-right text-amber-600">원금</th></>}
                                <th className="px-4 py-3 text-right text-purple-500">법인세</th><th className="px-4 py-3 text-right text-green-600">순현금</th><th className="px-4 py-3 text-right text-blue-600">누적</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {sim.yearlyData.map((row) => (
                                <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-center font-medium text-slate-700">{row.year}년</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{(row.annualGeneration / 1000).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{formatMoney(row.grossRevenue)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">-{formatMoney(row.maintenanceCost)}</td>
                                    {hasLoan && <><td className="px-4 py-3 text-right text-amber-500">-{formatMoney(row.interestPayment || 0)}</td><td className="px-4 py-3 text-right text-amber-600">-{formatMoney(row.principalPayment || 0)}</td></>}
                                    <td className="px-4 py-3 text-right text-purple-500">-{formatMoney(row.corporateTax || 0)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(row.netRevenue)}</td>
                                    <td className={`px-4 py-3 text-right font-medium ${row.cumulativeCashFlow >= 0 ? 'text-blue-600' : 'text-slate-400'}`}>{formatMoney(row.cumulativeCashFlow)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};
