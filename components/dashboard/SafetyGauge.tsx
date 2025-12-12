import React from 'react';

interface SafetyGaugeProps {
    label: string;
    current: number;
    limit: number;
    unit: string;
    type?: 'max' | 'min';
    subLabel?: string;
}

export const SafetyGauge = ({ label, current, limit, unit, type = 'max', subLabel }: SafetyGaugeProps) => {
    let percent = 0;
    let isSafe = false;
    let isWarning = false;

    if (type === 'max') {
        percent = Math.min((current / limit) * 100, 100);
        isSafe = current <= limit;
        isWarning = isSafe && percent > 95;
    } else {
        percent = current > 0 ? Math.min((limit / current) * 100, 100) : 100;
        isSafe = current >= limit;
        isWarning = isSafe && percent > 95;
    }

    const colorClass = !isSafe ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500';
    const textColor = !isSafe ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-700';
    const statusText = isSafe ? (isWarning ? 'Warning' : 'Safe') : 'FAIL';

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1.5">
                <div>
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                    {subLabel && <span className="text-[10px] text-slate-400 ml-1">({subLabel})</span>}
                </div>
                <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${textColor}`}>
                        {current.toFixed(1)}{unit}
                    </span>
                    <span className="text-[10px] text-slate-400 mx-1">/</span>
                    <span className="text-[10px] text-slate-500">{limit}{unit}</span>
                </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                {type === 'min' && <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: `${percent}%` }} title="Minimum Limit"></div>}
                <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${type === 'max' ? percent : 100}%` }}></div>
            </div>
            <div className="flex justify-end mt-1">
                <span className={`text-[10px] font-bold uppercase ${!isSafe ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-600'}`}>{statusText}</span>
            </div>
        </div>
    );
};
