import React from 'react';
import { Tooltip } from './Tooltip';

interface InputGroupProps {
  label: string;
  value: number | string;
  onChange: (val: string) => void;
  unit?: string;
  type?: 'number' | 'text';
  step?: string;
  placeholder?: string;
  helperFormat?: 'currency' | 'none'; // New prop to toggle currency formatting helper
  tooltip?: string; // [New] Help text for the tooltip
}

const formatKoreanNumber = (val: number | string): string | null => {
  const num = Number(val);
  if (isNaN(num) || num === 0) return null;

  // 1억 이상
  if (num >= 100000000) {
    const uk = Math.floor(num / 100000000);
    const rest = num % 100000000;
    const man = Math.round(rest / 10000);
    return man > 0 ? `${uk}억 ${man}만원` : `${uk}억원`;
  }
  // 1만 이상
  if (num >= 10000) {
    return `${(num / 10000).toLocaleString()}만원`;
  }
  return `${num.toLocaleString()}원`;
};

export const InputGroup: React.FC<InputGroupProps> = ({
  label, value, onChange, unit, type = "number", step = "any", placeholder, helperFormat = 'none', tooltip
}) => {
  const formattedHelper = helperFormat === 'currency' ? formatKoreanNumber(value) : null;

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <div className="relative">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-8 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 shadow-sm transition-shadow"
        />
        {unit && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 sm:text-xs font-medium">{unit}</span>
          </div>
        )}
      </div>
      {formattedHelper && (
        <p className="text-[10px] text-accent font-medium text-right px-1">
          {formattedHelper}
        </p>
      )}
    </div>
  );
};