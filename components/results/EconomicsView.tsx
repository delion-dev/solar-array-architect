import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, ReferenceLine, Cell } from 'recharts';
import { KPICard } from '../dashboard/KPICard';
import { SimulationResult, EconomicConfig } from '../../types';

const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(val);
const formatLargeMoney = (val: number) => {
    if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
    if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)}만`;
    return val.toLocaleString();
};

export const EconomicsView = ({ sim, econ }: { sim: SimulationResult, econ: EconomicConfig }) => {
    const sensitivityData = sim?.sensitivityAnalysis || [];
    const hasLoan = sim.yearlyData.length > 0 && (sim.yearlyData[0].loanPayment || 0) > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-l-4 border-l-success shadow-sm">
                <CardContent className="p-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">분석 개요 및 산출 근거 (Analysis Logic)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <strong className="text-slate-800 block mb-1 text-sm">1. 세후 현금흐름 (Net Cash Flow)</strong>
                            <p className="leading-relaxed">매출(SMP+REC)에서 운영비, 대출 원리금, 법인세를 차감한 실제 현금흐름입니다. 물가상승률({econ.inflationRate ?? 0}%)이 반영되었습니다.</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <strong className="text-slate-800 block mb-1 text-sm">2. 재무 지표 (Financial Metrics)</strong>
                            <p className="leading-relaxed">NPV는 할인율 4.5%를 적용하여 산출하였으며, LCOE는 생애주기 총비용을 총발전량으로 나누어 계산했습니다.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard label="20년 누적 순수익" value={sim.totalNetProfit} unit="원" color="success" />
                <KPICard label="순현재가치 (NPV)" value={sim.npv || 0} unit="원" color="primary" />
                <KPICard label="총 투자비 (CAPEX)" value={sim.totalConstructionCost} unit="원" color="slate" />
                <KPICard label="투자 수익률 (ROI)" value={sim.roi.toFixed(1)} unit="%" color="accent" />
                <KPICard label="균등화 발전원가 (LCOE)" value={sim.lcoe ? sim.lcoe.toFixed(1) : 0} unit="원/kWh" color="warning" />
                <KPICard label="투자 회수 기간 (Payback)" value={sim.paybackPeriod > 0 ? sim.paybackPeriod.toFixed(1) : '>20'} unit="년" color="danger" />
            </div>

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
