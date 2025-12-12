import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { KPICard } from '../dashboard/KPICard';
import { SimulationResult, EconomicConfig } from '../../types';

const formatMoney = (val: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(val);

export const DetailedGenView = ({ sim, econ, monthlyGenData, monthlyTableData, hourlyGenData }: { sim: SimulationResult, econ: EconomicConfig, monthlyGenData: any[], monthlyTableData: any[], hourlyGenData: any[] }) => {
    const totalGen = monthlyGenData.reduce((a, b) => a + b.generation, 0);
    const totalSmpRev = totalGen * econ.smp;
    const totalRecRev = (totalGen / 1000) * econ.recPrice * econ.recWeight;
    const grandTotalRev = totalSmpRev + totalRecRev;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard label="CO₂ 감축량" value={sim.environmentalImpact.co2Reduction.toLocaleString()} unit="tCO₂" color="success" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <KPICard label="소나무 식재 효과" value={sim.environmentalImpact.pineTreesPlanted.toLocaleString()} unit="그루" color="success" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
                <KPICard label="원유 대체 효과" value={sim.environmentalImpact.oilSubstitution.toLocaleString()} unit="TOE" color="slate" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} />
            </div>

            <Card className="shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">월별 예상 발전량</CardTitle></CardHeader>
                <CardContent className="h-80 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyGenData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis fontSize={11} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v: number) => [`${v.toLocaleString()} kWh`, '발전량']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="generation" fill="#6366f1" radius={[4, 4, 0, 0]} name="발전량 (kWh)" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">시간대별 발전 패턴 (Hourly Profile)</CardTitle></CardHeader>
                <CardContent className="h-80 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyGenData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="hour" fontSize={11} interval={2} tickLine={false} axisLine={false} />
                            <YAxis fontSize={11} width={40} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kWh`, '발전량']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="generation" stroke="#f59e0b" fill="#fcd34d" fillOpacity={0.6} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {sim.lossDiagramData && sim.lossDiagramData.length > 0 && (
                <Card className="shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">시스템 손실 분석 (Loss Waterfall)</CardTitle></CardHeader>
                    <CardContent className="h-96 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sim.lossDiagramData} layout="vertical" margin={{ left: 60 }}>
                                <CartesianGrid horizontal vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[60, 105]} hide />
                                <YAxis dataKey="name" type="category" width={120} fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fontWeight: 'bold', formatter: (v: number) => v.toFixed(1) }}>
                                    {sim.lossDiagramData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm">
                <CardHeader className="py-4 border-b border-slate-100"><CardTitle className="text-base">월별 상세 데이터 (Monthly Data Table)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <table className="min-w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-xs uppercase tracking-wider">
                            <tr><th className="px-4 py-3 text-center">월</th><th className="px-4 py-3">일사량 (hr)</th><th className="px-4 py-3">발전량 (kWh)</th><th className="px-4 py-3 text-slate-500">SMP 수익</th><th className="px-4 py-3 text-slate-500">REC 수익</th><th className="px-4 py-3 text-blue-600 font-bold">총 예상 수익</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {monthlyTableData.map((row) => (
                                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-center font-medium text-slate-800">{row.month}월</td>
                                    <td className="px-4 py-3 text-slate-600">{row.insolation.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-bold text-slate-700">{row.gen.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-slate-500">{formatMoney(row.smpRev)}</td>
                                    <td className="px-4 py-3 text-slate-500">{formatMoney(row.recRev)}</td>
                                    <td className="px-4 py-3 font-bold text-blue-600">{formatMoney(row.smpRev + row.recRev)}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                <td className="px-4 py-3 text-center">합계</td>
                                <td className="px-4 py-3">-</td>
                                <td className="px-4 py-3 text-slate-900">{totalGen.toLocaleString()}</td>
                                <td className="px-4 py-3 text-slate-600">{formatMoney(totalSmpRev)}</td>
                                <td className="px-4 py-3 text-slate-600">{formatMoney(totalRecRev)}</td>
                                <td className="px-4 py-3 text-blue-700">{formatMoney(grandTotalRev)}</td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};
