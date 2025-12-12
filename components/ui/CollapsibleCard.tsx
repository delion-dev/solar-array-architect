import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

/**
 * [접이식 카드 컴포넌트]
 * 화면 공간 절약을 위해 섹션을 접고 펼칠 수 있는 카드입니다.
 */
export const CollapsibleCard = ({ title, children, defaultOpen = false }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="transition-all duration-300 ease-in-out border-slate-200 shadow-sm hover:shadow-md">
            <CardHeader className="py-3 px-5 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-t-xl" onClick={() => setIsOpen(!isOpen)}>
                <CardTitle className="text-sm font-bold text-slate-700">{title}</CardTitle>
                <div className="text-slate-400">
                    {isOpen ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </CardHeader>
            {isOpen && (
                <CardContent className="animate-in fade-in slide-in-from-top-2 duration-200 p-5 bg-white rounded-b-xl">
                    {children}
                </CardContent>
            )}
        </Card>
    );
};
