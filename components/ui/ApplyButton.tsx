import React from 'react';

export const ApplyButton = ({ onClick, label }: { onClick: () => void, label: string }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-300 transition-colors flex items-center gap-1"
    >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v10h16v-10H4zm16 12H4v2h16v-2z" />
        </svg>
        {label}
    </button>
);
