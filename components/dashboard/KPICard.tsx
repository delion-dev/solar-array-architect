import React from 'react';
import { Card, CardContent } from '../ui/card';

interface KPICardProps {
    label: string;
    value: string | number;
    unit?: string;
    subValue?: string;
    color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'slate';
    icon?: React.ReactNode;
}

export const KPICard = ({ label, value, unit, subValue, color = 'slate', icon }: KPICardProps) => {
    const colorMap = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        accent: 'text-accent',
        success: 'text-green-600',
        warning: 'text-amber-500',
        danger: 'text-red-600',
        slate: 'text-slate-700'
    };

    const borderMap = {
        primary: 'border-l-primary',
        secondary: 'border-l-secondary',
        accent: 'border-l-accent',
        success: 'border-l-green-500',
        warning: 'border-l-amber-500',
        danger: 'border-l-red-500',
        slate: 'border-l-slate-500'
    };

    return (
        <Card className={`border-l-4 ${borderMap[color]} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 flex flex-col justify-center h-full">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                    {icon && <div className={`${colorMap[color]} opacity-80`}>{icon}</div>}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${colorMap[color]} truncate`}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                    {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
                </div>
                {subValue && (
                    <div className="mt-1 text-xs text-slate-400 font-medium">
                        {subValue}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
